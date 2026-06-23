// db/postgresStore.js — PostgreSQL persistence implementing the shared store
// interface. Used automatically when DATABASE_URL is set.
//
// SECURITY: every query is PARAMETERIZED ($1, $2, ...). User-supplied values
// are NEVER interpolated into SQL text. Table and column identifiers are
// validated against a whitelist before they are placed in SQL, so they can
// never carry injection.
//
// The "pg" package is an optional dependency. It is required lazily so the
// JSON-store-only install (no DATABASE_URL) does not need it present.

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { TABLES } = require('./jsonStore');

// Identifier validation — only plain snake_case identifiers are ever allowed
// to reach SQL text. This guards column names supplied via where/patch objects.
const IDENT_RE = /^[a-z_][a-z0-9_]*$/;

function assertIdent(name) {
  if (typeof name !== 'string' || !IDENT_RE.test(name)) {
    throw new Error(`Invalid identifier: ${String(name)}`);
  }
  return name;
}

class PostgresStore {
  constructor(connectionString) {
    // Lazy require so installs without DATABASE_URL don't need "pg".
    let Pool;
    try {
      ({ Pool } = require('pg'));
    } catch (err) {
      throw new Error(
        'DATABASE_URL is set but the "pg" package is not installed. ' +
          'Run "npm install pg" to enable the PostgreSQL store.'
      );
    }
    const ssl =
      /sslmode=require/.test(connectionString) ||
      process.env.PGSSLMODE === 'require'
        ? { rejectUnauthorized: false }
        : undefined;
    this.pool = new Pool({ connectionString, ssl });
  }

  _assertTable(table) {
    if (typeof table !== 'string' || !TABLES.includes(table)) {
      throw new Error(`Unknown table: ${String(table)}`);
    }
    return table;
  }

  async query(text, params) {
    return this.pool.query(text, params);
  }

  // Run schema.sql on boot to ensure all tables exist. Idempotent (every
  // statement is CREATE ... IF NOT EXISTS).
  async init() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await this.pool.query(sql);
  }

  // ----- shared interface --------------------------------------------------

  async all(table) {
    this._assertTable(table);
    const { rows } = await this.pool.query(
      `SELECT * FROM ${table} ORDER BY created_at DESC`
    );
    return rows;
  }

  async get(table, id) {
    this._assertTable(table);
    const { rows } = await this.pool.query(
      `SELECT * FROM ${table} WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  // Build a "WHERE col1 = $1 AND col2 = $2" clause from an equality object.
  _buildWhere(whereObj, startIndex = 1) {
    const keys = Object.keys(whereObj || {});
    const clauses = [];
    const values = [];
    keys.forEach((key, i) => {
      assertIdent(key);
      clauses.push(`${key} = $${startIndex + i}`);
      values.push(whereObj[key]);
    });
    return { text: clauses.join(' AND '), values };
  }

  async find(table, whereObj = {}) {
    this._assertTable(table);
    const { text, values } = this._buildWhere(whereObj);
    const where = text ? ` WHERE ${text}` : '';
    const { rows } = await this.pool.query(
      `SELECT * FROM ${table}${where} ORDER BY created_at DESC`,
      values
    );
    return rows;
  }

  async findOne(table, whereObj = {}) {
    const rows = await this.find(table, whereObj);
    return rows[0] || null;
  }

  async insert(table, obj) {
    this._assertTable(table);
    const row = {
      id: (obj && obj.id) || crypto.randomUUID(),
      ...obj,
    };
    if (!row.created_at) row.created_at = new Date().toISOString();

    const cols = Object.keys(row);
    cols.forEach(assertIdent);
    const placeholders = cols.map((_, i) => `$${i + 1}`);
    const values = cols.map((c) => this._serialize(row[c]));

    const { rows } = await this.pool.query(
      `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders.join(
        ', '
      )}) RETURNING *`,
      values
    );
    return rows[0];
  }

  async update(table, id, patch = {}) {
    this._assertTable(table);
    // Never allow id / created_at to be overwritten.
    const { id: _ignoreId, created_at: _ignoreCreated, ...safe } = patch;
    const cols = Object.keys(safe);
    if (!cols.length) return this.get(table, id);
    cols.forEach(assertIdent);
    const sets = cols.map((c, i) => `${c} = $${i + 1}`);
    const values = cols.map((c) => this._serialize(safe[c]));
    values.push(id);
    const { rows } = await this.pool.query(
      `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${
        cols.length + 1
      } RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  async remove(table, id) {
    this._assertTable(table);
    const { rowCount } = await this.pool.query(
      `DELETE FROM ${table} WHERE id = $1`,
      [id]
    );
    return rowCount > 0;
  }

  async count(table, whereObj) {
    this._assertTable(table);
    const { text, values } = this._buildWhere(whereObj || {});
    const where = text ? ` WHERE ${text}` : '';
    const { rows } = await this.pool.query(
      `SELECT COUNT(*)::int AS n FROM ${table}${where}`,
      values
    );
    return rows[0] ? rows[0].n : 0;
  }

  // Objects/arrays are stored in jsonb columns — pg stringifies them for us,
  // but we stringify explicitly so the binding is unambiguous.
  _serialize(value) {
    if (value !== null && typeof value === 'object') {
      return JSON.stringify(value);
    }
    return value;
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = { PostgresStore };
