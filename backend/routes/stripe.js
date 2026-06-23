// routes/stripe.js — Stripe webhook receiver.
//
//   POST /api/stripe/webhook   PUBLIC (called by Stripe, not the browser)
//
// server.js registers express.raw for THIS exact path, so req.body is the raw
// Buffer required for signature verification. This route is the ONLY place that
// marks an order paid = true — a client can never set that field.

'use strict';

const express = require('express');

const { store } = require('../db/store');
const stripe = require('../services/stripe');
const mailer = require('../services/mailer');

const router = express.Router();

router.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    // req.body is a Buffer here (express.raw). Throws on a bad/missing signature
    // or when Stripe is not configured.
    event = stripe.verifyWebhook(req.body, signature);
  } catch (err) {
    return res
      .status(400)
      .json({ error: 'Webhook verification failed: ' + err.message });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data && event.data.object ? event.data.object : {};
      const orderId =
        (session.metadata && session.metadata.order_id) ||
        session.client_reference_id;

      if (orderId) {
        const order = await store.get('orders', orderId);
        if (order && !order.paid) {
          await store.update('orders', order.id, {
            paid: true,
            status: 'Preparing with care',
            stripe_session_id: session.id || order.stripe_session_id || null,
          });

          // Best-effort confirmation email — must never block or fail the webhook.
          mailer
            .sendMail({
              to: order.customer_email,
              subject: 'Your Ubhi order is confirmed — ' + (order.order_ref || ''),
              text:
                'Thank you. We have received your payment and your order ' +
                (order.order_ref || '') +
                ' is now being prepared with care.',
            })
            .catch(() => {});
        }
      }
    }
  } catch (err) {
    // Acknowledge receipt (so Stripe does not retry forever on our own error)
    // but log it for investigation.
    // eslint-disable-next-line no-console
    console.error('[stripe] webhook processing error:', err.message);
  }

  // Always 200 once the signature is valid, so Stripe marks delivery successful.
  res.json({ received: true });
});

module.exports = router;
