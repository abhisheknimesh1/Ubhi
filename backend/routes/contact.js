// routes/contact.js — contact-form messages (table: contact_messages).
//
//   POST   /api/contact         PUBLIC  -> visitor sends a message
//   GET    /api/contact         ADMIN section 'customers' -> list all (newest first)
//   PATCH  /api/contact/:id     ADMIN section 'customers' -> mark read / unread
//   DELETE /api/contact/:id     ADMIN section 'customers' -> remove
//
// The storefront contact form POSTs here when the backend is reachable, so a
// message reaches the owner even if the visitor's mail app never opens. When
// the backend is offline the form falls back to the old mailto: behaviour.

'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');

const { store } = require('../db/store');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { asyncWrap, badRequest, notFound } = require('../middleware/errors');
const { requireFields, isEmail, cleanString, coerceBool } = require('../middleware/validate');

const router = express.Router();

// A genuine visitor sends one or two messages, not dozens.
const sendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages — please try again in a little while.' },
});

// PUBLIC create — store a message from the contact form.
router.post(
  '/',
  sendLimiter,
  asyncWrap(async (req, res) => {
    const b = req.body || {};
    requireFields(b, ['email', 'message']);

    const email = String(b.email).trim().toLowerCase();
    if (!isEmail(email)) throw badRequest('A valid email is required');

    // Keep paragraphs intact; just trim and cap the length.
    const message = String(b.message).trim().slice(0, 4000);
    if (!message) throw badRequest('message is required');

    const row = await store.insert('contact_messages', {
      name: cleanString(b.name) || '',
      email,
      subject: (cleanString(b.subject) || '').slice(0, 200),
      message,
      read: false,
    });

    res.status(201).json(row);
  })
);

// ADMIN list — every message, newest first (store.all orders by created_at).
router.get(
  '/',
  requireAuth,
  requirePermission('customers'),
  asyncWrap(async (req, res) => {
    res.json(await store.all('contact_messages'));
  })
);

// ADMIN update — only the read flag is changeable (no mass-assignment).
router.patch(
  '/:id',
  requireAuth,
  requirePermission('customers'),
  asyncWrap(async (req, res) => {
    const b = req.body || {};
    const patch = {};
    if (b.read !== undefined) patch.read = coerceBool(b.read, false);
    const row = await store.update('contact_messages', req.params.id, patch);
    if (!row) throw notFound('message not found');
    res.json(row);
  })
);

// ADMIN delete.
router.delete(
  '/:id',
  requireAuth,
  requirePermission('customers'),
  asyncWrap(async (req, res) => {
    res.json({ ok: await store.remove('contact_messages', req.params.id) });
  })
);

module.exports = router;
