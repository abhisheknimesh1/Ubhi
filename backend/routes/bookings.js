// routes/bookings.js — workshop bookings.
//
//   POST   /api/bookings        PUBLIC  (guest reserves a workshop place)
//   GET    /api/bookings        ADMIN section 'bookings' — list (newest first)
//   GET    /api/bookings/:id    ADMIN section 'bookings' — single booking
//   PATCH  /api/bookings/:id    ADMIN section 'bookings' — update (e.g. status)
//   DELETE /api/bookings/:id    ADMIN section 'bookings' — remove
//
// Only the shared store interface is used (no raw SQL) so this works against
// both the JSON and Postgres stores and is injection-safe.

'use strict';

const express = require('express');

const { store } = require('../db/store');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { asyncWrap, badRequest, notFound } = require('../middleware/errors');
const {
  isEmail,
  cleanString,
  coerceNumber,
} = require('../middleware/validate');

const router = express.Router();

// PUBLIC create — a guest reserves a place. If a workshop_id is supplied and
// resolves to a real workshop, we copy its title/date/price so the booking is
// self-contained even if the workshop later changes.
router.post(
  '/',
  asyncWrap(async (req, res) => {
    const b = req.body || {};

    const name = cleanString(b.name);
    if (!name) throw badRequest('name is required');

    const email = String(b.email || '').trim().toLowerCase();
    if (!email) throw badRequest('email is required');
    if (!isEmail(email)) throw badRequest('A valid email is required');

    let workshop_id = cleanString(b.workshop_id) || null;
    let workshop_title = cleanString(b.workshop_title) || '';
    let session_date = cleanString(b.session_date) || '';
    let price = coerceNumber(b.price, 0);

    // Enrich from the workshop record when we can find it.
    if (workshop_id) {
      const workshop = await store.get('workshops', workshop_id);
      if (workshop) {
        if (!workshop_title) workshop_title = workshop.title || '';
        if (!session_date) session_date = workshop.session_date || '';
        if (b.price === undefined) price = coerceNumber(workshop.price, 0);
      }
    }

    const row = await store.insert('bookings', {
      name,
      email,
      phone: cleanString(b.phone) || '',
      workshop_id,
      workshop_title,
      session_date,
      price: price < 0 ? 0 : price,
      note: cleanString(b.note) || '',
      status: 'Reserved',
    });

    res.status(201).json(row);
  })
);

// ADMIN list — all bookings, newest first (store.all orders by created_at).
router.get(
  '/',
  requireAuth,
  requirePermission('bookings'),
  asyncWrap(async (req, res) => {
    res.json(await store.all('bookings'));
  })
);

// ADMIN read — a single booking.
router.get(
  '/:id',
  requireAuth,
  requirePermission('bookings'),
  asyncWrap(async (req, res) => {
    const row = await store.get('bookings', req.params.id);
    if (!row) throw notFound('booking not found');
    res.json(row);
  })
);

// Fields an admin may change via PATCH. `price`, `email` and `workshop_id` are
// excluded from the generic update to prevent mass-assignment; status is enum-checked.
const BOOKING_STATUSES = ['Reserved', 'Confirmed', 'Attended', 'Cancelled'];
const BOOKING_PATCHABLE = ['status', 'name', 'phone', 'note', 'session_date', 'workshop_title'];

// ADMIN update — confirm/cancel a booking or correct its details.
router.patch(
  '/:id',
  requireAuth,
  requirePermission('bookings'),
  asyncWrap(async (req, res) => {
    const b = req.body || {};
    const patch = {};
    for (const key of BOOKING_PATCHABLE) {
      if (Object.prototype.hasOwnProperty.call(b, key)) {
        patch[key] = cleanString(b[key]);
      }
    }
    if (patch.status !== undefined && !BOOKING_STATUSES.includes(patch.status)) {
      throw badRequest('invalid status');
    }
    const row = await store.update('bookings', req.params.id, patch);
    if (!row) throw notFound('booking not found');
    res.json(row);
  })
);

// ADMIN delete.
router.delete(
  '/:id',
  requireAuth,
  requirePermission('bookings'),
  asyncWrap(async (req, res) => {
    res.json({ ok: await store.remove('bookings', req.params.id) });
  })
);

module.exports = router;
