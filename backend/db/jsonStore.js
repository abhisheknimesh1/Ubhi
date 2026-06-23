// db/jsonStore.js — zero-config persistence to JSON files on disk.
// Each table is stored at backend/db/data/<table>.json as an array of rows.
// The data directory is created on demand and is gitignored.
//
// Implements the shared store interface (all methods async):
//   all, get, find, findOne, insert, update, remove, count
//
// SECURITY: table names are validated against a whitelist to prevent path
// traversal (a caller can never read/write an arbitrary file on disk).

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// The complete set of tables in the Ubhi data model. Any table not listed
// here is rejected — this is the path-traversal guard.
const TABLES = [
  'admin_users',
  'customers',
  'snail_subscribers',
  'newsletter_signups',
  'orders',
  'bookings',
  'workshops',
  'products',
  'gallery_items',
  'journal_posts',
  'settings',
  // Generic content state-sync: each row is { key, value, updated_at } and holds
  // one storefront content collection (gallery, art-pieces, plans, reviews, …).
  'app_state',
];

const DATA_DIR = path.join(__dirname, 'data');

class JsonStore {
  constructor() {
    this.dataDir = DATA_DIR;
    // Serialize writes per-table so concurrent insert/update calls don't
    // clobber each other (each op reads-modifies-writes the whole file).
    this._locks = new Map();
    this._ensureDir();
  }

  // ----- internal helpers --------------------------------------------------

  _ensureDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  _assertTable(table) {
    if (typeof table !== 'string' || !TABLES.includes(table)) {
      throw new Error(`Unknown table: ${String(table)}`);
    }
  }

  _file(table) {
    this._assertTable(table);
    return path.join(this.dataDir, `${table}.json`);
  }

  // Read all rows for a table from disk (empty array if file is missing).
  _readRaw(table) {
    const file = this._file(table);
    if (!fs.existsSync(file)) return [];
    try {
      const text = fs.readFileSync(file, 'utf8');
      if (!text.trim()) return [];
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      throw new Error(`Failed to read table "${table}": ${err.message}`);
    }
  }

  // Write all rows for a table to disk (pretty-printed for easy inspection).
  _writeRaw(table, rows) {
    this._ensureDir();
    const file = this._file(table);
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(rows, null, 2), 'utf8');
    fs.renameSync(tmp, file); // atomic-ish replace
  }

  // Run an async function while holding a per-table lock so write operations
  // (which read-modify-write the whole file) cannot interleave.
  async _withLock(table, fn) {
    const prev = this._locks.get(table) || Promise.resolve();
    let release;
    const next = new Promise((resolve) => {
      release = resolve;
    });
    this._locks.set(table, prev.then(() => next));
    await prev;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  // Sort newest first by created_at (fall back to insertion order).
  _sortNewestFirst(rows) {
    return rows.slice().sort((a, b) => {
      const ta = Date.parse(a && a.created_at) || 0;
      const tb = Date.parse(b && b.created_at) || 0;
      return tb - ta;
    });
  }

  // True when row matches every key/value pair in where (strict-ish equality).
  _matches(row, where) {
    return Object.keys(where).every((key) => {
      const want = where[key];
      const have = row[key];
      // Compare loosely for primitives so "1" matches 1 etc., but use strict
      // for null/undefined and objects fall through to JSON compare.
      if (have === want) return true;
      if (want === null || want === undefined) return have === want;
      if (typeof have === 'object' || typeof want === 'object') {
        return JSON.stringify(have) === JSON.stringify(want);
      }
      // eslint-disable-next-line eqeqeq
      return have == want;
    });
  }

  // ----- shared interface --------------------------------------------------

  async all(table) {
    const rows = this._readRaw(table);
    return this._sortNewestFirst(rows);
  }

  async get(table, id) {
    const rows = this._readRaw(table);
    return rows.find((r) => r.id === id) || null;
  }

  async find(table, whereObj = {}) {
    const rows = this._readRaw(table);
    const matched = rows.filter((r) => this._matches(r, whereObj));
    return this._sortNewestFirst(matched);
  }

  async findOne(table, whereObj = {}) {
    const rows = await this.find(table, whereObj);
    return rows[0] || null;
  }

  async insert(table, obj) {
    return this._withLock(table, () => {
      const rows = this._readRaw(table);
      const row = {
        id: crypto.randomUUID(),
        ...obj,
        created_at: (obj && obj.created_at) || new Date().toISOString(),
      };
      rows.push(row);
      this._writeRaw(table, rows);
      return row;
    });
  }

  async update(table, id, patch = {}) {
    return this._withLock(table, () => {
      const rows = this._readRaw(table);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      // Never allow id / created_at to be overwritten via patch.
      const { id: _ignoreId, created_at: _ignoreCreated, ...safe } = patch;
      rows[idx] = { ...rows[idx], ...safe };
      this._writeRaw(table, rows);
      return rows[idx];
    });
  }

  async remove(table, id) {
    return this._withLock(table, () => {
      const rows = this._readRaw(table);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) return false;
      rows.splice(idx, 1);
      this._writeRaw(table, rows);
      return true;
    });
  }

  async count(table, whereObj) {
    if (whereObj && Object.keys(whereObj).length) {
      const rows = await this.find(table, whereObj);
      return rows.length;
    }
    return this._readRaw(table).length;
  }
}

module.exports = { JsonStore, TABLES };
