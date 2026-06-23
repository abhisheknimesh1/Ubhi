// middleware/auth.js — JWT auth + role / permission guards.
//
// Exports:
//   requireAuth(req,res,next)      verify "Authorization: Bearer <jwt>";
//                                  sets req.user = {id, role, permissions, email}
//   requireRole(...roles)          403 unless req.user.role is in roles
//   requirePermission(section)     owner always allowed; staff allowed only if
//                                  section is in req.user.permissions; else 403
//   signToken(user)                JWT {id, role, permissions, email}, 7d
//
// Tokens are stateless. Secret comes from config.JWT_SECRET.

'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');
const { store } = require('../db/store');
const { unauthorized, forbidden } = require('./errors');

// Build and sign a JWT for a user record. Only safe, non-sensitive claims are
// embedded (never the password hash).
function signToken(user) {
  const payload = {
    id: user.id,
    role: user.role,
    permissions: Array.isArray(user.permissions) ? user.permissions : [],
    email: user.email,
  };
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
}

// Extract a bearer token from the Authorization header.
function getBearer(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1].trim() : null;
}

// Verify the JWT, then RE-LOAD the user from the store so that role/permission
// changes, deactivation, and deletion take effect immediately (not after the
// 7-day token lifetime). 401 on any failure. req.user is built from the FRESH
// record, never trusting the (possibly stale) token claims for authorization.
async function requireAuth(req, res, next) {
  const token = getBearer(req);
  if (!token) {
    return next(unauthorized('Missing or malformed Authorization header'));
  }
  let decoded;
  try {
    decoded = jwt.verify(token, config.JWT_SECRET);
  } catch (err) {
    return next(unauthorized('Invalid or expired token'));
  }
  try {
    const user = await store.get('admin_users', decoded.id);
    if (!user || user.active === false) {
      return next(unauthorized('Account is inactive or no longer exists'));
    }
    req.user = {
      id: user.id,
      role: user.role,
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
      email: user.email,
      active: user.active !== false,
    };
    return next();
  } catch (err) {
    return next(err);
  }
}

// Require that the authenticated user has one of the given roles.
function requireRole(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user) return next(unauthorized('Authentication required'));
    if (!roles.includes(req.user.role)) {
      return next(forbidden('Insufficient role'));
    }
    return next();
  };
}

// Require access to a back-office section. Owner is always allowed. Staff is
// allowed only when the section key is present in their permissions array.
function requirePermission(section) {
  return function permissionGuard(req, res, next) {
    if (!req.user) return next(unauthorized('Authentication required'));
    if (req.user.role === 'owner') return next();
    if (
      req.user.role === 'staff' &&
      Array.isArray(req.user.permissions) &&
      req.user.permissions.includes(section)
    ) {
      return next();
    }
    return next(forbidden(`No access to section "${section}"`));
  };
}

module.exports = {
  signToken,
  requireAuth,
  requireRole,
  requirePermission,
};
