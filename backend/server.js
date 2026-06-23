// server.js — Ubhi backend entry point.
//
// Boots Express with helmet, CORS, JSON body parsing (raw body only for the
// Stripe webhook), mounts every /api route, exposes GET /api/health, and
// installs the error handler last. Selects the JSON store by default, or
// PostgreSQL when DATABASE_URL is set (running schema.sql on boot).

'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const config = require('./config');
const { store } = require('./db/store');
const { errorHandler } = require('./middleware/errors');

const app = express();

// --- Security & platform middleware ---------------------------------------
app.use(helmet());

// CORS — allow any origin in dev ('*'), or a comma-separated allowlist.
const corsOrigin =
  config.CORS_ORIGIN === '*'
    ? '*'
    : config.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: corsOrigin }));

// Trust the first proxy hop so express-rate-limit sees real client IPs when
// deployed behind a load balancer / reverse proxy.
app.set('trust proxy', 1);

// --- Body parsing -----------------------------------------------------------
// The Stripe webhook needs the RAW body for signature verification, so it must
// be registered with express.raw BEFORE the global JSON parser, and the JSON
// parser must skip that path.
app.use('/api/stripe/webhook', express.raw({ type: '*/*' }));
app.use((req, res, next) => {
  const u = req.originalUrl || '';
  // These handle their own (larger) body parsing: the Stripe webhook needs the
  // raw body; /api/state and /api/upload accept big content/image payloads.
  if (u === '/api/stripe/webhook' || u.startsWith('/api/state') || u.startsWith('/api/upload')) {
    return next();
  }
  return express.json({ limit: '1mb' })(req, res, next);
});

// Serve uploaded images (written by routes/upload.js) as static files.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Health -----------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ ok: true, store: store.kind });
});

// --- Route mounting ---------------------------------------------------------
// Mount each route file under its /api path. We require them directly (fail
// fast): if a route module has an error, the server should refuse to boot
// loudly rather than silently 404 that endpoint in production.
const mounts = [
  ['/api/auth', './routes/auth'],
  ['/api/users', './routes/users'],
  ['/api/orders', './routes/orders'],
  ['/api/bookings', './routes/bookings'],
  ['/api/workshops', './routes/workshops'],
  ['/api/shop', './routes/shop'],
  ['/api/gallery', './routes/gallery'],
  ['/api/journal', './routes/journal'],
  ['/api/subscribers', './routes/subscribers'],
  ['/api/updates', './routes/updates'],
  ['/api/customers', './routes/customers'],
  ['/api/settings', './routes/settings'],
  ['/api/state', './routes/state'],
  ['/api/upload', './routes/upload'],
  ['/api/checkout', './routes/checkout'],
  ['/api/stripe', './routes/stripe'],
];

for (const [mountPath, modulePath] of mounts) {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  app.use(mountPath, require(modulePath));
}

// --- 404 for unknown /api routes -------------------------------------------
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// --- Error handler (MUST be last) ------------------------------------------
app.use(errorHandler);

// --- Boot -------------------------------------------------------------------
async function start() {
  // Initialize the store (Postgres runs schema.sql; JSON is a no-op).
  if (typeof store.initialize === 'function') {
    await store.initialize();
  }

  app.listen(config.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(
      `[server] Ubhi backend listening on http://localhost:${config.PORT} ` +
        `(store: ${store.kind}, env: ${config.NODE_ENV})`
    );
  });
}

// Only start the server when run directly (allows importing app in tests).
if (require.main === module) {
  start().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[server] failed to start:', err);
    process.exit(1);
  });
}

module.exports = { app, start };
