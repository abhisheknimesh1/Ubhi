// routes/customers.js — storefront customer accounts (table: customers).
//
//   POST   /api/customers        PUBLIC  -> register a storefront account
//   GET    /api/customers        ADMIN section 'customers' -> list all
//   PATCH  /api/customers/:id     ADMIN section 'customers' -> update
//   DELETE /api/customers/:id     ADMIN section 'customers' -> remove
//
// SECURITY: passwords are hashed with bcryptjs and the password_hash is NEVER
// included in any response (see publicCustomer).

'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');

const { store } = require('../db/store');
const config = require('../config');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { asyncWrap, badRequest, notFound } = require('../middleware/errors');
const {
  requireFields,
  isEmail,
  cleanString,
  coerceBool,
} = require('../middleware/validate');

const router = express.Router();

// Strip the password hash before returning a customer record.
function publicCustomer(customer) {
  if (!customer) return null;
  const { password_hash, ...safe } = customer;
  return safe;
}

// POST /api/customers — PUBLIC. Register a new storefront account.
router.post(
  '/',
  asyncWrap(async (req, res) => {
    const b = req.body || {};
    requireFields(b, ['email', 'password']);

    const email = String(b.email).trim().toLowerCase();
    if (!isEmail(email)) throw badRequest('A valid email is required');
    if (String(b.password).length < 8) {
      throw badRequest('Password must be at least 8 characters');
    }

    const existing = await store.findOne('customers', { email });
    if (existing) throw badRequest('An account with that email already exists');

    const password_hash = await bcrypt.hash(
      String(b.password),
      config.BCRYPT_ROUNDS
    );

    const customer = await store.insert('customers', {
      email,
      password_hash,
      name: cleanString(b.name) || '',
      phone: cleanString(b.phone) || '',
      address: cleanString(b.address) || '',
      city: cleanString(b.city) || '',
      postcode: cleanString(b.postcode) || '',
      country: cleanString(b.country) || '',
      marketing_opt_in: coerceBool(b.marketing_opt_in, false),
      active: true,
    });

    res.status(201).json(publicCustomer(customer));
  })
);

// GET /api/customers — ADMIN. List all customers (never returns hashes).
router.get(
  '/',
  requireAuth,
  requirePermission('customers'),
  asyncWrap(async (req, res) => {
    const customers = await store.all('customers');
    res.json(customers.map(publicCustomer));
  })
);

// PATCH /api/customers/:id — ADMIN. Update a customer (never returns hash).
router.patch(
  '/:id',
  requireAuth,
  requirePermission('customers'),
  asyncWrap(async (req, res) => {
    const b = req.body || {};
    const existing = await store.get('customers', req.params.id);
    if (!existing) throw notFound('Customer not found');

    const patch = {};
    if (b.name !== undefined) patch.name = cleanString(b.name) || '';
    if (b.phone !== undefined) patch.phone = cleanString(b.phone) || '';
    if (b.address !== undefined) patch.address = cleanString(b.address) || '';
    if (b.city !== undefined) patch.city = cleanString(b.city) || '';
    if (b.postcode !== undefined) patch.postcode = cleanString(b.postcode) || '';
    if (b.country !== undefined) patch.country = cleanString(b.country) || '';

    if (b.email !== undefined) {
      const email = String(b.email).trim().toLowerCase();
      if (!isEmail(email)) throw badRequest('A valid email is required');
      patch.email = email;
    }

    if (b.marketing_opt_in !== undefined) {
      const optIn = coerceBool(b.marketing_opt_in, undefined);
      if (optIn === undefined) {
        throw badRequest('marketing_opt_in must be a boolean');
      }
      patch.marketing_opt_in = optIn;
    }

    if (b.active !== undefined) {
      const active = coerceBool(b.active, undefined);
      if (active === undefined) throw badRequest('active must be a boolean');
      patch.active = active;
    }

    // Allow an admin to reset a customer's password (re-hashed, never stored raw).
    if (b.password !== undefined) {
      if (String(b.password).length < 8) {
        throw badRequest('Password must be at least 8 characters');
      }
      patch.password_hash = await bcrypt.hash(
        String(b.password),
        config.BCRYPT_ROUNDS
      );
    }

    const customer = await store.update('customers', req.params.id, patch);
    if (!customer) throw notFound('Customer not found');
    res.json(publicCustomer(customer));
  })
);

// DELETE /api/customers/:id — ADMIN. Remove a customer account.
router.delete(
  '/:id',
  requireAuth,
  requirePermission('customers'),
  asyncWrap(async (req, res) => {
    res.json({ ok: await store.remove('customers', req.params.id) });
  })
);

module.exports = router;
