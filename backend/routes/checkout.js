// routes/checkout.js — start a Stripe Checkout for an existing order.
//
//   POST /api/checkout/session   PUBLIC
//     body: { order_id }   (create the order first via POST /api/orders)
//
//   -> { configured: false }                 when Stripe has no key (HTTP 200)
//   -> { configured: true, id, url }         redirect the customer to `url`
//
// The amount charged is derived entirely from the STORED order (items, shipping,
// total computed server-side at /api/orders), never from the client — so the
// Stripe charge always matches what was saved.

'use strict';

const express = require('express');

const { store } = require('../db/store');
const stripe = require('../services/stripe');
const { asyncWrap, badRequest, notFound } = require('../middleware/errors');
const { cleanString } = require('../middleware/validate');

const router = express.Router();

router.post(
  '/session',
  asyncWrap(async (req, res) => {
    const orderId = cleanString((req.body || {}).order_id);
    if (!orderId) throw badRequest('order_id is required');

    const order = await store.get('orders', orderId);
    if (!order) throw notFound('order not found');

    const result = await stripe.createCheckoutSession(order);

    // No Stripe key configured — the storefront falls back to its unpaid flow.
    if (!result || result.configured === false) {
      return res.json({ configured: false });
    }

    // Remember the session id so the webhook can reconcile this payment later.
    if (result.id) {
      await store.update('orders', order.id, { stripe_session_id: result.id });
    }

    res.json({ configured: true, id: result.id, url: result.url });
  })
);

module.exports = router;
