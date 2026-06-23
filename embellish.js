/* ════════════════════════════════════════════════════════════════════════
   embellish.js — places the hand-made ink details (embellish.css) at the most
   appropriate spots and wires the micro-interactions. Purely additive: it only
   INSERTS decorative, aria-hidden nodes and listens for clicks; it never edits
   or removes existing content.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var INK = '#3a2e22', GOLD = '#b68a3e', TERRA = '#a8442f', TEAL = '#5e7e72', OLIVE = '#8fa05a';

  // ---- reusable ink doodles (SVG strings) -----------------------------------
  function seed(cx, cy, r, color) {
    var o = ['', [r, 0], [r / 2, r * 0.866], [-r / 2, r * 0.866], [-r, 0], [-r / 2, -r * 0.866], [r / 2, -r * 0.866]];
    var s = '';
    for (var i = 0; i < o.length; i++) {
      var dx = i ? o[i][0] : 0, dy = i ? o[i][1] : 0;
      s += '<circle cx="' + (cx + dx).toFixed(1) + '" cy="' + (cy + dy).toFixed(1) + '" r="' + r + '"/>';
    }
    return '<g fill="none" stroke="' + (color || GOLD) + '" stroke-width="1">' + s + '</g>';
  }
  function star(cx, cy, s, color) {
    return '<path d="M' + cx + ' ' + (cy - s) + ' l' + (s * 0.32) + ' ' + (s * 0.68) + ' l' + (s * 0.68) + ' ' + (s * 0.32) +
      ' l' + (-s * 0.68) + ' ' + (s * 0.32) + ' l' + (-s * 0.32) + ' ' + (s * 0.68) + ' l' + (-s * 0.32) + ' ' + (-s * 0.68) +
      ' l' + (-s * 0.68) + ' ' + (-s * 0.32) + ' l' + (s * 0.68) + ' ' + (-s * 0.32) + ' z" fill="' + (color || GOLD) + '"/>';
  }
  var SNAIL =
    '<svg viewBox="0 0 90 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<g stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round" fill="none">' +
    '<path d="M14 52 q 2 9 14 9 q 30 2 46 -3 q 11 -3 11 -12"/>' +
    '<path d="M84 46 q 4 -10 9 -13"/><path d="M88 48 q 7 -7 12 -8"/></g>' +
    '<circle cx="92" cy="32" r="2" fill="' + INK + '"/><circle cx="101" cy="38" r="2" fill="' + INK + '"/>' +
    '<circle cx="44" cy="30" r="18" fill="#F6EFDA" stroke="' + INK + '" stroke-width="2.4"/>' +
    '<path d="M44 30 c 10 0 12 -10 2 -12 c -12 -3 -15 10 -3 13 c 15 5 18 -11 5 -17" fill="none" stroke="' + TERRA + '" stroke-width="2"/>' +
    '</svg>';
  function sprig(w) {
    return '<svg viewBox="0 0 90 150" width="' + (w || 64) + '" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<g fill="none" stroke="' + TEAL + '" stroke-width="2.4" stroke-linecap="round">' +
      '<path d="M45 150 q -6 -54 0 -96"/>' +
      '<path d="M45 130 q -16 -4 -22 -15"/><path d="M45 130 q 16 -4 22 -15"/>' +
      '<path d="M45 108 q -14 -4 -19 -14"/><path d="M45 108 q 14 -4 19 -14"/>' +
      '<path d="M45 86 q -11 -4 -15 -12"/><path d="M45 86 q 11 -4 15 -12"/></g>' +
      '<ellipse cx="45" cy="40" rx="6" ry="11" fill="' + OLIVE + '"/></svg>';
  }
  function dividerSVG(kind) {
    var centre = kind === 'snail'
      ? '<g transform="translate(135 6) scale(0.34)">' + SNAIL.replace(/<\/?svg[^>]*>/g, '') + '</g>'
      : kind === 'star' ? star(150, 22, 9, GOLD)
        : '<g transform="translate(150 22)">' + seed(0, 0, 7, GOLD) + '</g>';
    return '<svg viewBox="0 0 300 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M28 22 C 70 14 104 14 128 22" fill="none" stroke="' + GOLD + '" stroke-width="1.4" stroke-linecap="round" opacity="0.75"/>' +
      '<path d="M172 22 C 196 30 230 30 272 22" fill="none" stroke="' + GOLD + '" stroke-width="1.4" stroke-linecap="round" opacity="0.75"/>' +
      '<circle cx="20" cy="22" r="1.6" fill="' + GOLD + '"/><circle cx="280" cy="22" r="1.6" fill="' + GOLD + '"/>' +
      centre + '</svg>';
  }
  function waxSVG() {
    return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g transform="translate(32 32)">' +
      '<circle r="28" fill="' + TERRA + '"/>' +
      [0, 45, 90, 135, 180, 225, 270, 315].map(function (a) { return '<path d="M0 -28 l5 7 l-10 0 z" fill="#7c2a20" transform="rotate(' + a + ')"/>'; }).join('') +
      '<g stroke="#7c2a20" stroke-width="1.1" fill="none" opacity="0.9">' + seed(0, 0, 7.5, '#7c2a20').replace('<g fill="none" stroke="#7c2a20" stroke-width="1">', '').replace('</g>', '') + '</g>' +
      '</g></svg>';
  }
  function postmarkSVG() {
    return '<svg viewBox="0 0 116 116" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g fill="none" stroke="' + TEAL + '" stroke-width="2.2" opacity="0.85">' +
      '<circle cx="58" cy="58" r="46"/><circle cx="58" cy="58" r="36"/>' +
      '<path d="M22 50 q 36 -10 72 0 M22 58 q 36 -10 72 0 M22 66 q 36 -10 72 0"/></g>' +
      '<text x="58" y="40" text-anchor="middle" font-family="Georgia, serif" font-size="9" fill="' + TEAL + '" letter-spacing="1">UBHI · LONDON</text>' +
      '<text x="58" y="84" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="11" fill="' + TEAL + '">posted ✓</text></svg>';
  }
  function div(cls, html) { var d = document.createElement('div'); d.className = cls; d.setAttribute('aria-hidden', 'true'); if (html) d.innerHTML = html; return d; }

  // ---- placements -----------------------------------------------------------
  function placeDividers() {
    var home = document.getElementById('page-home');
    if (!home || home.dataset.embDiv) return; home.dataset.embDiv = '1';
    var kinds = ['seed', 'star', 'snail', 'seed', 'star', 'snail'];
    var secs = home.querySelectorAll(':scope > section');
    var n = 0;
    secs.forEach(function (sec) {
      if (sec.classList.contains('hero')) return;
      sec.parentNode.insertBefore(div('ubhi-divider', dividerSVG(kinds[n % kinds.length])), sec);
      n++;
    });
  }
  function placeSnailTile() {
    var card = document.querySelector('.pathway-card[data-page-link="snail-mail"], .pathway-card[href="#snail-mail"]');
    if (card && !card.querySelector('.ubhi-snail--tile')) card.appendChild(div('ubhi-snail ubhi-snail--tile', SNAIL));
  }
  function placeMarginalia() {
    var h = document.querySelector('.practice-journey h2');
    if (h && !h.dataset.embMark) {
      h.dataset.embMark = '1';
      var host = h.parentElement; if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      var m = div('ubhi-mark',
        '<svg width="78" height="60" viewBox="0 0 78 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<path d="M6 40 q 22 -10 30 -30" stroke="' + INK + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
        '<path d="M34 6 l5 8 m1 -10 l-9 8" stroke="' + INK + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
        star(64, 18, 8, GOLD) + '</svg>');
      m.style.right = '-6px'; m.style.top = '-34px';
      host.appendChild(m);
    }
  }
  function placeBotanical() {
    ['#page-art', '#page-journal'].forEach(function (sel) {
      var hero = document.querySelector(sel + ' .page-hero');
      if (hero && !hero.querySelector('.ubhi-botanical')) {
        var b = div('ubhi-botanical', sprig(70));
        b.style.right = '4%'; b.style.bottom = '-6px';
        hero.appendChild(b);
      }
    });
  }
  function placeFooterSeal() {
    var foot = document.querySelector('.site-footer');
    if (foot && !foot.querySelector('.ubhi-footer-seal')) {
      var s = div('ubhi-footer-seal', waxSVG() + '<span>sealed by hand in London · ਉਭੀ</span>');
      var legal = foot.querySelector('.footer-legal, nav.footer-legal');
      foot.insertBefore(s, legal || null);
    }
  }

  // ---- interactions ---------------------------------------------------------
  function waxBurst(x, y) {
    var w = div('ubhi-wax', waxSVG()); w.style.left = x + 'px'; w.style.top = y + 'px';
    document.body.appendChild(w); setTimeout(function () { w.remove(); }, 700);
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.nav-cta, .button-primary, .snail-hero-subscribe, [data-scroll-to-plans]');
    if (!btn || btn.closest('#page-admin, #page-account')) return;
    var r = btn.getBoundingClientRect();
    waxBurst(r.right - 6, r.top + r.height / 2);
  }, true);

  function postmark(form) {
    if (!form) return;
    if (getComputedStyle(form).position === 'static') form.style.position = 'relative';
    var p = div('ubhi-postmark', postmarkSVG());
    p.style.left = '50%'; p.style.top = '50%';
    form.appendChild(p); setTimeout(function () { p.remove(); }, 2600);
  }
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f && (f.matches('#newsletter-form, .subscribe-form, [data-subscribe], #snail-subscribe-form') ||
              f.querySelector('input[type="email"]'))) {
      postmark(f);
    }
  }, true);

  // ---- boot + SPA re-runs ----------------------------------------------------
  function run() {
    try { placeDividers(); } catch (e) {}
    try { placeSnailTile(); } catch (e) {}
    try { placeMarginalia(); } catch (e) {}
    try { placeBotanical(); } catch (e) {}
    try { placeFooterSeal(); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  window.addEventListener('hashchange', function () { setTimeout(run, 80); });
})();
