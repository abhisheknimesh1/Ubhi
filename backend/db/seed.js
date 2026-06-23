// db/seed.js — idempotent seed. Run with "npm run seed".
//
// Creates:
//   - the owner admin_user from OWNER_EMAIL / OWNER_PASSWORD (hashed) if none
//     exists yet,
//   - a few sample published workshops and products so the public API returns
//     data immediately.
//
// Safe to run repeatedly: existing records are detected and left untouched.

'use strict';

const bcrypt = require('bcryptjs');
const config = require('../config');
const { store } = require('./store');

const SAMPLE_WORKSHOPS = [
  {
    title: 'Handmade Paper: First Pulls',
    blurb:
      'A gentle introduction to forming sheets from cotton and plant fibre. Leave with your own pressed pages.',
    session_date: '2026-07-12',
    price: 65,
    spots: 8,
    image: '',
    published: true,
  },
  {
    title: 'Botanical Inclusions',
    blurb:
      'Press petals, leaves and seeds into living paper. A slow afternoon of texture and scent.',
    session_date: '2026-08-09',
    price: 75,
    spots: 6,
    image: '',
    published: true,
  },
];

const SAMPLE_PRODUCTS = [
  {
    name: 'Almanac — Cotton Edition',
    blurb:
      'Our flagship handmade-paper almanac. Deckle-edged, thread-bound, made to be written in.',
    price: 38,
    stock: 25,
    image: '',
    published: true,
  },
  {
    name: 'Letter Set — Wildflower',
    blurb:
      'Ten sheets and envelopes of seeded handmade paper. Plantable once your words have travelled.',
    price: 18,
    stock: 40,
    image: '',
    published: true,
  },
];

async function seedOwner() {
  const existing = await store.findOne('admin_users', {
    email: config.OWNER_EMAIL,
  });
  if (existing) {
    console.log(`[seed] owner already exists: ${config.OWNER_EMAIL}`);
    return;
  }
  // Also guard against any other owner already present.
  const owners = await store.find('admin_users', { role: 'owner' });
  if (owners.length) {
    console.log('[seed] an owner already exists — skipping owner creation');
    return;
  }

  // Never create the live owner login with a missing or default password.
  if (!config.OWNER_PASSWORD || config.OWNER_PASSWORD === 'change-me-now') {
    throw new Error(
      '[seed] OWNER_PASSWORD is missing or still the default. Set OWNER_EMAIL and a ' +
        'strong OWNER_PASSWORD in your environment (.env), then re-run "npm run seed".'
    );
  }

  const password_hash = await bcrypt.hash(
    config.OWNER_PASSWORD,
    config.BCRYPT_ROUNDS
  );
  const owner = await store.insert('admin_users', {
    email: config.OWNER_EMAIL,
    password_hash,
    role: 'owner',
    permissions: [],
    name: 'Owner',
    active: true,
  });
  console.log(`[seed] created owner: ${owner.email}`);
}

async function seedTable(table, rows, matchKey) {
  for (const row of rows) {
    const where = {};
    where[matchKey] = row[matchKey];
    const existing = await store.findOne(table, where);
    if (existing) {
      console.log(`[seed] ${table} already has "${row[matchKey]}"`);
      continue;
    }
    await store.insert(table, row);
    console.log(`[seed] inserted ${table}: "${row[matchKey]}"`);
  }
}

async function run() {
  console.log(`[seed] using ${store.kind} store`);
  if (typeof store.initialize === 'function') {
    await store.initialize();
  }
  await seedOwner();
  await seedTable('workshops', SAMPLE_WORKSHOPS, 'title');
  await seedTable('products', SAMPLE_PRODUCTS, 'name');
  console.log('[seed] done');
}

// Run when invoked directly (node db/seed.js). Export run() for reuse/tests.
if (require.main === module) {
  run()
    .then(() => {
      if (typeof store.close === 'function') return store.close();
    })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[seed] failed:', err);
      process.exit(1);
    });
}

module.exports = { run };
