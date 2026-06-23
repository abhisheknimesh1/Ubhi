// routes/updates.js — newsletter signups (table: newsletter_signups).
//
//   POST   /api/updates        PUBLIC  -> newsletter signup
//   GET    /api/updates        ADMIN section 'subscribers' -> list all
//   DELETE /api/updates/:id     ADMIN section 'subscribers' -> remove
//
// Note: newsletter signups are managed under the same back-office section as
// snail-mail subscribers ('subscribers'). There is intentionally no PATCH.

'use strict';

const express = require('express');

const { store } = require('../db/store');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { asyncWrap, badRequest } = require('../middleware/errors');
const { requireFields, isEmail, cleanString } = require('../middleware/validate');

const router = express.Router();

// POST /api/updates — PUBLIC. Sign up for the newsletter.
router.post(
  '/',
  asyncWrap(async (req, res) => {
    const b = req.body || {};
    requireFields(b, ['email']);

    const email = String(b.email).trim().toLowerCase();
    if (!isEmail(email)) throw badRequest('A valid email is required');

    const row = await store.insert('newsletter_signups', {
      name: cleanString(b.name) || '',
      email,
      interest: cleanString(b.interest) || '',
    });

    res.status(201).json(row);
  })
);

// GET /api/updates — ADMIN. List every newsletter signup (newest first).
router.get(
  '/',
  requireAuth,
  requirePermission('subscribers'),
  asyncWrap(async (req, res) => {
    res.json(await store.all('newsletter_signups'));
  })
);

// DELETE /api/updates/:id — ADMIN. Remove a newsletter signup.
router.delete(
  '/:id',
  requireAuth,
  requirePermission('subscribers'),
  asyncWrap(async (req, res) => {
    res.json({ ok: await store.remove('newsletter_signups', req.params.id) });
  })
);

module.exports = router;
