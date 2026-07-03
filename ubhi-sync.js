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
   • Transactional data (orders / bookings / subscribers / signups / messages)
     POSTs to its own structured, validated, append-only API endpoints — and a
     CONNECTED admin device pulls those records back down (ubhiPullRecords) and
     merges them into the local admin tables, so every device's orders appear.

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
          // …and pull every device's orders/bookings/subscribers down at once.
          window.ubhiPullRecords(true);
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
  var SUBMIT_PATHS = { order: '/orders', booking: '/bookings', subscriber: '/subscribers', update: '/updates', contact: '/contact' };
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

  // ----- admin pull-down: server records → local admin tables ---------------
  // The admin panel renders from localStorage. On a CONNECTED admin device we
  // pull the transactional records (orders / bookings / subscribers / signups /
  // contact messages) down from the server and merge them into the local
  // tables, so orders placed on ANY device appear in this panel. Local-only
  // records (placed in this browser while offline) are always kept.
  function readTable(key) {
    try { var v = JSON.parse(localStorage.getItem('ubhi-' + key)); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function writeTable(key, list) {
    try { localStorage.setItem('ubhi-' + key, JSON.stringify(list)); return true; }
    catch (e) { return false; }
  }
  function lower(s) { return String(s || '').toLowerCase(); }
  function sameDay(a, b) { return String(a || '').slice(0, 10) === String(b || '').slice(0, 10); }

  function mapOrder(r) {
    var items = (r.items || []).map(function (it) {
      return { id: it.id || null, name: it.name || 'Item', price: it.price, quantity: it.qty || it.quantity || 1 };
    });
    return {
      _sid: r.id, orderRef: r.order_ref || '',
      name: r.customer_name || '', email: r.customer_email || '', phone: r.phone || '',
      items: items, itemsList: items,
      subtotal: r.subtotal, shipping: r.shipping, totalPrice: r.total,
      address: { street: r.ship_street || '', city: r.ship_city || '', postcode: r.ship_postcode || '', country: r.ship_country || '' },
      orderedAt: r.created_at || new Date().toISOString(),
      status: r.status || 'Preparing with care', paid: !!r.paid,
    };
  }
  function sameOrder(a, b) {
    if (a._sid && a._sid === b._sid) return true;
    if (a.backendId && a.backendId === b._sid) return true;
    if (a.orderRef && b.orderRef && a.orderRef === b.orderRef) return true;
    // An order this browser placed itself (POSTed, but never stamped with the
    // server id): same buyer, same total, same day → one and the same order.
    return lower(a.email || a.customerEmail) === lower(b.email) &&
      Number(a.totalPrice) === Number(b.totalPrice) &&
      sameDay(a.orderedAt || a.date, b.orderedAt);
  }

  function mapBooking(r) {
    return {
      _sid: r.id, name: r.name || '', email: r.email || '', phone: r.phone || '',
      workshop: r.workshop_title || 'Workshop', date: r.session_date || '',
      price: r.price != null ? r.price : '', note: r.note || '',
      status: r.status || 'Reserved', reservedAt: r.created_at || new Date().toISOString(),
    };
  }
  function sameBooking(a, b) {
    if (a._sid && a._sid === b._sid) return true;
    return lower(a.email) === lower(b.email) &&
      String(a.workshop || '') === String(b.workshop || '') &&
      sameDay(a.reservedAt, b.reservedAt);
  }

  function mapMember(r) {
    return {
      _sid: r.id, name: r.name || '', email: r.email || '', contact: r.contact || '',
      plan: r.plan || '', monthlyEquiv: r.price != null ? Number(r.price) : undefined,
      billing: r.price ? ('£' + r.price + ' / month') : '',
      address: r.address || '', status: r.status || 'Active',
      dateSubscribed: String(r.date_subscribed || r.created_at || '').slice(0, 10),
    };
  }
  function sameMember(a, b) {
    if (a._sid && a._sid === b._sid) return true;
    return lower(a.email) === lower(b.email);
  }
  // Dispatch/gift bookkeeping lives only in this browser — never let a server
  // copy blank it out. Richer local billing strings win over the derived one.
  var MEMBER_LOCAL_FIELDS = ['sentCycles', 'lastSentCycle', 'startCycle', 'giftStart', 'giftTermMonths', 'giftPaid', 'isGift', 'giftOn', 'termMonths', 'isPrepay', 'paidUpfront'];
  function mergeMember(local, mapped) {
    var out = Object.assign({}, local);
    Object.keys(mapped).forEach(function (k) {
      if (mapped[k] !== '' && mapped[k] !== undefined && mapped[k] !== null) out[k] = mapped[k];
    });
    MEMBER_LOCAL_FIELDS.forEach(function (f) { if (local[f] !== undefined) out[f] = local[f]; });
    if (local.billing) out.billing = local.billing;
    if (local.monthlyEquiv != null) out.monthlyEquiv = local.monthlyEquiv;
    // A locally-expired gift stays expired even if the server copy says Active.
    if ((local.isGift || local.giftOn) && local.status === 'Inactive') out.status = 'Inactive';
    return out;
  }

  function mapSignup(r) {
    // Full ISO timestamp — the admin's new-item badges compare against it;
    // the table/CSV slice it to the day for display.
    return { _sid: r.id, name: r.name || '', email: r.email || '', interest: r.interest || 'Everything', date: r.created_at || '' };
  }
  function sameSignup(a, b) { return (a._sid && a._sid === b._sid) || lower(a.email) === lower(b.email); }

  function mapMessage(r) {
    return { _sid: r.id, name: r.name || '', email: r.email || '', subject: r.subject || '', message: r.message || '', date: r.created_at || '', read: !!r.read };
  }
  function sameMessage(a, b) { return !!(a._sid && a._sid === b._sid); }

  var PULLS = [
    { path: '/orders', key: 'shop-orders', map: mapOrder, same: sameOrder, merge: null },
    { path: '/bookings', key: 'workshop-reservations', map: mapBooking, same: sameBooking, merge: null },
    { path: '/subscribers', key: 'snail-members', map: mapMember, same: sameMember, merge: mergeMember },
    { path: '/updates', key: 'email-updates', map: mapSignup, same: sameSignup, merge: null },
    { path: '/contact', key: 'contact-messages', map: mapMessage, same: sameMessage, merge: null },
  ];

  function pullOne(spec) {
    return fetch(API + spec.path, { headers: Object.assign({ Accept: 'application/json' }, authHeaders()) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rows) {
        if (!Array.isArray(rows)) return { added: 0, updated: 0 };
        var list = readTable(spec.key);
        var added = 0, updated = 0;
        rows.forEach(function (raw) {
          var mapped = spec.map(raw);
          var idx = -1;
          for (var i = 0; i < list.length; i++) { if (spec.same(list[i], mapped)) { idx = i; break; } }
          if (idx === -1) { list.push(mapped); added++; }
          else {
            var next = spec.merge ? spec.merge(list[idx], mapped) : Object.assign({}, list[idx], mapped);
            if (JSON.stringify(next) !== JSON.stringify(list[idx])) { list[idx] = next; updated++; }
          }
        });
        if ((added || updated) && !writeTable(spec.key, list)) return { added: 0, updated: 0 };
        return { added: added, updated: updated };
      })
      .catch(function () { return { added: 0, updated: 0 }; });
  }

  var lastRecordsPull = 0;
  window.ubhiPullRecords = function (force) {
    if (!state.reachable || !token()) return Promise.resolve({ ok: false, offline: true });
    var now = Date.now();
    if (!force && now - lastRecordsPull < 45000) return Promise.resolve({ ok: true, skipped: true });
    lastRecordsPull = now;
    return Promise.all(PULLS.map(pullOne)).then(function (results) {
      var added = 0, updated = 0;
      results.forEach(function (r) { added += r.added; updated += r.updated; });
      if (added || updated) {
        try { document.dispatchEvent(new CustomEvent('ubhi:records-pulled', { detail: { added: added, updated: updated } })); } catch (e) {}
      }
      return { ok: true, added: added, updated: updated };
    });
  };

  // ----- admin write-back: status changes / deletions → server ---------------
  // Records merged from the server carry _sid; the admin actions in script.js
  // call these so a change made here is reflected for every device. Both
  // resolve (never reject) and are safe no-ops when offline/disconnected.
  var RECORD_PATHS = { order: '/orders', booking: '/bookings', subscriber: '/subscribers', update: '/updates', contact: '/contact' };
  window.ubhiPatch = function (kind, id, patch) {
    var p = RECORD_PATHS[kind];
    if (!p || !id || !state.reachable || !token()) return Promise.resolve({ ok: false, offline: true });
    return fetch(API + p + '/' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
      body: JSON.stringify(patch || {}),
    }).then(function (r) { return { ok: r.ok }; }).catch(function () { return { ok: false, offline: true }; });
  };
  window.ubhiDelete = function (kind, id) {
    var p = RECORD_PATHS[kind];
    if (!p || !id || !state.reachable || !token()) return Promise.resolve({ ok: false, offline: true });
    return fetch(API + p + '/' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: authHeaders(),
    }).then(function (r) { return { ok: r.ok }; }).catch(function () { return { ok: false, offline: true }; });
  };

  // ----- boot: health-check, then bootstrap content --------------------------
  fetch(API + '/health', { headers: { Accept: 'application/json' } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (h) {
      state.reachable = !!(h && h.ok);
      document.documentElement.setAttribute('data-ubhi-backend', state.reachable ? 'on' : 'off');
      pokePill();
      if (state.reachable) {
        return pullState().then(function (n) {
          // Content first, then (connected admin only) the transactional records.
          if (token()) window.ubhiPullRecords();
          return n;
        });
      }
    })
    .catch(function () { state.reachable = false; document.documentElement.setAttribute('data-ubhi-backend', 'off'); pokePill(); });
})();
