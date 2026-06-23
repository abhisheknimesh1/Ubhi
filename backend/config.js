// config.js — central configuration. Reads process.env via dotenv.
// Every secret / key comes from the environment. Sensible dev defaults are
// provided so the API boots with NO .env file (JSON store, no payments/email).

'use strict';

require('dotenv').config();

// Default JWT secret used only when none is supplied. We WARN loudly because
// this must never be used in production — tokens would be forgeable.
const DEFAULT_JWT_SECRET = 'ubhi-dev-insecure-secret-change-me';

function num(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;

if (JWT_SECRET === DEFAULT_JWT_SECRET) {
  // eslint-disable-next-line no-console
  console.warn(
    '[config] WARNING: JWT_SECRET is not set — using an insecure default. ' +
      'Set JWT_SECRET in your environment before deploying to production.'
  );
}

const config = {
  // Server
  PORT: num(process.env.PORT, 8090),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Auth
  JWT_SECRET,
  JWT_EXPIRES_IN: '7d',
  BCRYPT_ROUNDS: 10,

  // Database — when DATABASE_URL is set, PostgresStore is used; else JsonStore.
  DATABASE_URL: process.env.DATABASE_URL || '',

  // CORS — '*' allows any origin (dev default). In production set a real list.
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  // Stripe (optional — payments disabled when absent)
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',

  // Email / SMTP (optional — mailer logs to console when absent)
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: num(process.env.SMTP_PORT, 587),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  FROM_EMAIL: process.env.FROM_EMAIL || 'hello@ubhi.example',

  // Seed owner (used by db/seed.js)
  OWNER_EMAIL: process.env.OWNER_EMAIL || 'owner@ubhi.example',
  OWNER_PASSWORD: process.env.OWNER_PASSWORD || 'change-me-now',

  // Shop economics
  SHIPPING_FLAT: num(process.env.SHIPPING_FLAT, 3.95),
  FREE_SHIP_THRESHOLD: num(process.env.FREE_SHIP_THRESHOLD, 50),
};

// Convenience flag — true when a Postgres connection string is configured.
config.USE_POSTGRES = Boolean(config.DATABASE_URL);

// --- Production safety: refuse to boot with insecure defaults --------------
// In development we allow the insecure fallbacks (with warnings) so the API
// runs with zero setup. In production these become hard errors — an unset or
// default JWT_SECRET would let anyone forge an "owner" token.
if (config.NODE_ENV === 'production') {
  const problems = [];
  if (!process.env.JWT_SECRET || config.JWT_SECRET === DEFAULT_JWT_SECRET) {
    problems.push('JWT_SECRET must be set to a strong, unique value (never the default).');
  } else if (config.JWT_SECRET.length < 32) {
    problems.push('JWT_SECRET must be at least 32 characters long.');
  }
  if (config.CORS_ORIGIN === '*') {
    // eslint-disable-next-line no-console
    console.warn(
      '[config] WARNING: CORS_ORIGIN is "*" in production — set it to your real ' +
        'site origin(s) (comma-separated) so only your storefront can call the API.'
    );
  }
  if (problems.length) {
    throw new Error(
      '[config] Refusing to start with an insecure production configuration:\n  - ' +
        problems.join('\n  - ')
    );
  }
}

module.exports = config;
