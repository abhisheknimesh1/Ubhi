/* ════════════════════════════════════════════════════════════════
   THE UBHI ALMANAC · world.js
   Tactile life for the paper world. Self-contained; touches only its
   own elements so the existing script.js (routing, cart, CMS) is
   never disturbed.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // Owner wants the site's gentle decorative motion (draw-in lines, parallax,
  // ambient sway) on regardless of the OS "reduce motion" setting.
  var reduce = false;
  var finePointer = window.matchMedia &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ── 1 · retire the starfield; paper drifts with dust, not stars ── */
  function hideStarfield() {
    var c = document.getElementById('particles');
    if (c) c.style.display = 'none';
  }

  /* ── 2 · botanical sketches that ink themselves in on scroll ────── */
  function drawBotanicals() {
    var draws = [].slice.call(document.querySelectorAll('.draw'));
    if (!draws.length) return;

    draws.forEach(function (svg) {
      var strokes = svg.querySelectorAll('path, line, polyline, ellipse, circle');
      [].forEach.call(strokes, function (el) {
        var len = 320;
        try { len = el.getTotalLength() || 320; } catch (e) {}
        el.style.setProperty('--len', Math.ceil(len));
      });
    });

    if (reduce || !('IntersectionObserver' in window)) {
      draws.forEach(function (d) { d.classList.add('is-drawn'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          // stagger each stroke slightly for a drawn-by-hand cadence
          var strokes = e.target.querySelectorAll('path, line, polyline, ellipse, circle');
          [].forEach.call(strokes, function (el, i) {
            el.style.transitionDelay = (i * 0.16) + 's';
          });
          e.target.classList.add('is-drawn');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    draws.forEach(function (d) { io.observe(d); });
  }

  /* ── 3 · hero ephemera drift on the desk as the cursor moves ────── */
  function heroParallax() {
    var hero = document.querySelector('#page-home .hero');
    if (!hero || reduce || !finePointer) return;
    var layers = [].slice.call(hero.querySelectorAll('[data-depth]'));
    if (!layers.length) return;

    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    function loop() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      layers.forEach(function (l) {
        var d = parseFloat(l.getAttribute('data-depth')) || 10;
        // use the `translate` property so CSS `transform: rotate()` survives
        l.style.translate = (-cx * d) + 'px ' + (-cy * d) + 'px';
      });
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
        raf = requestAnimationFrame(loop);
      } else { raf = null; }
    }
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    hero.addEventListener('pointerleave', function () {
      tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(loop);
    });
  }

  /* ── 4 · slow dust motes catching the light ─────────────────────── */
  function driftMotes() {
    if (reduce) return;
    var N = window.innerWidth < 760 ? 7 : 16;
    var motes = [];
    var W = window.innerWidth, H = window.innerHeight;
    for (var i = 0; i < N; i++) {
      var m = document.createElement('div');
      m.className = 'mote';
      var s = 2 + Math.random() * 4;
      m.style.width = m.style.height = s.toFixed(1) + 'px';
      m.style.opacity = (0.18 + Math.random() * 0.4).toFixed(2);
      document.body.appendChild(m);
      motes.push({
        el: m, x: Math.random() * W, y: Math.random() * H,
        vy: -(0.08 + Math.random() * 0.22),
        ph: Math.random() * Math.PI * 2,
        amp: 0.2 + Math.random() * 0.6
      });
    }
    function tick() {
      W = window.innerWidth; H = window.innerHeight;
      for (var i = 0; i < motes.length; i++) {
        var p = motes[i];
        p.y += p.vy; p.ph += 0.01;
        p.x += Math.sin(p.ph) * p.amp;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        p.el.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px)';
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ── 5 · a faint desk-lamp glow trailing the cursor ─────────────── */
  function deskLight() {
    if (reduce || !finePointer) return;
    var g = document.createElement('div');
    g.id = 'desk-light';
    g.style.cssText = 'position:fixed;inset:0;z-index:2;pointer-events:none;' +
      'mix-blend-mode:soft-light;opacity:0;transition:opacity .6s ease;' +
      'background:radial-gradient(220px circle at 50% 50%,rgba(255,244,214,.9),transparent 70%);';
    document.body.appendChild(g);
    var tx = innerWidth / 2, ty = innerHeight / 2, cx = tx, cy = ty, raf = null;
    function loop() {
      cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
      g.style.backgroundPosition = cx + 'px ' + cy + 'px';
      g.style.background = 'radial-gradient(240px circle at ' + cx + 'px ' + cy +
        'px,rgba(255,244,214,.85),transparent 70%)';
      if (Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3) raf = requestAnimationFrame(loop);
      else raf = null;
    }
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY; g.style.opacity = '0.55';
      if (!raf) raf = requestAnimationFrame(loop);
    });
    window.addEventListener('pointerout', function () { g.style.opacity = '0'; });
  }

  /* ── 0 · SAFETY NET ───────────────────────────────────────────────
     The main script activates a page on its very last line. If any of
     its earlier init/render code throws (e.g. on unexpected localStorage
     data), that line never runs and the page loads blank. This guarantees
     a page is always shown on load, regardless of the router. */
  function ensurePageActive() {
    if (document.querySelector('.page.is-active')) return;
    try {
      if (typeof window.navigate === 'function') window.navigate(location.hash || '#home');
    } catch (e) { /* fall through to manual activation */ }
    if (document.querySelector('.page.is-active')) return;
    var map = {
      '#workshops': 'page-workshops', '#shop': 'page-shop',
      '#snail-mail': 'page-snail-mail', '#journal': 'page-journal',
      '#about': 'page-about', '#admin': 'page-admin', '#home': 'page-home'
    };
    var el = document.getElementById(map[location.hash] || 'page-home') ||
             document.getElementById('page-home');
    if (el) el.classList.add('is-active');
  }

  ready(function () {
    ensurePageActive();
    hideStarfield();
    drawBotanicals();
    heroParallax();
    driftMotes();
    deskLight();
  });
})();
