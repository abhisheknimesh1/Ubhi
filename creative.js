/* ============================================================
   Ubhi · Creative layer (v1.14.0)
   Nine artistic touches, all injected at runtime so index.html
   and script.js stay (almost) untouched. Every feature is wrapped
   in its own try/guard — one failing touch never breaks the others.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- tiny shared helpers (fall back if core not present) ---------- */
  var esc = window.esc || function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  function db(k, d) { try { return window.dbRead ? window.dbRead(k, d) : d; } catch (e) { return d; } }
  function dbW(k, v) {
    try { if (window.dbWrite) return window.dbWrite(k, v); localStorage.setItem("ubhi-" + k, JSON.stringify(v)); } catch (e) {}
  }
  function lget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lset(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function ready(fn) {
    if (document.readyState !== "loading") setTimeout(fn, 0);
    else document.addEventListener("DOMContentLoaded", fn);
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function isAdmin() { return lget("ubhi-admin-authenticated") === "true"; }
  function guard(name, fn) { try { fn(); } catch (e) { if (window.console) console.warn("[creative] " + name + " skipped:", e); } }
  function toast(msg) {
    if (typeof window.showAdminToast === "function") { try { window.showAdminToast(msg); return; } catch (e) {} }
    var t = document.getElementById("cr-toast");
    if (!t) { t = el("div", "cr-toast"); t.id = "cr-toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("cr-show");
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("cr-show"); }, 3200);
  }
  function currentHash() { return (location.hash || "#home").split("?")[0]; }

  /* run an enhancer now and on every route change (idempotent enhancers) */
  var routeHooks = [];
  function onRoute(fn) { routeHooks.push(fn); }
  window.addEventListener("hashchange", function () { setTimeout(runRoute, 60); });
  function runRoute() { routeHooks.forEach(function (fn) { guard("route", fn); }); }

  /* ============================================================
     3 · TIME-AWARE AMBIENCE
     ============================================================ */
  function feature_ambience() {
    var veil = el("div", "cr-ambience-veil"); veil.setAttribute("aria-hidden", "true");
    document.body.appendChild(veil);

    function stamp() {
      var h = new Date().getHours();
      var tod = h < 6 ? "night" : h < 11 ? "dawn" : h < 17 ? "day" : h < 21 ? "dusk" : "night";
      var m = new Date().getMonth();
      var season = (m === 11 || m <= 1) ? "winter" : m <= 4 ? "spring" : m <= 7 ? "summer" : "autumn";
      document.documentElement.setAttribute("data-cr-tod", tod);
      document.documentElement.setAttribute("data-cr-season", season);
      return season;
    }
    var season = stamp();
    setInterval(stamp, 15 * 60 * 1000);

    // seasonal pressed motif, shown on the home page only
    var motifs = {
      spring: '<path d="M46 130 C46 96 46 64 46 40" stroke="#2d8b7c" stroke-width="2" fill="none" stroke-linecap="round"/><g fill="#d98aa6"><ellipse cx="46" cy="30" rx="7" ry="12"/><ellipse cx="34" cy="40" rx="7" ry="12" transform="rotate(-52 34 40)"/><ellipse cx="58" cy="40" rx="7" ry="12" transform="rotate(52 58 40)"/><circle cx="46" cy="40" r="5" fill="#c9972a"/></g>',
      summer: '<path d="M46 130 C46 96 46 64 46 44" stroke="#2d8b7c" stroke-width="2" fill="none" stroke-linecap="round"/><g fill="#e0b23a"><ellipse cx="46" cy="30" rx="6" ry="13"/><ellipse cx="46" cy="52" rx="6" ry="13"/><ellipse cx="32" cy="41" rx="13" ry="6"/><ellipse cx="60" cy="41" rx="13" ry="6"/></g><circle cx="46" cy="41" r="7" fill="#a6741f"/>',
      autumn: '<path d="M46 132 C46 96 42 60 40 30" stroke="#a6741f" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M40 30 C24 34 20 52 30 66 C44 60 48 44 40 30 Z" fill="#c56a2a"/><path d="M40 34 C56 40 58 58 46 70" stroke="#8a3a2e" stroke-width="1.4" fill="none"/>',
      winter: '<g stroke="#6c8ba8" stroke-width="1.8" stroke-linecap="round"><path d="M46 20 V128 M46 40 L30 30 M46 40 L62 30 M46 64 L28 54 M46 64 L64 54 M46 90 L30 80 M46 90 L62 80"/></g><circle cx="46" cy="20" r="3" fill="#9db8d0"/>'
    };
    var motif = el("div", "cr-season-motif"); motif.setAttribute("aria-hidden", "true");
    motif.innerHTML = '<svg viewBox="0 0 92 140">' + (motifs[season] || motifs.spring) + '</svg>';
    document.body.appendChild(motif);
    function toggleMotif() { motif.style.display = currentHash() === "#home" ? "block" : "none"; }
    toggleMotif();
    onRoute(toggleMotif);
  }

  /* ============================================================
     2 · LETTER FROM THE STUDIO  (home page, monthly, owner-editable)
     ============================================================ */
  var MONTH_NOTES = [
    "January in the studio is all cold light and hot tea. I'm pressing the year's first prints slowly, letting the ink decide its own pace. Begin gently — that's the whole plan.",
    "February. Short days, long letters. There's a stack of paper by the window catching what little sun there is, waiting to become something for your letterbox.",
    "March, and the first green is back on the sill. New blocks carved this week — one is a fern, unfurling. Everything here is quietly waking up.",
    "April showers, wet ink, open windows. I've been drawing rain onto paper before it dries outside. Slow is still the fastest way I know to make something true.",
    "May. The studio smells of cut flowers and linseed. Pressing blooms for this month's parcels — a little summer, sealed in wax, sent your way.",
    "June light is generous, so I'm working late and softly. Long evenings, loose brushwork, the radio low. Thank you for reading this far.",
    "July. Everything slows in the heat, and that suits me. A cup of chai, a clean sheet, an afternoon that asks for nothing. I hope yours feels the same.",
    "August. The quiet middle of things. I'm mixing deeper colours this month — ochres and rusts, the first hint that autumn is thinking about arriving.",
    "September, back-to-the-desk light. New workshops taking shape, new pieces drying on the line. There's a good kind of busy in the air.",
    "October. The best month for ink and candlelight. Pressing leaves now, carving a little longer each evening. Cosy is a craft, too.",
    "November. Grey outside, gold on the desk. I'm sealing the year's warmest letters this month — the ones meant to be read slowly, with the kettle on.",
    "December. The studio glows. Every parcel this month leaves with a little extra care folded in. However your year has been — look within, and rise. See you in the new one."
  ];
  function feature_studioLetter() {
    var home = document.getElementById("page-home");
    if (!home) return;
    var hero = home.querySelector(".hero");
    var mount = el("section", "cr-studio-letter reveal");
    var monthIdx = new Date().getMonth();
    var monthName = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][monthIdx];
    var store = db("home-studio-letter", {});
    var key = new Date().getFullYear() + "-" + monthIdx;
    var text = (store && store[key]) || MONTH_NOTES[monthIdx];

    mount.innerHTML =
      '<div class="cr-studio-paper">' +
        (isAdmin() ? '<button type="button" class="cr-studio-edit">✎ edit</button>' : "") +
        '<p class="cr-studio-eyebrow">A letter from the studio · ' + esc(monthName) + '</p>' +
        '<p class="cr-studio-body">' + esc(text) + '</p>' +
        '<p class="cr-studio-sign">— Chelsea</p>' +
      '</div>';

    if (hero && hero.parentNode === home) hero.insertAdjacentElement("afterend", mount);
    else home.insertBefore(mount, home.firstChild);

    var editBtn = mount.querySelector(".cr-studio-edit");
    if (editBtn) {
      var body = mount.querySelector(".cr-studio-body");
      editBtn.addEventListener("click", function () {
        var editing = body.getAttribute("contenteditable") === "true";
        if (!editing) {
          body.setAttribute("contenteditable", "true"); body.focus();
          editBtn.textContent = "✓ save";
        } else {
          body.removeAttribute("contenteditable");
          editBtn.textContent = "✎ edit";
          var s = db("home-studio-letter", {}); s[key] = body.textContent.trim();
          dbW("home-studio-letter", s);
          toast("Studio letter saved for " + monthName);
        }
      });
    }
  }

  /* ============================================================
     4 · WAX SEAL THAT BREAKS OPEN  (sealed invitation on home)
     ============================================================ */
  function feature_waxSeal() {
    var home = document.getElementById("page-home");
    if (!home) return;
    var anchor = home.querySelector(".subscribe-card") || home.querySelector(".intro");
    if (!anchor) return;
    var wrap = el("div", "cr-sealed");
    wrap.innerHTML =
      '<button type="button" class="cr-seal" aria-label="Break the wax seal">' +
        '<span class="cr-seal-half cr-left" aria-hidden="true"></span>' +
        '<span class="cr-seal-half cr-right" aria-hidden="true"></span>' +
      '</button>' +
      '<p class="cr-seal-hint cr-hand">break the seal →</p>' +
      '<div class="cr-seal-note">' +
        '<p>You found the hidden note. Here’s a small welcome: use <strong>FIRSTLETTER</strong> at checkout for £5 off your first Snail Mail term — a letter to start your letters.</p>' +
        '<a class="cr-btn" href="#snail-mail" data-page-link="snail-mail">Open the Snail Mail Club</a>' +
      '</div>';
    // place just above the subscribe card
    anchor.parentNode.insertBefore(wrap, anchor);
    var seal = wrap.querySelector(".cr-seal");
    seal.addEventListener("click", function () {
      wrap.classList.add("cr-open");
    });
  }

  /* ============================================================
     1 · WRITE & POST A LETTER  (interactive postcard)
     ============================================================ */
  function feature_postcard() {
    var tab = el("button", "cr-postcard-tab", "✒ Write &amp; post a letter");
    tab.type = "button";
    document.body.appendChild(tab);

    var overlay = el("div", "cr-overlay");
    overlay.innerHTML =
      '<div class="cr-postcard" role="dialog" aria-modal="true" aria-label="Write a letter">' +
        '<button type="button" class="cr-x" aria-label="Close">×</button>' +
        '<div class="cr-postcard-inner">' +
          '<h3>Write &amp; post a letter</h3>' +
          '<p class="cr-sub">To a friend, or to your future self. We’ll seal it and send it on.</p>' +
          '<label class="cr-field"><span>Your letter</span><textarea maxlength="600" placeholder="Dear you,"></textarea></label>' +
          '<div class="cr-row">' +
            '<label class="cr-field"><span>From (your name)</span><input type="text" class="cr-from-name" autocomplete="name"></label>' +
            '<label class="cr-field"><span>Your email</span><input type="email" class="cr-from-email" autocomplete="email"></label>' +
          '</div>' +
          '<label class="cr-field"><span>Send to (their email — optional)</span><input type="email" class="cr-to-email" placeholder="leave blank to keep it for yourself"></label>' +
          '<label class="cr-check"><input type="checkbox" class="cr-sub-check" checked> Slip me the occasional word from the studio too.</label>' +
          '<div class="cr-actions"><button type="button" class="cr-post-btn">Seal &amp; post it ✒</button></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    var card = overlay.querySelector(".cr-postcard");
    var inner = overlay.querySelector(".cr-postcard-inner");

    var FORM_HTML =
      '<h3>Write &amp; post a letter</h3>' +
      '<p class="cr-sub">To a friend, or to your future self. We’ll seal it and send it on.</p>' +
      '<label class="cr-field"><span>Your letter</span><textarea maxlength="600" placeholder="Dear you,"></textarea></label>' +
      '<div class="cr-row">' +
        '<label class="cr-field"><span>From (your name)</span><input type="text" class="cr-from-name" autocomplete="name"></label>' +
        '<label class="cr-field"><span>Your email</span><input type="email" class="cr-from-email" autocomplete="email"></label>' +
      '</div>' +
      '<label class="cr-field"><span>Send to (their email — optional)</span><input type="email" class="cr-to-email" placeholder="leave blank to keep it for yourself"></label>' +
      '<label class="cr-check"><input type="checkbox" class="cr-sub-check" checked> Slip me the occasional word from the studio too.</label>' +
      '<div class="cr-actions"><button type="button" class="cr-post-btn">Seal &amp; post it ✒</button></div>';

    function renderForm() { card.classList.remove("cr-sending"); inner.innerHTML = FORM_HTML; }
    function open() { renderForm(); overlay.classList.add("cr-show"); setTimeout(function () { var t = overlay.querySelector("textarea"); if (t) t.focus(); }, 40); }
    function close() { overlay.classList.remove("cr-show"); card.classList.remove("cr-sending"); }

    tab.addEventListener("click", open);
    overlay.querySelector(".cr-x").addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && overlay.classList.contains("cr-show")) close(); });

    // one delegated handler covers both the fresh form's post button and the
    // confirmation view's "write another" — so reopening always works.
    inner.addEventListener("click", function (e) {
      if (e.target.closest(".cr-again")) { renderForm(); return; }
      if (!e.target.closest(".cr-post-btn")) return;

      var letter = (inner.querySelector("textarea").value || "").trim();
      var fromName = (inner.querySelector(".cr-from-name").value || "").trim();
      var fromEmail = (inner.querySelector(".cr-from-email").value || "").trim();
      var toEmail = (inner.querySelector(".cr-to-email").value || "").trim();
      var wantSub = inner.querySelector(".cr-sub-check").checked;
      if (letter.length < 4) { inner.querySelector("textarea").focus(); toast("Write a few words first — even just hello."); return; }

      // keep a local copy (syncs to the backend automatically when connected)
      var box = db("postcards", []);
      box.unshift({ letter: letter, fromName: fromName, fromEmail: fromEmail, toEmail: toEmail, at: new Date().toISOString() });
      dbW("postcards", box.slice(0, 200));

      // subscribe the sender to the newsletter if they asked
      if (wantSub && fromEmail && /@/.test(fromEmail) && typeof window.ubhiSubmit === "function") {
        try { window.ubhiSubmit("update", { name: fromName, email: fromEmail, interest: "Everything", source: "postcard" }); } catch (err) {}
      }

      // fold + seal animation, then the confirmation
      card.classList.add("cr-sending");
      var posted = toEmail && /@/.test(toEmail);
      setTimeout(function () {
        inner.innerHTML =
          '<div class="cr-sent">' +
            '<p class="cr-stamp">📮</p>' +
            '<h3>' + (posted ? "Sealed &amp; on its way" : "Sealed &amp; kept safe") + '</h3>' +
            '<p>' + (posted
              ? "Your letter is folded, stamped and ready. Tap below to send it from your own mail — the slow way, made quick."
              : "A little note to your future self, pressed and put aside. Thank you for writing.") + '</p>' +
            (posted ? '<a class="cr-btn cr-mailto">Send it now →</a>' : '<button type="button" class="cr-btn cr-again">Write another</button>') +
          '</div>';
        card.classList.remove("cr-sending");
        if (posted) {
          var subject = "A letter for you — via Ubhi";
          var bodyTxt = letter + "\n\n— " + (fromName || "a friend") + "\n\n(sent with a little help from ubhi · look within, to ascend)";
          inner.querySelector(".cr-mailto").setAttribute("href",
            "mailto:" + encodeURIComponent(toEmail) + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(bodyTxt));
        }
      }, 950);
    });
  }

  /* ============================================================
     6 · COMMUNITY LETTERS WALL  (on the Snail Mail page)
     ============================================================ */
  var WALL_SEED = [
    { note: "Signed up for my mum. She rang the day her first letter came, just to read it to me down the phone.", by: "Priya, Leeds" },
    { note: "I keep every one in a shoebox. On the hard days I take one out and read it slowly.", by: "Tom, Bristol" },
    { note: "There is something about wax and real ink in a world of screens. Thank you for the pause.", by: "Anon, London" },
    { note: "My daughter writes back to hers. A pen-pal she has never met, and somehow that is the point.", by: "Sarah, Glasgow" }
  ];
  function wallRotations(i) { var r = [-2.5, 1.8, -1.2, 2.4, -0.8, 1.4]; return r[i % r.length] + "deg"; }
  function renderWall(grid) {
    var mine = db("letters-wall", []);
    var all = mine.concat(WALL_SEED).slice(0, 24);
    grid.innerHTML = all.map(function (n, i) {
      return '<figure class="cr-wall-note" style="--r:' + wallRotations(i) + '">' +
        '<p>' + esc(n.note) + '</p>' +
        '<figcaption class="cr-wall-by">— ' + esc(n.by || "a friend") + '</figcaption>' +
      '</figure>';
    }).join("");
  }
  function feature_lettersWall() {
    var page = document.getElementById("page-snail-mail");
    if (!page || page.querySelector(".cr-wall")) return;
    var section = el("section", "cr-wall reveal");
    section.innerHTML =
      '<div class="cr-wall-head">' +
        '<h2>The letters wall</h2>' +
        '<p>A few words from people who write, and are written to. Pin your own.</p>' +
      '</div>' +
      '<div class="cr-wall-grid"></div>' +
      '<div class="cr-wall-add"><button type="button">✎ Pin a note to the wall</button></div>';
    page.appendChild(section);
    var grid = section.querySelector(".cr-wall-grid");
    renderWall(grid);

    section.querySelector(".cr-wall-add button").addEventListener("click", function () {
      var note = window.prompt("Your note for the wall (a wish, a thank-you, a small intention):", "");
      if (note == null) return;
      note = note.trim(); if (!note) return;
      var by = window.prompt("Sign it (name & town, or leave blank):", "") || "a friend";
      var mine = db("letters-wall", []);
      mine.unshift({ note: note.slice(0, 220), by: by.trim().slice(0, 40) || "a friend" });
      dbW("letters-wall", mine.slice(0, 60));
      renderWall(grid);
      toast("Pinned to the wall — thank you.");
    });
  }
  onRoute(function () { if (currentHash() === "#snail-mail") guard("wall", feature_lettersWall); });

  /* ============================================================
     5 · ILLUMINATED DROP-CAPS  (journal reader)
     ============================================================ */
  function feature_dropcaps() {
    var body = document.querySelector(".journal-modal-body");
    if (!body) return;
    var mo = new MutationObserver(function () {
      var first = body.querySelector("p");
      if (first && !first.classList.contains("cr-dropcap") && (first.textContent || "").trim().length > 40) {
        first.classList.add("cr-dropcap", "cr-first");
      }
    });
    mo.observe(body, { childList: true, subtree: true });
  }

  /* ============================================================
     7 · PROCESS LOOPS  (self-animating "making" vignette)
     ============================================================ */
  function processSVG() {
    return '<figure class="cr-process" aria-label="A block print being pressed by hand">' +
      '<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        // paper
        '<rect x="40" y="120" width="120" height="60" rx="3" fill="#fdfcf7" stroke="#c9972a" stroke-width="1.2"/>' +
        // inked bloom left on the paper
        '<g class="cr-ink-bloom" transform="translate(100 150)">' +
          '<circle r="15" fill="rgba(163,77,95,0.85)"/>' +
          '<path d="M0 -15 L4 -4 L15 0 L4 4 L0 15 L-4 4 L-15 0 L-4 -4 Z" fill="#8a3a2e"/>' +
        '</g>' +
        // the carved block / stamp, pressing
        '<g class="cr-press-block">' +
          '<rect x="72" y="70" width="56" height="46" rx="4" fill="#a6741f" stroke="#7a5416" stroke-width="1.5"/>' +
          '<rect x="80" y="52" width="40" height="20" rx="3" fill="#8a5c1a"/>' +
          '<circle cx="100" cy="93" r="9" fill="#7a5416"/>' +
        '</g>' +
      '</svg>' +
      '<figcaption>pressed by hand</figcaption>' +
    '</figure>';
  }
  function mountProcess(pageId, afterSelector) {
    var page = document.getElementById(pageId);
    if (!page || page.querySelector(".cr-process")) return;
    var host = afterSelector ? page.querySelector(afterSelector) : null;
    var fig = el("div", "reveal");
    fig.innerHTML = processSVG();
    if (host) host.insertAdjacentElement("afterend", fig.firstChild);
    else page.insertBefore(fig.firstChild, page.firstChild ? page.firstChild.nextSibling : null);
  }
  onRoute(function () {
    if (currentHash() === "#art") guard("process-art", function () { mountProcess("page-art", ".page-hero, .art-hero, section"); });
    if (currentHash() === "#shop") guard("process-shop", function () { mountProcess("page-shop", ".page-hero, .shop-hero, section"); });
  });

  /* ============================================================
     8 · AMBIENT SOUND TOGGLE  (Web Audio, opt-in, no assets)
     ============================================================ */
  function feature_ambientSound() {
    var btn = el("button", "cr-ambient-toggle", '<span class="cr-wave" aria-hidden="true"></span><span class="cr-ico">♪</span>');
    btn.type = "button";
    btn.setAttribute("aria-label", "Toggle ambient studio sound");
    btn.title = "Ambient studio sound";
    document.body.appendChild(btn);

    var ctx = null, nodes = null, on = false, chimeTimer = null;
    function build() {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      var master = ctx.createGain(); master.gain.value = 0.0; master.connect(ctx.destination);
      // soft low pad — two detuned sines through a gentle lowpass
      var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 620; lp.connect(master);
      var o1 = ctx.createOscillator(); o1.type = "sine"; o1.frequency.value = 110;
      var o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.value = 110 * 1.5 + 0.4;
      var g1 = ctx.createGain(); g1.gain.value = 0.16; var g2 = ctx.createGain(); g2.gain.value = 0.10;
      o1.connect(g1).connect(lp); o2.connect(g2).connect(lp); o1.start(); o2.start();
      // slow breathing of the pad
      var lfo = ctx.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 0.08;
      var lfoG = ctx.createGain(); lfoG.gain.value = 90; lfo.connect(lfoG).connect(lp.frequency); lfo.start();
      nodes = { master: master, lp: lp };
      return true;
    }
    function chime() {
      if (!ctx || !on) return;
      var notes = [523.25, 587.33, 659.25, 783.99, 880.0]; // soft pentatonic-ish
      var f = notes[Math.floor((Date.now() / 997) % notes.length)];
      var o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = f;
      var g = ctx.createGain(); g.gain.value = 0.0;
      o.connect(g).connect(nodes.master);
      var t = ctx.currentTime;
      g.gain.linearRampToValueAtTime(0.05, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      o.start(t); o.stop(t + 2.5);
      chimeTimer = setTimeout(chime, 6000 + Math.floor((Date.now() % 5000)));
    }
    function start() {
      if (!ctx && !build()) { toast("Sound isn’t available in this browser."); return; }
      if (ctx.state === "suspended") ctx.resume();
      var t = ctx.currentTime;
      nodes.master.gain.cancelScheduledValues(t);
      nodes.master.gain.linearRampToValueAtTime(0.5, t + 1.2);
      on = true; btn.classList.add("cr-on"); lset("ubhi-ambient", "on");
      clearTimeout(chimeTimer); chimeTimer = setTimeout(chime, 3000);
    }
    function stop() {
      on = false; btn.classList.remove("cr-on"); lset("ubhi-ambient", "off");
      clearTimeout(chimeTimer);
      if (ctx && nodes) { var t = ctx.currentTime; nodes.master.gain.cancelScheduledValues(t); nodes.master.gain.linearRampToValueAtTime(0.0, t + 0.8); }
    }
    btn.addEventListener("click", function () { on ? stop() : start(); });

    // if the visitor had it on last time, resume on their first interaction (autoplay policy)
    if (lget("ubhi-ambient") === "on") {
      var resume = function () { start(); document.removeEventListener("pointerdown", resume); document.removeEventListener("keydown", resume); };
      document.addEventListener("pointerdown", resume, { once: true });
      document.addEventListener("keydown", resume, { once: true });
    }
  }

  /* ============================================================
     9 · SENSORY PRODUCT COPY  (a one-line "mood" per shop piece)
     ============================================================ */
  var MOODS = {
    "Volume 01 · AUM": "the smell of fresh ink and a quiet Sunday",
    "AUM Geometry Print": "cool paper, warm gold, a held breath",
    "Lotus Sticker Set": "small joys you can stick anywhere",
    "Block Printing Starter Kit": "the satisfying press of the first stamp",
    "Sacred Geometry Compass Set": "brass, graphite, and the urge to begin",
    "Ubhi Journal — Blank": "blank pages that ask nothing of you yet",
    "Earth-bound Vessel": "cool clay, uneven by hand, honestly made",
    "Somatic Art Archive": "movement, caught and kept on paper",
    "Quiet Keepsake Set": "little things that hold a little calm",
    "Terracotta Relic Print": "sun-baked colour and old, slow earth",
    "Ritual Brass Bowl": "one clear note, then stillness",
    "Volume 02 · STILLNESS": "the hush after the kettle clicks off",
    "Embodied Geometry Art": "sacred lines that somehow feel like breathing",
    "Botanical Linen Wrap": "block-printed leaves on cloth, soft as an afternoon"
  };
  function normName(s) { return String(s || "").replace(/&middot;/g, "·").replace(/&mdash;/g, "—").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim(); }
  function feature_productMoods() {
    var page = document.getElementById("page-shop");
    if (!page) return;
    var cards = page.querySelectorAll(".product-card");
    cards.forEach(function (card) {
      if (card.querySelector(".cr-product-mood")) return;
      var buy = card.querySelector("[data-buy-product]");
      var name = buy ? normName(buy.getAttribute("data-buy-product")) : "";
      var mood = MOODS[name];
      if (!mood) { // try a title match
        var h = card.querySelector("h3, .product-title");
        if (h) mood = MOODS[normName(h.textContent)];
      }
      if (!mood) return;
      var title = card.querySelector("h3, .product-title");
      var line = el("span", "cr-product-mood", esc(mood));
      if (title) title.insertAdjacentElement("afterend", line);
    });
  }
  onRoute(function () { if (currentHash() === "#shop") guard("moods", feature_productMoods); });

  /* ============================================================
     BOOT
     ============================================================ */
  ready(function () {
    guard("ambience", feature_ambience);
    guard("studioLetter", feature_studioLetter);
    guard("waxSeal", feature_waxSeal);
    guard("postcard", feature_postcard);
    guard("dropcaps", feature_dropcaps);
    guard("ambientSound", feature_ambientSound);
    // route-driven features also run once for the current page
    setTimeout(runRoute, 200);
    // re-run reveal observer on injected .reveal blocks so they fade in
    setTimeout(function () {
      try {
        if (window.revealObserver) document.querySelectorAll(".cr-studio-letter.reveal, .cr-wall.reveal").forEach(function (n) { window.revealObserver.observe(n); });
        else document.querySelectorAll(".cr-studio-letter, .cr-wall").forEach(function (n) { n.classList.add("is-visible"); });
      } catch (e) {}
    }, 300);
  });
})();
