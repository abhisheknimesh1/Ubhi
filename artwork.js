/* ════════════════════════════════════════════════════════════════
   THE UBHI ALMANAC · artwork.js
   Ports the hand-drawn illustrations from Chelsea's earlier design
   experiments (EXPMT) into the live site — purely ADDITIVE. It:
     1. injects an inline SVG sprite of the line-art + the ink-wobble
        filter (#rough),
     2. places miniature accents into suitable margins per page,
     3. drives the gentle drift / sway / nudge / steam motion,
     4. switches the wax seals from "U" to "UBHI".
   Nothing existing is removed or overwritten.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  // Owner wants the decorative motion (sway, hand-drawn texture) on regardless
  // of the OS "reduce motion" setting.
  var reduce = false;
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ── 1 · the sprite: ink-wobble filter + symbol library ───────── */
  function injectSprite() {
    if (document.getElementById('ubhi-art-defs')) return;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('id', 'ubhi-art-defs');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    svg.innerHTML = [
      '<defs>',
      '<filter id="rough" x="-12%" y="-12%" width="124%" height="124%">',
      '<feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="7" result="n"/>',
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G"/>',
      '</filter>',
      '</defs>',

      /* — snail (from the Mail Club page) — */
      '<symbol id="art-snail" viewBox="0 0 112 86">',
        '<g fill="none" stroke="var(--art-terra)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">',
        '<path d="M14 74 H96"/>',
        '<path d="M30 74 C18 74 14 60 26 54 C40 46 70 48 80 64 C86 74 78 74 74 74"/>',
        '<circle cx="52" cy="62" r="17"/><circle cx="52" cy="62" r="11"/><circle cx="52" cy="62" r="5"/>',
        '<path d="M80 64 C92 60 96 48 92 40"/><path d="M80 64 C94 64 102 54 100 44"/>',
        '<circle cx="92" cy="40" r="2.6" fill="var(--art-terra)"/><circle cx="100" cy="44" r="2.6" fill="var(--art-terra)"/>',
        '</g></symbol>',

      /* — mandala / seed-of-life (from Random Expt) — */
      '<symbol id="art-mandala" viewBox="0 0 64 64">',
        '<g fill="none" stroke="var(--art-gold)" stroke-width="1.4">',
        '<circle cx="32" cy="32" r="20"/><circle cx="32" cy="22" r="10"/><circle cx="40.7" cy="27" r="10"/>',
        '<circle cx="40.7" cy="37" r="10"/><circle cx="32" cy="42" r="10"/><circle cx="23.3" cy="37" r="10"/>',
        '<circle cx="23.3" cy="27" r="10"/></g></symbol>',

      /* — lotus (from Random Expt) — */
      '<symbol id="art-lotus" viewBox="0 0 64 64">',
        '<g fill="none" stroke="var(--art-rose)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
        '<path d="M8 50c14 6 34 6 48 0"/><path d="M32 50C30 36 30 24 32 14c2 10 2 22 0 36z"/>',
        '<path d="M32 50C24 42 19 32 19 22c8 4 13 16 13 28z"/><path d="M32 50c8-8 13-18 13-28-8 4-13 16-13 28z"/>',
        '<path d="M32 50C18 48 10 40 8 31c10 1 20 9 24 19z"/><path d="M32 50c14-2 22-10 24-19-10 1-20 9-24 19z"/></g></symbol>',

      /* — leafy sprig (from Random Expt) — */
      '<symbol id="art-sprig" viewBox="0 0 64 64">',
        '<g fill="none" stroke="var(--art-sage)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
        '<path d="M32 60C32 44 32 28 32 8"/><path d="M32 47c-8-2-14-8-16-16 8 0 14 6 16 14"/>',
        '<path d="M32 39c8-2 14-8 16-16-8 0-14 6-16 14"/><path d="M32 31c-6-2-11-7-12-14 7 1 11 6 12 12"/>',
        '<path d="M32 23c6-2 11-6 13-12-6 0-11 4-13 10"/><circle cx="32" cy="8" r="2.3"/></g></symbol>',

      /* — eucalyptus stem (round leaves) — */
      '<symbol id="art-eucalyptus" viewBox="0 0 80 200">',
        '<g fill="none" stroke="var(--art-sage)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">',
        '<path d="M40 196 C32 140 48 80 36 22"/>',
        '<circle cx="24" cy="60" r="9"/><circle cx="54" cy="78" r="9"/><circle cx="26" cy="98" r="9"/>',
        '<circle cx="52" cy="116" r="9"/><circle cx="30" cy="136" r="8"/><circle cx="50" cy="154" r="8"/>',
        '</g></symbol>',

      /* — feathery fern — */
      '<symbol id="art-fern" viewBox="0 0 90 210">',
        '<g fill="none" stroke="var(--art-sage)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
        '<path d="M46 206 C40 150 52 92 70 30"/>',
        '<path d="M44 188 C32 186 24 190 17 197"/><path d="M44 188 C56 186 64 190 71 197"/>',
        '<path d="M47 162 C36 160 29 164 23 171"/><path d="M47 162 C58 160 65 164 70 171"/>',
        '<path d="M51 134 C41 132 35 136 30 143"/><path d="M51 134 C61 132 67 136 71 143"/>',
        '<path d="M56 104 C48 102 43 106 39 112"/><path d="M56 104 C64 102 69 106 72 112"/>',
        '<path d="M62 74 C56 72 52 75 49 80"/><path d="M62 74 C68 72 71 75 73 80"/>',
        '</g></symbol>',

      /* — sparkle & star (from art.js doodles) — */
      '<symbol id="art-sparkle" viewBox="0 0 40 40"><path d="M20 4 Q22 18 36 20 Q22 22 20 36 Q18 22 4 20 Q18 18 20 4Z" fill="none" stroke="var(--art-gold)" stroke-width="1.8" stroke-linejoin="round"/></symbol>',
      '<symbol id="art-star" viewBox="0 0 40 40"><path d="M20 4 l4.5 11 12 .8 -9 8 3 11.7 -10.5 -6.4 -10.5 6.4 3-11.7 -9-8 12-.8Z" fill="none" stroke="var(--art-rose)" stroke-width="1.6" stroke-linejoin="round"/></symbol>',

      /* — open journal / book (from art.js) — */
      '<symbol id="art-book" viewBox="0 0 200 200">',
        '<g fill="none" stroke="var(--art-sage)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">',
        '<path d="M40 70 Q100 52 160 70 L160 168 Q100 150 40 168 Z"/><path d="M100 60 L100 158" stroke-width="1.6"/>',
        '<path d="M52 92 Q76 84 96 90"/><path d="M52 108 Q76 100 96 106"/>',
        '<path d="M104 90 Q128 84 148 92"/><path d="M104 106 Q128 100 148 108"/>',
        '<path d="M70 188 L150 150" stroke-width="2.6"/><path d="M150 150 l8 -3 l-2 8 Z" fill="var(--art-sage)"/>',
        '</g></symbol>',

      /* — teacup with steam (from art.js) — */
      '<symbol id="art-teacup" viewBox="0 0 200 210">',
        '<g class="art-steam" fill="none" stroke="var(--art-soft)" stroke-width="2" stroke-linecap="round" opacity="0.7">',
        '<path d="M84 64 q-6 -14 6 -22"/><path d="M104 64 q-6 -14 6 -22"/><path d="M124 64 q-6 -14 6 -22"/>',
        '</g>',
        '<g fill="none" stroke="var(--art-gold)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">',
        '<path d="M52 92 L60 150 Q62 168 100 168 Q138 168 140 150 L148 92 Z"/><path d="M44 92 H156"/>',
        '<path d="M148 104 q30 0 28 24 q-2 16 -26 14"/>',
        '</g></symbol>',

      /* — meditation scene (miniature of the home showpiece) — */
      '<symbol id="art-meditation" viewBox="0 0 240 240">',
        '<g class="art-sun" fill="none" stroke="var(--art-gold)" stroke-width="2" stroke-linecap="round">',
        '<circle cx="198" cy="44" r="14"/>',
        '<path d="M198 18 V8"/><path d="M198 80 V70"/><path d="M224 44 H234"/><path d="M162 44 H172"/>',
        '<path d="M216 26 l7 -7"/><path d="M180 62 l-7 7"/><path d="M216 62 l7 7"/><path d="M180 26 l-7 -7"/>',
        '</g>',
        '<g fill="none" stroke="var(--art-sage)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
        '<path d="M40 196 C34 150 46 100 36 56"/><circle cx="26" cy="92" r="7"/><circle cx="48" cy="108" r="7"/><circle cx="30" cy="126" r="7"/>',
        '</g>',
        '<g fill="none" stroke="var(--art-ink)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">',
        '<circle cx="122" cy="74" r="16"/><path d="M122 90 L122 140"/>',
        '<path d="M122 112 Q88 138 98 162"/><path d="M122 112 Q156 138 146 162"/>',
        '<path d="M88 176 Q122 150 156 176 Q166 186 146 188 L98 188 Q78 186 88 176Z"/>',
        '</g>',
        '<g fill="none" stroke="var(--art-soft)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">',
        '<path d="M64 200 Q122 184 180 200 L188 220 Q122 204 56 220 Z"/><path d="M122 192 L122 212" stroke-width="1.4"/>',
        '<path d="M78 206 Q98 202 114 206" stroke-width="1.3"/><path d="M130 206 Q150 202 166 206" stroke-width="1.3"/>',
        '</g></symbol>',

      /* — postage stamp (lotus) & mini envelope for the collage — */
      '<symbol id="art-stamp" viewBox="0 0 120 140">',
        '<rect x="6" y="6" width="108" height="128" fill="var(--paper-cream)" stroke="var(--art-terra)" stroke-width="2" stroke-dasharray="0.1 8" stroke-linecap="round"/>',
        '<rect x="14" y="14" width="92" height="112" fill="none" stroke="var(--art-terra)" stroke-width="0.8" opacity="0.5"/>',
        '<g transform="translate(60 58)" stroke="var(--art-terra)" stroke-width="2" fill="none" stroke-linecap="round">',
        '<path d="M0 22 C0 4 0 -16 0 -22 C12 -10 12 8 0 22 C-12 8 -12 -10 0 -22"/>',
        '<path d="M0 22 C-8 8 -22 0 -30 -2 C-22 -16 -6 -8 0 22"/><path d="M0 22 C8 8 22 0 30 -2 C22 -16 6 -8 0 22"/>',
        '</g></symbol>',
      '<symbol id="art-envelope" viewBox="0 0 200 150">',
        '<g fill="none" stroke="var(--art-soft)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">',
        '<rect x="14" y="20" width="172" height="112" rx="4" fill="var(--paper-cream)"/>',
        '<path d="M14 26 L100 88 L186 26"/><path d="M14 126 L74 80"/><path d="M186 126 L126 80"/></g></symbol>',

      /* — tote bag: the new cart mark — */
      '<symbol id="art-basket" viewBox="0 0 64 64">',
        '<g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">',
        '<path d="M16 23 H48 L45 54 Q44 57 41 57 H23 Q20 57 19 54 Z"/>',
        '<path d="M25 23 Q25 12 32 12 Q39 12 39 23"/>',
        '</g>',
        '<path d="M32 33 c-2.6-2.6-6.4-.4-4.6 2.8 l4.6 5 4.6-5 c1.8-3.2-2-5.4-4.6-2.8Z" fill="currentColor" stroke="none"/>',
      '</symbol>',

      /* — a little heart & a flying bird (for the Snail Mail hero) — */
      '<symbol id="art-heart" viewBox="0 0 40 36"><path d="M20 32 C6 22 4 12 12 8 C17 5 20 10 20 12 C20 10 23 5 28 8 C36 12 34 22 20 32Z" fill="none" stroke="var(--art-rose)" stroke-width="2.4" stroke-linejoin="round"/></symbol>',
      '<symbol id="art-bird" viewBox="0 0 64 28"><path d="M4 20 Q18 5 32 19 Q46 5 60 20" fill="none" stroke="var(--art-soft)" stroke-width="2" stroke-linecap="round"/></symbol>',
      ''
    ].join('');
    document.body.appendChild(svg);
  }

  /* ── 2 · build an accent element ──────────────────────────────── */
  function accent(sym, vb, cls) {
    var s = document.createElement('span');
    s.className = 'art-accent ' + cls;
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = '<svg viewBox="' + vb + '" preserveAspectRatio="xMidYMid meet">' +
      '<use href="#' + sym + '"' + (reduce ? '' : ' filter="url(#rough)"') + '/></svg>';
    return s;
  }

  /* placements: [pageId, anchorSelector, symbol, viewBox, positionClass] */
  var PLACEMENTS = [
    /* HOME */
    ['page-home', '.hero',            'art-mandala',    '0 0 64 64',  'acc acc-tr drift spin-slow acc-faint sz-mandala'],
    ['page-home', '.hero',            'art-eucalyptus', '0 0 80 200', 'acc acc-bl sway sz-stem'],
    ['page-home', '.path',            'art-sprig',      '0 0 64 64',  'acc acc-tr2 drift sz-sm'],
    ['page-home', '.path',            'art-sparkle',    '0 0 40 40',  'acc acc-spk1 float sz-spk'],
    ['page-home', '.preview-section', 'art-sparkle',    '0 0 40 40',  'acc acc-spk2 drift sz-spk'],
    ['page-home', '.preview-section', 'art-star',       '0 0 40 40',  'acc acc-spk3 float sz-spk'],
    /* SNAIL MAIL */
    ['page-snail-mail', '.snail-story-section', 'art-snail',     '0 0 112 86', 'acc acc-snail sway sz-snail'],
    ['page-snail-mail', '.snail-story-section', 'art-eucalyptus','0 0 80 200', 'acc acc-bl sway sz-stem'],
    ['page-snail-mail', '.snail-story-section', 'art-heart',   '0 0 40 36', 'acc snail-heart-a drift sz-heart'],
    ['page-snail-mail', '.snail-story-section', 'art-heart',   '0 0 40 36', 'acc snail-heart-b float sz-heart'],
    ['page-snail-mail', '.snail-story-section', 'art-bird',    '0 0 64 28', 'acc snail-bird drift sz-bird'],
    ['page-snail-mail', '.snail-story-section', 'art-star',    '0 0 40 40', 'acc snail-star float sz-spk'],
    ['page-snail-mail', '.snail-story-section', 'art-sparkle', '0 0 40 40', 'acc snail-spk-a float sz-spk'],
    ['page-snail-mail', '.snail-archive-section', 'art-mandala', '0 0 64 64',  'acc acc-tr drift spin-slow acc-faint sz-mandala'],
    ['page-snail-mail', '.snail-plans-section', 'art-sparkle',   '0 0 40 40',  'acc acc-spk1 float sz-spk'],
    /* JOURNAL */
    ['page-journal', '.journal-section', 'art-book',    '0 0 200 200','acc acc-book sway sz-book'],
    ['page-journal', '.journal-section', 'art-sprig',   '0 0 64 64',  'acc acc-bl2 drift sz-sm'],
    ['page-journal', '.journal-section', 'art-sparkle', '0 0 40 40',  'acc acc-spk2 float sz-spk'],
    ['page-journal', '.journal-section', 'art-teacup',  '0 0 200 210','acc acc-tea float sz-tea'],
    /* ABOUT */
    ['page-about', '.about', 'art-meditation', '0 0 240 240','acc acc-about float sz-med2'],
    ['page-about', '.about', 'art-mandala',    '0 0 64 64',  'acc acc-tr drift spin-slow acc-faint sz-mandala'],
    ['page-about', '.about', 'art-eucalyptus', '0 0 80 200', 'acc acc-bl sway sz-stem'],
    /* WORKSHOPS */
    ['page-workshops', '.page-hero', 'art-mandala',  '0 0 64 64',  'acc acc-tr drift spin-slow acc-faint sz-mandala'],
    ['page-workshops', '.page-hero', 'art-sprig',    '0 0 64 64',  'acc acc-bl2 sway sz-sm'],
    ['page-workshops', '.page-hero', 'art-sparkle',  '0 0 40 40',  'acc acc-spk1 float sz-spk'],
    ['page-workshops', '.workshops', 'art-eucalyptus','0 0 80 200', 'acc acc-bl sway sz-stem'],
    ['page-workshops', '.workshops', 'art-lotus',    '0 0 64 64',  'acc acc-tr2 drift acc-faint sz-mandala'],
    /* SHOP */
    ['page-shop', '.page-hero', 'art-lotus',    '0 0 64 64',  'acc acc-tr drift acc-faint sz-mandala'],
    ['page-shop', '.page-hero', 'art-eucalyptus','0 0 80 200', 'acc acc-bl sway sz-stem'],
    ['page-shop', '.page-hero', 'art-star',     '0 0 40 40',  'acc acc-spk1 float sz-spk'],
    ['page-shop', '.shop', 'art-sprig',    '0 0 64 64',  'acc acc-bl2 sway sz-sm'],
    ['page-shop', '.shop', 'art-sparkle',  '0 0 40 40',  'acc acc-spk2 float sz-spk'],
    /* JOURNAL extra */
    ['page-journal', '.journal-section', 'art-eucalyptus', '0 0 80 200', 'acc acc-bl sway sz-stem']
  ];

  function place() {
    PLACEMENTS.forEach(function (p) {
      var page = document.getElementById(p[0]);
      if (!page) return;
      var anchor = page.querySelector(p[1]);
      if (!anchor) return;
      if (getComputedStyle(anchor).position === 'static') anchor.style.position = 'relative';
      anchor.appendChild(accent(p[2], p[3], p[4]));
    });
    buildMiniCollage();
  }

  /* ── 3 · a small "this month's parcel" collage on Snail Mail ───── */
  function buildMiniCollage() {
    var page = document.getElementById('page-snail-mail');
    if (!page) return;
    var anchor = page.querySelector('.snail-plans-section') || page.querySelector('.snail-archive-section');
    if (!anchor) return;
    if (getComputedStyle(anchor).position === 'static') anchor.style.position = 'relative';
    var c = document.createElement('div');
    c.className = 'art-collage';
    c.setAttribute('aria-hidden', 'true');
    c.innerHTML =
      '<span class="ac-card"></span>' +
      '<span class="ac-stamp"><svg viewBox="0 0 120 140"><use href="#art-stamp"' + (reduce ? '' : ' filter="url(#rough)"') + '/></svg></span>' +
      '<span class="ac-env"><svg viewBox="0 0 200 150"><use href="#art-envelope"' + (reduce ? '' : ' filter="url(#rough)"') + '/></svg></span>' +
      '<span class="ac-sprig"><svg viewBox="0 0 80 200"><use href="#art-eucalyptus"' + (reduce ? '' : ' filter="url(#rough)"') + '/></svg></span>' +
      '<span class="wax art-wax sway">UBHI</span>' +
      '<span class="ac-cap">this month’s parcel</span>';
    anchor.appendChild(c);
  }

  /* ── 4 · wax seals say UBHI, and sway ─────────────────────────── */
  function waxToUbhi() {
    document.querySelectorAll('.wax, .wax-gold, .plan-wax-seal, [class*="wax-seal"]').forEach(function (w) {
      var t = (w.textContent || '').trim();
      if (t === '' || t === 'U' || t === 'ਉ' /* ਉ */ || t.length <= 2) {
        // only relabel simple monograms, never wipe richer markup
        if (!w.querySelector('svg')) { w.textContent = 'UBHI'; w.classList.add('wax-ubhi'); }
      }
      if (!reduce) w.classList.add('sway');
    });
  }

  /* ── 5a · swap the cart amulet for a hand-drawn basket ────────── */
  function restyleCart() {
    var btn = document.getElementById('header-cart-btn');
    if (!btn || btn.querySelector('.cart-basket')) return;
    var b = document.createElement('span');
    b.className = 'cart-basket';
    b.setAttribute('aria-hidden', 'true');
    b.innerHTML = '<svg viewBox="0 0 64 64"><use href="#art-basket"/></svg>';
    var badge = btn.querySelector('.cart-badge-count-container');
    if (badge) btn.insertBefore(b, badge); else btn.appendChild(b);
    btn.classList.add('has-art-basket');
  }

  /* ── 5b · cart art nudges when something is added ─────────────── */
  function cartNudge() {
    var badge = document.getElementById('cart-badge-count');
    var btn = document.getElementById('header-cart-btn');
    if (!badge || !btn) return;
    var last = badge.textContent;
    new MutationObserver(function () {
      var now = badge.textContent;
      if (now !== last) {
        last = now;
        if (reduce) return;
        btn.classList.remove('cart-nudge');
        void btn.offsetWidth;            // restart the animation
        btn.classList.add('cart-nudge');
      }
    }).observe(badge, { childList: true, characterData: true, subtree: true });
  }

  /* ── Snail Mail · the "peek inside" letter unfolds ──────────────── */
  function snailPeek() {
    var btn = document.getElementById('snail-peek-btn');
    var letter = document.getElementById('snail-peek-letter');
    if (!btn || !letter) return;
    btn.addEventListener('click', function () { letter.classList.add('is-open'); });
  }

  /* ── Snail Mail · a Subscribe button on every plan tile ─────────── */
  function snailPlanSubscribe() {
    var cards = document.querySelectorAll('#page-snail-mail .snail-plan-card');
    if (!cards.length) return;
    var subBtn = document.getElementById('snail-subscribe-btn');
    [].forEach.call(cards, function (card) {
      if (card.querySelector('.snail-plan-subscribe')) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'snail-plan-subscribe';
      b.innerHTML = 'Subscribe <span class="heart" aria-hidden="true">♥</span>';
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        card.click();                  // select this plan via the site's own handler
        if (subBtn) subBtn.click();    // and open the subscribe modal, seamlessly
      });
      card.appendChild(b);
    });
  }

  /* ── Snail Mail · the big envelope opens to reveal the letter ───── */
  function snailEnvelopeReveal() {
    var mount = document.querySelector('#page-snail-mail .snail-letter-mount');
    var env = document.getElementById('snail-closed-envelope');
    if (!mount || !env) return;
    mount.classList.add('js-envelope');           // enable the closed-envelope mode
    env.addEventListener('click', function () { mount.classList.add('is-open'); });
  }

  /* ── Snail Mail · hero CTA smooth-scrolls to the plans (button, not a hash link) ─ */
  function snailHeroSubscribe() {
    var btn = document.querySelector('#page-snail-mail [data-scroll-to-plans]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var target = document.getElementById('snail-subscribe-anchor');
      if (!target) return;
      var header = document.querySelector('[data-header]');
      var offset = (header ? header.offsetHeight : 88) + 16;
      var soft = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      var y = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: y, behavior: soft ? 'smooth' : 'auto' });
      target.classList.add('snail-plans-flash');
      setTimeout(function () { target.classList.remove('snail-plans-flash'); }, 1400);
    });
  }

  ready(function () {
    injectSprite();
    place();
    waxToUbhi();
    restyleCart();
    cartNudge();
    snailPeek();
    snailPlanSubscribe();
    snailEnvelopeReveal();
    snailHeroSubscribe();
  });
})();
