// services/mailer.js — outbound email (optional).
//
// Exports:
//   sendMail({ to, subject, text, html, from })  -> Promise<{ ok, ... }>
//   isConfigured()                               -> boolean
//
// The "nodemailer" package is LAZY-REQUIRED and only used when SMTP_HOST is set.
// When SMTP is NOT configured, sendMail logs the message to the console (a dev
// stub) and resolves — it never throws and never crashes the server. This lets
// the rest of the API call sendMail freely (order confirmations, etc.) without
// guarding every call site.

'use strict';

const config = require('../config');

// Memoised transport so we reuse a single connection pool across calls.
let transporter = null;

// True when an SMTP host has been configured via the environment.
function isConfigured() {
  return Boolean(config.SMTP_HOST);
}

// Lazily build (and cache) the nodemailer transport. Returns null when SMTP is
// not configured. The require lives here so the server boots without the SMTP
// path ever being exercised in dev.
function getTransport() {
  if (!isConfigured()) return null;
  if (transporter) return transporter;

  // eslint-disable-next-line global-require
  const nodemailer = require('nodemailer');

  transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    // Port 465 implies implicit TLS; other ports use STARTTLS when available.
    secure: Number(config.SMTP_PORT) === 465,
    auth:
      config.SMTP_USER || config.SMTP_PASS
        ? { user: config.SMTP_USER, pass: config.SMTP_PASS }
        : undefined,
  });

  return transporter;
}

// Send (or, in dev, log) an email. Required: `to` and `subject`, plus at least
// one of `text` / `html`. Resolves with a small result object; rejects only on
// a genuine SMTP failure when SMTP IS configured. Missing fields throw a clear
// Error (status 400) so a route can surface a useful message.
async function sendMail(message = {}) {
  const to = String(message.to || '').trim();
  const subject = String(message.subject || '').trim();
  const text = message.text != null ? String(message.text) : '';
  const html = message.html != null ? String(message.html) : '';
  const from = String(message.from || config.FROM_EMAIL || '').trim();

  if (!to) {
    const err = new Error('sendMail: "to" is required');
    err.status = 400;
    throw err;
  }
  if (!subject) {
    const err = new Error('sendMail: "subject" is required');
    err.status = 400;
    throw err;
  }
  if (!text && !html) {
    const err = new Error('sendMail: provide "text" or "html"');
    err.status = 400;
    throw err;
  }

  // Dev stub — no SMTP configured. Log a compact summary and resolve so callers
  // (and the server) carry on uninterrupted.
  if (!isConfigured()) {
    // eslint-disable-next-line no-console
    console.log(
      `[mailer:dev] (SMTP not configured) email not sent\n` +
        `  from:    ${from}\n` +
        `  to:      ${to}\n` +
        `  subject: ${subject}\n` +
        `  body:    ${(text || html).slice(0, 500)}`
    );
    return { ok: true, configured: false, stub: true };
  }

  // Real send. We deliberately do NOT swallow SMTP errors here — a caller that
  // truly needs delivery confirmation can await/catch. Routes that fire-and-
  // forget should call sendMail(...).catch(() => {}) so a mail outage never
  // fails the user's primary action.
  const transport = getTransport();
  const info = await transport.sendMail({ from, to, subject, text, html });

  return { ok: true, configured: true, messageId: info && info.messageId };
}

module.exports = {
  isConfigured,
  sendMail,
};
