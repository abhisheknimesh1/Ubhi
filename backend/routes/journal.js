// routes/journal.js — journal posts.
//
// PUBLIC:
//   GET    /api/journal          -> published posts only
// ADMIN (requireAuth + requirePermission('journal')):
//   GET    /api/journal/all      -> every post (published or not)
//   POST   /api/journal          -> create a post
//   PATCH  /api/journal/:id      -> update a post
//   DELETE /api/journal/:id      -> delete a post

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

const SECTION = 'journal';
const TABLE = 'journal_posts';

// Turn a title into a URL-friendly slug.
function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Build a clean patch from a request body, skipping undefined fields so PATCH
// only touches what was sent.
function buildPatch(body) {
  const patch = {};
  if (body.title !== undefined) patch.title = cleanString(body.title) || '';
  if (body.slug !== undefined) {
    patch.slug = slugify(body.slug) || slugify(body.title) || '';
  }
  if (body.body !== undefined) patch.body = cleanString(body.body) || '';
  if (body.author !== undefined) patch.author = cleanString(body.author) || '';
  if (body.published !== undefined) {
    patch.published = coerceBool(body.published, false);
  }
  return patch;
}

// PUBLIC: published posts only.
router.get(
  '/',
  asyncWrap(async (req, res) => {
    const rows = await store.find(TABLE, { published: true });
    res.json(rows);
  })
);

// ADMIN: every post (published or not).
router.get(
  '/all',
  requireAuth,
  requirePermission(SECTION),
  asyncWrap(async (req, res) => {
    res.json(await store.all(TABLE));
  })
);

// ADMIN: create a post.
router.post(
  '/',
  requireAuth,
  requirePermission(SECTION),
  asyncWrap(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ['title']);
    const title = cleanString(body.title) || '';
    const row = await store.insert(TABLE, {
      title,
      slug: slugify(body.slug) || slugify(title),
      body: cleanString(body.body) || '',
      author: cleanString(body.author) || '',
      published: coerceBool(body.published, false),
    });
    res.status(201).json(row);
  })
);

// ADMIN: update a post.
router.patch(
  '/:id',
  requireAuth,
  requirePermission(SECTION),
  asyncWrap(async (req, res) => {
    const patch = buildPatch(req.body || {});
    const row = await store.update(TABLE, req.params.id, patch);
    if (!row) throw notFound('journal post not found');
    res.json(row);
  })
);

// ADMIN: delete a post.
router.delete(
  '/:id',
  requireAuth,
  requirePermission(SECTION),
  asyncWrap(async (req, res) => {
    res.json({ ok: await store.remove(TABLE, req.params.id) });
  })
);

module.exports = router;
