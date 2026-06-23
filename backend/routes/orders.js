// routes/orders.js — shop orders.
//
//   POST   /api/orders          PUBLIC  (checkout creates an order)
//   GET    /api/orders          ADMIN section 'orders' — list (newest first)
//   GET    /api/orders/:id      ADMIN section 'orders' — single order
//   PATCH  /api/orders/:id      ADMIN section 'orders' — update (e.g. status)
//   DELETE /api/orders/:id      ADMIN section 'orders' — remove
//
// Only the shared store interface is used (no raw SQL) so this works against
// both the JSON and Postgres stores and is injection-safe.

'use strict';

const express = require('express');

const { store } = require('../db/store');
const config = require('../config');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { asyncWrap, badRequest, notFound } = require('../middleware/errors');
const {
  isEmail,
  cleanString,
  coerceNumber,
} = require('../middleware/validate');

const router = express.Router();

// Generate a short, human-friendly order reference (e.g. UBHI-7F3K2Q).
function makeOrderRef() {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `UBHI-${rand}`;
}

// Normalise an incoming cart into a clean array of line items and compute the
// subtotal from them. We never trust a client-supplied subtotal/total — they
// are derived here from the items and the configured shipping rules.
function normalizeItems(input) {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) {
    throw badRequest('items must be an array');
  }
  return input.map((raw) => {
    const item = raw && typeof raw === 'object' ? raw : {};
    const price = coerceNumber(item.price, 0);
    const qty = Math.max(1, Math.trunc(coerceNumber(item.qty, 1)));
    return {
      id: cleanString(item.id) || null,
      name: cleanString(item.name) || 'Item',
      price: price < 0 ? 0 : price,
      qty,
    };
  });
}

// PUBLIC create — the storefront checkout posts a cart here. Money values are
// computed server-side; the order starts unpaid and "Preparing with care".
router.post(
  '/',
  asyncWrap(async (req, res) => {
    const b = req.body || {};

    const customer_email = String(b.customer_email || '').trim().toLowerCase();
    if (!customer_email) throw badRequest('customer_email is required');
    if (!isEmail(customer_email)) {
      throw badRequest('A valid customer_email is required');
    }

    const items = normalizeItems(b.items);
    const subtotal = items.reduce(
      (sum, it) => sum + it.price * it.qty,
      0
    );

    // Shipping: free over the threshold, otherwise the flat rate. An empty
    // cart ships for nothing.
    let shipping = 0;
    if (subtotal > 0 && subtotal < config.FREE_SHIP_THRESHOLD) {
      shipping = config.SHIPPING_FLAT;
    }

    const total = Number((subtotal + shipping).toFixed(2));

    const row = await store.insert('orders', {
      order_ref: makeOrderRef(),
      customer_name: cleanString(b.customer_name) || '',
      customer_email,
      phone: cleanString(b.phone) || '',
      items,
      subtotal: Number(subtotal.toFixed(2)),
      shipping: Number(shipping.toFixed(2)),
      total,
      status: 'Preparing with care',
      ship_street: cleanString(b.ship_street) || '',
      ship_city: cleanString(b.ship_city) || '',
      ship_postcode: cleanString(b.ship_postcode) || '',
      ship_country: cleanString(b.ship_country) || '',
      stripe_session_id: cleanString(b.stripe_session_id) || null,
      paid: false,
    });

    res.status(201).json(row);
  })
);

// ADMIN list — all orders, newest first (store.all orders by created_at).
router.get(
  '/',
  requireAuth,
  requirePermission('orders'),
  asyncWrap(async (req, res) => {
    res.json(await store.all('orders'));
  })
);

// ADMIN read — a single order.
router.get(
  '/:id',
  requireAuth,
  requirePermission('orders'),
  asyncWrap(async (req, res) => {
    const row = await store.get('orders', req.params.id);
    if (!row) throw notFound('order not found');
    res.json(row);
  })
);

// Fields an admin may change via PATCH. Money (subtotal/shipping/total), `paid`,
// `items`, `customer_email`, `order_ref` and `stripe_session_id` are deliberately
// EXCLUDED — `paid` is set only by the verified Stripe webhook, and totals are
// computed at checkout. This prevents mass-assignment (e.g. faking a paid order).
const ORDER_STATUSES = ['Preparing with care', 'Shipped', 'Delivered', 'Cancelled'];
const ORDER_PATCHABLE = [
  'status', 'customer_name', 'phone',
  'ship_street', 'ship_city', 'ship_postcode', 'ship_country',
];

// ADMIN update — advance fulfilment status / correct delivery details only.
router.patch(
  '/:id',
  requireAuth,
  requirePermission('orders'),
  asyncWrap(async (req, res) => {
    const b = req.body || {};
    const patch = {};
    for (const key of ORDER_PATCHABLE) {
      if (Object.prototype.hasOwnProperty.call(b, key)) {
        patch[key] = cleanString(b[key]);
      }
    }
    if (patch.status !== undefined && !ORDER_STATUSES.includes(patch.status)) {
      throw badRequest('invalid status');
    }
    const row = await store.update('orders', req.params.id, patch);
    if (!row) throw notFound('order not found');
    res.json(row);
  })
);

// ADMIN delete.
router.delete(
  '/:id',
  requireAuth,
  requirePermission('orders'),
  asyncWrap(async (req, res) => {
    res.json({ ok: await store.remove('orders', req.params.id) });
  })
);

module.exports = router;
