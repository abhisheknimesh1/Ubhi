// routes/users.js — admin user management. OWNER-ONLY (every route).
//
//   GET    /api/users                 -> admin_users[] (no password hashes)
//   POST   /api/users                 -> create user
//   PATCH  /api/users/:id             -> update role/permissions/name/active
//   POST   /api/users/:id/password    -> set a user's password
//   DELETE /api/users/:id             -> delete (cannot delete the last owner)

'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');

const { store } = require('../db/store');
const config = require('../config');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  asyncWrap,
  badRequest,
  notFound,
  forbidden,
} = require('../middleware/errors');
const {
  requireFields,
  isEmail,
  cleanString,
  coerceBool,
} = require('../middleware/validate');

const router = express.Router();

// Default permissions granted to a freshly created staff member.
const DEFAULT_STAFF_PERMISSIONS = [
  'workshops',
  'shop',
  'subscribers',
  'orders',
  'bookings',
];

// Sections that are owner-only and must NEVER be granted to staff.
const OWNER_ONLY_SECTIONS = [
  'overview',
  'customers',
  'settings',
  'users',
  'journal',
  'gallery',
];

// All routes here require an authenticated OWNER.
router.use(requireAuth, requireRole('owner'));

// Remove the password hash before returning a user.
function publicUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

// Validate + normalise a permissions array: must be an array of known staff
// section keys; owner-only sections are stripped out.
function normalizePermissions(input) {
  if (input === undefined) return undefined;
  if (!Array.isArray(input)) {
    throw badRequest('permissions must be an array of section keys');
  }
  const cleaned = input
    .map((s) => cleanString(s))
    .filter(Boolean)
    .filter((s) => !OWNER_ONLY_SECTIONS.includes(s));
  // De-duplicate.
  return Array.from(new Set(cleaned));
}

// GET /api/users — list all admin users (no hashes).
router.get(
  '/',
  asyncWrap(async (req, res) => {
    const users = await store.all('admin_users');
    res.json(users.map(publicUser));
  })
);

// POST /api/users — create a new admin user.
router.post(
  '/',
  asyncWrap(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ['email', 'password', 'role']);

    const email = String(body.email).trim().toLowerCase();
    if (!isEmail(email)) throw badRequest('A valid email is required');
    if (String(body.password).length < 8) {
      throw badRequest('Password must be at least 8 characters');
    }

    const role = body.role === 'owner' ? 'owner' : 'staff';
    if (body.role !== 'owner' && body.role !== 'staff') {
      throw badRequest("role must be 'owner' or 'staff'");
    }

    const existing = await store.findOne('admin_users', { email });
    if (existing) throw badRequest('A user with that email already exists');

    // Owners implicitly have all access -> store empty permissions for them.
    let permissions;
    if (role === 'owner') {
      permissions = [];
    } else {
      const provided = normalizePermissions(body.permissions);
      permissions =
        provided === undefined ? DEFAULT_STAFF_PERMISSIONS.slice() : provided;
    }

    const password_hash = await bcrypt.hash(
      String(body.password),
      config.BCRYPT_ROUNDS
    );

    const user = await store.insert('admin_users', {
      email,
      password_hash,
      role,
      permissions,
      name: cleanString(body.name) || '',
      active: coerceBool(body.active, true),
    });

    res.status(201).json(publicUser(user));
  })
);

// PATCH /api/users/:id — update role / permissions / name / active.
router.patch(
  '/:id',
  asyncWrap(async (req, res) => {
    const body = req.body || {};
    const user = await store.get('admin_users', req.params.id);
    if (!user) throw notFound('User not found');

    const patch = {};

    if (body.name !== undefined) patch.name = cleanString(body.name) || '';

    if (body.role !== undefined) {
      if (body.role !== 'owner' && body.role !== 'staff') {
        throw badRequest("role must be 'owner' or 'staff'");
      }
      // Prevent demoting the last owner.
      if (user.role === 'owner' && body.role !== 'owner') {
        const owners = await store.find('admin_users', { role: 'owner' });
        if (owners.length <= 1) {
          throw forbidden('Cannot demote the last owner');
        }
      }
      patch.role = body.role;
    }

    // Determine the effective role after this patch.
    const effectiveRole = patch.role || user.role;

    if (body.permissions !== undefined || patch.role) {
      if (effectiveRole === 'owner') {
        patch.permissions = [];
      } else if (body.permissions !== undefined) {
        patch.permissions = normalizePermissions(body.permissions);
      }
    }

    if (body.active !== undefined) {
      const active = coerceBool(body.active, undefined);
      if (active === undefined) throw badRequest('active must be a boolean');
      // Prevent deactivating the last active owner.
      if (user.role === 'owner' && active === false) {
        const owners = await store.find('admin_users', { role: 'owner' });
        const activeOwners = owners.filter((o) => o.active !== false);
        if (activeOwners.length <= 1) {
          throw forbidden('Cannot deactivate the last active owner');
        }
      }
      patch.active = active;
    }

    const updated = await store.update('admin_users', user.id, patch);
    res.json(publicUser(updated));
  })
);

// POST /api/users/:id/password — set a user's password.
router.post(
  '/:id/password',
  asyncWrap(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ['password']);
    if (String(body.password).length < 8) {
      throw badRequest('Password must be at least 8 characters');
    }
    const user = await store.get('admin_users', req.params.id);
    if (!user) throw notFound('User not found');

    const password_hash = await bcrypt.hash(
      String(body.password),
      config.BCRYPT_ROUNDS
    );
    await store.update('admin_users', user.id, { password_hash });
    res.json({ ok: true });
  })
);

// DELETE /api/users/:id — delete a user (cannot remove the last owner, and an
// owner cannot delete their own account).
router.delete(
  '/:id',
  asyncWrap(async (req, res) => {
    const user = await store.get('admin_users', req.params.id);
    if (!user) throw notFound('User not found');

    if (user.id === req.user.id) {
      throw forbidden('You cannot delete your own account');
    }

    if (user.role === 'owner') {
      const owners = await store.find('admin_users', { role: 'owner' });
      if (owners.length <= 1) {
        throw forbidden('Cannot delete the last owner');
      }
    }

    await store.remove('admin_users', user.id);
    res.json({ ok: true });
  })
);

module.exports = router;
