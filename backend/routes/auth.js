// routes/auth.js — authentication endpoints.
//
//   POST /api/auth/login            PUBLIC -> { token, user }
//   GET  /api/auth/me               requireAuth -> { user }
//   POST /api/auth/change-password  requireAuth -> { ok: true }
//
// Login is rate-limited (10 attempts / 15 min per IP). Passwords are bcrypt
// hashed and never returned.

'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const { store } = require('../db/store');
const config = require('../config');
const { signToken, requireAuth } = require('../middleware/auth');
const {
  asyncWrap,
  badRequest,
  unauthorized,
  notFound,
} = require('../middleware/errors');
const { requireFields } = require('../middleware/validate');

const router = express.Router();

// Rate limiter for login: 10 requests / 15 minutes per IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

// Strip sensitive fields before sending a user to the client.
function publicUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

// POST /api/auth/login — verify credentials, return a JWT + safe user.
router.post(
  '/login',
  loginLimiter,
  asyncWrap(async (req, res) => {
    const { email, password } = req.body || {};
    requireFields(req.body, ['email', 'password']);

    const user = await store.findOne('admin_users', {
      email: String(email).trim().toLowerCase(),
    });

    // Uniform error message — never reveal whether the email exists.
    if (!user || user.active === false) {
      throw unauthorized('Invalid email or password');
    }

    const ok = await bcrypt.compare(String(password), user.password_hash || '');
    if (!ok) {
      throw unauthorized('Invalid email or password');
    }

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  })
);

// GET /api/auth/me — return the current authenticated user (fresh from store).
router.get(
  '/me',
  requireAuth,
  asyncWrap(async (req, res) => {
    const user = await store.get('admin_users', req.user.id);
    if (!user) throw notFound('User not found');
    res.json({ user: publicUser(user) });
  })
);

// POST /api/auth/change-password — change own password.
router.post(
  '/change-password',
  requireAuth,
  asyncWrap(async (req, res) => {
    const body = req.body || {};
    requireFields(body, ['current', 'next']);
    const { current, next } = body;

    if (String(next).length < 8) {
      throw badRequest('New password must be at least 8 characters');
    }

    const user = await store.get('admin_users', req.user.id);
    if (!user) throw notFound('User not found');

    const ok = await bcrypt.compare(String(current), user.password_hash || '');
    if (!ok) throw badRequest('Current password is incorrect');

    const password_hash = await bcrypt.hash(
      String(next),
      config.BCRYPT_ROUNDS
    );
    await store.update('admin_users', user.id, { password_hash });
    res.json({ ok: true });
  })
);

module.exports = router;
