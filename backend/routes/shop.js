// routes/shop.js — shop catalogue. Backed by the "products" table.
//
// PUBLIC:
//   GET    /api/shop          -> published products only
// ADMIN (requireAuth + requirePermission('shop')):
//   GET    /api/shop/all      -> every product (published or not)
//   POST   /api/shop          -> create a product
//   PATCH  /api/shop/:id      -> update a product
//   DELETE /api/shop/:id      -> delete a product

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

const SECTION = 'shop';
const TABLE = 'products';

// Build a clean patch from a request body, skipping undefined fields so PATCH
// only touches what was sent.
function buildPatch(body) {
  const patch = {};
  if (body.name !== undefined) patch.name = cleanString(body.name) || '';
  if (body.blurb !== undefined) patch.blurb = cleanString(body.blurb) || '';
  if (body.price !== undefined) patch.price = coerceNumber(body.price, 0);
  if (body.stock !== undefined) patch.stock = coerceInt(body.stock, 0);
  if (body.image !== undefined) patch.image = cleanString(body.image) || '';
  if (body.published !== undefined) {
    patch.published = coerceBool(body.published, false);
  }
  return patch;
}

// PUBLIC: published products only.
router.get(
  '/',
  asyncWrap(async (req, res) => {
    const rows = await store.find(TABLE, { published: true });
    res.json(rows);
  })
);

// ADMIN: every product (published or not).
router.get(
  '/all',
  requireAuth,
  requirePermission(SECTION),
  asyncWrap(async (req, res) => {
    res.json(await store.all(TABLE));
  })
);

// ADMIN: create a product.
router.post(
  '/',
  requireAuth,
  requirePermission(SECTION),
  asyncWrap(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ['name']);
    const row = await store.insert(TABLE, {
      name: cleanString(body.name) || '',
      blurb: cleanString(body.blurb) || '',
      price: coerceNumber(body.price, 0),
      stock: coerceInt(body.stock, 0),
      image: cleanString(body.image) || '',
      published: coerceBool(body.published, false),
    });
    res.status(201).json(row);
  })
);

// ADMIN: update a product.
router.patch(
  '/:id',
  requireAuth,
  requirePermission(SECTION),
  asyncWrap(async (req, res) => {
    const patch = buildPatch(req.body || {});
    const row = await store.update(TABLE, req.params.id, patch);
    if (!row) throw notFound('product not found');
    res.json(row);
  })
);

// ADMIN: delete a product.
router.delete(
  '/:id',
  requireAuth,
  requirePermission(SECTION),
  asyncWrap(async (req, res) => {
    res.json({ ok: await store.remove(TABLE, req.params.id) });
  })
);

module.exports = router;
