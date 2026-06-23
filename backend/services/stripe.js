// services/stripe.js — Stripe Checkout integration (optional).
//
// Exports:
//   createCheckoutSession(order)      -> { configured:false } when no key,
//                                        else a Stripe Checkout Session summary
//   verifyWebhook(rawBody, signature) -> the verified Stripe event object
//   isConfigured()                    -> boolean
//
// The "stripe" package is LAZY-REQUIRED — it is only loaded when a secret key is
// present. This keeps the server bootable (and dependency-light) when payments
// are not yet provisioned. Nothing here ever crashes the server: an unconfigured
// createCheckoutSession resolves with { configured:false }, and verifyWebhook
// throws a clear, catchable error that route handlers turn into a 4xx/5xx.

'use strict';

const config = require('../config');

// Memoised Stripe client so we don't re-instantiate per request. Created on
// first use only when STRIPE_SECRET_KEY is set.
let stripeClient = null;

// True when a secret key has been configured via the environment.
function isConfigured() {
  return Boolean(config.STRIPE_SECRET_KEY);
}

// Lazily build (and cache) the Stripe client. Returns null when unconfigured.
// The require lives here so projects without the "stripe" package installed,
// and with no key set, still boot cleanly.
function getClient() {
  if (!isConfigured()) return null;
  if (stripeClient) return stripeClient;

  // eslint-disable-next-line global-require
  const Stripe = require('stripe');
  stripeClient = new Stripe(config.STRIPE_SECRET_KEY, {
    // Pin a known API version for predictable behaviour across deploys.
    apiVersion: '2024-06-20',
  });
  return stripeClient;
}

// Convert a money amount in major units (e.g. pounds) to integer minor units
// (pence) as Stripe requires. Guards against negatives and rounding drift.
function toMinorUnits(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

// Build Stripe line items from a normalised order's items array. Each order
// item is { id, name, price, qty } (see routes/orders.js). Items with a zero or
// invalid unit price are skipped so we never create a £0.00 line.
function buildLineItems(order, currency) {
  const items = Array.isArray(order && order.items) ? order.items : [];
  return items
    .map((it) => {
      const item = it && typeof it === 'object' ? it : {};
      const unitAmount = toMinorUnits(item.price);
      const quantity = Math.max(1, Math.trunc(Number(item.qty) || 1));
      if (unitAmount <= 0) return null;
      return {
        quantity,
        price_data: {
          currency,
          unit_amount: unitAmount,
          product_data: {
            name: String(item.name || 'Item'),
          },
        },
      };
    })
    .filter(Boolean);
}

// Create a Stripe Checkout Session for a previously-created order.
//
// `order` is the order row returned by store.insert('orders', ...). We pass the
// order id/ref through as metadata + client_reference_id so the webhook can find
// and mark the matching order paid. Shipping is added as its own line item when
// non-zero so the Stripe total matches the order total exactly.
//
// Returns { configured:false } (HTTP 200 at the route) when Stripe has no key —
// the storefront then knows to fall back to its unpaid-order flow.
async function createCheckoutSession(order = {}) {
  if (!isConfigured()) {
    return { configured: false };
  }

  const stripe = getClient();
  const currency = (config.STRIPE_CURRENCY || 'gbp').toLowerCase();

  const line_items = buildLineItems(order, currency);

  // Shipping appears as its own line so the customer sees an itemised total
  // and the Stripe charge equals order.total.
  const shippingMinor = toMinorUnits(order.shipping);
  if (shippingMinor > 0) {
    line_items.push({
      quantity: 1,
      price_data: {
        currency,
        unit_amount: shippingMinor,
        product_data: { name: 'Shipping' },
      },
    });
  }

  if (line_items.length === 0) {
    // Nothing chargeable — surface a clear error rather than a confusing Stripe
    // rejection. The route wraps this and returns 400.
    const err = new Error('Cannot create a checkout session with no payable items');
    err.status = 400;
    throw err;
  }

  // Where Stripe redirects after success/cancel. Defaults are sensible for the
  // brand site; override via env in production.
  const baseUrl = config.PUBLIC_URL || 'http://localhost:8090';
  const successUrl =
    config.STRIPE_SUCCESS_URL ||
    `${baseUrl}/?checkout=success&order=${encodeURIComponent(order.order_ref || '')}`;
  const cancelUrl = config.STRIPE_CANCEL_URL || `${baseUrl}/?checkout=cancelled`;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items,
    currency,
    success_url: successUrl,
    cancel_url: cancelUrl,
    // Let the webhook reconcile the payment back to this order.
    client_reference_id: order.id || order.order_ref || undefined,
    customer_email: order.customer_email || undefined,
    metadata: {
      order_id: order.id || '',
      order_ref: order.order_ref || '',
    },
  });

  // Return only what the storefront needs to redirect — never the full session.
  return {
    configured: true,
    id: session.id,
    url: session.url,
  };
}

// Verify and parse an incoming Stripe webhook. `rawBody` MUST be the unparsed
// request body (server.js registers express.raw for this path) and `signature`
// is the "stripe-signature" header. Throws a clear error when Stripe is not
// configured or the signature is invalid; the route maps that to a 400.
function verifyWebhook(rawBody, signature) {
  if (!isConfigured()) {
    throw new Error('Stripe not configured');
  }
  if (!config.STRIPE_WEBHOOK_SECRET) {
    throw new Error('Stripe webhook secret not configured (STRIPE_WEBHOOK_SECRET)');
  }

  const stripe = getClient();
  // Throws if the signature does not match — propagate to the caller.
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    config.STRIPE_WEBHOOK_SECRET
  );
}

module.exports = {
  isConfigured,
  createCheckoutSession,
  verifyWebhook,
};
