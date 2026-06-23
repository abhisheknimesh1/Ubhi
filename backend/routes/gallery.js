// routes/gallery.js — gallery items.
//
// PUBLIC:
//   GET    /api/gallery          -> published gallery items only
// ADMIN (requireAuth + requirePermission('gallery')):
//   GET    /api/gallery/all      -> every gallery item (published or not)
//   POST   /api/gallery          -> create a gallery item
//   PATCH  /api/gallery/:id      -> update a gallery item
//   DELETE /api/gallery/:id      -> delete a gallery item

'use strict';

const express = require('express');

const { store } = require('../db/store');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { asyncWrap, badRequest, notFound } = require('../middleware/errors');
const {
  requireFields,
  cleanString,
  coerceBool,
} = require('../middleware/validate');

const router = express.Router();

const SECTION = 'gallery';
const TABLE = 'gallery_items';

// Build a clean patch from a request body, skipping undefined fields so PATCH
// only touches what was sent.
function buildPatch(body) {
  const patch = {};
  if (body.image !== undefined) patch.image = cleanString(body.image) || '';
  if (body.caption !== undefined) {
    patch.caption = cleanString(body.caption) || '';
  }
  if (body.published !== undefined) {
    patch.published = coerceBool(body.published, false);
  }
  return patch;
}

// PUBLIC: published gallery items only.
router.get(
  '/',
  asyncWrap(async (req, res) => {
    const rows = await store.find(TABLE, { published: true });
    res.json(rows);
  })
);

// ADMIN: every gallery item (published or not).
router.get(
  '/all',
  requireAuth,
  requirePermission(SECTION),
  asyncWrap(async (req, res) => {
    res.json(await store.all(TABLE));
  })
);

// ADMIN: create a gallery item.
router.post(
  '/',
  requireAuth,
  requirePermission(SECTION),
  asyncWrap(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ['image']);
    const row = await store.insert(TABLE, {
      image: cleanString(body.image) || '',
      caption: cleanString(body.caption) || '',
      published: coerceBool(body.published, false),
    });
    res.status(201).json(row);
  })
);

// ADMIN: update a gallery item.
router.patch(
  '/:id',
  requireAuth,
  requirePermission(SECTION),
  asyncWrap(async (req, res) => {
    const patch = buildPatch(req.body || {});
    const row = await store.update(TABLE, req.params.id, patch);
    if (!row) throw notFound('gallery item not found');
    res.json(row);
  })
);

// ADMIN: delete a gallery item.
router.delete(
  '/:id',
  requireAuth,
  requirePermission(SECTION),
  asyncWrap(async (req, res) => {
    res.json({ ok: await store.remove(TABLE, req.params.id) });
  })
);

module.exports = router;
