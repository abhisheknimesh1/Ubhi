// routes/workshops.js — workshops catalogue.
//
// PUBLIC:
//   GET    /api/workshops          -> published workshops only
// ADMIN (requireAuth + requirePermission('workshops')):
//   GET    /api/workshops/all      -> every workshop (published or not)
//   POST   /api/workshops          -> create a workshop
//   PATCH  /api/workshops/:id      -> update a workshop
//   DELETE /api/workshops/:id      -> delete a workshop

'use strict';

const express = require('express');

const { store } = require('../db/store');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { asyncWrap, badRequest, notFound } = require('../middleware/errors');
const {
  requireFields,
  cleanString,
  coerceNumber,
  coerceInt,
  coerceBool,
} = require('../middleware/validate');

const router = express.Router();

const SECTION = 'workshops';
const TABLE = 'workshops';

// Build a clean patch from a request body, skipping undefined fields so PATCH
// only touches what was sent.
function buildPatch(body) {
  const patch = {};
  if (body.title !== undefined) patch.title = cleanString(body.title) || '';
  if (body.blurb !== undefined) patch.blurb = cleanString(body.blurb) || '';
  if (body.session_date !== undefined) {
    patch.session_date = cleanString(body.session_date) || '';
  }
  if (body.price !== undefined) patch.price = coerceNumber(body.price, 0);
  if (body.spots !== undefined) patch.spots = coerceInt(body.spots, 0);
  if (body.image !== undefined) patch.image = cleanString(body.image) || '';
  if (body.published !== undefined) {
    patch.published = coerceBool(body.published, false);
  }
  return patch;
}

// PUBLIC: published workshops only.
router.get(
  '/',
  asyncWrap(async (req, res) => {
    const rows = await store.find(TABLE, { published: true });
    res.json(rows);
  })
);

// ADMIN: every workshop (published or not).
router.get(
  '/all',
  requireAuth,
  requirePermission(SECTION),
  asyncWrap(async (req, res) => {
    res.json(await store.all(TABLE));
  })
);

// ADMIN: create a workshop.
router.post(
  '/',
  requireAuth,
  requirePermission(SECTION),
  asyncWrap(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ['title']);
    const row = await store.insert(TABLE, {
      title: cleanString(body.title) || '',
      blurb: cleanString(body.blurb) || '',
      session_date: cleanString(body.session_date) || '',
      price: coerceNumber(body.price, 0),
      spots: coerceInt(body.spots, 0),
      image: cleanString(body.image) || '',
      published: coerceBool(body.published, false),
    });
    res.status(201).json(row);
  })
);

// ADMIN: update a workshop.
router.patch(
  '/:id',
  requireAuth,
  requirePermission(SECTION),
  asyncWrap(async (req, res) => {
    const patch = buildPatch(req.body || {});
    const row = await store.update(TABLE, req.params.id, patch);
    if (!row) throw notFound('workshop not found');
    res.json(row);
  })
);

// ADMIN: delete a workshop.
router.delete(
  '/:id',
  requireAuth,
  requirePermission(SECTION),
  asyncWrap(async (req, res) => {
    res.json({ ok: await store.remove(TABLE, req.params.id) });
  })
);

module.exports = router;
