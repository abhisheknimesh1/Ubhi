// routes/subscribers.js — snail-mail subscribers (table: snail_subscribers).
//
//   POST   /api/subscribers        PUBLIC  -> join the snail-mail list
//   GET    /api/subscribers        ADMIN section 'subscribers' -> list all
//   PATCH  /api/subscribers/:id     ADMIN section 'subscribers' -> update
//   DELETE /api/subscribers/:id     ADMIN section 'subscribers' -> remove

'use strict';

const express = require('express');

const { store } = require('../db/store');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { asyncWrap, badRequest, notFound } = require('../middleware/errors');
const {
  requireFields,
  isEmail,
  cleanString,
  coerceNumber,
} = require('../middleware/validate');

const router = express.Router();

const VALID_STATUS = ['Active', 'Inactive'];

// Normalise a status value to the allowed set, defaulting to 'Active'.
function normalizeStatus(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  return VALID_STATUS.includes(value) ? value : fallback;
}

// POST /api/subscribers — PUBLIC. Join the snail-mail list.
router.post(
  '/',
  asyncWrap(async (req, res) => {
    const b = req.body || {};
    requireFields(b, ['name', 'email']);

    const email = String(b.email).trim().toLowerCase();
    if (!isEmail(email)) throw badRequest('A valid email is required');

    const row = await store.insert('snail_subscribers', {
      name: cleanString(b.name) || '',
      email,
      contact: cleanString(b.contact) || '',
      status: 'Active',
      plan: cleanString(b.plan) || '',
      price: coerceNumber(b.price, 0),
      address: cleanString(b.address) || '',
      date_subscribed: cleanString(b.date_subscribed) || new Date().toISOString(),
      last_sent_cycle: cleanString(b.last_sent_cycle) || '',
    });

    res.status(201).json(row);
  })
);

// GET /api/subscribers — ADMIN. List every subscriber (newest first).
router.get(
  '/',
  requireAuth,
  requirePermission('subscribers'),
  asyncWrap(async (req, res) => {
    res.json(await store.all('snail_subscribers'));
  })
);

// PATCH /api/subscribers/:id — ADMIN. Update an existing subscriber.
router.patch(
  '/:id',
  requireAuth,
  requirePermission('subscribers'),
  asyncWrap(async (req, res) => {
    const b = req.body || {};
    const existing = await store.get('snail_subscribers', req.params.id);
    if (!existing) throw notFound('Subscriber not found');

    const patch = {};
    if (b.name !== undefined) patch.name = cleanString(b.name) || '';
    if (b.contact !== undefined) patch.contact = cleanString(b.contact) || '';
    if (b.plan !== undefined) patch.plan = cleanString(b.plan) || '';
    if (b.address !== undefined) patch.address = cleanString(b.address) || '';
    if (b.last_sent_cycle !== undefined) {
      patch.last_sent_cycle = cleanString(b.last_sent_cycle) || '';
    }
    if (b.date_subscribed !== undefined) {
      patch.date_subscribed = cleanString(b.date_subscribed) || '';
    }
    if (b.email !== undefined) {
      const email = String(b.email).trim().toLowerCase();
      if (!isEmail(email)) throw badRequest('A valid email is required');
      patch.email = email;
    }
    if (b.price !== undefined) patch.price = coerceNumber(b.price, 0);
    if (b.status !== undefined) {
      const status = normalizeStatus(b.status, undefined);
      if (status === undefined) {
        throw badRequest("status must be 'Active' or 'Inactive'");
      }
      patch.status = status;
    }

    const row = await store.update('snail_subscribers', req.params.id, patch);
    if (!row) throw notFound('Subscriber not found');
    res.json(row);
  })
);

// DELETE /api/subscribers/:id — ADMIN. Remove a subscriber.
router.delete(
  '/:id',
  requireAuth,
  requirePermission('subscribers'),
  asyncWrap(async (req, res) => {
    res.json({ ok: await store.remove('snail_subscribers', req.params.id) });
  })
);

module.exports = router;
