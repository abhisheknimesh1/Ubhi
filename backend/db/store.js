// db/store.js — selects the active persistence backend and exposes a single
// "store" object with the shared async interface used by every route.
//
//   store.all(table)               -> rows[]   (newest first by created_at)
//   store.get(table, id)           -> row | null
//   store.find(table, whereObj)    -> rows[]    (AND equality match)
//   store.findOne(table, whereObj) -> row | null
//   store.insert(table, obj)       -> row       (auto id (uuid) + created_at)
//   store.update(table, id, patch) -> row | null
//   store.remove(table, id)        -> boolean
//   store.count(table, whereObj?)  -> number
//
// Backend selection:
//   DATABASE_URL set  -> PostgresStore (parameterized SQL)
//   otherwise         -> JsonStore (zero-config JSON files, default)
//
// Routes use ONLY this interface (never raw SQL), so they are portable across
// both backends and injection-safe.

'use strict';

const config = require('../config');
const { JsonStore } = require('./jsonStore');
const { PostgresStore } = require('./postgresStore');

let store;

if (config.USE_POSTGRES) {
  store = new PostgresStore(config.DATABASE_URL);
  store.kind = 'postgres';
} else {
  store = new JsonStore();
  store.kind = 'json';
}

// Optional one-time initialization (Postgres runs schema.sql; JSON is a no-op).
// server.js awaits this on boot.
store.initialize = async function initialize() {
  if (typeof store.init === 'function') {
    await store.init();
  }
};

module.exports = { store };
