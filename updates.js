/* ════════════════════════════════════════════════════════════════
   THE UBHI ALMANAC · updates.js
   "Keep me posted" email list — front-of-house sign-up + a new Admin
   tab with CSV export. Self-contained & additive: script.js is never
   touched. Stored under the same ubhi- prefix so the existing JSON
   database backup includes it automatically.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var KEY = 'ubhi-email-updates';

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (e) { return []; }
  }
  function write(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {}
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ── front-of-house: the "Keep me posted" form ──────────────────── */
  function initForm() {
    var form = document.getElementById('updates-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var emailEl = document.getElementById('updates-email');
      var email = (emailEl && emailEl.value || '').trim();
      var name = (document.getElementById('updates-name') || {}).value || '';
      name = name.trim();
      var interest = (document.getElementById('updates-interest') || {}).value || 'Everything';
      var msg = document.getElementById('updates-msg');

      function say(text, ok) {
        if (!msg) return;
        msg.textContent = text;
        msg.className = 'subscribe-msg ' + (ok ? 'is-ok' : 'is-error');
      }
      if (!name) {
        say('Mind telling me your name?', false);
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        say('Hmm, that email looks off — mind checking it?', false);
        return;
      }
      var list = read();
      if (list.some(function (x) { return (x.email || '').toLowerCase() === email.toLowerCase(); })) {
        say("You're already on the list — lovely to have you ✿", true);
        form.reset();
        return;
      }
      list.push({ name: name, email: email, interest: interest, date: new Date().toISOString().split('T')[0] });
      write(list);
      form.reset();
      say("You're on the list — thank you for wandering in ✿", true);
      renderAdmin();
    });
  }

  /* ── admin: render the list ─────────────────────────────────────── */
  function renderAdmin() {
    var body = document.getElementById('admin-updates-table-body');
    if (!body) return;
    var list = read();
    var stats = document.getElementById('admin-updates-stats');
    if (stats) {
      stats.innerHTML = '<span class="admin-stat"><strong>' + list.length + '</strong> ' +
        (list.length === 1 ? 'person' : 'people') + ' on the list</span>';
    }
    if (!list.length) {
      body.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:26px;color:var(--mist);">No one has subscribed yet.</td></tr>';
      return;
    }
    body.innerHTML = list.map(function (x, i) {
      return '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td>' + esc(x.name || '—') + '</td>' +
        '<td>' + esc(x.email) + '</td>' +
        '<td>' + esc(x.interest || 'Everything') + '</td>' +
        '<td>' + esc(x.date || '') + '</td>' +
        '<td style="text-align:center;"><button type="button" class="admin-mini-del" data-updates-del="' + i + '" title="Remove">✕</button></td>' +
        '</tr>';
    }).join('');
  }

  function exportCsv() {
    var list = read();
    if (!list.length) { alert('No emails to export yet.'); return; }
    var csv = 'Name,Email,Interested In,Date Subscribed\n';
    list.forEach(function (x) {
      var row = [x.name || '', x.email || '', x.interest || 'Everything', x.date || ''].map(function (f) {
        f = String(f).replace(/"/g, '""');
        return /[",\n]/.test(f) ? '"' + f + '"' : f;
      }).join(',');
      csv += row + '\n';
    });
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'ubhi_email_updates_' + new Date().toISOString().split('T')[0] + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function initAdmin() {
    var tab = document.querySelector('[data-admin-tab="updates"]');
    if (tab) tab.addEventListener('click', renderAdmin);   // render when the tab is opened
    var exportBtn = document.getElementById('admin-updates-export-btn');
    if (exportBtn) exportBtn.addEventListener('click', exportCsv);
    var clearBtn = document.getElementById('admin-updates-clear-btn');
    if (clearBtn) clearBtn.addEventListener('click', function () {
      if (confirm('Clear the entire email update list? This cannot be undone.')) { write([]); renderAdmin(); }
    });
    var body = document.getElementById('admin-updates-table-body');
    if (body) body.addEventListener('click', function (e) {
      var del = e.target.closest && e.target.closest('[data-updates-del]');
      if (!del) return;
      var i = +del.getAttribute('data-updates-del');
      var list = read();
      list.splice(i, 1);
      write(list);
      renderAdmin();
    });
    renderAdmin();
  }

  /* ── front-of-house: a quiet "unsubscribe" ──────────────────────── */
  function initUnsub() {
    var btn = document.getElementById('updates-unsub');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var emailEl = document.getElementById('updates-email');
      var email = (emailEl && emailEl.value || '').trim();
      var msg = document.getElementById('updates-msg');
      function say(t, ok) { if (msg) { msg.textContent = t; msg.className = 'subscribe-msg ' + (ok ? 'is-ok' : 'is-error'); } }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        say('Pop your email in the box above, then tap unsubscribe.', false);
        if (emailEl) emailEl.focus();
        return;
      }
      var list = read();
      var idx = -1;
      for (var i = 0; i < list.length; i++) {
        if ((list[i].email || '').toLowerCase() === email.toLowerCase()) { idx = i; break; }
      }
      if (idx === -1) { say("That email isn't on the list — nothing to undo.", false); return; }
      list.splice(idx, 1);
      write(list);
      if (emailEl) emailEl.value = '';
      say("You've been removed — you're always welcome back ✿", true);
      renderAdmin();
    });
  }

  /* ── front-of-house: a compact email-only sign-up (e.g. at the foot of the Journal) ── */
  function initJournalForm() {
    var form = document.getElementById('journal-updates-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var emailEl = document.getElementById('journal-updates-email');
      var email = (emailEl && emailEl.value || '').trim();
      var msg = document.getElementById('journal-updates-msg');
      function say(t, ok) { if (msg) { msg.textContent = t; msg.className = 'subscribe-msg ' + (ok ? 'is-ok' : 'is-error'); } }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { say('Hmm, that email looks off — mind checking it?', false); return; }
      var list = read();
      if (list.some(function (x) { return (x.email || '').toLowerCase() === email.toLowerCase(); })) { say("You're already on the list — lovely to have you ✿", true); form.reset(); return; }
      list.push({ name: '', email: email, interest: 'Journal', date: new Date().toISOString().split('T')[0] });
      write(list);
      form.reset();
      say("You're on the list — thank you for wandering in ✿", true);
      renderAdmin();
    });
  }

  ready(function () { initForm(); initJournalForm(); initUnsub(); initAdmin(); });
})();
