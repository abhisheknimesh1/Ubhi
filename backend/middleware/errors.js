// middleware/errors.js — error helpers + final error handler.
//
// Exports:
//   asyncWrap(fn)            wraps async handlers, forwards rejections to next()
//   badRequest(msg)          -> Error with .status = 400
//   unauthorized(msg)        -> Error with .status = 401
//   forbidden(msg)           -> Error with .status = 403
//   notFound(msg)            -> Error with .status = 404
//   errorHandler(err,...)    final middleware: status + { error: message }

'use strict';

// Wrap an async route handler so any thrown/rejected error reaches Express's
// error pipeline (and therefore errorHandler) instead of crashing the process.
function asyncWrap(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function makeError(status, message, fallback) {
  const err = new Error(message || fallback);
  err.status = status;
  return err;
}

function badRequest(msg) {
  return makeError(400, msg, 'Bad request');
}

function unauthorized(msg) {
  return makeError(401, msg, 'Unauthorized');
}

function forbidden(msg) {
  return makeError(403, msg, 'Forbidden');
}

function notFound(msg) {
  return makeError(404, msg, 'Not found');
}

// Final error-handling middleware. Must be mounted LAST in server.js.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err && err.status ? err.status : 500;
  // Avoid leaking internal details on unexpected 500s.
  const message =
    status >= 500
      ? err && err.message
        ? err.message
        : 'Server error'
      : err.message || 'Server error';

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err && err.stack ? err.stack : err);
  }

  res.status(status).json({ error: message || 'Server error' });
}

module.exports = {
  asyncWrap,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  errorHandler,
};
