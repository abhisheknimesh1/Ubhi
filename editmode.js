/* ════════════════════════════════════════════════════════════════════════
   editmode.js — click-to-edit text for the whole site.

   The owner unlocks the admin (Keeper's Desk), then a small "Edit text" button
   appears on the live site. Turn it on and click ANY piece of text — the menu,
   a heading (including the hero title with its underline), body copy, the
   footer — type the new wording, click away, done. It saves to the synced
   `text-content` store (so it persists to the backend when connected, and to
   this browser otherwise).

   What it does NOT touch: data-driven cards/lists (gallery, shop products,
   workshops, journal posts) — those are edited in their own admin sections so
   inline edits can't be wiped by a re-render. Admin/account screens and forms
   are skipped too.

   Loaded after script.js + ubhi-sync.js so renders and the sync hook exist.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var STORE_KEY = 'ubhi-text-content';
  var usedKeys = {};
  var editMode = false;
  var built = false;

  // ---- persistence (localStorage + backend sync when connected) -------------
  function getStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
  }
  function setStore(o) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(o)); } catch (e) {}
    if (window.ubhiSyncPush) { try { window.ubhiSyncPush('text-content', o); } catch (e) {} }
  }

  // ---- stable key per element (computed from the ORIGINAL wording) -----------
  function hash(s) {
    var h = 5381, i = s.length;
    while (i) h = (h * 33) ^ s.charCodeAt(--i);
    return (h >>> 0).toString(36);
  }
  function keyFor(el) {
    if (el.dataset.emKey) return el.dataset.emKey;
    var page = (el.closest('[id^="page-"]') || {}).id || 'site';
    var base = page + '|' + el.tagName.toLowerCase() + '|' + hash((el.textContent || '').trim());
    var key = base, n = 1;
    while (usedKeys[key]) key = base + '|' + n++;
    usedKeys[key] = true;
    el.dataset.emKey = key;
    el.dataset.emOrig = el.innerHTML;
    return key;
  }

  // ---- which elements are editable ------------------------------------------
  var SEL = 'h1,h2,h3,h4,h5,h6,p,li,blockquote,summary,figcaption,.eyebrow,' +
            '.nav-links a,.nav-cta,.site-footer a,.site-footer h4';
  var EXCLUDE = '#page-admin,#page-account,.modal,[data-noedit],[contenteditable],' +
                'script,style,.ubhi-em-ui,' +
                '[id$="-list"],[id$="-grid"],[id$="-track"],[id$="-table-body"],' +
                '.product-card,.workshop-card,.journal-card,.artfolio-card,.art-card,' +
                '.gallery-item,.snail-photo,.snail-review,.preview-card,.member-card';
  var INLINE_OK = { BR: 1, SPAN: 1, EM: 1, STRONG: 1, I: 1, B: 1, U: 1, A: 1, SMALL: 1, SUP: 1, SUB: 1 };

  function isEditable(el) {
    if (!el || el.closest(EXCLUDE)) return false;
    if (!(el.textContent || '').trim()) return false;
    if (el.children.length === 0) return true;                 // pure-text leaf
    var tag = el.tagName.toLowerCase();
    if (!/^h[1-6]$/.test(tag) && !el.classList.contains('eyebrow')) return false;
    for (var i = 0; i < el.children.length; i++) {             // headings: inline tags only
      if (!INLINE_OK[el.children[i].tagName]) return false;
    }
    return true;
  }
  function collect() {
    var out = [];
    document.querySelectorAll(SEL).forEach(function (el) {
      if (!isEditable(el)) return;
      keyFor(el);
      out.push(el);
    });
    return out;
  }

  // ---- keep owner markup safe when committing --------------------------------
  function sanitize(html) {
    var box = document.createElement('div');
    box.innerHTML = html;
    (function walk(node) {
      Array.prototype.slice.call(node.children).forEach(function (c) {
        if (!INLINE_OK[c.tagName]) { c.replaceWith(document.createTextNode(c.textContent)); return; }
        Array.prototype.slice.call(c.attributes).forEach(function (a) {
          var keep = a.name === 'class' || (c.tagName === 'A' && a.name === 'href');
          if (!keep) c.removeAttribute(a.name);
        });
        if (c.tagName === 'A' && /^\s*javascript:/i.test(c.getAttribute('href') || '')) c.removeAttribute('href');
        walk(c);
      });
    })(box);
    return box.innerHTML.trim();
  }

  // ---- apply saved overrides -------------------------------------------------
  function applyAll() {
    var store = getStore();
    collect().forEach(function (el) {
      var k = el.dataset.emKey;
      if (Object.prototype.hasOwnProperty.call(store, k) && el.innerHTML !== store[k]) {
        el.innerHTML = store[k];
      }
    });
  }

  function isOwner() {
    try { return localStorage.getItem('ubhi-admin-authenticated') === 'true'; } catch (e) { return false; }
  }

  // ---- inline editing --------------------------------------------------------
  function startEdit(el) {
    if (el.isContentEditable) return;
    el._emBefore = el.innerHTML;
    el.contentEditable = 'true';
    el.classList.add('ubhi-em-active');
    el.focus();
    try {
      var r = document.createRange(); r.selectNodeContents(el);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    } catch (e) {}
  }
  function finishEdit(el, commit) {
    el.contentEditable = 'false';
    el.classList.remove('ubhi-em-active');
    if (!commit) { el.innerHTML = el._emBefore; return; }
    var html = sanitize(el.innerHTML);
    var store = getStore(), k = el.dataset.emKey, orig = el.dataset.emOrig;
    if (!html || html === orig) { delete store[k]; el.innerHTML = orig; }
    else { store[k] = html; el.innerHTML = html; }
    setStore(store);
    toast(getStore()[k] ? 'Saved ✓' : 'Reset to original');
  }

  // ---- chrome (button, banner, toast) ---------------------------------------
  function injectStyles() {
    var css =
      '.ubhi-em-btn{position:fixed;left:18px;bottom:18px;z-index:99998;font:600 13px/1 Georgia,serif;letter-spacing:.04em;' +
      'background:#3a2e22;color:#f3ead4;border:1px solid #6b5b49;border-radius:30px;padding:11px 18px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);}' +
      '.ubhi-em-btn:hover{background:#4a3a2a;}' +
      '.ubhi-em-btn.on{background:#5e7e72;border-color:#3a6a55;}' +
      '.ubhi-em-bar{position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:99998;display:none;align-items:center;gap:14px;' +
      'background:#3a2e22;color:#f3ead4;font:14px/1.3 Georgia,serif;padding:10px 16px;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.3);}' +
      '.ubhi-em-bar b{color:#e6c98a;font-weight:600;}' +
      '.ubhi-em-bar button{background:#5e7e72;color:#fff;border:0;border-radius:5px;padding:6px 12px;font:600 13px Georgia,serif;cursor:pointer;}' +
      'body.ubhi-em-on .ubhi-em-bar{display:flex;}' +
      'body.ubhi-em-on [data-em-key]:hover{outline:1px dashed #9e7c3e;outline-offset:3px;cursor:text;}' +
      '[data-em-key].ubhi-em-active{outline:2px solid #b68a3e !important;outline-offset:3px;background:rgba(182,138,62,.10);border-radius:3px;}' +
      '.ubhi-em-toast{position:fixed;left:50%;bottom:70px;transform:translateX(-50%);z-index:99999;background:#3a6a55;color:#fff;' +
      'font:14px Georgia,serif;padding:9px 16px;border-radius:6px;opacity:0;transition:opacity .2s;pointer-events:none;}' +
      '.ubhi-em-toast.show{opacity:1;}';
    var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
  }
  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'ubhi-em-toast'; document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }
  function buildUI() {
    if (built) return; built = true;
    injectStyles();

    // No floating button on the public site — editing is started from the admin
    // ("Edit text on the page"). Only the top "Editing… / Done" bar shows, and
    // only while edit mode is actually on.
    var bar = document.createElement('div');
    bar.className = 'ubhi-em-bar ubhi-em-ui';
    bar.innerHTML = '<span><b>Editing</b> — click any text to change it. It saves as you go.</span>';
    var done = document.createElement('button'); done.type = 'button'; done.textContent = 'Done';
    done.addEventListener('click', function () { setEditMode(false); });
    bar.appendChild(done);
    document.body.appendChild(bar);

    // Wire the admin "Website Text" launcher (it lives in the HTML; fall back to
    // injecting one if it isn't there).
    var launch = document.querySelector('.ubhi-em-launch');
    if (!launch) {
      var card = document.querySelector('#admin-sub-profile-text .admin-section-card');
      if (card) {
        launch = document.createElement('button');
        launch.type = 'button'; launch.className = 'button button-primary ubhi-em-launch';
        launch.textContent = '✎ Edit text on the page';
        card.insertBefore(launch, card.firstChild);
      }
    }
    if (launch && !launch._emWired) {
      launch._emWired = true;
      launch.addEventListener('click', function () { location.hash = '#home'; setTimeout(function () { setEditMode(true); }, 140); });
    }
  }
  function setEditMode(on) {
    editMode = on;
    document.body.classList.toggle('ubhi-em-on', on);
    if (buildUI.btn) { buildUI.btn.classList.toggle('on', on); buildUI.btn.textContent = on ? '✓ Done editing' : '✎ Edit text'; }
    if (on) collect(); // make sure everything on the current page is keyed
    else {
      var a = document.querySelector('[data-em-key].ubhi-em-active');
      if (a) finishEdit(a, true);
    }
  }

  // ---- events ----------------------------------------------------------------
  document.addEventListener('click', function (e) {
    if (!editMode) return;
    if (e.target.closest('.ubhi-em-ui')) return;            // our own chrome
    var el = e.target.closest('[data-em-key]');
    if (!el) return;
    e.preventDefault(); e.stopPropagation();                // block links/buttons
    var active = document.querySelector('[data-em-key].ubhi-em-active');
    if (active && active !== el) finishEdit(active, true);
    startEdit(el);
  }, true);

  document.addEventListener('keydown', function (e) {
    var el = e.target.closest && e.target.closest('[data-em-key].ubhi-em-active');
    if (!el) return;
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); finishEdit(el, true); }
    else if (e.key === 'Escape') { e.preventDefault(); finishEdit(el, false); }
  });
  document.addEventListener('blur', function (e) {
    var el = e.target.closest && e.target.closest('[data-em-key].ubhi-em-active');
    if (el) finishEdit(el, true);
  }, true);

  // ---- boot ------------------------------------------------------------------
  function refresh() { applyAll(); if (isOwner()) buildUI(); }
  function boot() {
    refresh();
    window.addEventListener('hashchange', function () { setTimeout(refresh, 60); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  // exposed so the admin panel can offer a one-tap launcher
  window.ubhiEditMode = { enable: function () { if (isOwner()) { buildUI(); setEditMode(true); } }, disable: function () { setEditMode(false); }, refresh: refresh };
})();
