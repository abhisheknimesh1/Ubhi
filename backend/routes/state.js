// routes/state.js — generic content state-sync for the storefront.
//
// The storefront keeps each piece of editable CONTENT as a whole collection
// (gallery images, art pieces, workshops, subscription plans, reviews, the site
// text overrides, …). This endpoint persists those collections to the database
// so the owner's admin edits are real and shared across every device/visitor.
//
//   GET  /api/state          -> { "<key>": value, ... }   (public read)
//   GET  /api/state/:key     -> { key, value }             (public read)
//   PUT  /api/state/:key     -> { key, value, ok }         (ADMIN auth required)
//
// NOTE: only the content keys below are allowed. Transactional data the public
// can create (orders, bookings, subscribers) is NOT synced here — it uses its
// own structured, validated, append-only endpoints so a client can never
// overwrite the whole collection.

'use strict';

const express = require('express');
const router = express.Router();
const { store } = require('../db/store');
const { requireAuth } = require('../middleware/auth');

// Content collections can be sizeable, so parse a larger body for writes.
const bigJson = express.json({ limit: '16mb' });

const ALLOWED = new Set([
  'gallery-items',
  'art-pieces',
  'workshops',
  'workshops-capacities',
  'shop-catalog',
  'journal-posts',
  'snail-plans',
  'snail-photos',
  'snail-reviews',
  'site-settings',
  'text-overrides',
  'text-content',
  'email-updates',
]);

const keyOk = (k) => typeof k === 'string' && ALLOWED.has(k);

// All content collections in one call (used to bootstrap the storefront on load)
router.get('/', async (req, res, next) => {
  try {
    const rows = await store.all('app_state');
    const out = {};
    for (const r of rows) if (keyOk(r.key)) out[r.key] = r.value;
    res.json(out);
  } catch (err) {
    next(err);
  }
});

// A single content collection
router.get('/:key', async (req, res, next) => {
  try {
    if (!keyOk(req.params.key)) return res.status(404).json({ error: 'Unknown key' });
    const row = await store.findOne('app_state', { key: req.params.key });
    res.json({ key: req.params.key, value: row ? row.value : null });
  } catch (err) {
    next(err);
  }
});

// Upsert a whole content collection (admin only)
router.put('/:key', requireAuth, bigJson, async (req, res, next) => {
  try {
    const key = req.params.key;
    if (!keyOk(key)) return res.status(400).json({ error: 'Unknown key' });
    const value =
      req.body && Object.prototype.hasOwnProperty.call(req.body, 'value')
        ? req.body.value
        : req.body;
    const existing = await store.findOne('app_state', { key });
    const updated_at = new Date().toISOString();
    const row = existing
      ? await store.update('app_state', existing.id, { value, updated_at })
      : await store.insert('app_state', { key, value, updated_at });
    res.json({ key, value: row.value, ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
