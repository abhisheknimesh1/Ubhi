// middleware/validate.js — small input validation / coercion helpers.
//
// These keep route handlers terse while enforcing the contract: reject missing
// required fields with 400, and coerce loose inputs (strings -> number/bool)
// into clean values before they reach the store.
//
// Exports:
//   requireFields(body, [...keys])     -> throws badRequest if any missing/empty
//   pick(obj, [...keys])               -> new object with only those keys present
//   isEmail(str)                       -> boolean
//   coerceNumber(v, fallback?)         -> number | undefined
//   coerceBool(v, fallback?)           -> boolean | undefined
//   coerceInt(v, fallback?)            -> integer | undefined
//   cleanString(v)                     -> trimmed string | undefined

'use strict';

const { badRequest } = require('./errors');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmail(value) {
  return typeof value === 'string' && EMAIL_RE.test(value.trim());
}

// Throw a 400 listing every required field that is missing or blank.
function requireFields(body, keys) {
  const source = body && typeof body === 'object' ? body : {};
  const missing = [];
  keys.forEach((key) => {
    const v = source[key];
    if (
      v === undefined ||
      v === null ||
      (typeof v === 'string' && v.trim() === '')
    ) {
      missing.push(key);
    }
  });
  if (missing.length) {
    throw badRequest(`Missing required field(s): ${missing.join(', ')}`);
  }
  return true;
}

// Return a shallow copy of obj containing only the listed keys that are
// actually present (undefined keys are skipped — useful for PATCH).
function pick(obj, keys) {
  const out = {};
  if (!obj || typeof obj !== 'object') return out;
  keys.forEach((key) => {
    if (obj[key] !== undefined) out[key] = obj[key];
  });
  return out;
}

function coerceNumber(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function coerceInt(value, fallback) {
  const n = coerceNumber(value, undefined);
  return n === undefined ? fallback : Math.trunc(n);
}

function coerceBool(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const s = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(s)) return true;
  if (['false', '0', 'no', 'off'].includes(s)) return false;
  return fallback;
}

function cleanString(value) {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  return s === '' ? undefined : s;
}

module.exports = {
  isEmail,
  requireFields,
  pick,
  coerceNumber,
  coerceInt,
  coerceBool,
  cleanString,
};
