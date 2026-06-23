// routes/settings.js — key/value site settings (settings table).
//
//   GET /api/settings/:key   -> { key, value }   (owner-only; a small allowlist
//                               of "safe" keys may be read without auth so the
//                               public storefront can fetch e.g. shipping config)
//   PUT /api/settings/:key   -> { key, value }   (owner-only; upsert by key)
//
// The settings table stores rows of { key (unique), value (jsonb) }. Routes use
// ONLY the shared store interface (no raw SQL) and are guarded by the contract:
// settings is an owner-only section, so writes require an authenticated owner.

'use strict';

const express = require('express');

const { store } = require('../db/store');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncWrap, badRequest, notFound } = require('../middleware/errors');
const { cleanString } = require('../middleware/validate');

const router = express.Router();

// Keys whose values are safe to expose to the public storefront without auth
// (no secrets — purely presentational / shipping configuration the checkout UI
// needs). Any key NOT in this set requires an authenticated owner to read.
const PUBLIC_READABLE_KEYS = new Set([
  'shipping',
  'announcement',
  'storefront',
]);

// Normalise and validate a :key param. Keys are short, lowercase, snake/kebab
// identifiers — reject anything else so the store only ever sees clean keys.
function normalizeKey(raw) {
  const key = cleanString(raw);
  if (!key) throw badRequest('A settings key is required');
  if (!/^[a-zA-Z0-9_.-]{1,64}$/.test(key)) {
    throw badRequest('Invalid settings key');
  }
  return key;
}

// GET /api/settings/:key — read a single setting.
// Public for allowlisted safe keys; otherwise owner-only.
router.get(
  '/:key',
  asyncWrap(async (req, res, next) => {
    const key = normalizeKey(req.params.key);

    // Enforce owner auth unless this key is on the public allowlist.
    if (!PUBLIC_READABLE_KEYS.has(key)) {
      return next();
    }

    const row = await store.findOne('settings', { key });
    if (!row) throw notFound('Setting not found');
    res.json({ key: row.key, value: row.value });
  }),
  // Auth chain only reached for non-public keys (via next() above).
  requireAuth,
  requireRole('owner'),
  asyncWrap(async (req, res) => {
    const key = normalizeKey(req.params.key);
    const row = await store.findOne('settings', { key });
    if (!row) throw notFound('Setting not found');
    res.json({ key: row.key, value: row.value });
  })
);

// PUT /api/settings/:key — create or update a setting (owner-only).
// Body: { value: <any JSON> }. The value is stored verbatim as jsonb.
router.put(
  '/:key',
  requireAuth,
  requireRole('owner'),
  asyncWrap(async (req, res) => {
    const key = normalizeKey(req.params.key);

    const body = req.body || {};
    if (!Object.prototype.hasOwnProperty.call(body, 'value')) {
      throw badRequest('value is required');
    }
    const value = body.value;

    const existing = await store.findOne('settings', { key });
    let row;
    if (existing) {
      row = await store.update('settings', existing.id, { value });
    } else {
      row = await store.insert('settings', { key, value });
    }

    res.json({ key: row.key, value: row.value });
  })
);

module.exports = router;
