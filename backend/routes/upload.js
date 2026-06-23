// routes/upload.js — image hosting.
//
//   POST /api/upload   body: { dataUrl }   -> { url }   (ADMIN auth required)
//
// The storefront converts a chosen file to a base64 data URL (it already does
// this for the admin image pickers); we decode it, write it to disk under
// backend/uploads/, and return a URL the storefront stores INSTEAD of the giant
// base64 string. This is what keeps localStorage / the DB from bloating, and is
// the local-disk default. To move to S3/Cloudinary later, swap the write below
// for an SDK put and return the CDN URL — the storefront contract is unchanged.

'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const router = express.Router();
const { requireAuth } = require('../middleware/auth');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const bigJson = express.json({ limit: '16mb' });

const EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

router.post('/', requireAuth, bigJson, async (req, res, next) => {
  try {
    const dataUrl = req.body && req.body.dataUrl;
    const m = /^data:([^;]+);base64,(.+)$/s.exec(String(dataUrl || ''));
    if (!m) return res.status(400).json({ error: 'Expected a base64 data URL in { dataUrl }' });
    const mime = m[1].toLowerCase();
    const ext = EXT[mime];
    if (!ext) return res.status(415).json({ error: `Unsupported image type: ${mime}` });
    const buf = Buffer.from(m[2], 'base64');
    if (!buf.length) return res.status(400).json({ error: 'Empty image data' });
    if (buf.length > 8 * 1024 * 1024) return res.status(413).json({ error: 'Image too large (max 8MB)' });
    const name = `${crypto.randomUUID()}.${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
    res.json({ url: `/uploads/${name}`, ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
