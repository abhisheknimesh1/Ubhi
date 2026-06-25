/* ════════════════════════════════════════════════════════════════════════
   ubhi-sync.js — connects the storefront to the Ubhi backend.

   This is the bridge that makes the site "real": instead of living only in one
   browser's localStorage, the owner's CONTENT (gallery, art pieces, plans,
   reviews, site text, …) is persisted to the backend database and shared with
   every device and visitor.

   Design goals:
   • Zero-risk fallback — if the backend is unreachable, everything keeps working
     exactly as before (pure localStorage). Nothing here can break the static site.
   • No rewrite — the 5,000-line app keeps its synchronous dbRead/dbWrite. We just
     (1) BOOTSTRAP localStorage from the server on load, then re-render, and
     (2) WRITE-THROUGH content saves to the server (the dbWrite hook calls us).
   • Transactional data (orders / bookings / subscribers) is NOT synced here — it
     uses its own structured, validated, append-only API endpoints.

   Loaded AFTER script.js so all of the app's render functions already exist.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ----- where is the API? (overridable via window.UBHI_API_BASE) -----------
  var API = (function () {
    if (window.UBHI_API_BASE) return String(window.UBHI_API_BASE).replace(/\/$/, '');
    var loc = window.location;
    if (loc.protocol === 'file:') return 'http://localhost:8090/api';
    // A static dev server (e.g. :8099) talks to the backend on :8090.
    if (loc.port && loc.port !== '80' && loc.port !== '443') {
      if (loc.port === '8090') return loc.origin + '/api';
      return loc.protocol + '//' + loc.hostname + ':8090/api';
    }
    return loc.origin + '/api'; // deployed same-origin
  })();

  // Content collections the storefront syncs (must match the backend allow-list).
  var CONTENT_KEYS = [
    'gallery-items', 'art-pieces', 'workshops', 'workshops-capacities',
    'shop-catalog', 'journal-posts', 'snail-plans', 'snail-photos',
    'snail-reviews', 'site-settings', 'text-overrides', 'text-content', 'email-updates',
  ];

  var TOKEN_KEY = 'ubhi-api-token';
  var EMAIL_KEY = 'ubhi-api-email';
  var state = { reachable: false, base: API };

  function pokePill() { try { if (typeof window.updateServerPill === 'function') window.updateServerPill(); } catch (e) {} }
  function token() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } }
  function setToken(t, email) {
    try {
      if (t) { localStorage.setItem(TOKEN_KEY, t); if (email) localStorage.setItem(EMAIL_KEY, email); }
      else { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(EMAIL_KEY); }
    } catch (e) {}
  }
  function authHeaders() { return token() ? { Authorization: 'Bearer ' + token() } : {}; }

  // ----- the storefront re-renders after a fresh pull ------------------------
  function refreshUI() {
    var fns = [
      'renderHomeGallery', 'renderArtPortfolio', 'renderShop', 'renderWorkshops',
      'renderJournalPosts', 'renderJournal', 'renderSnailPhotos', 'renderSnailGallery',
      'renderSnailReviews', 'applySiteSettings', 'applyTextOverrides', 'applySnailPlanPrices',
    ];
    fns.forEach(function (name) {
      try { if (typeof window[name] === 'function') window[name](); } catch (e) { /* never let one render break the rest */ }
    });
    // Refresh the admin dashboard only when it is actually open — re-rendering it
    // on the public site is wasteful and can surface admin-only render errors.
    try {
      var dash = document.getElementById('admin-dashboard');
      if (dash && dash.offsetParent !== null && typeof window.renderAdminDashboard === 'function') {
        window.renderAdminDashboard();
      }
    } catch (e) {}
  }

  // ----- bootstrap: pull all content from the server into localStorage -------
  function pullState() {
    return fetch(API + '/state', { headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('state ' + r.status); return r.json(); })
      .then(function (data) {
        var changed = 0;
        CONTENT_KEYS.forEach(function (k) {
          if (data && Object.prototype.hasOwnProperty.call(data, k) && data[k] != null) {
            try { localStorage.setItem('ubhi-' + k, JSON.stringify(data[k])); changed++; } catch (e) {}
          }
        });
        if (changed) refreshUI();
        return changed;
      })
      .catch(function () { return 0; });
  }

  // ----- write-through: dbWrite() calls this for every save ------------------
  var pending = {};
  function push(key, value) {
    if (CONTENT_KEYS.indexOf(key) === -1) return;      // content only
    if (!state.reachable || !token()) return;          // need a connected admin
    clearTimeout(pending[key]);
    pending[key] = setTimeout(function () {
      fetch(API + '/state/' + encodeURIComponent(key), {
        method: 'PUT',
        headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
        body: JSON.stringify({ value: value }),
      }).catch(function () { /* offline: localStorage already has it; will re-sync later */ });
    }, 600);
  }
  // dbWrite (in script.js) invokes window.ubhiSyncPush after every local write.
  window.ubhiSyncPush = push;

  // ----- image hosting: base64 -> uploaded file URL --------------------------
  // getFormImageSource() in script.js calls this; returns a hosted URL, or null
  // (caller then falls back to keeping the base64 string).
  window.ubhiUpload = function (dataUrl) {
    if (!state.reachable || !token() || !/^data:/.test(String(dataUrl || ''))) return Promise.resolve(null);
    return fetch(API + '/upload', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
      body: JSON.stringify({ dataUrl: dataUrl }),
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return j && j.url ? (state.base.replace(/\/api$/, '') + j.url) : null; })
      .catch(function () { return null; });
  };

  // ----- admin connects to the server (email + password -> token) -----------
  window.ubhiSyncConnect = function (email, password) {
    return fetch(API + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password }),
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok && res.j && res.j.token) {
          setToken(res.j.token, email);
          // After connecting, push the current local content up once so the
          // server reflects anything the owner edited while offline.
          CONTENT_KEYS.forEach(function (k) {
            try { var v = JSON.parse(localStorage.getItem('ubhi-' + k)); if (v != null) push(k, v); } catch (e) {}
          });
          return { ok: true, email: email };
        }
        return { ok: false, error: (res.j && res.j.error) || 'Login failed' };
      })
      .catch(function () { return { ok: false, error: 'Could not reach the server' }; });
  };
  window.ubhiSyncDisconnect = function () { setToken(''); };
  window.ubhiSyncStatus = function () {
    var email = ''; try { email = localStorage.getItem(EMAIL_KEY) || ''; } catch (e) {}
    return { reachable: state.reachable, connected: !!token(), email: email, base: state.base };
  };

  // ----- transactional submit: orders / bookings / subscribers ---------------
  // Checkout / booking / subscribe flows call this AFTER saving a local receipt.
  // When the backend is reachable the record is POSTed to its validated,
  // append-only PUBLIC endpoint, so it reaches the owner on EVERY device — not
  // just the browser it was placed in. Resolves to a result object and NEVER
  // rejects: { ok:true, data } on success, or { ok:false, offline|error } so the
  // caller can keep the local copy as the fallback. No auth header (public POST).
  var SUBMIT_PATHS = { order: '/orders', booking: '/bookings', subscriber: '/subscribers' };
  window.ubhiSubmit = function (kind, payload) {
    var path = SUBMIT_PATHS[kind];
    if (!path) return Promise.resolve({ ok: false, error: 'unknown kind: ' + kind });
    if (!state.reachable) return Promise.resolve({ ok: false, offline: true });
    return fetch(API + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }, function () { return { ok: r.ok, j: null }; }); })
      .then(function (res) {
        if (res.ok) return { ok: true, data: res.j };
        return { ok: false, error: (res.j && res.j.error) || 'server rejected the record' };
      })
      .catch(function () { return { ok: false, offline: true }; });
  };

  // ----- boot: health-check, then bootstrap content --------------------------
  fetch(API + '/health', { headers: { Accept: 'application/json' } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (h) {
      state.reachable = !!(h && h.ok);
      document.documentElement.setAttribute('data-ubhi-backend', state.reachable ? 'on' : 'off');
      pokePill();
      if (state.reachable) return pullState();
    })
    .catch(function () { state.reachable = false; document.documentElement.setAttribute('data-ubhi-backend', 'off'); pokePill(); });
})();
