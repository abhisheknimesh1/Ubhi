// ============================================================
// UBHI.IN — script.js
// Hash router · particles · booking · cart · nav
// NOTE: navigate() is called LAST so all helpers are defined first
// ============================================================

// ── PAGE MAP ─────────────────────────────────────────────────
const PAGE_MAP = {
  "":            "page-home",
  "#":           "page-home",
  "#home":       "page-home",
  "#about":      "page-about",
  "#workshops":  "page-workshops",
  "#shop":       "page-shop",
  "#snail-mail": "page-snail-mail",
  "#art":        "page-art",
  "#journal":    "page-journal",
  "#admin":      "page-admin",
  "#account":    "page-account",
  // Support / legal routes
  "#contact":    "page-contact",
  "#faq":        "page-faq",
  "#shipping":   "page-shipping",
  "#refunds":    "page-refunds",
  "#privacy":    "page-privacy",
  "#cookies":    "page-cookies",
  "#terms":      "page-terms",
  "#404":        "page-404",
};

const NAV_HASH = {
  "page-home":       "#home",
  "page-about":      "#about",
  "page-workshops":  "#workshops",
  "page-shop":       "#shop",
  "page-snail-mail": "#snail-mail",
  "page-art":        "#art",
  "page-journal":    "#journal",
  "page-admin":      "#admin",
  "page-account":    "#account",
  "page-contact":    "#contact",
  "page-faq":        "#faq",
  "page-shipping":   "#shipping",
  "page-refunds":    "#refunds",
  "page-privacy":    "#privacy",
  "page-cookies":    "#cookies",
  "page-terms":      "#terms",
  "page-404":        "#404",
};

// ── PER-ROUTE SEO ─────────────────────────────────────────────
// Title + meta description swapped on every navigation so each "page" of this
// single-page app is describable to search engines and link previews.
// NOTE for developer: for true crawlability of a hash SPA, consider pre-rendering
// or moving to real routes at deploy. These also keep the browser tab accurate.
const SITE_NAME = "Ubhi.in";
const SITE_URL  = "https://ubhi.in/";
const PAGE_SEO = {
  "page-home":       { t: "Ubhi.in | Yoga, Art & Slow Ritual — London", d: "A sanctuary for seekers and makers. Yoga workshops, handmade art, and a monthly Snail Mail Club — slow ritual, posted to your door." },
  "page-about":      { t: "About — Ubhi.in", d: "The story behind Ubhi: Chelsea Kaur Ubhi's practice of yoga, art and slow living in London." },
  "page-workshops":  { t: "Workshops — Ubhi.in", d: "Yoga, breathwork and hands-on art workshops in London, open to seekers from anywhere in the world." },
  "page-shop":       { t: "Shop — Ubhi.in", d: "Hand-finished prints, ceramics and ritual objects, made slowly by hand. UK delivery." },
  "page-snail-mail": { t: "Snail Mail Club — Ubhi.in", d: "A monthly hand-made parcel of slow pages and pressed prints, posted to your door across the UK." },
  "page-art":        { t: "Art Portfolio — Ubhi.in", d: "Original handmade artwork by Chelsea Kaur Ubhi — block prints, paintings and slow-made pieces from the London studio." },
  "page-journal":    { t: "Journal — Ubhi.in", d: "Slow reading and reflection — essays and writing from the Ubhi studio." },
  "page-account":    { t: "Your Almanac — Ubhi.in", d: "Sign in to view your orders, workshops and Snail Mail subscription." },
  "page-admin":      { t: "Studio Portal — Ubhi.in", d: "" },
  "page-contact":    { t: "Contact — Ubhi.in", d: "Get in touch with the Ubhi studio. A real person reads every message." },
  "page-faq":        { t: "Questions & Answers — Ubhi.in", d: "Answers to common questions about workshops, the Snail Mail Club, shipping and returns." },
  "page-shipping":   { t: "Shipping & Delivery — Ubhi.in", d: "How and where Ubhi ships its handmade goods and Snail Mail parcels." },
  "page-refunds":    { t: "Returns & Refunds — Ubhi.in", d: "Our returns, refunds and cancellation policy." },
  "page-privacy":    { t: "Privacy Policy — Ubhi.in", d: "How Ubhi collects, uses and protects your personal data." },
  "page-cookies":    { t: "Cookie Policy — Ubhi.in", d: "How Ubhi uses cookies and how to manage your preferences." },
  "page-terms":      { t: "Terms & Conditions — Ubhi.in", d: "The terms that apply when you use Ubhi.in or buy from us." },
  "page-404":        { t: "Page not found — Ubhi.in", d: "" },
};

function applyRouteSeo(pageId) {
  const seo = PAGE_SEO[pageId] || PAGE_SEO["page-home"];
  try {
    document.title = seo.t;
    const setMeta = (sel, attr, val) => {
      const el = document.querySelector(sel);
      if (el && val != null) el.setAttribute(attr, val);
    };
    if (seo.d) setMeta('meta[name="description"]', "content", seo.d);
    // Open Graph / Twitter mirror the route so shared links preview correctly.
    setMeta('meta[property="og:title"]', "content", seo.t);
    if (seo.d) setMeta('meta[property="og:description"]', "content", seo.d);
    setMeta('meta[name="twitter:title"]', "content", seo.t);
    if (seo.d) setMeta('meta[name="twitter:description"]', "content", seo.d);
    // Canonical + og:url track the current hash route.
    const hash = NAV_HASH[pageId] || "#home";
    const url = SITE_URL + (hash === "#home" ? "" : hash);
    setMeta('link[rel="canonical"]', "href", url);
    setMeta('meta[property="og:url"]', "content", url);
  } catch (e) { /* non-critical */ }
}

// ── PARTICLE CANVAS ──────────────────────────────────────────
// (defined early so navigate() can call startParticles/stopParticles)
const canvas = document.getElementById("particles");
const ctx    = canvas ? canvas.getContext("2d") : null;

const PARTICLE_COLORS = [
  "201,151,42",   // gold
  "181,96,122",   // rose
  "45,139,124",   // teal
  "255,248,230",  // stardust
];

let particles        = [];
let particlesRunning = false;
let rafId            = null;

function resizeCanvas() {
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createParticle() {
  return {
    x:          Math.random() * canvas.width,
    y:          Math.random() * canvas.height,
    vx:         (Math.random() - 0.5) * 0.18,
    vy:         (Math.random() - 0.5) * 0.18 - 0.06,
    radius:     Math.random() * 1.3 + 0.25,
    alpha:      Math.random() * 0.55 + 0.08,
    colorRgb:   PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    twinkleSpd: Math.random() * 0.011 + 0.003,
    twinkleDir: Math.random() > 0.5 ? 1 : -1,
  };
}

function initParticles() {
  if (!canvas) return;
  const count = Math.min(Math.floor((canvas.width * canvas.height) / 5800), 180);
  particles = Array.from({ length: count }, createParticle);
}

function drawParticles() {
  if (!particlesRunning || !ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.alpha += p.twinkleSpd * p.twinkleDir;
    if (p.alpha <= 0.04) { p.twinkleDir =  1; p.alpha = 0.04; }
    if (p.alpha >= 0.72) { p.twinkleDir = -1; p.alpha = 0.72; }
    if (p.x < -6)                p.x = canvas.width  + 6;
    if (p.x > canvas.width  + 6) p.x = -6;
    if (p.y < -6)                p.y = canvas.height + 6;
    if (p.y > canvas.height + 6) p.y = -6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${p.colorRgb},${p.alpha.toFixed(2)})`;
    ctx.fill();
  }
  rafId = requestAnimationFrame(drawParticles);
}

function startParticles() {
  if (!canvas || particlesRunning) return;
  particlesRunning = true;
  drawParticles();
}

function stopParticles() {
  particlesRunning = false;
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}

if (canvas) {
  resizeCanvas();
  initParticles();
  window.addEventListener("resize", () => { resizeCanvas(); initParticles(); }, { passive: true });
}

// ── REVEAL HELPERS ────────────────────────────────────────────
// Home page: IntersectionObserver handles scroll-based reveals
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08 }
);

// Inner pages: stagger all reveals when page is shown
function triggerInnerPageReveals(pageEl) {
  const reveals = pageEl ? pageEl.querySelectorAll(".reveal") : [];
  reveals.forEach((el) => el.classList.remove("is-visible"));
  reveals.forEach((el, i) => {
    setTimeout(() => el.classList.add("is-visible"), 50 + i * 50);
  });
}

// ── SPA ROUTER ────────────────────────────────────────────────
let currentPageId = null;

function navigate(hash) {
  // Known route → its page. Unknown non-empty hash → 404 (empty/"#" → home).
  let pageId = PAGE_MAP[hash];
  if (!pageId) pageId = (hash && hash !== "#") ? "page-404" : "page-home";
  currentPageId = pageId;

  // Hide all pages, show target
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("is-active"));
  const target = document.getElementById(pageId);
  if (target) target.classList.add("is-active");

  // Authentication check for admin panel
  if (pageId === "page-admin") {
    const isAuthenticated = safeLocalRead("ubhi-admin-authenticated") === "true";
    const gate = document.getElementById("admin-gate");
    const dashboard = document.getElementById("admin-dashboard");
    if (isAuthenticated) {
      if (gate) gate.style.display = "none";
      if (dashboard) {
        dashboard.style.display = "grid";
        if (typeof renderAdminDashboard === "function") {
          renderAdminDashboard();
        }
      }
    } else {
      if (gate) gate.style.display = "flex";
      if (dashboard) dashboard.style.display = "none";
    }
  }

  // Member account: show the sign-in card or the dashboard
  if (pageId === "page-account") {
    const memberAuthed = safeLocalRead("ubhi-member-authenticated") === "true";
    const mGate = document.getElementById("member-gate");
    const mDash = document.getElementById("member-dashboard");
    if (memberAuthed) {
      if (mGate) mGate.style.display = "none";
      if (mDash) {
        mDash.style.display = "block";
        if (typeof renderMemberDashboard === "function") renderMemberDashboard();
      }
    } else {
      if (mGate) mGate.style.display = "";
      if (mDash) mDash.style.display = "none";
    }
  }

  // Art Portfolio: render from the latest gallery store on each visit
  if (pageId === "page-art" && typeof renderArtPortfolio === "function") {
    renderArtPortfolio();
  }

  // Active nav link
  const activeHash = NAV_HASH[pageId] || "#home";
  document.querySelectorAll(".nav-links a, footer nav a").forEach((a) => {
    const h = a.getAttribute("href");
    a.classList.toggle("is-active", h === activeHash);
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "instant" });

  // Update tab title + meta/OG/canonical for this route.
  applyRouteSeo(pageId);

  // Keep every hero ticker scrolling at the same speed regardless of its length.
  if (typeof normalizeTickerSpeeds === "function") normalizeTickerSpeeds();

  // Particles on home only
  if (pageId === "page-home") {
    startParticles();
    // Re-observe home reveals for scroll-based animation
    target.querySelectorAll(".reveal").forEach((el) => {
      el.classList.remove("is-visible");
      revealObserver.observe(el);
    });
  } else {
    stopParticles();
    triggerInnerPageReveals(target);
  }

  // Close mobile nav
  navLinksEl.classList.remove("is-open");
  navToggle.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
  document.body.classList.remove("menu-open");

  // ("Reserve a space" now simply lands on the Workshops page — the booking
  // form only opens when a specific workshop's Book button is chosen.)
}

// Expose so the world.js safety net can re-route to the correct page on load.
window.navigate = navigate;

// Make every hero ticker scroll at the same visual speed, regardless of how
// much text it holds (otherwise a shorter ticker scrolls slower at a fixed 50s).
function normalizeTickerSpeeds() {
  var PX_PER_SEC = 45;
  var tracks = document.querySelectorAll(".workshops-ticker-track, .shop-ticker-track, .snail-mail-ticker-track, .journal-ticker-track, .art-ticker-track");
  for (var i = 0; i < tracks.length; i++) {
    var w = tracks[i].getBoundingClientRect().width;
    if (w > 4) tracks[i].style.animationDuration = (w / PX_PER_SEC).toFixed(1) + "s";
  }
}

// Update the URL hash so a refresh returns to the same page. pushState can throw
// in restricted contexts (e.g. opening the file directly via file://) — fall back
// to setting location.hash, which always works.
function setUrlHash(hash) {
  try {
    history.pushState(null, "", hash);
    // Some environments accept pushState but don't reflect the hash in the URL;
    // enforce it so a refresh reliably returns to this page.
    if (location.hash !== hash) location.hash = hash;
  } catch (e) {
    if (location.hash !== hash) location.hash = hash;
  }
}

// ── HEADER SCROLL ─────────────────────────────────────────────
const header = document.querySelector("[data-header]");
if (header) {
  const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 28);
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();
}

// ── MOBILE NAV ────────────────────────────────────────────────
const navToggle  = document.querySelector("[data-nav-toggle]");
const navLinksEl = document.querySelector(".nav-links");

navToggle.addEventListener("click", () => {
  const isOpen = navLinksEl.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
  document.body.style.overflow = isOpen ? "hidden" : "";
  document.body.classList.toggle("menu-open", isOpen);
});

// ── CLICK DELEGATION (all internal navigation) ────────────────
document.addEventListener("click", (e) => {
  // Ignore plain "#" links (journal "Read essay →" placeholders)
  const anchor = e.target.closest("a");
  if (anchor && anchor.getAttribute("href") === "#") return;

  // Skip-to-content link: move focus to the main region without routing.
  if (anchor && anchor.classList.contains("skip-link")) {
    e.preventDefault();
    const main = document.getElementById("app");
    if (main) { main.focus(); main.scrollIntoView({ behavior: "instant", block: "start" }); }
    return;
  }

  const el = e.target.closest("a[href^='#'], [data-page-link]");
  if (!el) return;

  const pageLink = el.dataset.pageLink;
  const href     = el.getAttribute?.("href") || "";

  if (pageLink) {
    e.preventDefault();
    const newHash = "#" + pageLink;
    navigate(newHash);
    setUrlHash(newHash);
    return;
  }

  if (href && href.startsWith("#") && href !== "#") {
    e.preventDefault();
    navigate(href);
    setUrlHash(href);
  }
});

window.addEventListener("popstate", () => navigate(location.hash || "#home"));

// ── BOOKING (workshops page - modal dialogue flow) ─────────────
const bookingModal          = document.getElementById("booking-modal");
const modalForm            = document.getElementById("modal-booking-form");
const modalCloseBtn        = document.getElementById("modal-close-btn");
const modalToPaymentBtn    = document.getElementById("modal-to-payment-btn");
const modalBackBtn         = document.getElementById("modal-back-btn");
const modalSuccessCloseBtn = document.getElementById("modal-success-close-btn");
const modalSelect          = document.getElementById("modal-workshop-select");

// Steps panels
const stepDetails = document.getElementById("modal-step-details");
const stepPayment = document.getElementById("modal-step-payment");
const stepSuccess = document.getElementById("modal-step-success");

// Preview elements
const previewEyebrow = document.getElementById("modal-preview-eyebrow");
const previewTitle   = document.getElementById("modal-preview-title");
const previewDate    = document.getElementById("modal-preview-date");
const previewTime    = document.getElementById("modal-preview-time");
const previewPrice   = document.getElementById("modal-preview-price");
const paymentAmount  = document.getElementById("modal-payment-amount");
const successMsg     = document.getElementById("modal-success-msg");

// Form input elements
const nameInput   = document.getElementById("modal-name-input");
const emailInput  = document.getElementById("modal-email-input");
const phoneInput  = document.getElementById("modal-phone-input");
const cardName    = document.getElementById("modal-card-name");
const cardNumber  = document.getElementById("modal-card-number");
const cardExpiry  = document.getElementById("modal-card-expiry");
const cardCvc     = document.getElementById("modal-card-cvc");

// Eyebrow label map based on workshop type/date
const modalEyebrowMap = {
  "Yoga & Hand Block Printing": "Signature &middot; 12 July",
  "Sacred Geometry Drawing": "Drawing &middot; 26 July",
  "Watercolour & Sound (AUM)": "Rest &middot; 9 August",
  "Breathwork & Clay Pots": "Sensory &middot; 23 August",
  "Somatic Silk Dyeing": "Botanical &middot; 6 Sept",
  "Restorative Art & Ink Flow": "Zen &middot; 20 September",
  "Private Ubhi Session": "Private Session"
};

// Spaces still available for a workshop (by title), from the capacity store.
function workshopRemaining(title) {
  const caps = dbRead("workshops-capacities", {});
  const cap = caps[title];
  if (cap && cap.total != null) return Math.max(0, (Number(cap.total) || 0) - (Number(cap.booked) || 0));
  const w = dbRead("workshops", []).find(function (x) { return x.title === title; });
  if (w && w.capacity != null) return Math.max(0, Number(w.capacity) || 0);
  return Infinity;
}

function updateModalPreview() {
  if (!modalSelect) return;
  const option = modalSelect.options[modalSelect.selectedIndex];
  if (!option) return;

  const priceVal = option.dataset.price;
  const isCustom = priceVal === "custom";
  const unit = isCustom ? 0 : (parseFloat(priceVal) || 0);

  // Clamp the chosen quantity to what's still available.
  const qtyInput = document.getElementById("modal-qty-input");
  const remaining = workshopRemaining(option.value);
  const maxQty = isCustom ? 1 : (isFinite(remaining) && remaining > 0 ? remaining : 99);
  let qty = qtyInput ? (parseInt(qtyInput.value, 10) || 1) : 1;
  if (qty < 1) qty = 1;
  if (qty > maxQty) qty = maxQty;
  if (qtyInput) { qtyInput.value = qty; qtyInput.max = maxQty; }

  const minusBtn = document.getElementById("modal-qty-minus");
  const plusBtn = document.getElementById("modal-qty-plus");
  if (minusBtn) minusBtn.disabled = qty <= 1;
  if (plusBtn) plusBtn.disabled = qty >= maxQty;

  const qtyField = document.getElementById("modal-qty-field");
  if (qtyField) qtyField.style.display = isCustom ? "none" : "";
  const qtyNote = document.getElementById("modal-qty-note");
  if (qtyNote) {
    if (isCustom) qtyNote.textContent = "Private session — arranged with you directly.";
    else if (isFinite(remaining)) qtyNote.textContent = remaining + " space" + (remaining === 1 ? "" : "s") + " left" + (qty >= maxQty ? " · maximum selected" : "");
    else qtyNote.textContent = "";
  }

  const total = unit * qty;
  const totalStr = isCustom ? "Quote" : "£" + (Number.isInteger(total) ? total : total.toFixed(2));
  const unitStr = Number.isInteger(unit) ? unit : unit.toFixed(2);
  const breakdown = (!isCustom && qty > 1) ? "  (" + qty + " × £" + unitStr + ")" : "";

  if (previewTitle)   previewTitle.textContent = option.value;
  if (previewEyebrow) previewEyebrow.innerHTML = modalEyebrowMap[option.value] || "Workshop";
  if (previewDate)    previewDate.textContent  = option.dataset.date || "";
  if (previewTime)    previewTime.textContent  = option.dataset.time || "";
  if (previewPrice)   previewPrice.textContent = totalStr;
  if (paymentAmount)  paymentAmount.textContent = totalStr + breakdown;
}

function openBookingModal(workshopName) {
  if (!bookingModal) return;

  // Show overlay
  bookingModal.classList.add("is-active");
  bookingModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden"; // Prevent background body scroll

  // Reset steps state
  if (stepDetails) stepDetails.classList.add("is-active");
  if (stepPayment) stepPayment.classList.remove("is-active");
  if (stepSuccess) stepSuccess.classList.remove("is-active");

  // Pre-select if target workshop name is passed
  if (workshopName && modalSelect) {
    modalSelect.value = workshopName;
  }

  const qtyReset = document.getElementById("modal-qty-input");
  if (qtyReset) qtyReset.value = 1;
  updateModalPreview();
}

function closeBookingModal() {
  if (!bookingModal) return;
  bookingModal.classList.remove("is-active");
  bookingModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  // Reset form inputs
  if (modalForm) {
    modalForm.reset();
  }
}

// Wire change event for dropdown — reset quantity when the workshop changes.
if (modalSelect) {
  modalSelect.addEventListener("change", function () {
    const q = document.getElementById("modal-qty-input");
    if (q) q.value = 1;
    updateModalPreview();
  });
}

// Quantity steppers (− / +) in the booking modal.
(function wireQtySteppers() {
  const minus = document.getElementById("modal-qty-minus");
  const plus = document.getElementById("modal-qty-plus");
  const input = document.getElementById("modal-qty-input");
  if (minus && input) minus.addEventListener("click", function () { input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1); updateModalPreview(); });
  if (plus && input) plus.addEventListener("click", function () { input.value = (parseInt(input.value, 10) || 1) + 1; updateModalPreview(); });
})();

// Wire close actions
if (modalCloseBtn) {
  modalCloseBtn.addEventListener("click", closeBookingModal);
}
if (modalSuccessCloseBtn) {
  modalSuccessCloseBtn.addEventListener("click", closeBookingModal);
}

// Overlay click to close
if (bookingModal) {
  bookingModal.addEventListener("click", (e) => {
    if (e.target === bookingModal) {
      closeBookingModal();
    }
  });
}

// Escape key to close
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (bookingModal && bookingModal.classList.contains("is-active")) {
      closeBookingModal();
    }
    const shopModal = document.getElementById("shop-modal");
    if (shopModal && shopModal.classList.contains("is-active")) {
      closeShopModal();
    }
    const snailModal = document.getElementById("snail-modal");
    if (snailModal && snailModal.classList.contains("is-active")) {
      closeSnailModal();
    }
    const journalModal = document.getElementById("journal-modal");
    if (journalModal && journalModal.classList.contains("is-active")) {
      closeJournalModal();
    }
  }
});

// Grid cards "Reserve my space" buttons
document.querySelectorAll("[data-book]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    openBookingModal(btn.dataset.book);
  });
});

// Step 1 validation & transition
if (modalToPaymentBtn) {
  modalToPaymentBtn.addEventListener("click", () => {
    if (nameInput && !nameInput.checkValidity()) {
      nameInput.reportValidity();
      return;
    }
    if (emailInput && !emailInput.checkValidity()) {
      emailInput.reportValidity();
      return;
    }
    if (phoneInput && !phoneInput.checkValidity()) {
      phoneInput.reportValidity();
      return;
    }

    // Go to payment mockup
    if (stepDetails && stepPayment) {
      stepDetails.classList.remove("is-active");
      stepPayment.classList.add("is-active");
    }
  });
}

// Back to Step 1
if (modalBackBtn) {
  modalBackBtn.addEventListener("click", () => {
    if (stepDetails && stepPayment) {
      stepPayment.classList.remove("is-active");
      stepDetails.classList.add("is-active");
    }
  });
}

// Premium Auto-formatting for Credit Card Mockup fields
if (cardNumber) {
  cardNumber.addEventListener("input", (e) => {
    let val = e.target.value.replace(/\D/g, "").substring(0, 16);
    const parts = [];
    for (let i = 0; i < val.length; i += 4) {
      parts.push(val.substring(i, i + 4));
    }
    e.target.value = parts.join(" ");
  });
}

if (cardExpiry) {
  cardExpiry.addEventListener("input", (e) => {
    let val = e.target.value.replace(/\D/g, "").substring(0, 4);
    if (val.length >= 2) {
      e.target.value = val.substring(0, 2) + " / " + val.substring(2);
    } else {
      e.target.value = val;
    }
  });
}

if (cardCvc) {
  cardCvc.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").substring(0, 4);
  });
}

// Step 2 validation & submit (creates reservation in localStorage)
if (modalForm) {
  modalForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (cardName && !cardName.checkValidity())     { cardName.reportValidity(); return; }
    if (cardNumber && !cardNumber.checkValidity()) { cardNumber.reportValidity(); return; }
    if (cardExpiry && !cardExpiry.checkValidity()) { cardExpiry.reportValidity(); return; }
    if (cardCvc && !cardCvc.checkValidity())       { cardCvc.reportValidity(); return; }

    const option = modalSelect.options[modalSelect.selectedIndex];
    const name   = (nameInput ? nameInput.value : "").trim() || "there";
    const email  = emailInput ? emailInput.value : "";
    const phone  = phoneInput ? phoneInput.value.trim() : "";
    const note   = document.getElementById("modal-note-input") ? document.getElementById("modal-note-input").value : "";

    const qtyEl  = document.getElementById("modal-qty-input");
    const tickets = Math.max(1, parseInt(qtyEl ? qtyEl.value : "1", 10) || 1);
    const unitPrice = option.dataset.price === "custom" ? null : (parseFloat(option.dataset.price) || 0);
    const totalPrice = unitPrice == null ? "custom" : String(Number.isInteger(unitPrice * tickets) ? unitPrice * tickets : (unitPrice * tickets).toFixed(2));

    const reservationObj = {
      workshop: option.value,
      name: name,
      email: email,
      phone: phone,
      note: note,
      date: option.dataset.date + " · " + option.dataset.time,
      price: totalPrice,
      tickets: tickets,
      reservedAt: new Date().toISOString(),
      status: "Confirmed"
    };

    // Save a local receipt copy (used by the receipt download + offline fallback).
    try { localStorage.setItem("ubhi-workshop-reservation", JSON.stringify(reservationObj)); } catch (e) {}
    const bookingSavedLocally = persistAppend("workshop-reservations", reservationObj);

    // Send the booking to the backend so it reaches the owner on EVERY device.
    if (typeof window !== "undefined" && typeof window.ubhiSubmit === "function") {
      window.ubhiSubmit("booking", {
        name: name,
        email: email,
        phone: phone,
        workshop_title: option.value,
        session_date: reservationObj.date,
        price: (totalPrice === "custom" ? 0 : totalPrice),
        note: note
      }).then(r => {
        // Stamp the server id onto the saved copy so an admin pull on this
        // device recognises the booking instead of duplicating it.
        if (r && r.ok && r.data) {
          try {
            const list = dbRead("workshop-reservations", []);
            const mine = list.find(x => x.reservedAt === reservationObj.reservedAt);
            if (mine) { mine._sid = r.data.id; dbWrite("workshop-reservations", list); }
          } catch (e) {}
        }
      });
    }

    const bookingBackendUp = !!(window.ubhiSyncStatus && window.ubhiSyncStatus().reachable);
    if (!bookingSavedLocally && !bookingBackendUp) {
      alert("We're sorry — your device storage is full and our server is offline, so this reservation couldn't be recorded. Please screenshot this page and email hello@ubhi.in to confirm your place.");
    }

    // Update capacity
    const capacities = JSON.parse(localStorage.getItem("ubhi-workshops-capacities")) || {};
    if (capacities[option.value]) {
      capacities[option.value].booked = Math.min(capacities[option.value].booked + tickets, capacities[option.value].total);
      localStorage.setItem("ubhi-workshops-capacities", JSON.stringify(capacities));
      if (typeof updateWorkshopAvailabilityDOM === "function") {
        updateWorkshopAvailabilityDOM();
      }
    }

    // Update success screen text
    if (successMsg) {
      const spaceWord = tickets > 1 ? (tickets + " spaces") : "place";
      const heldWord = tickets > 1 ? "have" : "has";
      // Honest wording: only claim "held" when the reservation actually reached
      // the server; otherwise it needs a manual confirmation from the studio.
      const bookingLive = !!(window.ubhiSyncStatus && window.ubhiSyncStatus().reachable);
      successMsg.innerHTML = bookingLive
        ? `Thank you, <strong>${esc(name)}</strong>. Your ${spaceWord} for <strong>${esc(option.value)}</strong> ${heldWord} been held.`
        : `Thank you, <strong>${esc(name)}</strong>. Your request for ${spaceWord === "place" ? "a place" : spaceWord} at <strong>${esc(option.value)}</strong> is received — we'll confirm by email within a day.`;
    }

    // Go to step 3
    if (stepPayment && stepSuccess) {
      stepPayment.classList.remove("is-active");
      stepSuccess.classList.add("is-active");
    }
  });
}

// ── SHOP PURCHASE MODAL ──────────────────────────────────────────
function openShopModal(productName, price) {
  const shopModal = document.getElementById("shop-modal");
  if (!shopModal) return;

  const shopPreviewTitle = document.getElementById("shop-preview-title");
  const shopPreviewPrice = document.getElementById("shop-preview-price");
  const shopPaymentAmount = document.getElementById("shop-payment-amount");

  if (shopPreviewTitle) shopPreviewTitle.textContent = productName;
  const _sub = parseFloat(price) || 0, _ship = ubhiShipping(_sub), _grand = _sub + _ship;
  const _grandStr = Number.isInteger(_grand) ? _grand : _grand.toFixed(2);
  if (shopPreviewPrice) shopPreviewPrice.textContent = `£${price}`;
  if (shopPaymentAmount) shopPaymentAmount.textContent = `£${_grandStr}${_ship ? ` (incl. £${_ship.toFixed(2)} shipping)` : " · free shipping"}`;

  shopModal.dataset.productName = productName;
  shopModal.dataset.price = price;

  shopModal.classList.add("is-active");
  shopModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  const stepDelivery = document.getElementById("shop-step-delivery");
  const stepPayment = document.getElementById("shop-step-payment");
  const stepSuccess = document.getElementById("shop-step-success");

  if (stepDelivery) stepDelivery.classList.add("is-active");
  if (stepPayment) stepPayment.classList.remove("is-active");
  if (stepSuccess) stepSuccess.classList.remove("is-active");
}

function closeShopModal() {
  const shopModal = document.getElementById("shop-modal");
  if (!shopModal) return;

  shopModal.classList.remove("is-active");
  shopModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  const shopForm = document.getElementById("modal-shop-form");
  if (shopForm) {
    shopForm.reset();
  }
}

// Wire buy buttons
document.querySelectorAll("[data-buy-product]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    openShopModal(btn.dataset.buyProduct, btn.dataset.price);
  });
});

// Wire close actions
const shopModalCloseBtn = document.getElementById("shop-modal-close-btn");
if (shopModalCloseBtn) {
  shopModalCloseBtn.addEventListener("click", closeShopModal);
}

const shopSuccessCloseBtn = document.getElementById("shop-success-close-btn");
if (shopSuccessCloseBtn) {
  shopSuccessCloseBtn.addEventListener("click", closeShopModal);
}

// Overlay click to close
const shopModal = document.getElementById("shop-modal");
if (shopModal) {
  shopModal.addEventListener("click", (e) => {
    if (e.target === shopModal) {
      closeShopModal();
    }
  });
}

// Step 1 validation & transition
const shopToPaymentBtn = document.getElementById("shop-to-payment-btn");
if (shopToPaymentBtn) {
  shopToPaymentBtn.addEventListener("click", () => {
    const fields = [
      "shop-name-input",
      "shop-email-input",
      "shop-mobile-input",
      "shop-address-input",
      "shop-city-input",
      "shop-postcode-input",
      "shop-country-input"
    ];
    for (const id of fields) {
      const el = document.getElementById(id);
      if (el && !el.checkValidity()) {
        el.reportValidity();
        return;
      }
    }
    const stepDelivery = document.getElementById("shop-step-delivery");
    const stepPayment = document.getElementById("shop-step-payment");
    if (stepDelivery && stepPayment) {
      stepDelivery.classList.remove("is-active");
      stepPayment.classList.add("is-active");
    }
  });
}

// Back to Step 1
const shopBackBtn = document.getElementById("shop-back-btn");
if (shopBackBtn) {
  shopBackBtn.addEventListener("click", () => {
    const stepDelivery = document.getElementById("shop-step-delivery");
    const stepPayment = document.getElementById("shop-step-payment");
    if (stepDelivery && stepPayment) {
      stepPayment.classList.remove("is-active");
      stepDelivery.classList.add("is-active");
    }
  });
}

// Input formatting for credit card
const shopCardNumber = document.getElementById("shop-card-number");
if (shopCardNumber) {
  shopCardNumber.addEventListener("input", (e) => {
    let val = e.target.value.replace(/\D/g, "").substring(0, 16);
    const parts = [];
    for (let i = 0; i < val.length; i += 4) {
      parts.push(val.substring(i, i + 4));
    }
    e.target.value = parts.join(" ");
  });
}

const shopCardExpiry = document.getElementById("shop-card-expiry");
if (shopCardExpiry) {
  shopCardExpiry.addEventListener("input", (e) => {
    let val = e.target.value.replace(/\D/g, "").substring(0, 4);
    if (val.length >= 2) {
      e.target.value = val.substring(0, 2) + " / " + val.substring(2);
    } else {
      e.target.value = val;
    }
  });
}

const shopCardCvc = document.getElementById("shop-card-cvc");
if (shopCardCvc) {
  shopCardCvc.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").substring(0, 4);
  });
}

// Form submit
const shopForm = document.getElementById("modal-shop-form");
if (shopForm) {
  shopForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const paymentFields = [
      "shop-card-name",
      "shop-card-number",
      "shop-card-expiry",
      "shop-card-cvc"
    ];
    for (const id of paymentFields) {
      const el = document.getElementById(id);
      if (el && !el.checkValidity()) {
        el.reportValidity();
        return;
      }
    }

    const name = document.getElementById("shop-name-input")?.value || "";
    const email = document.getElementById("shop-email-input")?.value || "";
    const mobile = document.getElementById("shop-mobile-input")?.value?.trim() || "";
    const address = document.getElementById("shop-address-input")?.value || "";
    const city = document.getElementById("shop-city-input")?.value || "";
    const postcode = document.getElementById("shop-postcode-input")?.value || "";
    const country = document.getElementById("shop-country-input")?.value || "";

    const productName = shopModal?.dataset.productName || "";
    const price = shopModal?.dataset.price || "";

    const cartItems = JSON.parse(localStorage.getItem("ubhi-cart")) || [];
    const isCartCheckout = cartItems.length > 0;
    
    const itemsList = isCartCheckout 
      ? cartItems 
      : [{ name: productName, price: parseInt(price, 10), quantity: 1 }];

    const subtotal = isCartCheckout
      ? cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      : parseInt(price, 10);
    const shipping = ubhiShipping(subtotal);
    const totalPrice = subtotal + shipping;     // grand total the customer pays
    const orderRef = ubhiOrderRef();

    const orderData = {
      items: itemsList,
      subtotal: subtotal,
      shipping: shipping,
      totalPrice: totalPrice,
      orderRef: orderRef,
      name: name,
      email: email,
      phone: mobile,
      address: {
        street: address,
        city: city,
        postcode: postcode,
        country: country
      },
      orderedAt: new Date().toISOString(),
      status: "Preparing with care"
    };
    
    // Save a local receipt copy (used by the receipt download + offline fallback).
    try { localStorage.setItem("ubhi-shop-order", JSON.stringify(orderData)); } catch (e) {}
    // Quota-safe append to the cumulative list (returns false if storage is full).
    const savedLocally = persistAppend("shop-orders", orderData);
    // Take the purchased pieces off the shelf (restored if the order is deleted).
    adjustStockFor(orderData, +1);

    // Send the order to the backend so it reaches the owner on EVERY device — not
    // only this browser. No-op when the backend isn't deployed/reachable.
    if (typeof window !== "undefined" && typeof window.ubhiSubmit === "function") {
      window.ubhiSubmit("order", {
        customer_name: name,
        customer_email: email,
        phone: mobile,
        items: itemsList.map(it => ({ id: it.id || null, name: it.name, price: it.price, qty: it.quantity || 1 })),
        ship_street: address, ship_city: city, ship_postcode: postcode, ship_country: country
      }).then(r => {
        if (r && r.ok && r.data) {
          try {
            const o = JSON.parse(localStorage.getItem("ubhi-shop-order"));
            if (o) { o.backendId = r.data.id; o.backendRef = r.data.order_ref; localStorage.setItem("ubhi-shop-order", JSON.stringify(o)); }
          } catch (e) {}
          // Stamp the server id onto the saved list copy too, so an admin pull
          // on this device recognises the order instead of duplicating it.
          try {
            const list = dbRead("shop-orders", []);
            const mine = list.find(x => x.orderRef === orderRef);
            if (mine) { mine._sid = r.data.id; dbWrite("shop-orders", list); }
          } catch (e) {}
        }
      });
    }

    // Fail LOUDLY only if the order could reach neither local storage nor a server.
    const backendUp = !!(window.ubhiSyncStatus && window.ubhiSyncStatus().reachable);
    if (!savedLocally && !backendUp) {
      alert("We're sorry — your device storage is full and our server is offline, so this order couldn't be recorded. Please screenshot this page (Order " + orderRef + ") and email hello@ubhi.in and we'll complete it for you.");
    }

    // Clear cart
    if (isCartCheckout) {
      localStorage.removeItem("ubhi-cart");
      if (typeof updateCartDOM === "function") {
        updateCartDOM();
      }
    }

    const successMsg = document.getElementById("shop-success-msg");
    if (successMsg) {
      const totalStr = Number.isInteger(totalPrice) ? totalPrice : totalPrice.toFixed(2);
      const shipStr = shipping === 0 ? "free shipping" : `incl. £${shipping.toFixed(2)} shipping`;
      const what = isCartCheckout
        ? `your order of <strong>${itemsList.length} item${itemsList.length > 1 ? "s" : ""}</strong>`
        : `<strong>${esc(productName)}</strong>`;
      // Honest wording: "confirmed" only when the order actually reached the
      // server; otherwise it's a request awaiting the studio's confirmation.
      const orderLive = !!(window.ubhiSyncStatus && window.ubhiSyncStatus().reachable);
      successMsg.innerHTML =
        `Thank you, <strong>${esc(name)}</strong> — ${what} ${orderLive ? "is confirmed" : "is received; we'll confirm by email within a day"}.<br>` +
        `<span style="display:inline-block;margin-top:8px;">Order <strong>${esc(orderRef)}</strong> · Total <strong>£${totalStr}</strong> <span style="opacity:.75;">(${shipStr})</span></span><br>` +
        `<span style="opacity:.75;font-size:0.92em;">Download your receipt below to keep for your records.</span>`;
    }

    const stepPayment = document.getElementById("shop-step-payment");
    const stepSuccess = document.getElementById("shop-step-success");
    if (stepPayment && stepSuccess) {
      stepPayment.classList.remove("is-active");
      stepSuccess.classList.add("is-active");
    }
  });
}

// ── GALLERY LIGHTBOX MODAL ───────────────────────────────────────
const lightbox = document.getElementById("gallery-lightbox");
if (lightbox) {
  const lightboxImg = lightbox.querySelector(".lightbox-content");
  const lightboxClose = lightbox.querySelector(".lightbox-close");
  const lbCap = lightbox.querySelector(".lightbox-cap");
  const lbPrev = lightbox.querySelector(".lightbox-prev");
  const lbNext = lightbox.querySelector(".lightbox-next");
  const lbDots = lightbox.querySelector(".lightbox-dots");
  let lbImages = [];      // the set currently being browsed (one art piece, or a single image)
  let lbIndex = 0;
  let lbCaption = "";

  const setLbNav = (show) => {
    if (lbPrev) lbPrev.style.display = show ? "" : "none";
    if (lbNext) lbNext.style.display = show ? "" : "none";
  };
  // Build the little dot indicator so visitors can see (and click) the photos.
  const buildLbDots = () => {
    if (!lbDots) return;
    if (lbImages.length < 2) { lbDots.innerHTML = ""; lbDots.style.display = "none"; return; }
    lbDots.style.display = "";
    lbDots.innerHTML = lbImages.map((_, k) =>
      `<button type="button" class="lb-dot" data-lb-dot="${k}" aria-label="Photo ${k + 1} of ${lbImages.length}"></button>`
    ).join("");
  };
  const syncLbDots = () => {
    if (!lbDots) return;
    lbDots.querySelectorAll(".lb-dot").forEach((d, k) => d.classList.toggle("is-active", k === lbIndex));
  };
  const showLb = (i) => {
    if (!lbImages.length) return;
    lbIndex = (i + lbImages.length) % lbImages.length; // wrap-around
    lightboxImg.src = lbImages[lbIndex];
    lightboxImg.alt = lbCaption || "";
    if (lbCap) lbCap.textContent = lbCaption + (lbImages.length > 1 ? "   ·   " + (lbIndex + 1) + " / " + lbImages.length : "");
    syncLbDots();
  };
  const openLb = (images, caption, startIndex) => {
    lbImages = (Array.isArray(images) ? images : []).filter(Boolean);
    lbCaption = caption || "";
    if (!lbImages.length) return;
    setLbNav(lbImages.length > 1);
    buildLbDots();
    showLb(startIndex || 0);
    lightbox.classList.add("is-active");
    lightbox.setAttribute("aria-hidden", "false");
  };
  const closeLb = () => {
    lightbox.classList.remove("is-active");
    lightbox.setAttribute("aria-hidden", "true");
    lbImages = [];
  };

  document.addEventListener("click", (e) => {
    // Art Portfolio tile → open that piece and let the viewer swipe its photos.
    const tileImg = e.target.closest(".art-portfolio-tile img");
    if (tileImg) {
      const tile = tileImg.closest(".art-portfolio-tile");
      const pi = tile ? parseInt(tile.dataset.pieceIdx, 10) : NaN;
      const piece = (Array.isArray(artPieces) && !isNaN(pi)) ? artPieces[pi] : null;
      if (piece) { openLb(piece.images, piece.title || "", 0); return; }
    }
    // Any other gallery image → single view, no browsing.
    const galImg = e.target.closest(".gallery-item img");
    if (galImg) openLb([galImg.getAttribute("src")], galImg.getAttribute("alt") || "", 0);
  });

  if (lbPrev) lbPrev.addEventListener("click", (e) => { e.stopPropagation(); showLb(lbIndex - 1); });
  if (lbNext) lbNext.addEventListener("click", (e) => { e.stopPropagation(); showLb(lbIndex + 1); });
  if (lbDots) lbDots.addEventListener("click", (e) => {
    const dot = e.target.closest("[data-lb-dot]");
    if (dot) { e.stopPropagation(); showLb(parseInt(dot.getAttribute("data-lb-dot"), 10) || 0); }
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("is-active")) return;
    if (e.key === "Escape") closeLb();
    else if (e.key === "ArrowLeft" && lbImages.length > 1) showLb(lbIndex - 1);
    else if (e.key === "ArrowRight" && lbImages.length > 1) showLb(lbIndex + 1);
  });

  // Touch swipe between a piece's photos.
  let lbTouchX = null;
  lightbox.addEventListener("touchstart", (e) => { lbTouchX = e.changedTouches[0].clientX; }, { passive: true });
  lightbox.addEventListener("touchend", (e) => {
    if (lbTouchX == null || lbImages.length < 2) { lbTouchX = null; return; }
    const dx = e.changedTouches[0].clientX - lbTouchX;
    if (Math.abs(dx) > 40) showLb(lbIndex + (dx < 0 ? 1 : -1));
    lbTouchX = null;
  }, { passive: true });

  if (lightboxClose) lightboxClose.addEventListener("click", closeLb);

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLb();
  });
}

// ── UBHI SNAIL MAIL CLUB INTERACTIVE LOGIC ────────────────────────
// Keep track of the active/selected plan details (default 12 Months prepay)
let selectedSnailPlan = "12 Months";
let selectedSnailPrice = "12.42"; // monthly-equivalent £
let selectedSnailDesc = "A full year of slow post — twelve parcels, opened with a hand-thrown clay inkwell.";
let selectedSnailTotal = "149";  // upfront £ (Monthly uses "0")
let selectedSnailTerm = "12";    // months
let selectedSnailPrepay = true;  // boolean

// Gift terms always override the self-subscribe plan while the gift toggle is on.
const SNAIL_GIFT_TERMS = {
  "3":  { total: "49",  price: "16.33" },
  "6":  { total: "95",  price: "15.83" },
  "12": { total: "149", price: "12.42" }
};

function snailGiftIsOn() {
  return !!document.getElementById("snail-gift-toggle")?.checked;
}

function selectedSnailGiftTerm() {
  const checked = document.querySelector('input[name="snail-gift-term"]:checked');
  return checked ? String(checked.value) : "6";
}

// Recompute the active selection (gift term overrides the active plan card)
// and refresh the footer summary + description.
function refreshSnailSelection() {
  if (snailGiftIsOn()) {
    const term = selectedSnailGiftTerm();
    const g = SNAIL_GIFT_TERMS[term] || SNAIL_GIFT_TERMS["6"];
    selectedSnailPlan = term + "-month gift";
    selectedSnailPrice = g.price;
    selectedSnailTotal = g.total;
    selectedSnailTerm = term;
    selectedSnailPrepay = true;
    selectedSnailDesc = "A prepaid " + term + "-month gift of handmade post.";
  } else {
    const active = document.querySelector(".snail-plan-card.is-active");
    if (active) {
      selectedSnailPlan = active.getAttribute("data-plan") || selectedSnailPlan;
      selectedSnailPrice = active.getAttribute("data-price") || selectedSnailPrice;
      selectedSnailTotal = active.getAttribute("data-total") || selectedSnailTotal;
      selectedSnailTerm = active.getAttribute("data-term") || selectedSnailTerm;
      selectedSnailPrepay = active.getAttribute("data-prepay") === "true";
      selectedSnailDesc = active.getAttribute("data-desc") || selectedSnailDesc;
    }
  }

  const renewEvery = selectedSnailTerm === "12" ? "year" : selectedSnailTerm + " months";
  const summary = document.getElementById("snail-selected-summary");
  if (summary) {
    const body = selectedSnailPrepay
      ? `Selected: <strong>${selectedSnailPlan}</strong> &middot; <strong>£${selectedSnailTotal} every ${renewEvery}</strong> (£${selectedSnailPrice}/mo) &middot; auto-renews, cancel anytime`
      : `Selected: <strong>Monthly</strong> &middot; <strong>£${selectedSnailPrice} / month</strong> &middot; cancel anytime`;
    summary.innerHTML = `${body}
        <p style="font-size:0.85rem;color:var(--mist,#6b5b49);margin-top:6px;font-family:Jost,sans-serif;font-style:normal;" id="snail-selected-desc">${selectedSnailDesc}</p>`;
  }

  // Keep the checkout modal's pricing in sync with the selection (so toggling a
  // gift after the modal is open updates the amount shown at payment).
  const mName = document.getElementById("snail-modal-plan-name");
  if (mName) mName.textContent = selectedSnailPrepay ? `${selectedSnailPlan} · auto-renews` : "Monthly subscription";
  const mPrice = document.getElementById("snail-modal-plan-price");
  if (mPrice) mPrice.textContent = selectedSnailPrepay ? `£${selectedSnailTotal} today` : `£${selectedSnailPrice} / month`;
  const pAmt = document.getElementById("snail-payment-amount");
  if (pAmt) pAmt.textContent = selectedSnailPrepay ? `£${selectedSnailTotal} today` : `£${selectedSnailPrice} / month`;
  const pLabel = document.getElementById("snail-payment-label");
  if (pLabel) pLabel.textContent = selectedSnailPrepay ? "Total today:" : "Monthly rate:";
  const pSub = document.getElementById("snail-payment-subline");
  if (pSub) pSub.textContent = selectedSnailPrepay ? `then £${selectedSnailTotal} every ${renewEvery} · cancel anytime` : "Billed monthly · Cancel anytime";
}

// Switch plan on card click
const snailPlanCards = document.querySelectorAll(".snail-plan-card");
snailPlanCards.forEach(card => {
  card.addEventListener("click", () => {
    // Deactivate current active plan card
    snailPlanCards.forEach(c => c.classList.remove("is-active"));

    // Activate clicked plan card
    card.classList.add("is-active");

    // Recompute selection + summary (gift term, if on, still overrides).
    refreshSnailSelection();
  });
});

// ── Snail Mail subscription pricing (admin-editable, stored locally) ──────────
// Owner edits prices in the admin; we override the hardcoded plan-card prices on
// the live page from the stored map (falling back to the card defaults).
function getSnailPlanPrices() {
  const v = dbRead("snail-plans", {});
  return v && typeof v === "object" ? v : {};
}

function applySnailPlanPrices() {
  const prices = getSnailPlanPrices();
  document.querySelectorAll(".snail-plan-card").forEach((card) => {
    const plan = card.getAttribute("data-plan");
    if (!plan || prices[plan] == null) return;
    const cfg = prices[plan];
    // New schema: { total, price } per plan. Monthly carries only a monthly price.
    if (cfg && typeof cfg === "object") {
      const isMonthly = card.getAttribute("data-prepay") !== "true";
      const totalStr = cfg.total != null ? String(cfg.total).trim() : "";
      const priceStr = cfg.price != null ? String(cfg.price).trim() : "";
      if (priceStr !== "") {
        card.setAttribute("data-price", priceStr);
      }
      if (!isMonthly && totalStr !== "") {
        card.setAttribute("data-total", totalStr);
      }
      const priceEl = card.querySelector(".snail-plan-price");
      if (priceEl) {
        // Prepay cards show the upfront total; Monthly shows the per-month price.
        priceEl.textContent = "£" + (isMonthly ? card.getAttribute("data-price") : card.getAttribute("data-total"));
      }
      const periodEl = card.querySelector(".snail-plan-period");
      if (periodEl && !isMonthly) {
        const _term = card.getAttribute("data-term");
        const _every = _term === "12" ? "year" : _term + " months";
        periodEl.textContent = "every " + _every + " · £" + card.getAttribute("data-price") + "/mo";
      }
    } else if (String(cfg).trim() !== "") {
      // Legacy schema fallback: a plain monthly-price string.
      const p = String(cfg).trim();
      card.setAttribute("data-price", p);
      const isMonthly = card.getAttribute("data-prepay") !== "true";
      const priceEl = card.querySelector(".snail-plan-price");
      if (priceEl && isMonthly) priceEl.textContent = "£" + p;
    }
  });
  // Gift totals (3/6/12) reuse the prepaid totals; keep the override map in sync,
  // deriving the per-month equivalent as total/term to two decimals.
  if (prices.gift && typeof prices.gift === "object") {
    ["3", "6", "12"].forEach((t) => {
      const tot = prices.gift[t];
      if (tot != null && String(tot).trim() !== "" && SNAIL_GIFT_TERMS[t]) {
        SNAIL_GIFT_TERMS[t].total = String(tot).trim();
        const totNum = Number(String(tot).trim());
        if (!isNaN(totNum)) SNAIL_GIFT_TERMS[t].price = (totNum / Number(t)).toFixed(2);
      }
    });
  }
  // Refresh the currently-selected plan's price + footer summary.
  refreshSnailSelection();
}
applySnailPlanPrices();

// Admin: build the editable price inputs for the new pricing model —
// Monthly (£/mo) plus the 3-, 6- and 12-month prepay totals. Gifts reuse the
// same prepaid totals, so there are no separate gift inputs.
function renderAdminSnailPrices() {
  const wrap = document.getElementById("admin-snail-prices-list");
  if (!wrap) return;

  // Read live values from the cards (which already reflect any saved overrides).
  const cardVal = (plan, attr, fallback) => {
    const card = document.querySelector('.snail-plan-card[data-plan="' + plan + '"]');
    return (card && card.getAttribute(attr)) || fallback;
  };
  const monthly = cardVal("Monthly", "data-price", "18");
  const threeTotal = cardVal("3 Months", "data-total", "49");
  const sixTotal = cardVal("6 Months", "data-total", "95");
  const twelveTotal = cardVal("12 Months", "data-total", "149");

  const row = (label, kind, key, value, suffix) =>
    '<div style="display:flex; align-items:center; gap:10px; margin-bottom:10px; flex-wrap:wrap;">' +
    '<span style="min-width:170px; font-weight:600;">' + esc(label) + "</span>" +
    '<span style="color:var(--mist);">£</span>' +
    '<input type="number" min="0" step="1" inputmode="numeric" class="admin-snail-price-input" data-kind="' +
    esc(kind) + '" data-key="' + esc(key) + '" value="' + esc(String(value)) +
    '" style="width:90px; padding:7px 9px; background:rgba(255,255,255,0.05); border:1px solid var(--border-color); border-radius:4px; color:var(--gold); font-size:0.95rem;">' +
    '<span style="color:var(--mist); font-size:0.85rem;">' + esc(suffix) + "</span>" +
    "</div>";

  wrap.innerHTML =
    '<p style="font-weight:600; margin:0 0 10px; color:var(--gold);">Subscriptions</p>' +
    row("Monthly (rolling)", "plan", "Monthly", monthly, "/ month") +
    row("3 Months (recurring)", "plan", "3 Months", threeTotal, "every 3 months") +
    row("6 Months (recurring)", "plan", "6 Months", sixTotal, "every 6 months") +
    row("12 Months (recurring)", "plan", "12 Months", twelveTotal, "every 12 months") +
    '<p style="font-size:0.82rem; color:var(--mist); margin:14px 0 0;">Subscriptions auto-renew each term. Gifts reuse these totals as a one-time charge — £' + esc(String(threeTotal)) + ' for 3 months, £' + esc(String(sixTotal)) + ' for 6, £' + esc(String(twelveTotal)) + ' for 12.</p>';
}

function saveSnailPrices() {
  const inputs = document.querySelectorAll(".admin-snail-price-input");
  // Preserve the existing store shape and merge in the edited values.
  const prices = getSnailPlanPrices();
  if (!prices.gift || typeof prices.gift !== "object") prices.gift = {};
  const PLAN_TERMS = { "3 Months": 3, "6 Months": 6, "12 Months": 12 };
  inputs.forEach((inp) => {
    const kind = inp.getAttribute("data-kind");
    const key = inp.getAttribute("data-key");
    const val = String(inp.value || "").trim();
    if (!key || val === "" || isNaN(Number(val)) || Number(val) < 0) return;
    if (kind === "gift") {
      prices.gift[key] = val;
    } else if (key === "Monthly") {
      // Monthly is a rolling per-month price.
      prices.Monthly = { price: val };
    } else {
      // Prepay plans store the upfront total; derive the monthly-equivalent
      // as total/term to two decimals (e.g. (49/3).toFixed(2) = "16.33") so the
      // displayed and stored monthly figures match and the ladder is preserved.
      const term = PLAN_TERMS[key] || 6;
      const perMo = (Number(val) / term).toFixed(2);
      prices[key] = { total: val, price: perMo };
    }
  });
  // Gifts reuse the prepaid totals — mirror them so the two never drift.
  prices.gift["3"] = (prices["3 Months"] && prices["3 Months"].total) || prices.gift["3"];
  prices.gift["6"] = (prices["6 Months"] && prices["6 Months"].total) || prices.gift["6"];
  prices.gift["12"] = (prices["12 Months"] && prices["12 Months"].total) || prices.gift["12"];
  dbWrite("snail-plans", prices);
  applySnailPlanPrices();
  renderAdminSnailPrices();
  const msg = document.getElementById("admin-snail-prices-msg");
  if (msg) {
    msg.textContent = "Saved ✓ Live prices updated.";
    setTimeout(function () { if (msg) msg.textContent = ""; }, 3000);
  }
}

(function initSnailPriceEditor() {
  const btn = document.getElementById("admin-snail-prices-save");
  if (btn) btn.addEventListener("click", saveSnailPrices);
})();

// ── Generic admin sub-tabs ───────────────────────────────────────────────────
// Used by the Snail Mail tab (and any future tab) where buttons carry
// data-subtab="<panel-element-id>" and sibling panels use class .admin-subpanel.
// The Orders & Bookings tab uses short keys (orders/bookings) with its OWN
// handler, so we bail out here when data-subtab is not an actual panel id.
(function initGenericSubtabs() {
  document.addEventListener("click", function (e) {
    const btn = e.target.closest && e.target.closest(".admin-subtabs button[data-subtab]");
    if (!btn) return;
    const panelId = btn.getAttribute("data-subtab");
    const panel = document.getElementById(panelId);
    if (!panel || !panel.classList.contains("admin-subpanel")) return;
    const nav = btn.closest(".admin-subtabs");
    const scope = btn.closest(".admin-tab-content") || document;
    nav.querySelectorAll("button[data-subtab]").forEach(function (b) { b.classList.toggle("is-active", b === btn); });
    scope.querySelectorAll(".admin-subpanel").forEach(function (p) { p.classList.toggle("is-active", p === panel); });
    // Remember this sub-tab so a refresh returns the owner here, not the default.
    const navKey = nav.id || (scope && scope.id) || "";
    if (navKey) safeLocalWrite("ubhi-admin-subtab-" + navKey, panelId);
  });
})();

// Restore each section's last-viewed sub-tab after a refresh.
function restoreAdminSubtabs() {
  document.querySelectorAll(".admin-subtabs").forEach(function (nav) {
    const scope = nav.closest(".admin-tab-content") || document;
    const navKey = nav.id || (scope && scope.id) || "";
    if (!navKey) return;
    const savedPanel = safeLocalRead("ubhi-admin-subtab-" + navKey);
    if (!savedPanel) return;
    const panel = document.getElementById(savedPanel);
    const btn = nav.querySelector('button[data-subtab="' + savedPanel + '"]');
    if (!panel || !btn || !panel.classList.contains("admin-subpanel")) return;
    nav.querySelectorAll("button[data-subtab]").forEach(function (b) { b.classList.toggle("is-active", b === btn); });
    scope.querySelectorAll(".admin-subpanel").forEach(function (p) { p.classList.toggle("is-active", p === panel); });
  });
  // Orders & Bookings uses its own short-key sub-tabs — restore it too.
  const ob = safeLocalRead("ubhi-admin-ob-subtab");
  if (ob === "orders" || ob === "bookings") {
    const obNav = document.getElementById("admin-orders-subtabs");
    if (obNav) {
      obNav.querySelectorAll(".admin-subtab").forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-subtab") === ob); });
      const op = document.getElementById("admin-sub-orders");
      const bp = document.getElementById("admin-sub-bookings");
      if (op) op.classList.toggle("is-active", ob === "orders");
      if (bp) bp.classList.toggle("is-active", ob === "bookings");
    }
  }
}
window.restoreAdminSubtabs = restoreAdminSubtabs;

// Pre-fill the offline add-member form's "Date Subscribed" with today's date.
(function prefillAddMemberDate() {
  function setToday() {
    const d = document.getElementById("admin-m-date");
    if (d && !d.value) { try { d.value = new Date().toISOString().slice(0, 10); } catch (e) {} }
  }
  setToday();
  const toggle = document.getElementById("admin-toggle-add-member-btn");
  if (toggle) toggle.addEventListener("click", setToday);
})();

// ════════════ Site Profile — owner-editable site content ════════════
// Two stores: "ubhi-site-settings" (contact + social) and "ubhi-text-overrides"
// (any wording on the site, keyed by its original text so styling/font is kept).
function getSiteSettings() {
  const v = dbRead("site-settings", {});
  return v && typeof v === "object" ? v : {};
}
function getTextOverrides() {
  const v = dbRead("text-overrides", {});
  return v && typeof v === "object" ? v : {};
}

// Shipping still reads settings (defaults 50 / 3.95) so checkout keeps working.
function ubhiFreeShip() { const v = Number((getSiteSettings().shipping || {}).freeThreshold); return Number.isFinite(v) && v >= 0 ? v : 50; }
function ubhiShipFlat() { const v = Number((getSiteSettings().shipping || {}).flatRate); return Number.isFinite(v) && v >= 0 ? v : 3.95; }

// ── Apply contact + social settings to the live site ──
function applySiteSettings() {
  const s = getSiteSettings();
  const c = s.contact || {}, soc = s.social || {};

  if (c.email) {
    document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
      const parts = (a.getAttribute("href") || "").split("?");
      a.setAttribute("href", "mailto:" + c.email + (parts[1] ? "?" + parts[1] : ""));
      if (a.textContent && a.textContent.indexOf("@") !== -1) a.textContent = c.email;
    });
  }
  if (soc.instagram) document.querySelectorAll('a.soc-ig, a[href*="instagram.com"]').forEach(function (a) { a.setAttribute("href", soc.instagram); });
  if (soc.pinterest) document.querySelectorAll('a.soc-pin, a[href*="pinterest.com"]').forEach(function (a) { a.setAttribute("href", soc.pinterest); });
  if (c.phone) {
    document.querySelectorAll('[data-site="phone"]').forEach(function (el) { el.textContent = c.phone; });
    document.querySelectorAll('[data-site-row="phone"]').forEach(function (el) { el.style.display = ""; });
  }
  if (c.address) document.querySelectorAll('[data-site="address"]').forEach(function (el) { el.textContent = c.address; });

  // Extra social links — rendered into the FOOTER only (not the header).
  document.querySelectorAll(".footer-social").forEach(function (foot) {
    foot.querySelectorAll("a.soc-custom").forEach(function (a) { a.remove(); });
    (Array.isArray(soc.extra) ? soc.extra : []).forEach(function (x) {
      if (!x || !x.url) return;
      const a = document.createElement("a");
      a.className = "soc-custom";
      a.href = x.url; a.target = "_blank"; a.rel = "noopener noreferrer";
      a.setAttribute("aria-label", x.label || "Social link");
      a.title = x.label || "";
      a.textContent = (x.icon && x.icon.trim()) ? x.icon.trim() : ((x.label || "?").trim().charAt(0).toUpperCase());
      foot.appendChild(a);
    });
  });
}

// ── Editable site text — keyed by the ORIGINAL wording so the font/styling stays ──
const TEXT_EDIT_SELECTOR = "h1,h2,h3,h4,h5,h6,p,li,blockquote,summary,figcaption,.eyebrow,.snail-plan-desc,.snail-plan-term";
function isEditableTextEl(el) {
  if (!el || el.children.length > 0) return false;            // pure-text leaves only (never strip inline tags)
  const t = (el.textContent || "").trim();
  if (t.length < 2) return false;
  if (el.closest('#page-admin, #page-account, nav, header, footer .footer-cols, script, style, [data-noedit]')) return false;
  if (el.closest('[id$="-list"], [id$="-grid"], [id$="-track"], [id$="-table-body"], .product-card, .workshop-card, .journal-card, .modal, .admin-tab-content')) return false;
  return true;
}
function collectEditableTextEls() {
  const out = [];
  document.querySelectorAll(TEXT_EDIT_SELECTOR).forEach(function (el) {
    if (!isEditableTextEl(el)) return;
    if (el.getAttribute("data-orig-text") == null) el.setAttribute("data-orig-text", (el.textContent || "").trim());
    out.push(el);
  });
  return out;
}
function applyTextOverrides() {
  const ov = getTextOverrides();
  collectEditableTextEls().forEach(function (el) {
    const orig = el.getAttribute("data-orig-text");
    if (orig && Object.prototype.hasOwnProperty.call(ov, orig) && el.textContent !== ov[orig]) {
      el.textContent = ov[orig];
    }
  });
}

applySiteSettings();
applyTextOverrides();

// ── Admin: Website Text editor ──
const TEXT_PAGE_NAMES = {
  "page-home": "Home", "page-about": "About", "page-snail-mail": "Snail Mail",
  "page-shop": "Shop", "page-workshops": "Workshops", "page-journal": "Art & Journal",
  "page-contact": "Contact", "page-faq": "FAQ", "page-shipping": "Shipping policy",
  "page-privacy": "Privacy", "page-terms": "Terms", "page-refunds": "Returns & Refunds",
  "page-cookies": "Cookie notice", "page-404": "Page-not-found", "page-account": "Account",
  "FOOTER": "Footer", "OTHER": "Other bits"
};
function renderTextEditor() {
  const wrap = document.getElementById("admin-text-editor");
  if (!wrap) return;
  const ov = getTextOverrides();
  const pageOf = {}, order = [];
  collectEditableTextEls().forEach(function (el) {
    const orig = el.getAttribute("data-orig-text");
    if (!orig || pageOf[orig] !== undefined) return;
    const page = el.closest(".page");
    pageOf[orig] = page ? page.id : (el.closest("footer") ? "FOOTER" : "OTHER");
    order.push(orig);
  });
  const byPage = {};
  order.forEach(function (orig) { const p = pageOf[orig]; (byPage[p] = byPage[p] || []).push(orig); });
  let html = "";
  Object.keys(byPage).forEach(function (pid) {
    const items = byPage[pid];
    html += '<details class="text-edit-group"><summary><span class="teg-name">' + esc(TEXT_PAGE_NAMES[pid] || pid) +
      '</span><span class="teg-count">' + items.length + ' item' + (items.length === 1 ? "" : "s") + '</span></summary><div class="teg-body">';
    items.forEach(function (orig) {
      const cur = Object.prototype.hasOwnProperty.call(ov, orig) ? ov[orig] : orig;
      html += '<label class="text-edit-row' + (cur !== orig ? " is-changed" : "") +
        '"><textarea class="text-edit-input" rows="2" data-orig="' + esc(orig) + '">' + esc(cur) + '</textarea></label>';
    });
    html += '</div></details>';
  });
  wrap.innerHTML = html || '<p style="color:var(--mist);">No editable text found.</p>';
}
function saveTextOverrides() {
  const ov = {};
  document.querySelectorAll("#admin-text-editor .text-edit-input").forEach(function (ta) {
    const orig = ta.getAttribute("data-orig");
    const val = ta.value;
    if (orig != null && val.trim() !== "" && val !== orig) ov[orig] = val;
  });
  dbWrite("text-overrides", ov);
  applyTextOverrides();
  renderTextEditor();
  const msg = document.getElementById("text-edit-msg");
  if (msg) { msg.textContent = "Saved ✓ Your wording is live."; setTimeout(function () { if (msg) msg.textContent = ""; }, 3000); }
}

// ── Admin: Contact & Social form (incl. custom footer links) ──
function extraSocialRowHtml(label, icon, url) {
  return '<div class="extra-social-row">' +
    '<input type="text" class="xs-label" placeholder="Facebook" value="' + esc(label || "") + '">' +
    '<input type="text" class="xs-icon" placeholder="📘" value="' + esc(icon || "") + '">' +
    '<input type="text" class="xs-url" placeholder="https://…" value="' + esc(url || "") + '">' +
    '<button type="button" class="xs-remove button button-secondary" aria-label="Remove">✕</button>' +
    '</div>';
}
function renderExtraSocials() {
  const wrap = document.getElementById("extra-socials-list");
  if (!wrap) return;
  const extra = ((getSiteSettings().social || {}).extra) || [];
  wrap.innerHTML = extra.map(function (x) { return extraSocialRowHtml(x.label, x.icon, x.url); }).join("");
}
function populateSiteSettingsForm() {
  if (!document.getElementById("set-email")) return;
  const s = getSiteSettings();
  const c = s.contact || {}, soc = s.social || {};
  const set = function (id, v) { const el = document.getElementById(id); if (el) el.value = v == null ? "" : v; };
  set("set-email", c.email || "hello@ubhi.in");
  set("set-phone", c.phone || "");
  set("set-address", c.address || "London, United Kingdom");
  set("set-instagram", soc.instagram || "https://instagram.com/ubhi.in");
  set("set-pinterest", soc.pinterest || "https://in.pinterest.com/chelseaubhi/");
  renderExtraSocials();
  renderTextEditor();
}
function saveContactSettings() {
  const s = getSiteSettings();
  const gv = function (id) { const el = document.getElementById(id); return el ? String(el.value || "").trim() : ""; };
  const extra = [];
  document.querySelectorAll("#extra-socials-list .extra-social-row").forEach(function (row) {
    const url = (row.querySelector(".xs-url") || {}).value || "";
    if (!url.trim()) return;
    extra.push({
      label: ((row.querySelector(".xs-label") || {}).value || "").trim(),
      icon: ((row.querySelector(".xs-icon") || {}).value || "").trim(),
      url: url.trim(),
    });
  });
  s.contact = { email: gv("set-email"), phone: gv("set-phone"), address: gv("set-address") };
  s.social = { instagram: gv("set-instagram"), pinterest: gv("set-pinterest"), extra: extra };
  dbWrite("site-settings", s);
  applySiteSettings();
  const msg = document.getElementById("set-contact-msg");
  if (msg) { msg.textContent = "Saved ✓ Live site updated."; setTimeout(function () { if (msg) msg.textContent = ""; }, 3000); }
}

(function initSiteProfile() {
  const cs = document.getElementById("set-contact-save"); if (cs) cs.addEventListener("click", saveContactSettings);
  const ts = document.getElementById("text-edit-save"); if (ts) ts.addEventListener("click", saveTextOverrides);
  const add = document.getElementById("add-extra-social");
  if (add) add.addEventListener("click", function () {
    const wrap = document.getElementById("extra-socials-list");
    if (wrap) wrap.insertAdjacentHTML("beforeend", extraSocialRowHtml("", "", ""));
  });
  const xs = document.getElementById("extra-socials-list");
  if (xs) xs.addEventListener("click", function (e) {
    const rm = e.target.closest && e.target.closest(".xs-remove");
    if (rm) { const row = rm.closest(".extra-social-row"); if (row) row.remove(); }
  });
  const search = document.getElementById("text-edit-search");
  if (search) search.addEventListener("input", function () {
    const q = this.value.toLowerCase().trim();
    document.querySelectorAll("#admin-text-editor .text-edit-row").forEach(function (row) {
      const ta = row.querySelector("textarea");
      const txt = (ta ? (ta.value + " " + (ta.getAttribute("data-orig") || "")) : "").toLowerCase();
      row.style.display = (!q || txt.indexOf(q) !== -1) ? "" : "none";
    });
    document.querySelectorAll("#admin-text-editor .text-edit-group").forEach(function (g) {
      const any = Array.prototype.slice.call(g.querySelectorAll(".text-edit-row")).some(function (r) { return r.style.display !== "none"; });
      g.style.display = any ? "" : "none";
      g.open = q ? any : false;   // auto-open matches while searching; collapse all when cleared
    });
  });
  populateSiteSettingsForm();
})();

// Modal open helper
function openSnailModal() {
  const snailModal = document.getElementById("snail-modal");
  if (!snailModal) return;

  // Start from a clean form so a previously-toggled gift doesn't linger. reset()
  // unchecks the gift toggle but doesn't fire its change handler, so hide the gift
  // fields explicitly before recomputing the selection.
  const snailFormReset = document.getElementById("modal-snail-form");
  if (snailFormReset) snailFormReset.reset();
  const giftFieldsReset = document.getElementById("snail-gift-fields");
  if (giftFieldsReset) giftFieldsReset.style.display = "none";

  // Make sure the globals reflect the current selection (gift term overrides plan).
  refreshSnailSelection();

  // Set modal texts based on selection
  const modalPlanName = document.getElementById("snail-modal-plan-name");
  const modalPlanPrice = document.getElementById("snail-modal-plan-price");
  const paymentAmount = document.getElementById("snail-payment-amount");
  const paymentSubline = document.getElementById("snail-payment-subline");
  const paymentLabel = document.getElementById("snail-payment-label");

  const modalRenewEvery = selectedSnailTerm === "12" ? "year" : selectedSnailTerm + " months";
  if (modalPlanName) {
    modalPlanName.textContent = selectedSnailPrepay
      ? `${selectedSnailPlan} · auto-renews`
      : "Monthly subscription";
  }
  if (modalPlanPrice) {
    modalPlanPrice.textContent = selectedSnailPrepay
      ? `£${selectedSnailTotal} today`
      : `£${selectedSnailPrice} / month`;
  }
  if (paymentAmount) {
    paymentAmount.textContent = selectedSnailPrepay
      ? `£${selectedSnailTotal} today`
      : `£${selectedSnailPrice} / month`;
  }
  if (paymentLabel) {
    paymentLabel.textContent = selectedSnailPrepay ? "Total today:" : "Monthly rate:";
  }
  if (paymentSubline) {
    paymentSubline.textContent = selectedSnailPrepay
      ? `then £${selectedSnailTotal} every ${modalRenewEvery} · cancel anytime`
      : "Billed monthly · Cancel anytime";
  }
  
  // Reset/show correct steps
  const stepDelivery = document.getElementById("snail-step-delivery");
  const stepPayment = document.getElementById("snail-step-payment");
  const stepSuccess = document.getElementById("snail-step-success");
  
  if (stepDelivery) stepDelivery.classList.add("is-active");
  if (stepPayment) stepPayment.classList.remove("is-active");
  if (stepSuccess) stepSuccess.classList.remove("is-active");

  // Open modal container
  snailModal.classList.add("is-active");
  snailModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

// Modal close helper
function closeSnailModal() {
  const snailModal = document.getElementById("snail-modal");
  if (!snailModal) return;
  
  snailModal.classList.remove("is-active");
  snailModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

// Wire subscribe/step into button
const snailSubscribeBtn = document.getElementById("snail-subscribe-btn");
if (snailSubscribeBtn) {
  snailSubscribeBtn.addEventListener("click", openSnailModal);
}

// Wire modal close buttons
const snailModalCloseBtn = document.getElementById("snail-modal-close-btn");
if (snailModalCloseBtn) {
  snailModalCloseBtn.addEventListener("click", closeSnailModal);
}

const snailSuccessCloseBtn = document.getElementById("snail-success-close-btn");
if (snailSuccessCloseBtn) {
  snailSuccessCloseBtn.addEventListener("click", closeSnailModal);
}

// Overlay click outside content to close
const snailModalElement = document.getElementById("snail-modal");
if (snailModalElement) {
  snailModalElement.addEventListener("click", (e) => {
    if (e.target === snailModalElement) {
      closeSnailModal();
    }
  });
}

// Step 1 -> Step 2 validation & transition
const snailToPaymentBtn = document.getElementById("snail-to-payment-btn");
if (snailToPaymentBtn) {
  snailToPaymentBtn.addEventListener("click", () => {
    const fields = [
      "snail-name-input",
      "snail-email-input",
      "snail-mobile-input",
      "snail-address-input",
      "snail-city-input",
      "snail-postcode-input",
      "snail-country-input"
    ];
    for (const id of fields) {
      const el = document.getElementById(id);
      if (el && !el.checkValidity()) {
        el.reportValidity();
        return;
      }
    }

    // Transition to payment step
    const stepDelivery = document.getElementById("snail-step-delivery");
    const stepPayment = document.getElementById("snail-step-payment");
    if (stepDelivery && stepPayment) {
      stepDelivery.classList.remove("is-active");
      stepPayment.classList.add("is-active");
    }
  });
}

// Back to step 1
const snailBackBtn = document.getElementById("snail-back-btn");
if (snailBackBtn) {
  snailBackBtn.addEventListener("click", () => {
    const stepDelivery = document.getElementById("snail-step-delivery");
    const stepPayment = document.getElementById("snail-step-payment");
    if (stepDelivery && stepPayment) {
      stepPayment.classList.remove("is-active");
      stepDelivery.classList.add("is-active");
    }
  });
}

// Real-time credit card formatting
const snailCardNumber = document.getElementById("snail-card-number");
if (snailCardNumber) {
  snailCardNumber.addEventListener("input", (e) => {
    let val = e.target.value.replace(/\D/g, "").substring(0, 16);
    const parts = [];
    for (let i = 0; i < val.length; i += 4) {
      parts.push(val.substring(i, i + 4));
    }
    e.target.value = parts.join(" ");
  });
}

const snailCardExpiry = document.getElementById("snail-card-expiry");
if (snailCardExpiry) {
  snailCardExpiry.addEventListener("input", (e) => {
    let val = e.target.value.replace(/\D/g, "").substring(0, 4);
    if (val.length >= 2) {
      e.target.value = val.substring(0, 2) + " / " + val.substring(2);
    } else {
      e.target.value = val;
    }
  });
}

const snailCardCvc = document.getElementById("snail-card-cvc");
if (snailCardCvc) {
  snailCardCvc.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").substring(0, 3);
  });
}

// Submit payment form
const snailSubmitBtn = document.getElementById("snail-submit-btn");
if (snailSubmitBtn) {
  snailSubmitBtn.addEventListener("click", (e) => {
    // Validate Step 2 payment fields manually
    const paymentFields = [
      "snail-card-name",
      "snail-card-number",
      "snail-card-expiry",
      "snail-card-cvc"
    ];
    for (const id of paymentFields) {
      const el = document.getElementById(id);
      if (el && !el.checkValidity()) {
        el.reportValidity();
        return;
      }
    }

    // Retrieve values for order storage
    const nameVal = document.getElementById("snail-name-input")?.value || "";
    const emailVal = document.getElementById("snail-email-input")?.value || "";
    const mobileVal = document.getElementById("snail-mobile-input")?.value?.trim() || "";
    const addressVal = document.getElementById("snail-address-input")?.value || "";
    const cityVal = document.getElementById("snail-city-input")?.value || "";
    const postcodeVal = document.getElementById("snail-postcode-input")?.value || "";
    const countryVal = document.getElementById("snail-country-input")?.value || "";
    const giftOn = !!document.getElementById("snail-gift-toggle")?.checked;
    const giftFor = document.getElementById("snail-gift-name")?.value?.trim() || "";
    const giftEmail = document.getElementById("snail-gift-email")?.value?.trim() || "";
    const giftMessage = document.getElementById("snail-gift-message")?.value?.trim() || "";
    const giftStart = document.getElementById("snail-gift-start")?.value || "";

    // Make sure pricing globals reflect the final selection (gift overrides plan).
    refreshSnailSelection();
    const giftTerm = giftOn ? selectedSnailGiftTerm() : "";
    // Gifts are recorded under a "{term}-month gift" plan label.
    const recordPlan = giftOn ? (giftTerm + "-month gift") : selectedSnailPlan;
    const billingStr = selectedSnailPrepay
      ? ("£" + selectedSnailTotal + " every " + selectedSnailTerm + " months (£" + selectedSnailPrice + "/mo, auto-renews)")
      : ("£" + selectedSnailPrice + " / month");

    const orderData = {
      planName: selectedSnailPlan,
      price: selectedSnailPrice,
      plan: recordPlan,
      monthlyEquiv: Number(selectedSnailPrice),
      termMonths: Number(selectedSnailTerm),
      isPrepay: !!selectedSnailPrepay,
      paidUpfront: selectedSnailPrepay ? Number(selectedSnailTotal) : 0,
      billing: billingStr,
      isGift: giftOn,
      giftFor: giftFor,
      giftEmail: giftEmail,
      giftMessage: giftMessage,
      giftStart: giftStart,
      giftTermMonths: giftOn ? Number(giftTerm) : undefined,
      giftPaid: giftOn ? Number(selectedSnailTotal) : undefined,
      customerName: nameVal,
      customerEmail: emailVal,
      customerMobile: mobileVal,
      shippingAddress: {
        street: addressVal,
        city: cityVal,
        postcode: postcodeVal,
        country: countryVal
      },
      subscribedAt: new Date().toISOString()
    };
    
    // Write order data to localStorage (local receipt + offline fallback).
    try { localStorage.setItem("ubhi-snail-mail-order", JSON.stringify(orderData)); } catch (e) {}
    // Quota-safe append to the cumulative list.
    persistAppend("snail-mail-orders", orderData);

    // Also register the subscriber in the admin Snail-Mail members database so this
    // sign-up (and its mobile number, shown in the Contact column) appears in the
    // admin panel. Non-fatal if it fails — the order above is already saved.
    try {
      const members = dbRead("snail-members", []);
      const addrParts = [addressVal, cityVal, postcodeVal, countryVal].filter(Boolean);
      members.push({
        name: nameVal,
        email: emailVal,
        contact: mobileVal,
        plan: recordPlan,
        monthlyEquiv: Number(selectedSnailPrice),
        termMonths: Number(selectedSnailTerm),
        isPrepay: !!selectedSnailPrepay,
        paidUpfront: selectedSnailPrepay ? Number(selectedSnailTotal) : 0,
        billing: billingStr,
        address: addrParts.join(", "),
        dateSubscribed: new Date().toISOString().split("T")[0],
        status: "Active",
        isGift: giftOn,
        giftFor: giftFor,
        giftEmail: giftEmail,
        giftMessage: giftMessage,
        giftStart: giftStart,
        giftTermMonths: giftOn ? Number(giftTerm) : undefined,
        giftPaid: giftOn ? Number(selectedSnailTotal) : undefined
      });
      dbWrite("snail-members", members);
    } catch (e) { /* keep the subscription even if the admin bridge fails */ }

    // Send the subscriber to the backend so it reaches the owner on EVERY device.
    if (typeof window !== "undefined" && typeof window.ubhiSubmit === "function") {
      window.ubhiSubmit("subscriber", {
        name: nameVal,
        email: emailVal,
        contact: mobileVal,
        plan: recordPlan,
        price: Number(selectedSnailPrice) || 0,
        address: [addressVal, cityVal, postcodeVal, countryVal].filter(Boolean).join(", "),
        date_subscribed: new Date().toISOString()
      }).then(r => {
        // Stamp the server id onto the member record so an admin pull on this
        // device recognises the subscription instead of duplicating it.
        if (r && r.ok && r.data) {
          try {
            const ms = dbRead("snail-members", []);
            for (let i = ms.length - 1; i >= 0; i--) {
              if (String(ms[i].email || "").toLowerCase() === emailVal.toLowerCase() && !ms[i]._sid) {
                ms[i]._sid = r.data.id; dbWrite("snail-members", ms); break;
              }
            }
          } catch (e) {}
        }
      });
    }

    // Update success screen text — honest about what happens next.
    const successMsg = document.getElementById("snail-success-msg");
    const snailLive = !!(window.ubhiSyncStatus && window.ubhiSyncStatus().reachable);
    if (successMsg) {
      const planLabel = giftOn ? (giftTerm + "-month gift") : selectedSnailPlan;
      successMsg.innerHTML = snailLive
        ? `Thank you, <strong>${esc(nameVal)}</strong>. Your first Snail Mail package under the <strong>${esc(planLabel)}</strong> is being prepared with quiet care.`
        : `Thank you, <strong>${esc(nameVal)}</strong>. Your request for the <strong>${esc(planLabel)}</strong> is received — we'll confirm your first posting by email within a day.`;
    }
    // A gift deserves something to hand over on the day — offer a
    // print-at-home gift certificate on the success screen.
    const certBtn = document.getElementById("snail-gift-cert-btn");
    if (certBtn) {
      certBtn.style.display = giftOn ? "" : "none";
      if (giftOn) {
        window._ubhiGiftCert = {
          to: giftFor || "someone lovely",
          from: nameVal || "",
          months: Number(giftTerm) || 6,
          message: giftMessage || "",
          start: giftStart || ""
        };
      }
    }
    
    // Transition to step 3 success screen
    const stepPayment = document.getElementById("snail-step-payment");
    const stepSuccess = document.getElementById("snail-step-success");
    if (stepPayment && stepSuccess) {
      stepPayment.classList.remove("is-active");
      stepSuccess.classList.add("is-active");
    }
  });
}

// ── JOURNAL PAGE LOGIC (Tactile Notebook scrolling & Dialogue reader modal) ──
let journalEssays = [
  {
    title: "AUM & the Science of Sound",
    tag: "Philosophy",
    date: "June 2026",
    art: `<svg viewBox="0 0 160 160" fill="none" width="110" height="110"><circle cx="80" cy="80" r="76" stroke="rgba(201,151,42,0.35)" stroke-width="0.6"/><circle cx="80" cy="80" r="50" stroke="rgba(201,151,42,0.25)" stroke-width="0.5"/><circle cx="80" cy="80" r="25" stroke="rgba(201,151,42,0.4)" stroke-width="0.6"/><polygon points="80,14 138,116 22,116" stroke="rgba(201,151,42,0.4)" stroke-width="0.6" fill="rgba(201,151,42,0.04)"/><polygon points="80,146 138,44 22,44" stroke="rgba(181,96,122,0.3)" stroke-width="0.6" fill="none"/><circle cx="80" cy="80" r="5" fill="rgba(201,151,42,0.6)"/></svg>`,
    body: `
      <p>Sound is the first manifest form of matter. Long before the eye perceived light, the ear was shaped by the low vibration of the void. In ancient Indian philosophy, AUM is not merely a chant or a mystical symbol; it is a mathematical map of consciousness and acoustic resonance.</p>
      <p>AUM is composed of three phonemes representing the cycle of existence: "A" (the waking state, creation), "U" (the dreaming state, preservation), and "M" (the deep sleep state, dissolution). The final silence that follows is Turiya, the unmanifest source.</p>
      <p>When chanted, these sounds create physical standing waves in the skull, stimulating the vagus nerve and slowing the heart. Modern neuroscience reveals that repeating these resonant frequencies shifts the brain from alert beta states to relaxed alpha and theta waves. We do not just hear sound — we align with it.</p>
    `
  },
  {
    title: "Sacred Geometry: Patterns That Think",
    tag: "Geometry",
    date: "May 2026",
    art: `<svg viewBox="0 0 160 160" fill="none" width="110" height="110"><circle cx="80" cy="80" r="76" stroke="rgba(201,151,42,0.3)" stroke-width="0.6"/><circle cx="80" cy="22" r="58" stroke="rgba(201,151,42,0.1)" stroke-width="0.4"/><circle cx="130" cy="51" r="58" stroke="rgba(201,151,42,0.1)" stroke-width="0.4"/><circle cx="130" cy="109" r="58" stroke="rgba(201,151,42,0.1)" stroke-width="0.4"/><circle cx="80" cy="138" r="58" stroke="rgba(201,151,42,0.1)" stroke-width="0.4"/><circle cx="30" cy="109" r="58" stroke="rgba(201,151,42,0.1)" stroke-width="0.4"/><circle cx="30" cy="51" r="58" stroke="rgba(201,151,42,0.1)" stroke-width="0.4"/><circle cx="80" cy="80" r="8" stroke="rgba(201,151,42,0.5)" stroke-width="0.6"/><circle cx="80" cy="80" r="3" fill="rgba(201,151,42,0.6)"/></svg>`,
    body: `
      <p>Nature does not design at random. If you cut open a nautilus shell, count the seeds of a sunflower, or trace the rotation of a spiral galaxy, you will find the exact same proportion: 1.618, the Golden Ratio. It is the signature of optimal growth.</p>
      <p>Sacred geometry is the study of these archetypal patterns that structure reality. From the Flower of Life to the Sri Yantra, these shapes are visual forms of silence. They represent the blueprint of how energy organizes itself into physical form, balancing tension, expansion, and collapse.</p>
      <p>By contemplating these forms or drawing them by hand, we engage in a silent dialogue with cosmic design. The circle represents absolute unity, the square represents grounding, and the triangle represents direction. Geometry is not just mathematics; it is philosophy made visible.</p>
    `
  },
  {
    title: "Why We Print by Hand",
    tag: "Craft",
    date: "May 2026",
    art: `<svg viewBox="0 0 160 160" fill="none" width="110" height="110"><rect x="20" y="20" width="120" height="120" stroke="rgba(45,139,124,0.35)" stroke-width="0.6" fill="none"/><rect x="40" y="40" width="80" height="80" stroke="rgba(45,139,124,0.28)" stroke-width="0.5" fill="none" transform="rotate(45 80 80)"/><circle cx="80" cy="80" r="40" stroke="rgba(45,139,124,0.35)" stroke-width="0.6"/><circle cx="80" cy="80" r="18" stroke="rgba(45,139,124,0.5)" stroke-width="0.6"/><circle cx="80" cy="80" r="5" fill="rgba(45,139,124,0.6)"/></svg>`,
    body: `
      <p>In a world of infinite digital replication, a physical print is a quiet rebellion. When we carve a block of linoleum or wood, mix oil-based pigments, and press it against textured paper, we participate in an ancient, slow ritual of presence.</p>
      <p>Hand-printing allows for the presence of the hand. Unlike a screen or a digital printer, no two impressions are identical. One print might have a deeper ink deposit, while another shows the subtle texture of the paper grain peaking through the fibers. These variations are not errors; they are evidence of life.</p>
      <p>This dialogue with raw materials teaches us patience. You cannot rush the drying of ink, nor can you bypass the sharpness of the chisel. In carving, we learn that taking away material is how we reveal the shape of our intentions.</p>
    `
  },
  {
    title: "Pranayama & the Vagus Nerve",
    tag: "Breathwork",
    date: "April 2026",
    art: `<svg viewBox="0 0 160 160" fill="none" width="110" height="110"><path d="M80 16C50 40 16 52 16 80C16 108 50 120 80 144C110 120 144 108 144 80C144 52 110 40 80 16Z" stroke="rgba(181,96,122,0.4)" stroke-width="0.6" fill="rgba(181,96,122,0.05)"/><path d="M80 32C56 52 32 60 32 80C32 100 56 108 80 128C104 108 128 100 128 80C128 60 104 52 80 32Z" stroke="rgba(181,96,122,0.3)" stroke-width="0.5" fill="none"/><circle cx="80" cy="80" r="18" stroke="rgba(181,96,122,0.5)" stroke-width="0.6"/><circle cx="80" cy="80" r="5" fill="rgba(181,96,122,0.6)"/></svg>`,
    body: `
      <p>The breath is the bridge between the conscious and unconscious mind. While heart rate, digestion, and hormone secretion occur automatically in the background, breathwork is the singular lever we can pull to consciously override our autonomic nervous system.</p>
      <p>When we practice pranayama—specifically extending the exhalation longer than the inhalation—we stimulate the vagus nerve. This nerve, traveling from the brainstem down to the abdomen, sends signals to the heart to slow down, lowering blood pressure and switching the body from fight-or-flight into rest-and-digest.</p>
      <p>By slowing the breath to six cycles per minute, we reach heart rate coherence. In this state, the brain waves synchronize with the cardiovascular rhythm, creating an deep feeling of grounding and safety. Stillness is not something we look for; it is something we breathe into.</p>
    `
  },
  {
    title: "The Philosophy of Slow Making",
    tag: "Philosophy",
    date: "March 2026",
    art: `<svg viewBox="0 0 160 160" fill="none" width="110" height="110"><line x1="80" y1="8" x2="80" y2="152" stroke="rgba(201,151,42,0.35)" stroke-width="0.5"/><line x1="8" y1="80" x2="152" y2="80" stroke="rgba(201,151,42,0.35)" stroke-width="0.5"/><line x1="24" y1="24" x2="136" y2="136" stroke="rgba(201,151,42,0.28)" stroke-width="0.5"/><line x1="136" y1="24" x2="24" y2="136" stroke="rgba(201,151,42,0.28)" stroke-width="0.5"/><circle cx="80" cy="80" r="72" stroke="rgba(201,151,42,0.3)" stroke-width="0.6"/><circle cx="80" cy="80" r="44" stroke="rgba(201,151,42,0.25)" stroke-width="0.5"/><circle cx="80" cy="80" r="18" stroke="rgba(201,151,42,0.4)" stroke-width="0.6"/><circle cx="80" cy="80" r="5" fill="rgba(201,151,42,0.6)"/></svg>`,
    body: `
      <p>Modern culture values output. The faster a product is created, distributed, and consumed, the higher its perceived efficiency. Yet, in this relentless push for speed, the sacred relationship between maker and object is severed.</p>
      <p>Slow making is the recovery of this connection. When we craft with attention, we imprint our state of being onto the materials. The clay, the ink, and the wood carry the vibration of the hands that held them. An object created in haste communicates frenzy; an object created in presence communicates stillness.</p>
      <p>Slowing down is not a lack of ambition. It is a commitment to depth. It is the understanding that some processes cannot be optimized without losing their soul. In making slowly, we do not just produce objects — we allow ourselves to be formed.</p>
    `
  },
  {
    title: "What Yoga Actually Means",
    tag: "Yoga",
    date: "March 2026",
    art: `<svg viewBox="0 0 160 160" fill="none" width="110" height="110"><ellipse cx="80" cy="105" rx="55" ry="22" stroke="rgba(45,139,124,0.35)" stroke-width="0.6" fill="none"/><ellipse cx="80" cy="80" rx="40" ry="55" stroke="rgba(45,139,124,0.28)" stroke-width="0.5" fill="none"/><ellipse cx="80" cy="80" rx="55" ry="40" stroke="rgba(45,139,124,0.28)" stroke-width="0.5" fill="none" transform="rotate(60 80 80)"/><ellipse cx="80" cy="80" rx="55" ry="40" stroke="rgba(45,139,124,0.28)" stroke-width="0.5" fill="none" transform="rotate(120 80 80)"/><circle cx="80" cy="80" r="10" stroke="rgba(45,139,124,0.5)" stroke-width="0.6"/><circle cx="80" cy="80" r="4" fill="rgba(45,139,124,0.6)"/></svg>`,
    body: `
      <p>The contemporary landscape has translated yoga into poses, flexibility, and athletic wear. But the postures (asanas) were historically only the preparation—a way to settle the body's restlessness so that one could sit still in meditation without discomfort.</p>
      <p>The Sanskrit word "Yuj" means to yoke, to bind, or to unite. It is the union of the individual consciousness with the universal thread. Yoga is any practice that restores wholeness to what has been fragmented. It is the slow folding back of the mind into its source.</p>
      <p>When we move with absolute awareness, the division between body, breath, and mind dissolves. We cease to be a collection of worries and become a field of presence. Yoga is not about self-improvement; it is about self-remembering.</p>
    `
  },
  {
    title: "The Geometry of Silence",
    tag: "Philosophy",
    date: "February 2026",
    art: `<svg viewBox="0 0 160 160" fill="none" width="110" height="110"><circle cx="80" cy="80" r="72" stroke="rgba(201,151,42,0.3)" stroke-width="0.6"/><circle cx="80" cy="80" r="40" stroke="rgba(201,151,42,0.15)" stroke-width="0.5" stroke-dasharray="3 3"/><circle cx="80" cy="80" r="10" stroke="rgba(201,151,42,0.5)" stroke-width="0.6"/><path d="M 76 65 A 15 15 0 0 0 84 79 A 13 13 0 0 1 76 65" fill="rgba(201,151,42,0.3)" stroke="rgba(201,151,42,0.4)" stroke-width="0.5"/></svg>`,
    body: `
      <p>We often treat silence as the absence of noise, a blank void that needs to be filled. But in the architecture of sound, silence is the load-bearing wall. Without it, melody is only noise.</p>
      <p>In visual art and geometry, negative space is what gives shape its gravity. A circle is defined by the boundary of the space it does not occupy. When we sit in meditation, we do not try to empty the mind of thoughts; instead, we expand the space between the thoughts.</p>
      <p>By cultivating visual and auditory space, we allow our internal system to settle. Silence is not empty. It is pregnant with clarity, carrying the subtle coordinates of who we are when we stop speaking.</p>
    `
  },
  {
    title: "Rituals of the Wax Seal",
    tag: "Craft",
    date: "January 2026",
    art: `<svg viewBox="0 0 160 160" fill="none" width="110" height="110"><rect x="25" y="45" width="110" height="70" rx="4" stroke="rgba(181,96,122,0.35)" stroke-width="0.6"/><path d="M25 45 L80 85 L135 45" stroke="rgba(181,96,122,0.35)" stroke-width="0.6"/><circle cx="80" cy="85" r="14" fill="rgba(181,96,122,0.2)" stroke="rgba(181,96,122,0.5)" stroke-width="0.8"/><circle cx="80" cy="85" r="6" fill="rgba(181,96,122,0.6)"/></svg>`,
    body: `
      <p>To write a letter, seal it in an envelope, melt wax, and stamp it with a brass crest is to engage in a slow physics of commitment. In a world of fleeting emails, a sealed letter is a tangible archive of time.</p>
      <p>The wax seal is a physical signature. The heat of the flame, the pooling of the wax, and the cool touch of the brass stamp capture a singular moment. No two wax seals pool in the exact same shape. They represent a boundary of privacy and care.</p>
      <p>When you seal a letter, you declare that the recipient is worth your presence. It is a slow, tactile reminder that communication is not just about exchanging data; it is about exchanging touch, intention, and weight.</p>
    `
  },
  {
    title: "The Alchemy of Clay",
    tag: "Somatic",
    date: "December 2025",
    art: `<svg viewBox="0 0 160 160" fill="none" width="110" height="110"><path d="M55,30 Q80,25 105,30 L95,65 Q115,100 95,135 Q80,140 65,135 Q45,100 65,65 Z" stroke="rgba(45,139,124,0.35)" stroke-width="0.6" fill="rgba(45,139,124,0.03)"/><ellipse cx="80" cy="30" rx="25" ry="6" stroke="rgba(45,139,124,0.4)" stroke-width="0.5"/><circle cx="80" cy="85" r="12" stroke="rgba(45,139,124,0.25)" stroke-width="0.5"/></svg>`,
    body: `
      <p>Pottery is a somatic lesson in gravity. When you place a lump of clay on the spinning wheel, you quickly realize that you cannot center the clay if your own body is out of alignment. You must find your own spine first.</p>
      <p>The clay absorbs your state. If you are tense, the clay collapses. If your fingers hesitate, the shape buckles. You must centripetally ground your elbows, apply constant pressure, and move from your core. Centering is not static; it is a dynamic equilibrium.</p>
      <p>In clay, we see a mirror of our own psychology. The wheel spins, the environment moves, but at the very center, there is a point of absolute stillness. We shape the clay from that center point, learning that external structures arise from internal alignment.</p>
    `
  },
  {
    title: "The Weaver's Path",
    tag: "Geometry",
    date: "November 2025",
    art: `<svg viewBox="0 0 160 160" fill="none" width="110" height="110"><line x1="30" y1="30" x2="130" y2="30" stroke="rgba(201,151,42,0.2)" stroke-width="0.5"/><line x1="30" y1="50" x2="130" y2="50" stroke="rgba(201,151,42,0.2)" stroke-width="0.5"/><line x1="30" y1="70" x2="130" y2="70" stroke="rgba(201,151,42,0.2)" stroke-width="0.5"/><line x1="30" y1="90" x2="130" y2="90" stroke="rgba(201,151,42,0.2)" stroke-width="0.5"/><line x1="30" y1="110" x2="130" y2="110" stroke="rgba(201,151,42,0.2)" stroke-width="0.5"/><line x1="30" y1="130" x2="130" y2="130" stroke="rgba(201,151,42,0.2)" stroke-width="0.5"/><line x1="30" y1="30" x2="30" y2="130" stroke="rgba(201,151,42,0.2)" stroke-width="0.5"/><line x1="50" y1="30" x2="50" y2="130" stroke="rgba(201,151,42,0.2)" stroke-width="0.5"/><line x1="70" y1="30" x2="70" y2="130" stroke="rgba(201,151,42,0.2)" stroke-width="0.5"/><line x1="90" y1="30" x2="90" y2="130" stroke="rgba(201,151,42,0.2)" stroke-width="0.5"/><line x1="110" y1="30" x2="110" y2="130" stroke="rgba(201,151,42,0.2)" stroke-width="0.5"/><line x1="130" y1="30" x2="130" y2="130" stroke="rgba(201,151,42,0.2)" stroke-width="0.5"/><path d="M80 68 L82 77 L90 80 L82 83 L80 92 L78 83 L70 80 L78 77 Z" fill="rgba(201,151,42,0.45)"/></svg>`,
    body: `
      <p>Weaving is the ancient arithmetic of textiles. Every thread is a coordinate; every shuttle pass is a beat in time. The loom is a binary machine of tension and release, translating numbers into soft, tactile structures.</p>
      <p>When weaving, the repetitive rhythm of the loom creates a natural state of flow. The body coordinates with the wood, the warp, and the weft. You become absorbed in the count, the alignment, and the steady beat of the reed.</p>
      <p>This process reminds us that complexity is built of simple threads. By focusing entirely on one single pass at a time, we weave a pattern that is stronger than its individual fibers. Life, too, is woven warp by warp.</p>
    `
  },
  {
    title: "Wood, Steel, and Ink",
    tag: "Craft",
    date: "October 2025",
    art: `<svg viewBox="0 0 160 160" fill="none" width="110" height="110"><rect x="30" y="30" width="100" height="100" stroke="rgba(45,139,124,0.35)" stroke-width="0.6"/><circle cx="80" cy="80" r="35" stroke="rgba(45,139,124,0.3)" stroke-width="0.5"/><line x1="30" y1="80" x2="130" y2="80" stroke="rgba(45,139,124,0.2)" stroke-width="0.5"/><line x1="80" y1="30" x2="80" y2="130" stroke="rgba(45,139,124,0.2)" stroke-width="0.5"/><polygon points="80,62 98,90 62,90" stroke="rgba(45,139,124,0.45)" stroke-width="0.6" fill="rgba(45,139,124,0.05)"/></svg>`,
    body: `
      <p>Operating an antique letterpress is a physical negotiation with machinery. You handle the heavy lead and wood type, lock it into the steel chase, roll the sticky ink, and feed the paper sheets. It is an industrial weight applied to quiet letters.</p>
      <p>The impression is three-dimensional. Unlike a digital screen, letterpress forces ink deep into the paper fibers, creating a tactile relief you can touch. The letters cast shadows on their own paper boundaries. The press is a physical recording of pressure.</p>
      <p>This physical weight makes us value the written word. When every letter must be selected, placed, and locked in backward, you do not write in haste. You print only what needs to stay.</p>
    `
  },
  {
    title: "The Slow Light of June",
    tag: "Somatic",
    date: "September 2025",
    art: `<svg viewBox="0 0 160 160" fill="none" width="110" height="110"><circle cx="80" cy="80" r="45" stroke="rgba(181,96,122,0.35)" stroke-width="0.6"/><circle cx="80" cy="80" r="60" stroke="rgba(181,96,122,0.15)" stroke-width="0.4" stroke-dasharray="2 2"/><path d="M80 10 L80 150 M10 80 L150 80 M30 30 L130 130 M130 30 L30 130" stroke="rgba(181,96,122,0.2)" stroke-width="0.5"/><circle cx="80" cy="80" r="10" fill="rgba(181,96,122,0.4)"/><path d="M 100 20 A 10 10 0 0 0 110 30 A 8.6 8.6 0 0 1 100 20" fill="rgba(181,96,122,0.3)" stroke="rgba(181,96,122,0.4)" stroke-width="0.5"/></svg>`,
    body: `
      <p>In early photography, image capture was not instantaneous. A solar print or cyanotype requires long, quiet exposure to light, letting UV rays react slowly with chemical compounds on paper.</p>
      <p>If you place a botanical leaf on the paper, the light slowly darkens the surrounding space while keeping the leaf outline white. You must leave the print on the grass, in the sun, and simply wait. The sun does the carving.</p>
      <p>This slow light teaches us that patience has its own chemistry. Sometimes, revealing an image—or an understanding—requires not action, but passive exposure to light. Stillness allows the shadow to form.</p>
    `
  },
  {
    title: "The Medicine of Mud",
    tag: "Philosophy",
    date: "August 2025",
    art: `<svg viewBox="0 0 160 160" fill="none" width="110" height="110"><circle cx="80" cy="80" r="76" stroke="rgba(201,151,42,0.3)" stroke-width="0.6"/><circle cx="80" cy="80" r="52" stroke="rgba(201,151,42,0.2)" stroke-width="0.5" stroke-dasharray="2 2"/><circle cx="80" cy="80" r="28" stroke="rgba(201,151,42,0.4)" stroke-width="0.6"/><path d="M80 12 L80 148 M12 80 L148 80" stroke="rgba(201,151,42,0.15)" stroke-width="0.5"/><polygon points="80,40 115,80 80,120 45,80" stroke="rgba(201,151,42,0.3)" stroke-width="0.6" fill="rgba(201,151,42,0.03)"/><circle cx="80" cy="80" r="4" fill="rgba(201,151,42,0.5)"/></svg>`,
    body: `
      <p>Mud is the raw material of creation. In our modern pursuit of sanitization, we keep ourselves distant from the soil. Yet, touching wet earth, molding clay, or planting seeds is a biological reunion. The microbes in the dirt act as natural anti-depressants, stimulating serotonin production.</p>
      <p>In Eastern philosophy, the lotus arises from the deepest mud. The flower does not deny its roots; it relies on the rich, dark muck to fuel its pristine ascent. Stillness is not found in a sterile environment, but in our ability to root deeply in our chaotic, muddy experiences.</p>
      <p>When we allow ourselves to get dirty—to touch the soil with bare hands—we remember that we too are organic matter. The medicine of mud is the acceptance of our raw, unrefined edges. Out of that acceptance, beauty grows.</p>
    `
  },
  {
    title: "Acoustic Spaces & Listening",
    tag: "Sound",
    date: "July 2025",
    art: `<svg viewBox="0 0 160 160" fill="none" width="110" height="110"><ellipse cx="80" cy="80" rx="72" ry="40" stroke="rgba(45,139,124,0.35)" stroke-width="0.6"/><ellipse cx="80" cy="80" rx="52" ry="28" stroke="rgba(45,139,124,0.25)" stroke-width="0.5"/><ellipse cx="80" cy="80" rx="32" ry="16" stroke="rgba(45,139,124,0.4)" stroke-width="0.6"/><circle cx="80" cy="80" r="6" fill="rgba(45,139,124,0.6)"/><line x1="80" y1="20" x2="80" y2="140" stroke="rgba(45,139,124,0.2)" stroke-width="0.5"/></svg>`,
    body: `
      <p>The space we inhabit changes how we speak, but more importantly, how we listen. In a room with high, vaulted stone ceilings, sound lingers, creating a natural echo that forces us to slow our speech. In a small, carpeted room, sound is absorbed instantly, creating an intimate, quiet cavity.</p>
      <p>We are constantly bathing in acoustic environments. Our modern cities are full of harsh, flat, non-resonant spaces that keep our nervous systems on high alert. By contrast, natural environments—forests, caves, open fields—offer complex acoustic textures that allow our ears to settle and expand.</p>
      <p>To listen deeply is to become aware of the space itself. When we listen to a temple bell, we are not just hearing the metal vibrate; we are hearing the room respond. Every room is an instrument, and our presence is the breath that plays it.</p>
    `
  },
  {
    title: "The Shadow of the Needle",
    tag: "Craft",
    date: "June 2025",
    art: `<svg viewBox="0 0 160 160" fill="none" width="110" height="110"><path d="M20,20 C50,80 110,80 140,140" stroke="rgba(181,96,122,0.4)" stroke-width="0.8"/><path d="M140,20 C110,80 50,80 20,140" stroke="rgba(181,96,122,0.3)" stroke-width="0.5"/><circle cx="80" cy="74" r="16" stroke="rgba(181,96,122,0.35)" stroke-width="0.6"/><circle cx="80" cy="74" r="6" fill="rgba(181,96,122,0.6)"/><line x1="80" y1="12" x2="80" y2="148" stroke="rgba(181,96,122,0.15)" stroke-width="0.5"/></svg>`,
    body: `
      <p>Hand-sewing is a practice in small measures. You pull the thread, slide the steel needle through the weave, and press the fabric flat. It is a slow, rhythmic repetition that repairs not just the cloth, but the split attention of the mind.</p>
      <p>In mending an old garment, we honor its history. Every tear tells a story of movement, wear, and utility. Running a visible sashiko stitch over a rip is an act of love—it makes the wound the most beautiful part of the garment, celebrating its survival.</p>
      <p>The needle moves forward, leaving a trail of quiet points. By focusing on a single millimeter of thread at a time, we settle into the present. The needle is small, but its shadow is long, casting a line of quiet attention across the afternoon.</p>
    `
  },
  {
    title: "Geometry of the Heart",
    tag: "Geometry",
    date: "May 2025",
    art: `<svg viewBox="0 0 160 160" fill="none" width="110" height="110"><circle cx="80" cy="80" r="72" stroke="rgba(201,151,42,0.35)" stroke-width="0.6"/><polygon points="80,18 132,108 28,108" stroke="rgba(201,151,42,0.3)" stroke-width="0.6"/><polygon points="80,142 132,52 28,52" stroke="rgba(201,151,42,0.25)" stroke-width="0.5"/><circle cx="80" cy="80" r="14" stroke="rgba(201,151,42,0.45)" stroke-width="0.6"/><circle cx="80" cy="80" r="4" fill="rgba(201,151,42,0.6)"/></svg>`,
    body: `
      <p>When you draw a circle with a compass, you must plant the metal spike firmly in the paper before you swing the graphite lead. If the center point shifts, the circle is lost. This is the primary law of geometry: form arises from a fixed center.</p>
      <p>The human system functions the same way. If our internal center point is unstable, our actions, relationships, and thoughts become distorted. Centering ourselves is not a luxury; it is the prerequisite for drawing a balanced life.</p>
      <p>By drawing geometry by hand, we train our minds to return to the center. The lines connect outer boundaries back to the silent origin point. The paper is the universe; the compass is our intention; the center is the heart.</p>
    `
  },
  {
    title: "Center of the Loom",
    tag: "Philosophy",
    date: "April 2025",
    art: `<svg viewBox="0 0 160 160" fill="none" width="110" height="110"><rect x="30" y="30" width="100" height="100" stroke="rgba(45,139,124,0.3)" stroke-width="0.5"/><polygon points="80,30 130,80 80,130 30,80" stroke="rgba(45,139,124,0.35)" stroke-width="0.6" fill="rgba(45,139,124,0.03)"/><line x1="80" y1="30" x2="80" y2="130" stroke="rgba(45,139,124,0.2)" stroke-width="0.5"/><line x1="30" y1="80" x2="130" y2="80" stroke="rgba(45,139,124,0.2)" stroke-width="0.5"/><circle cx="80" cy="80" r="12" stroke="rgba(45,139,124,0.5)" stroke-width="0.6"/><circle cx="80" cy="80" r="4" fill="rgba(45,139,124,0.6)"/></svg>`,
    body: `
      <p>On a weaving loom, tension is everything. If the warp threads are too loose, the shuttle cannot pass and the pattern collapses. If they are too tight, the threads snap under the pressure of the reed. Weaving requires a constant, balanced tension.</p>
      <p>This balance is the core of spiritual practice. In the middle path, we neither grip too tightly nor let go entirely. We hold our intentions with a firm but gentle hand, allowing room for the weave to settle naturally.</p>
      <p>When the loom is perfectly balanced, the shuttle slides through the shed with a satisfying, low click. The tension becomes silent, carrying the pattern forward thread by thread. Stillness is not the absence of force; it is the alignment of equal tensions.</p>
    `
  },
  {
    title: "Sun-Stitched Linen",
    tag: "Somatic",
    date: "March 2025",
    art: `<svg viewBox="0 0 160 160" fill="none" width="110" height="110"><circle cx="80" cy="80" r="72" stroke="rgba(181,96,122,0.35)" stroke-width="0.6"/><circle cx="80" cy="80" r="36" stroke="rgba(181,96,122,0.2)" stroke-width="0.5"/><line x1="80" y1="8" x2="80" y2="152" stroke="rgba(181,96,122,0.15)" stroke-width="0.5"/><line x1="8" y1="80" x2="152" y2="80" stroke="rgba(181,96,122,0.15)" stroke-width="0.5"/><path d="M40,40 L120,120 M120,40 L40,120" stroke="rgba(181,96,122,0.2)" stroke-width="0.5"/><circle cx="80" cy="80" r="10" stroke="rgba(181,96,122,0.5)" stroke-width="0.6" fill="rgba(181,96,122,0.1)"/><circle cx="80" cy="80" r="3" fill="rgba(181,96,122,0.6)"/></svg>`,
    body: `
      <p>Dyeing fabric with plants is an exercise in slow chemistry. You simmer marigolds, avocado pits, or eucalyptus leaves in water, letting the organic color slowly extract. Then, you submerge the linen, allowing the plant pigments to bond with the fibers.</p>
      <p>Once dyed, the fabric is hung in the sun. The ultraviolet rays slowly bleach the exposed surfaces, creating organic, soft gradations of color. The sun acts as a quiet artist, softening the intense pigments into earth tones.</p>
      <p>This slow process reminds us that time is a necessary ingredient in beauty. You cannot force a plant to release its color faster, nor can you speed up the bleaching rays of the sun. The final color is a physical record of patience and chemical exposure.</p>
    `
  }
];



// Modal open/close handlers
const journalModal = document.getElementById("journal-modal");
const closeJournalBtn = document.querySelector("[data-close-journal-modal]");

function openJournalModal(id) {
  if (!journalModal) return;
  const essay = journalEssays[id];
  if (!essay) return;

  const modalArt = journalModal.querySelector(".journal-modal-art");
  const modalTag = journalModal.querySelector(".modal-tag");
  const modalDate = journalModal.querySelector(".modal-date");
  const modalTitle = journalModal.querySelector(".modal-title");
  const modalBody = journalModal.querySelector(".journal-modal-body");

  if (modalArt) modalArt.innerHTML = essay.art;
  if (modalTag) modalTag.textContent = essay.tag;
  if (modalDate) modalDate.textContent = essay.date;
  if (modalTitle) modalTitle.textContent = essay.title;
  if (modalBody) modalBody.innerHTML = essay.body;

  journalModal.classList.add("is-active");
  journalModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeJournalModal() {
  if (!journalModal) return;
  journalModal.classList.remove("is-active");
  journalModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

// Dynamic random color palettes for journal cards
const journalCardColors = [
  { val: '#ce745b', bg: 'rgba(206, 116, 91, 0.18)' },
  { val: '#6b7f5f', bg: 'rgba(107, 127, 95, 0.16)' },
  { val: '#4b6782', bg: 'rgba(75, 103, 130, 0.16)' },
  { val: 'var(--aurora-gold)', bg: 'rgba(201, 151, 42, 0.18)' },
  { val: 'var(--aurora-rose)', bg: 'rgba(181, 96, 122, 0.16)' },
  { val: 'var(--aurora-teal)', bg: 'rgba(45, 139, 124, 0.16)' },
  { val: '#94586f', bg: 'rgba(148, 88, 111, 0.16)' },
  { val: '#b58d3c', bg: 'rgba(181, 141, 60, 0.18)' },
  { val: '#52664b', bg: 'rgba(82, 102, 75, 0.16)' },
  { val: '#5e6b77', bg: 'rgba(94, 107, 119, 0.16)' },
  { val: '#83729c', bg: 'rgba(131, 114, 156, 0.16)' },
  { val: '#484b52', bg: 'rgba(72, 75, 82, 0.15)' }
];

function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const shuffledColors = shuffleArray(journalCardColors);

document.querySelectorAll(".journal-card").forEach((card, idx) => {
  const color = shuffledColors[idx % shuffledColors.length];
  card.style.setProperty("--spine-color", color.val);
  
  const artContainer = card.querySelector(".journal-card-art");
  if (artContainer) {
    artContainer.style.background = `radial-gradient(circle at center, ${color.bg}, #faf8f2 80%)`;
  }
  
  card.addEventListener("click", () => {
    const essayId = parseInt(card.getAttribute("data-journal-id"), 10);
    openJournalModal(essayId);
  });
});

if (closeJournalBtn) {
  closeJournalBtn.addEventListener("click", closeJournalModal);
}

if (journalModal) {
  journalModal.addEventListener("click", (e) => {
    if (e.target === journalModal) {
      closeJournalModal();
    }
  });
}

// =================================================================
// ── OPTION 4: WORKSHOP AVAILABILITY & WAITLISTS ──────────────────
// =================================================================

const initialCapacities = {
  "Yoga & Hand Block Printing": { total: 10, booked: 8 },
  "Sacred Geometry Drawing": { total: 8, booked: 7 },
  "Watercolour & Sound (AUM)": { total: 10, booked: 10 }, // sold out initially
  "Breathwork & Clay Pots": { total: 8, booked: 3 },
  "Somatic Silk Dyeing": { total: 8, booked: 8 },        // sold out initially
  "Restorative Art & Ink Flow": { total: 10, booked: 5 },
  "Embodied Clay & Breath": { total: 8, booked: 2 },
  "Sacred Mandala & Sound": { total: 12, booked: 4 }
};

// Initialize capacities if not present
if (!localStorage.getItem("ubhi-workshops-capacities")) {
  localStorage.setItem("ubhi-workshops-capacities", JSON.stringify(initialCapacities));
}

function updateWorkshopAvailabilityDOM() {
  const stored = JSON.parse(localStorage.getItem("ubhi-workshops-capacities")) || {};
  const capacities = Object.assign({}, initialCapacities, stored);
  
  document.querySelectorAll(".workshop-card").forEach((card) => {
    const titleEl = card.querySelector("h3");
    if (!titleEl) return;
    const title = titleEl.textContent.trim();
    const data = capacities[title];
    if (!data) return;

    // Find Spaces <dd> element inside the card
    const dlDivs = card.querySelectorAll("dl div");
    dlDivs.forEach((div) => {
      const dt = div.querySelector("dt");
      const dd = div.querySelector("dd");
      if (dt && dd && dt.textContent.trim() === "Spaces") {
        const remaining = data.total - data.booked;
        dd.className = "spaces-counter";
        
        if (remaining === 0) {
          dd.textContent = "Sold out";
          dd.classList.add("sold-out");
          dd.classList.remove("few-left");
        } else {
          dd.textContent = remaining + " left";
          dd.classList.remove("sold-out");
          if (remaining <= 2) {
            dd.classList.add("few-left");
          } else {
            dd.classList.remove("few-left");
          }
        }
      }
    });

    // Update CTA button state
    const btn = card.querySelector("button[data-book]");
    if (btn) {
      const remaining = data.total - data.booked;
      if (remaining === 0) {
        btn.textContent = "Sold Out";
        btn.setAttribute("disabled", "true");
      } else {
        btn.textContent = "Reserve my space";
        btn.removeAttribute("disabled");
      }
    }
  });

  // Also update booking dropdown options in the modal
  const modalSelect = document.getElementById("modal-workshop-select");
  if (modalSelect) {
    Array.from(modalSelect.options).forEach((option) => {
      const title = option.value;
      const data = capacities[title];
      if (data) {
        const remaining = data.total - data.booked;
        if (remaining === 0) {
          option.text = `${title} (Sold Out)`;
          option.disabled = true;
        } else {
          option.text = `${title} (£${option.dataset.price})`;
          option.disabled = false;
        }
      }
    });
  }
}

// Capacities render runs immediately on load, waitlists interceptor removed.

// Run capacity render on load
updateWorkshopAvailabilityDOM();


// =================================================================
// ── OPTION 2: UNIFIED SHOPPING BAG (CART DRAWER) ─────────────────
// =================================================================

let cart = JSON.parse(localStorage.getItem("ubhi-cart")) || [];

// Toggle Cart Drawer
const cartDrawer = document.getElementById("cart-drawer");
const headerCartBtn = document.getElementById("header-cart-btn");
const cartCloseBtn = document.getElementById("cart-close-btn");
const cartOverlay = document.getElementById("cart-drawer-overlay");

function openCartDrawer() {
  if (cartDrawer) {
    cartDrawer.classList.add("is-active");
    cartDrawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
}

function closeCartDrawer() {
  if (cartDrawer) {
    cartDrawer.classList.remove("is-active");
    cartDrawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
}

if (headerCartBtn) {
  headerCartBtn.addEventListener("click", openCartDrawer);
}
if (cartCloseBtn) {
  cartCloseBtn.addEventListener("click", closeCartDrawer);
}
if (cartOverlay) {
  cartOverlay.addEventListener("click", closeCartDrawer);
}

// Add to Cart
function addToCart(name, price) {
  // Find product image/art context to show in cart
  let svgArt = `<svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" stroke="var(--aurora-gold)" stroke-width="0.5"/><circle cx="50" cy="50" r="15" fill="var(--aurora-gold)"/></svg>`;
  document.querySelectorAll(".product-card").forEach((card) => {
    const cardTitle = card.querySelector("h3")?.textContent || "";
    if (cardTitle.includes(name) || name.includes(cardTitle)) {
      const art = card.querySelector(".product-art")?.innerHTML;
      if (art) svgArt = art;
    }
  });

  const existingItem = cart.find(item => item.name === name);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      name: name,
      price: parseInt(price, 10),
      quantity: 1,
      art: svgArt
    });
  }

  localStorage.setItem("ubhi-cart", JSON.stringify(cart));
  updateCartDOM(true);
  openCartDrawer();
}

// Update Cart Quantity
function updateCartQty(name, newQty) {
  if (newQty <= 0) {
    cart = cart.filter(item => item.name !== name);
  } else {
    const item = cart.find(item => item.name === name);
    if (item) item.quantity = newQty;
  }
  localStorage.setItem("ubhi-cart", JSON.stringify(cart));
  updateCartDOM(true);
}

// Update Cart DOM elements
// UK shipping: flat rate, free over a threshold. (Developer: confirm real rates.)
const UBHI_FREE_SHIP = 50;
const UBHI_SHIP_FLAT = 3.95;
function ubhiShipping(subtotal) { return subtotal >= ubhiFreeShip() ? 0 : ubhiShipFlat(); }
// Collision-proof order reference: time component (so refs sort roughly by date)
// PLUS a random component, so two checkouts in the same millisecond never clash.
function ubhiOrderRef() {
  var t = Date.now().toString(36).toUpperCase().slice(-4);
  var r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return "UB-" + t + r;
}

// Quota-safe append to a cumulative localStorage list. Returns true on success,
// false if the browser's storage is full (so the caller can fail LOUDLY instead
// of silently dropping an order). Never throws.
function persistAppend(tableKey, record) {
  var fullKey = "ubhi-" + tableKey;
  try {
    var list = [];
    try { list = JSON.parse(localStorage.getItem(fullKey)) || []; } catch (e) { list = []; }
    if (!Array.isArray(list)) list = [];
    list.push(record);
    localStorage.setItem(fullKey, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error("Could not persist to " + fullKey + " (storage full?):", e);
    return false;
  }
}

function updateCartDOM(shouldPulse = false) {
  cart = JSON.parse(localStorage.getItem("ubhi-cart")) || [];
  
  const badgeCount = document.getElementById("cart-badge-count");
  const emptyMsg = document.getElementById("cart-empty-msg");
  const footer = document.getElementById("cart-drawer-footer");
  const itemsList = document.getElementById("cart-items-list");
  const subtotalPrice = document.getElementById("cart-subtotal-price");

  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (badgeCount) badgeCount.textContent = totalQty;

  if (shouldPulse && headerCartBtn) {
    headerCartBtn.classList.remove("badge-pulse");
    void headerCartBtn.offsetWidth; // Trigger reflow to restart animation
    headerCartBtn.classList.add("badge-pulse");
  }

  if (totalQty === 0) {
    if (emptyMsg) emptyMsg.style.display = "block";
    if (footer) footer.style.display = "none";
    if (itemsList) itemsList.innerHTML = "";
  } else {
    if (emptyMsg) emptyMsg.style.display = "none";
    if (footer) footer.style.display = "block";
    
    if (itemsList) {
      itemsList.innerHTML = cart.map(item => `
        <div class="cart-item-row">
          <div class="cart-item-art">${item.art}</div>
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <div class="cart-item-price">£${item.price}</div>
          </div>
          <div class="cart-item-actions">
            <button type="button" class="cart-qty-btn decrease-qty" data-name="${item.name}">-</button>
            <span class="cart-item-qty">${item.quantity}</span>
            <button type="button" class="cart-qty-btn increase-qty" data-name="${item.name}">+</button>
            <button type="button" class="cart-remove-btn remove-item" data-name="${item.name}" aria-label="Remove item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      `).join("");

      // Add listeners
      itemsList.querySelectorAll(".decrease-qty").forEach(btn => {
        btn.addEventListener("click", () => {
          const name = btn.getAttribute("data-name");
          const item = cart.find(i => i.name === name);
          if (item) updateCartQty(name, item.quantity - 1);
        });
      });

      itemsList.querySelectorAll(".increase-qty").forEach(btn => {
        btn.addEventListener("click", () => {
          const name = btn.getAttribute("data-name");
          const item = cart.find(i => i.name === name);
          if (item) updateCartQty(name, item.quantity + 1);
        });
      });

      itemsList.querySelectorAll(".remove-item").forEach(btn => {
        btn.addEventListener("click", () => {
          const name = btn.getAttribute("data-name");
          updateCartQty(name, 0);
        });
      });
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = ubhiShipping(subtotal);
    const grand = subtotal + shipping;
    if (subtotalPrice) subtotalPrice.textContent = "£" + subtotal;
    const shipEl = document.getElementById("cart-shipping-price");
    const shipNote = document.getElementById("cart-ship-note");
    const totalEl = document.getElementById("cart-total-price");
    if (shipEl) shipEl.textContent = shipping === 0 ? "Free" : "£" + shipping.toFixed(2);
    if (shipNote) shipNote.textContent = shipping === 0 ? "" : "· free over £" + ubhiFreeShip();
    if (totalEl) totalEl.textContent = "£" + (Number.isInteger(grand) ? grand : grand.toFixed(2));
  }
}

// Hijack direct buy clicks to add to cart
document.querySelectorAll("[data-buy-product]").forEach(btn => {
  const cloned = btn.cloneNode(true);
  btn.parentNode.replaceChild(cloned, btn);
  
  cloned.addEventListener("click", (e) => {
    e.preventDefault();
    const productName = cloned.getAttribute("data-buy-product");
    const productPrice = cloned.getAttribute("data-price");
    addToCart(productName, productPrice);
  });
});

// Proceed from Cart to Shop checkout modal
const cartCheckoutBtn = document.getElementById("cart-checkout-btn");
if (cartCheckoutBtn) {
  cartCheckoutBtn.addEventListener("click", () => {
    closeCartDrawer();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const summaryText = cart.map(item => `${item.name} (x${item.quantity})`).join(", ");
    openShopModal(summaryText, subtotal);
  });
}

// Redirect empty state Explore Shop button to close cart drawer
const cartExploreBtn = document.getElementById("cart-explore-btn");
if (cartExploreBtn) {
  cartExploreBtn.addEventListener("click", () => {
    closeCartDrawer();
  });
}

// Run cart rendering on load
updateCartDOM();


// =================================================================
// ── OPTION 5: JOURNAL SEARCH, TAGS & SORT FILTERS ────────────────
// =================================================================

function filterAndSortJournal() {
  const searchInput = document.getElementById("journal-search-input");
  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : "";
  
  const activeTagBtn = document.querySelector(".journal-tag-btn.is-active");
  const activeTag = activeTagBtn ? activeTagBtn.dataset.tag : "All";
  
  const sortSelect = document.getElementById("journal-sort-select");
  const sortBy = sortSelect ? sortSelect.value : "newest";

  const cards = Array.from(document.querySelectorAll(".journal-grid .journal-card"));
  
  const items = cards.map(card => {
    const id = parseInt(card.getAttribute("data-journal-id"), 10);
    const essay = journalEssays[id];
    if (!essay) return null;

    // Word count calculation
    const words = essay.body.replace(/<[^>]*>/g, "").split(/\s+/).length;
    const readingTime = Math.ceil(words / 180); // 180 words per minute

    // Parse Month Year to Timestamp
    const months = {
      "January": 0, "February": 1, "March": 2, "April": 3, "May": 4, "June": 5,
      "July": 6, "August": 7, "September": 8, "October": 9, "November": 10, "December": 11
    };
    const dateParts = essay.date.split(" ");
    const month = months[dateParts[0]] || 0;
    const year = parseInt(dateParts[1], 10) || 2026;
    const dateVal = new Date(year, month, 1).getTime();

    // Check query matches
    const titleMatch = essay.title.toLowerCase().includes(searchQuery);
    const descMatch = card.querySelector(".card-desc")?.textContent.toLowerCase().includes(searchQuery) || false;
    const bodyMatch = essay.body.toLowerCase().includes(searchQuery);
    const matchesSearch = titleMatch || descMatch || bodyMatch;
    const matchesTag = activeTag === "All" || essay.tag === activeTag;

    return {
      card,
      readingTime,
      dateVal,
      matchesSearch,
      matchesTag
    };
  }).filter(Boolean);

  // Toggle CSS visibility classes
  items.forEach(item => {
    if (item.matchesSearch && item.matchesTag) {
      item.card.style.display = "";
      item.card.classList.remove("is-hidden");
    } else {
      item.card.style.display = "none";
      item.card.classList.add("is-hidden");
    }
  });

  // Sort elements in items list
  items.sort((a, b) => {
    if (sortBy === "newest") return b.dateVal - a.dateVal;
    if (sortBy === "oldest") return a.dateVal - b.dateVal;
    if (sortBy === "shortest") return a.readingTime - b.readingTime;
    if (sortBy === "longest") return b.readingTime - a.readingTime;
    return 0;
  });

  // Reorder in DOM
  const grid = document.querySelector(".journal-grid");
  if (grid) {
    items.forEach(item => {
      grid.appendChild(item.card);
    });
  }
}

// Hook filter bar input events
const journalSearch = document.getElementById("journal-search-input");
if (journalSearch) {
  journalSearch.addEventListener("input", filterAndSortJournal);
}

const journalSort = document.getElementById("journal-sort-select");
if (journalSort) {
  journalSort.addEventListener("change", filterAndSortJournal);
}

document.querySelectorAll(".journal-tag-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".journal-tag-btn").forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    filterAndSortJournal();
  });
});

// Render reading times on cards dynamically on load
document.querySelectorAll(".journal-card").forEach(card => {
  const id = parseInt(card.getAttribute("data-journal-id"), 10);
  const essay = journalEssays[id];
  if (essay) {
    const words = essay.body.replace(/<[^>]*>/g, "").split(/\s+/).length;
    const time = Math.ceil(words / 180);
    const metaEl = card.querySelector(".journal-card-meta");
    if (metaEl) {
      metaEl.innerHTML += ` &middot; <span style="opacity:0.65;">${time} min read</span>`;
    }
  }
});


// =================================================================
// ── SHOP SEARCH & CATEGORY FILTERING ──────────────────────────────
// =================================================================

const shopSearchInput = document.getElementById("shop-search-input");
const shopCategoryBtns = document.querySelectorAll("#shop-categories .category-btn");
let shopProductCards = document.querySelectorAll("#page-shop .product-card");

function filterShopProducts() {
  const query = shopSearchInput ? shopSearchInput.value.toLowerCase().trim() : "";
  const activeBtn = document.querySelector("#shop-categories .category-btn.active");
  const category = activeBtn ? activeBtn.getAttribute("data-category") : "all";

  shopProductCards.forEach(card => {
    const titleEl = card.querySelector("h3");
    const eyebrowEl = card.querySelector(".eyebrow");
    const descEl = card.querySelector(".product-body p");
    
    const title = titleEl ? titleEl.textContent.toLowerCase() : "";
    const eyebrow = eyebrowEl ? eyebrowEl.textContent.toLowerCase() : "";
    const desc = descEl ? descEl.textContent.toLowerCase() : "";
    
    const matchesSearch = title.includes(query) || desc.includes(query) || eyebrow.includes(query);
    
    let matchesCategory = true;
    if (category !== "all") {
      if (category === "mail") {
        matchesCategory = eyebrow.includes("snail mail") || eyebrow.includes("mail");
      } else if (category === "prints") {
        matchesCategory = eyebrow.includes("print");
      } else if (category === "tools") {
        matchesCategory = eyebrow.includes("tool") || eyebrow.includes("kit") || eyebrow.includes("stationery") || eyebrow.includes("drawing");
      } else if (category === "art") {
        matchesCategory = eyebrow.includes("art") || eyebrow.includes("keepsake") || eyebrow.includes("vessel") || eyebrow.includes("clay");
      }
    }

    if (matchesSearch && matchesCategory) {
      card.style.display = "";
      card.classList.add("is-visible");
    } else {
      card.style.display = "none";
      card.classList.remove("is-visible");
    }
  });
}

if (shopSearchInput) {
  shopSearchInput.addEventListener("input", filterShopProducts);
}

shopCategoryBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    shopCategoryBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filterShopProducts();
  });
});

shopCategoryBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    shopCategoryBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filterShopProducts();
  });
});

// Re-bind the [data-buy-product] click hijack listeners for all shop cards
document.querySelectorAll("#page-shop .product-card [data-buy-product]").forEach(btn => {
  const cloned = btn.cloneNode(true);
  btn.parentNode.replaceChild(cloned, btn);
  
  cloned.addEventListener("click", (e) => {
    e.preventDefault();
    const productName = cloned.getAttribute("data-buy-product");
    const productPrice = cloned.getAttribute("data-price");
    addToCart(productName, productPrice);
  });
});

// =================================================================
// ── OPTION 5: DATABASE LAYER & CMS PORTAL ────────────────────────
// =================================================================

// --- 1. Default Datasets ---
const defaultGalleryItems = [
  { src: 'assets/gallery-chelsea.png', alt: 'Chelsea Kaur Ubhi in her studio' },
  { src: 'assets/gallery-yoga-breath.png', alt: 'Somatic yoga and breathwork guidance' },
  { src: 'assets/gallery-block-print.png', alt: 'Hand carving linoleum block printing stamp' },
  { src: 'assets/gallery-geometry-draw.png', alt: 'Sacred geometry drawing session' }
];

const defaultWorkshops = [
  {
    title: "Yoga & Hand Block Printing",
    eyebrow: "Signature · 12 July",
    desc: "A grounding somatic yoga practice followed by slow block printing on organic paper and cloth.",
    time: "10:30–13:30",
    place: "Hackney studio",
    price: 58,
    capacity: 10,
    image: "assets/ubhi-workshop-generated.png"
  },
  {
    title: "Sacred Geometry Drawing",
    eyebrow: "Geometry · 26 July",
    desc: "Compass-and-rule mandala drawing, breath, stillness, and a short philosophical inquiry.",
    time: "09:30–12:00",
    place: "Hackney studio",
    price: 44,
    capacity: 8,
    image: "assets/gallery-geometry-draw.png"
  },
  {
    title: "Watercolour & Sound (AUM)",
    eyebrow: "Sound · 9 August",
    desc: "Vocal tuning, sound bath meditation, and fluid pigment experimentation on cold-press sheets.",
    time: "14:00–17:00",
    place: "Hackney studio",
    price: 52,
    capacity: 10,
    image: "assets/gallery-chelsea.png"
  },
  {
    title: "Breathwork & Clay Pots",
    eyebrow: "Clay · 23 August",
    desc: "Slow down your nervous system, connect with earth, and mold tactile terracotta shapes.",
    time: "10:30–13:00",
    place: "Hackney studio",
    price: 48,
    capacity: 8,
    image: "assets/gallery-yoga-breath.png"
  },
  {
    title: "Somatic Silk Dyeing",
    eyebrow: "Silk · 6 September",
    desc: "Explore organic indigo vats and botanical dyes, painting intentions onto premium raw silk.",
    time: "11:00–14:30",
    place: "Hackney studio",
    price: 64,
    capacity: 8,
    image: "assets/gallery-block-print.png"
  },
  {
    title: "Restorative Art & Ink Flow",
    eyebrow: "Ink · 20 September",
    desc: "A nourishing restoration session using fluid pigments, breath, and botanical inks.",
    time: "14:30–17:00",
    place: "Hackney studio",
    price: 46,
    capacity: 10,
    image: "assets/gallery-yoga-breath.png"
  }
];

const defaultShopCatalog = [
  {
    name: "AUM Geometry Print",
    price: 32,
    category: "Limited print",
    description: "Terracotta linework on ivory archival paper. A4. Hand-stamped edition of 50.",
    vector: "yantra",
    totalStock: 50,
    remainingStock: 12,
    image: ""
  },
  {
    name: "Lotus Sticker Set",
    price: 8,
    category: "Workshop object",
    description: "12 small symbols for journals, letters, and altar corners. Screen-printed on kraft paper.",
    vector: "lotus",
    totalStock: 100,
    remainingStock: 45,
    image: ""
  },
  {
    name: "Block Printing Starter Kit",
    price: 24,
    category: "Ritual tool",
    description: "One hand-carved foam block, two ink pads, and a folded instruction card.",
    vector: "concentric",
    totalStock: 30,
    remainingStock: 8,
    image: ""
  },
  {
    name: "Sacred Geometry Compass Set",
    price: 28,
    category: "Drawing tool",
    description: "Precision compass, ruler, and a guide to the first six patterns.",
    vector: "lines",
    totalStock: 25,
    remainingStock: 5,
    image: ""
  },
  {
    name: "Ubhi Journal — Blank",
    price: 22,
    category: "Ritual stationery",
    description: "A4 lay-flat, 160 pages of off-white cartridge paper. Embossed cover.",
    vector: "lotus",
    totalStock: 40,
    remainingStock: 14,
    image: ""
  },
  {
    name: "Earth-bound Vessel",
    price: 45,
    category: "Clay craft",
    description: "Hand-thrown terracotta pot, wood-fired with organic glaze. Each piece holds a unique shape.",
    vector: "lines",
    totalStock: 15,
    remainingStock: 3,
    image: ""
  },
  {
    name: "Somatic Art Archive",
    price: 38,
    category: "Art archive",
    description: "Folio of 4 linocut prints documenting bodily movement, printed on cotton rag paper.",
    vector: "concentric",
    totalStock: 20,
    remainingStock: 7,
    image: ""
  },
  {
    name: "Quiet Keepsake Set",
    price: 15,
    category: "Quiet keepsakes",
    description: "Three polished river stones wrapped in woven brass wire. Altars and sensory focus.",
    vector: "lotus",
    totalStock: 30,
    remainingStock: 11,
    image: ""
  },
  {
    name: "Terracotta Relic Print",
    price: 26,
    category: "Relic print",
    description: "Woodblock print in warm iron oxide inks, detailing ancient geometry on heavy card.",
    vector: "lines",
    totalStock: 40,
    remainingStock: 19,
    image: ""
  },
  {
    name: "Ritual Brass Bowl",
    price: 34,
    category: "Ritual tool",
    description: "Hand-beaten brass incense bowl, matching sand, and wild-harvested white sage bundle.",
    vector: "concentric",
    totalStock: 20,
    remainingStock: 9,
    image: ""
  },
  {
    name: "Embodied Geometry Art",
    price: 40,
    category: "Yantra print",
    description: "Silk-screened cosmic diagram on hand-dyed indigo paper. Signed and numbered.",
    vector: "yantra",
    totalStock: 25,
    remainingStock: 6,
    image: ""
  },
  {
    name: "Botanical Linen Wrap",
    price: 18,
    category: "Limited edition",
    description: "Hand-dyed linen wrap for books or journals, infused with wild marigold and madder root.",
    vector: "lotus",
    totalStock: 30,
    remainingStock: 12,
    image: ""
  }
];

const defaultSnailPhotos = [
  { src: 'assets/gallery-chelsea.png', caption: 'January — Vol. 01: AUM ॐ' },
  { src: 'assets/gallery-yoga-breath.png', caption: 'February — Vol. 02: Presence 🧘' },
  { src: 'assets/gallery-block-print.png', caption: 'March — Vol. 03: Carving 🪵' },
  { src: 'assets/gallery-geometry-draw.png', caption: 'April — Vol. 04: Symmetry 📐' },
  { src: 'assets/ubhi-snail-mail-generated.png', caption: 'May — Vol. 05: Slow post ✉️' },
  { src: 'assets/ubhi-workshop-generated.png', caption: 'June — Vol. 06: Crafting 🏺' },
  { src: 'assets/gallery-chelsea.png', caption: 'July — Vol. 07: Silence 🤫' },
  { src: 'assets/gallery-yoga-breath.png', caption: 'August — Vol. 08: Sound 🔊' },
  { src: 'assets/gallery-block-print.png', caption: 'September — Vol. 09: Alchemy 🧪' },
  { src: 'assets/gallery-geometry-draw.png', caption: 'October — Vol. 10: Geometry 🌀' },
  { src: 'assets/ubhi-snail-mail-generated.png', caption: 'November — Vol. 11: Stardust ✨' },
  { src: 'assets/ubhi-workshop-generated.png', caption: 'December — Vol. 12: Ascend 👁️' }
];

const defaultSnailReviews = [
  { author: 'Eleanor K. 🌿', stamp: '🪷', text: 'Receiving Chelsea’s letters each month has become a sacred ritual. The paper feels alive, and the wax seal makes opening it feel like a gift from another era.' },
  { author: 'Clara H. ✨', stamp: '🌙', text: 'The linocuts are so beautiful on my altar. It’s a gentle reminder to slow down, disconnect from screens, and touch something real.' },
  { author: 'Julian V. 🪵', stamp: '👁️', text: 'Intention is woven into every detail—the ink, the stamp, the words. It is medicine for the nervous system in a busy world.' },
  { author: 'Marcus T. 🌊', stamp: '🐚', text: 'Every month a new piece of quiet presence arrives at my door. Chelsea has created a beautiful channel for shared consciousness.' }
];

const defaultSnailMembers = [
  { name: 'Emily Watson', email: 'emily@example.com', contact: '+44 7700 900077', plan: '12 Months', billing: '£14 / month', address: "14 Primrose Gardens, London, NW3 4YT, United Kingdom", dateSubscribed: '2026-02-12', status: 'Active' },
  { name: 'Julian Vane', email: 'julian.vane@example.com', contact: '+44 7700 900112', plan: 'Monthly', billing: '£18 / month', address: "Flat 4B, 88 Brunswick Place, Brighton, BN3 1FL, United Kingdom", dateSubscribed: '2026-01-08', status: 'Active' },
  { name: 'Clara Hughes', email: 'clara.h@example.com', contact: '+44 7700 900224', plan: '6 Months', billing: '£16 / month', address: "22 Windmill Lane, York, YO10 3LG, United Kingdom", dateSubscribed: '2025-11-20', status: 'Inactive' },
  { name: 'Marcus Thorne', email: 'marcus.thorne@example.com', contact: '+44 7700 900331', plan: '12 Months', billing: '£14 / month', address: "9 Ashdown Close, Sheffield, S10 5FJ, United Kingdom", dateSubscribed: '2026-03-01', status: 'Active' },
  { name: 'Sophia Lin', email: 'sophia@example.com', contact: '+44 7700 900445', plan: 'Monthly', billing: '£18 / month', address: "72 High Street, Edinburgh, EH1 1TB, United Kingdom", dateSubscribed: '2025-09-14', status: 'Inactive' }
];

// --- 2. Database Adaptation Layer ---
const memoryDb = {};

function safeLocalRead(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn("localStorage read blocked, using memoryDb fallback:", e);
    return memoryDb[key] || null;
  }
}

function safeLocalWrite(key, val) {
  try {
    localStorage.setItem(key, val);
  } catch (e) {
    console.warn("localStorage write blocked, using memoryDb fallback:", e);
    memoryDb[key] = val;
  }
}

function safeLocalRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn("localStorage remove blocked:", e);
    delete memoryDb[key];
  }
}

// Escape user/stored text before placing it into innerHTML. Prevents stored XSS — e.g. a
// customer typing HTML into a name/note/address that later renders in the admin dashboard.
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function dbRead(tableKey, defaultValue = []) {
  const data = safeLocalRead("ubhi-" + tableKey);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      // Guard against corrupt/legacy data: if a list was expected, insist on a list
      // (a stray non-array would otherwise throw inside .map/.reduce/.filter).
      if (Array.isArray(defaultValue) && !Array.isArray(parsed)) return defaultValue;
      return parsed;
    } catch (e) {
      console.error(`Failed to parse localStorage data for ${tableKey}:`, e);
    }
  }
  return defaultValue;
}

function dbWrite(tableKey, value) {
  safeLocalWrite("ubhi-" + tableKey, JSON.stringify(value));
  // Write-through to the backend when connected (ubhi-sync.js). No-op offline.
  if (typeof window !== "undefined" && window.ubhiSyncPush) {
    try { window.ubhiSyncPush(tableKey, value); } catch (e) { /* never block a local save */ }
  }
}

function dbRemove(tableKey) {
  safeLocalRemove("ubhi-" + tableKey);
}

// Newer workshops, added to the catalogue (April 2026)
const moreWorkshops = [
  {
    title: "Lunar Yin & Ink Wash",
    eyebrow: "Moon · 6 September",
    desc: "A slow yin practice under low light, then loose ink-wash painting — letting the brush wander as the body softens.",
    time: "18:30–21:00", place: "Hackney studio", price: 54, capacity: 9, image: ""
  },
  {
    title: "Pressed Flowers & Pencil Study",
    eyebrow: "Botanical · 20 September",
    desc: "Press a flower, then learn to hold its likeness in pencil and wash. Materials and a small sketchbook to keep.",
    time: "11:00–14:00", place: "Hackney studio", price: 48, capacity: 8, image: ""
  },
  {
    title: "Kintsugi & Self-Compassion",
    eyebrow: "Mending · 4 October",
    desc: "Repair a broken bowl with golden seams while we sit with the quiet philosophy of honouring what has cracked.",
    time: "13:00–16:00", place: "Hackney studio", price: 62, capacity: 8, image: ""
  },
  {
    title: "Morning Movement & Letters",
    eyebrow: "Correspondence · 18 October",
    desc: "Gentle movement, a pot of tea, and an hour of writing real letters by hand — to a friend, or to yourself.",
    time: "09:00–11:30", place: "Hackney studio", price: 40, capacity: 12, image: ""
  },
  {
    title: "Candlelit Sound & Clay",
    eyebrow: "Sound · 1 November",
    desc: "A sound bath, then hand-building a small clay vessel — shaping earth to the hum still humming in your chest.",
    time: "17:30–20:00", place: "Hackney studio", price: 56, capacity: 10, image: ""
  }
];

// Newer journal entries (April 2026)
const moreEssays = [
  {
    title: "On Keeping a Slow Notebook",
    tag: "Philosophy", date: "May 2026",
    body: "<p>A notebook is the slowest technology I own, and the most honest. It does not autocorrect me, or suggest what I might mean. It simply holds what I was brave enough to write down.</p><p>I keep mine half-finished on purpose. The empty pages are a promise that the thinking isn't over — that there is room, still, to change my mind. A notebook kept slowly becomes a kind of friend: patient, a little dog-eared, and entirely yours.</p>"
  },
  {
    title: "The Quiet Geometry of a Leaf",
    tag: "Geometry", date: "April 2026",
    body: "<p>Hold a leaf to the light and the whole of sacred geometry is already there — the central vein, the branching that repeats itself smaller and smaller, the gentle asymmetry that keeps it from feeling machined.</p><p>We draw mandalas with compass and rule to remember a pattern the leaf never forgot. The practice is not to invent order, but to notice it; to sit long enough that the veins become a kind of map back to your own breathing.</p>"
  },
  {
    title: "Why I Still Write by Hand",
    tag: "Craft", date: "March 2026",
    body: "<p>Typing is for getting things done. Handwriting is for getting things felt. The hand is slower than the mind, and in that gap — between the thought and the ink catching up — something softens.</p><p>A letter written by hand carries the weather of the day it was written: the rushed loops, the careful ones, the place where the pen paused. It is the opposite of a feed. It asks for your presence, and it keeps it.</p>"
  },
  {
    title: "Breathing as a First Language",
    tag: "Breathwork", date: "February 2026",
    body: "<p>Before we had words we had breath — the first rhythm, learned in the dark, repeated some twenty thousand times a day without a single lesson.</p><p>To return to the breath in a practice is not to learn something new but to remember something old. Lengthen the exhale and the nervous system reads it as safety. The body believes the breath before it believes the mind; begin there, and the rest follows.</p>"
  }
];

// Seeding checks
if (!dbRead("gallery-items", null)) {
  dbWrite("gallery-items", defaultGalleryItems);
}
// Art Portfolio "pieces" — each artwork can hold several photos (swipe to view
// when enlarged). Seeded once from the gallery images as single-photo pieces;
// fully managed from the admin "Art Portfolio" tab thereafter.
if (!dbRead("art-pieces", null)) {
  const _galSeed = dbRead("gallery-items", []);
  dbWrite("art-pieces", (Array.isArray(_galSeed) ? _galSeed : []).map(function (it) {
    return { title: it.alt || "Untitled piece", images: [it.src] };
  }));
}
if (!dbRead("workshops", null)) {
  dbWrite("workshops", defaultWorkshops.concat(moreWorkshops));
}
// Top-up: fold the newer workshops in once, without disturbing any edits
if (!dbRead("workshops-topup-v2", null)) {
  const _wsCur = dbRead("workshops", []);
  if (Array.isArray(_wsCur)) {
    const _have = new Set(_wsCur.map(w => w && w.title));
    moreWorkshops.forEach(w => { if (!_have.has(w.title)) _wsCur.push(w); });
    dbWrite("workshops", _wsCur);
  }
  dbWrite("workshops-topup-v2", true);
}
if (!dbRead("shop-catalog", null)) {
  dbWrite("shop-catalog", defaultShopCatalog);
}
// LAUNCH-CLEAN: demo data must never sit in a real shop. This one-time
// migration removes the old demo seeds from browsers where they had already
// run: the two "example gallery" products (added only to demo the image zoom)
// and the fake demo customer with their fabricated order history.
(function purgeDemoData() {
  if (safeLocalRead("ubhi-demo-data-purged-v1") === "1") return;
  try {
    // Example photo-gallery products — matched by name AND their seeded cover
    // image, so a real product the owner later makes with the same name survives.
    const exNames = { "Block-Print Art Set": "assets/gallery-block-print.png", "Studio Ritual Bundle": "assets/ubhi-workshop-generated.png" };
    const cat = dbRead("shop-catalog", null);
    if (Array.isArray(cat)) {
      const kept = cat.filter(p => !(p && exNames[p.name] && p.image === exNames[p.name]));
      if (kept.length !== cat.length) dbWrite("shop-catalog", kept);
    }
    // The demo customer (abhi@ubhi.in) and their fabricated history.
    const demo = (e) => String(e || "").toLowerCase() === "abhi@ubhi.in";
    const mem = dbRead("members", null);
    if (Array.isArray(mem)) dbWrite("members", mem.filter(m => !demo(m.email)));
    const so = dbRead("shop-orders", null);
    if (Array.isArray(so)) dbWrite("shop-orders", so.filter(o => !demo(o.email || o.customerEmail)));
    const wr = dbRead("workshop-reservations", null);
    if (Array.isArray(wr)) dbWrite("workshop-reservations", wr.filter(b => !demo(b.email)));
    const sm = dbRead("snail-members", null);
    if (Array.isArray(sm)) dbWrite("snail-members", sm.filter(m => !demo(m.email)));
  } catch (e) { /* best effort — never block boot */ }
  safeLocalWrite("ubhi-demo-data-purged-v1", "1");
})();
if (!dbRead("snail-photos", null)) {
  dbWrite("snail-photos", defaultSnailPhotos);
}
if (!dbRead("snail-reviews", null)) {
  dbWrite("snail-reviews", defaultSnailReviews);
}
if (!dbRead("snail-members", null)) {
  dbWrite("snail-members", defaultSnailMembers);
}
if (!dbRead("journal-posts", null)) {
  dbWrite("journal-posts", journalEssays.concat(moreEssays));
}
// Top-up: fold the newer essays in once, without disturbing any edits
if (!dbRead("journal-topup-v2", null)) {
  const _jCur = dbRead("journal-posts", []);
  if (Array.isArray(_jCur)) {
    const _jHave = new Set(_jCur.map(e => e && e.title));
    moreEssays.forEach(e => { if (!_jHave.has(e.title)) _jCur.push(e); });
    dbWrite("journal-posts", _jCur);
  }
  dbWrite("journal-topup-v2", true);
}

// Sync capacities mapping
const dbCapacities = dbRead("workshops-capacities", null) || initialCapacities;
const dbWorkshopsList = dbRead("workshops", null) || defaultWorkshops;
dbWorkshopsList.forEach(w => {
  if (!dbCapacities[w.title]) {
    dbCapacities[w.title] = { total: w.capacity, booked: 0 };
  }
});
dbWrite("workshops-capacities", dbCapacities);

// Read journal posts from db to reassign reference
journalEssays = dbRead("journal-posts", null) || journalEssays;

// Snail Mail Member Sorting & Page size defaults
let snailMembersSearch = "";
let snailMembersPage = 1;
let snailMembersPageSize = 25;
let snailMembersSortColumn = "name";
let snailMembersSortOrder = "asc";

// Orders search vars
let adminOrdersSearch = "";
let adminBookingsSearch = "";
// Large-list management (filter / sort / paginate / bulk) for Orders & Bookings
let adminOrdersStatus = "all";        // all | preparing | shipped | delivered | cancelled
let adminOrdersSort = "date-desc";    // date-desc | date-asc | total-desc | total-asc | name-asc
let adminOrdersPage = 1;
let adminOrdersPerPage = 25;          // 25 | 50 | 100 | 0 (=all)
let adminOrdersPageIds = [];
const adminOrdersSelected = new Set();
let adminBookingsWorkshop = "all";    // "all" | <workshop title>
let adminBookingsWhen = "all";        // all | upcoming — filter by the workshop's session date
let adminBookingsSort = "date-desc";  // date-desc | date-asc | price-desc | price-asc | name-asc
let adminBookingsPage = 1;
let adminBookingsPerPage = 25;
let adminBookingsPageIds = [];
const adminBookingsSelected = new Set();

// Bind the Orders & Bookings control handlers resiliently: register on DOMContentLoaded
// and guard with try/catch so an unrelated error elsewhere in startup can never leave the
// chips / sub-tabs / sortable headers / pager unresponsive. (initOrdersAndBackupListeners
// is a hoisted function declaration, so it's available here even though it's defined below.)
(function ensureOrdersListeners() {
  function go() { try { initOrdersAndBackupListeners(); } catch (e) { console.error("Orders/Bookings listeners failed to bind:", e); } }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go);
  else go();
})();
let adminGallerySearch = "";
let adminWorkshopsSearch = "";
let adminShopSearch = "";
let adminJournalSearch = "";

// --- 3. Dynamic Front-Facing Page Renderers ---

function renderHomeGallery() {
  const container = document.getElementById("home-gallery-container");
  if (!container) return;
  const items = dbRead("gallery-items", []);
  
  if (items.length === 0) {
    container.innerHTML = `<p style="padding:40px;text-align:center;color:var(--mist);">No gallery images yet.</p>`;
    return;
  }

  const makeTrackHTML = () => {
    return items.map((item, idx) => `
      <div class="gallery-item">
        <img src="${esc(item.src)}" alt="${esc(item.alt)}" loading="lazy" />
      </div>
      <div class="gallery-separator" aria-hidden="true">
        <span class="sep-om">ॐ</span>
        <span class="sep-eye">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="var(--aurora-teal)" stroke-width="0.8" fill="rgba(45,139,124,0.05)"/>
            <circle cx="12" cy="12" r="6" fill="#1f4ba6"/>
            <circle cx="12" cy="12" r="3" fill="#000000"/>
            <circle cx="10.8" cy="10.8" r="1" fill="#ffffff"/>
          </svg>
        </span>
      </div>
    `).join("");
  };

  container.innerHTML = `
    <div class="gallery-track">
      ${makeTrackHTML()}
    </div>
    <div class="gallery-track" aria-hidden="true">
      ${makeTrackHTML()}
    </div>
  `;

  // Keep the dedicated Art Portfolio page in sync with the same gallery store.
  if (typeof renderArtPortfolio === "function") renderArtPortfolio();
}

// Art Portfolio page — a compact grid of small images drawn from the same
// gallery-items the admin manages. Clicking any image opens it enlarged in the
// shared lightbox, where the arrows / ← → keys browse left and right through
// the whole set. (artImages is read by the lightbox handler above.)
let artPieces = [];

function renderArtPortfolio() {
  const container = document.getElementById("art-portfolio-container");
  if (!container) return;
  artPieces = dbRead("art-pieces", []);

  if (!artPieces.length) {
    container.innerHTML = `<p class="art-portfolio-empty">New work is being prepared. Please check back soon.</p>`;
    return;
  }

  container.innerHTML = artPieces.map((piece, i) => {
    const imgs = Array.isArray(piece.images) ? piece.images.filter(Boolean) : [];
    const cover = imgs[0] || "";
    const title = piece.title || "";
    const multi = imgs.length > 1;
    return `
    <figure class="art-portfolio-tile" data-piece-idx="${i}" title="${esc(title)}${multi ? " — " + imgs.length + " photos" : ""}">
      <img src="${esc(cover)}" alt="${esc(title)}" loading="lazy" />
      ${multi ? `<span class="art-tile-count" aria-hidden="true"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="3" width="13" height="13" rx="2"/><path d="M16 16v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3"/></svg>${imgs.length}</span>` : ""}
      ${title ? `<figcaption>${esc(title)}</figcaption>` : ""}
    </figure>`;
  }).join("");
}

// Share a single workshop — native share sheet on mobile, copy-link fallback elsewhere.
function shareWorkshop(title, slug) {
  const base = location.origin + location.pathname;
  const url = base + "?w=" + encodeURIComponent(slug || "") + "#workshops";
  const data = { title: "Ubhi — " + title, text: "Join me at the “" + title + "” workshop with Ubhi:", url: url };
  if (navigator.share) {
    navigator.share(data).catch(function () {});
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(function () { workshopShareToast("Workshop link copied ✓"); }).catch(function () { window.prompt("Copy this workshop link:", url); });
  } else {
    window.prompt("Copy this workshop link:", url);
  }
}

function workshopShareToast(text) {
  let t = document.getElementById("ws-share-toast");
  if (!t) { t = document.createElement("div"); t.id = "ws-share-toast"; t.className = "ws-share-toast"; document.body.appendChild(t); }
  t.textContent = text;
  void t.offsetWidth;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(function () { t.classList.remove("show"); }, 2200);
}

// If arrived via a shared link (?w=<slug>), scroll to + highlight that workshop once.
let _sharedWorkshopHandled = false;
function highlightSharedWorkshop() {
  if (_sharedWorkshopHandled) return;
  const w = new URLSearchParams(location.search).get("w");
  if (!w) return;
  const card = document.querySelector('.workshop-card[data-wslug="' + w.replace(/[^a-z0-9-]/gi, "") + '"]');
  if (!card) return;
  _sharedWorkshopHandled = true;
  setTimeout(function () {
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.add("workshop-card-highlight");
    setTimeout(function () { card.classList.remove("workshop-card-highlight"); }, 2600);
  }, 350);
}

function renderWorkshops() {
  const container = document.getElementById("workshops-list-container");
  if (!container) return;
  const list = dbRead("workshops", []);
  const capacities = dbRead("workshops-capacities", {});
  
  if (list.length === 0) {
    container.innerHTML = `<p style="padding:40px;text-align:center;color:var(--mist);grid-column: span 2;">No workshops scheduled at this time.</p>`;
    return;
  }

  container.innerHTML = list.map((w, idx) => {
    const cap = capacities[w.title] || { total: w.capacity, booked: 0 };
    const remaining = cap.total - cap.booked;
    const wslug = (w.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    let spacesText = "";
    let btnAttr = "";
    let btnText = "Reserve my space";
    
    if (remaining <= 0) {
      spacesText = `<span class="spaces-counter sold-out">Sold out</span>`;
      btnAttr = 'disabled="true"';
      btnText = "Sold Out";
    } else if (remaining <= 2) {
      spacesText = `<span class="spaces-counter few-left">${remaining} left</span>`;
    } else {
      spacesText = `<span class="spaces-counter">${remaining} left</span>`;
    }

    let imgHtml = "";
    if (w.image && w.image !== "") {
      imgHtml = `<div class="card-image-wrap"><img src="${w.image}" alt="${w.title}" loading="lazy" /><div class="card-image-glow"></div></div>`;
    } else {
      imgHtml = `
        <div class="product-art" style="background:radial-gradient(circle at center,rgba(201,151,42,0.08),rgba(7,6,14,0.9));" aria-hidden="true">
          <svg viewBox="0 0 200 200" fill="none" width="120" height="120">
            <path d="M50,90 A50,50 0 0,0 150,90 Z" fill="rgba(201,151,42,0.08)" stroke="rgba(201,151,42,0.5)" stroke-width="0.8"/>
            <line x1="40" y1="90" x2="160" y2="90" stroke="rgba(201,151,42,0.4)" stroke-width="0.8"/>
            <circle cx="100" cy="90" r="3" fill="rgba(201,151,42,0.6)"/>
            <circle cx="100" cy="100" r="60" stroke="rgba(201,151,42,0.2)" stroke-width="0.5"/>
          </svg>
        </div>
      `;
    }

    return `
      <article class="workshop-card reveal is-visible" data-wslug="${wslug}">
        <button class="workshop-share" type="button" data-share="${esc(w.title)}" data-wslug="${wslug}" aria-label="Share this workshop" title="Share this workshop">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><line x1="8.3" y1="10.8" x2="15.7" y2="6.2"/><line x1="8.3" y1="13.2" x2="15.7" y2="17.8"/></svg>
        </button>
        ${imgHtml}
        <div class="card-body">
          <p class="eyebrow">${w.eyebrow}</p>
          <h3>${w.title}</h3>
          <p>${w.desc}</p>
          <dl>
            <div><dt>Time</dt><dd>${w.time}</dd></div>
            <div><dt>Place</dt><dd>${w.place}</dd></div>
            <div><dt>Price</dt><dd>£${w.price}</dd></div>
            <div><dt>Spaces</dt><dd>${spacesText}</dd></div>
          </dl>
          <button class="button button-secondary" type="button" data-book="${w.title}" ${btnAttr}>${btnText}</button>
        </div>
      </article>
    `;
  }).join("");

  // Re-bind booking clicks
  container.querySelectorAll("[data-book]").forEach(btn => {
    btn.addEventListener("click", () => {
      const wTitle = btn.getAttribute("data-book");
      if (typeof openBookingModal === "function") {
        openBookingModal(wTitle);
      }
    });
  });

  // Share buttons on each tile
  container.querySelectorAll("[data-share]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      shareWorkshop(btn.getAttribute("data-share"), btn.getAttribute("data-wslug"));
    });
  });

  updateBookingModalSelect();
  highlightSharedWorkshop();
}

function updateBookingModalSelect() {
  const modalSelect = document.getElementById("modal-workshop-select");
  if (!modalSelect) return;
  const list = dbRead("workshops", []);
  const capacities = dbRead("workshops-capacities", {});

  let html = `<option value="" disabled selected>Select practice...</option>`;
  html += list.map(w => {
    const cap = capacities[w.title] || { total: w.capacity, booked: 0 };
    const remaining = cap.total - cap.booked;
    const isSoldOut = remaining <= 0;
    const label = isSoldOut ? `${w.title} (Sold Out)` : `${w.title} — £${w.price}`;
    const disabledAttr = isSoldOut ? 'disabled' : '';
    
    return `<option value="${w.title}" data-price="${w.price}" data-date="${(w.eyebrow || '').split('·')[1]?.trim() || ''}" data-time="${w.time}" ${disabledAttr}>${label}</option>`;
  }).join("");

  // Add Private Ubhi Session fallback
  html += `<option value="Private Ubhi Session" data-price="custom" data-date="By arrangement" data-time="Custom duration">Private Ubhi Session &mdash; Quote</option>`;
  
  modalSelect.innerHTML = html;
}

// Share a single shop product — native share sheet, or copy-link fallback.
function shareProduct(title, slug) {
  const url = location.origin + location.pathname + "?p=" + encodeURIComponent(slug || "") + "#shop";
  const data = { title: "Ubhi — " + title, text: "Have a look at “" + title + "” from the Ubhi shop:", url: url };
  if (navigator.share) {
    navigator.share(data).catch(function () {});
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(function () { workshopShareToast("Product link copied ✓"); }).catch(function () { window.prompt("Copy this product link:", url); });
  } else {
    window.prompt("Copy this product link:", url);
  }
}

// If arrived via a shared product link (?p=<slug>), scroll to + highlight it once.
let _sharedProductHandled = false;
function highlightSharedProduct() {
  if (_sharedProductHandled) return;
  const p = new URLSearchParams(location.search).get("p");
  if (!p) return;
  const card = document.querySelector('.product-card[data-pslug="' + p.replace(/[^a-z0-9-]/gi, "") + '"]');
  if (!card) return;
  _sharedProductHandled = true;
  setTimeout(function () {
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.add("workshop-card-highlight");
    setTimeout(function () { card.classList.remove("workshop-card-highlight"); }, 2600);
  }, 350);
}

function renderShop() {
  const container = document.getElementById("shop-products-container");
  if (!container) return;
  const list = dbRead("shop-catalog", []);

  if (list.length === 0) {
    container.innerHTML = `<p style="padding:40px;text-align:center;color:var(--mist);grid-column: span 3;">No shop items cataloged yet.</p>`;
    return;
  }

  container.innerHTML = list.map((p, idx) => {
    const pslug = (p.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    let visualHtml = "";
    if (p.image && p.image !== "") {
      visualHtml = `<div class="product-image-wrap"><img src="${p.image}" alt="${p.name}" loading="lazy" /></div>`;
    } else {
      // Ink plates — confident, letterpress-style line art (the old whisper-faint
      // strokes made cards look blank). One ink + paper tint per theme, tint in CSS.
      const themeClass = p.vector || "lotus";
      const PLATES = {
        lotus: `<svg viewBox="0 0 200 200" fill="none" width="100%" height="100%" stroke-linecap="round" stroke-linejoin="round">
          <path d="M100 128 C 92 108, 92 84, 100 62 C 108 84, 108 108, 100 128 Z" stroke="#a34d5f" stroke-width="2.4"/>
          <path d="M100 128 C 82 118, 68 102, 62 80 C 84 84, 96 96, 100 128 Z" stroke="#a34d5f" stroke-width="2.2"/>
          <path d="M100 128 C 118 118, 132 102, 138 80 C 116 84, 104 96, 100 128 Z" stroke="#a34d5f" stroke-width="2.2"/>
          <path d="M100 128 C 74 126, 52 116, 40 98 C 66 96, 88 106, 100 128 Z" stroke="#b4596d" stroke-width="2"/>
          <path d="M100 128 C 126 126, 148 116, 160 98 C 134 96, 112 106, 100 128 Z" stroke="#b4596d" stroke-width="2"/>
          <path d="M52 140 Q 100 156 148 140" stroke="#8a6a3c" stroke-width="2"/>
          <path d="M62 150 Q 100 162 138 150" stroke="#8a6a3c" stroke-width="1.8"/>
          <circle cx="100" cy="52" r="4" fill="#a34d5f"/>
        </svg>`,
        yantra: `<svg viewBox="0 0 200 200" fill="none" width="100%" height="100%" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="100" cy="100" r="74" stroke="#a6741f" stroke-width="2.2"/>
          <polygon points="100,38 154,138 46,138" stroke="#a6741f" stroke-width="2.4"/>
          <polygon points="100,162 154,62 46,62" stroke="#a34d5f" stroke-width="2.2"/>
          <circle cx="100" cy="100" r="10" stroke="#a6741f" stroke-width="2.2"/>
          <circle cx="100" cy="100" r="3.4" fill="#a34d5f"/>
          <path d="M100 14 v12 M100 174 v12 M14 100 h12 M174 100 h12" stroke="#8a6a3c" stroke-width="2.2"/>
        </svg>`,
        concentric: `<svg viewBox="0 0 200 200" fill="none" width="100%" height="100%" stroke-linecap="round">
          <circle cx="100" cy="100" r="78" stroke="#2d6b60" stroke-width="2.4"/>
          <circle cx="100" cy="100" r="58" stroke="#2d6b60" stroke-width="2" stroke-dasharray="2 9"/>
          <circle cx="100" cy="100" r="40" stroke="#3c8577" stroke-width="2.2"/>
          <circle cx="100" cy="100" r="22" stroke="#2d6b60" stroke-width="2"/>
          <circle cx="100" cy="100" r="6" fill="#2d6b60"/>
          <path d="M100 10 v10 M100 180 v10 M10 100 h10 M180 100 h10 M35 35 l8 8 M157 157 l8 8 M165 35 l-8 8 M43 157 l-8 8" stroke="#8a6a3c" stroke-width="2"/>
        </svg>`,
        lines: `<svg viewBox="0 0 200 200" fill="none" width="100%" height="100%" stroke-linecap="round">
          <rect x="36" y="36" width="128" height="128" stroke="#3a496a" stroke-width="2.4"/>
          <path d="M36 68 h128 M36 100 h128 M36 132 h128" stroke="#3a496a" stroke-width="1.8"/>
          <path d="M68 36 v128 M100 36 v128 M132 36 v128" stroke="#54678f" stroke-width="1.8"/>
          <circle cx="100" cy="100" r="44" stroke="#a34d5f" stroke-width="2.2"/>
          <circle cx="100" cy="100" r="4" fill="#3a496a"/>
        </svg>`,
        default: `<svg viewBox="0 0 200 200" fill="none" width="100%" height="100%" stroke-linecap="round">
          <path d="M100 26 a74 74 0 1 0 0.5 0" stroke="#a6741f" stroke-width="2.6"/>
          <path d="M100 44 a56 56 0 1 1 -0.5 0" stroke="#8a6a3c" stroke-width="1.8" stroke-dasharray="1 8"/>
          <circle cx="100" cy="100" r="5" fill="#a6741f"/>
        </svg>`
      };
      const svgMarkup = PLATES[themeClass] || PLATES.default;
      visualHtml = `<div class="product-art ${themeClass}"><span class="plate-frame" aria-hidden="true"></span>${svgMarkup}</div>`;
    }

    // Stock indicators
    let stockBadge = "";
    const left = p.remainingStock || 0;
    if (left === 0) {
      stockBadge = `<span style="position:absolute;top:12px;right:12px;background:var(--aurora-rose);color:var(--dark-cosmos);padding:2px 8px;font-size:0.75rem;border-radius:10px;font-weight:600;z-index:2;">Sold Out</span>`;
    } else if (left <= 5) {
      stockBadge = `<span style="position:absolute;top:12px;right:12px;background:var(--aurora-gold);color:var(--dark-cosmos);padding:2px 8px;font-size:0.75rem;border-radius:10px;font-weight:600;z-index:2;">Only ${left} left!</span>`;
    }

    const buyButtonHtml = left <= 0 
      ? `<button type="button" class="button button-secondary" disabled>Out of stock</button>`
      : `<button type="button" class="button button-secondary" data-buy-product="${p.name}" data-price="${p.price}">Bring home</button>`;

    return `
      <article class="product-card reveal is-visible" data-pslug="${pslug}" style="position:relative;">
        <button class="workshop-share product-share" type="button" data-share="${esc(p.name)}" data-pslug="${pslug}" aria-label="Share this product" title="Share this product">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><line x1="8.3" y1="10.8" x2="15.7" y2="6.2"/><line x1="8.3" y1="13.2" x2="15.7" y2="17.8"/></svg>
        </button>
        ${stockBadge}
        ${visualHtml}
        <div class="product-body">
          <p class="eyebrow">${p.category}</p>
          <h3>${p.name}</h3>
          <p>${p.description}</p>
          <div class="product-footer">
            <strong>£${p.price}</strong>
            ${buyButtonHtml}
          </div>
        </div>
      </article>
    `;
  }).join("");

  // Re-bind click hijack listeners
  container.querySelectorAll("[data-buy-product]").forEach(btn => {
    const cloned = btn.cloneNode(true);
    btn.parentNode.replaceChild(cloned, btn);
    
    cloned.addEventListener("click", (e) => {
      e.preventDefault();
      const productName = cloned.getAttribute("data-buy-product");
      const productPrice = cloned.getAttribute("data-price");
      addToCart(productName, productPrice);
    });
  });

  // Share buttons on each product
  container.querySelectorAll("[data-share]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      shareProduct(btn.getAttribute("data-share"), btn.getAttribute("data-pslug"));
    });
  });

  // Refresh references for filtering
  shopProductCards = document.querySelectorAll("#page-shop .product-card");
  filterShopProducts();
  highlightSharedProduct();
}

function renderSnailMailArchive() {
  const container = document.getElementById("snail-photos-carousel-container");
  if (!container) return;
  const list = dbRead("snail-photos", []);

  if (list.length === 0) {
    container.innerHTML = `<p style="padding:40px;text-align:center;color:var(--mist);">No archive photos yet.</p>`;
    return;
  }

  const rotations = ["snail-rot-left-1", "snail-rot-right-1", "snail-rot-left-2", "snail-rot-right-2", "snail-rot-zero"];

  const makeTrackHTML = () => {
    return list.map((item, idx) => {
      const rotClass = rotations[idx % rotations.length];
      return `
        <div class="gallery-item snail-photo-card ${rotClass}">
          <img src="${esc(item.src)}" alt="${esc(item.caption)}" loading="lazy" />
          <div class="snail-photo-caption">${esc(item.caption)}</div>
        </div>
      `;
    }).join("");
  };

  container.innerHTML = `
    <div class="snail-photos-track">
      ${makeTrackHTML()}
    </div>
    <div class="snail-photos-track" aria-hidden="true">
      ${makeTrackHTML()}
    </div>
  `;
}

function renderSnailMailReviews() {
  const container = document.getElementById("snail-reviews-carousel-container");
  if (!container) return;
  const list = dbRead("snail-reviews", []);

  if (list.length === 0) {
    container.innerHTML = `<p style="padding:40px;text-align:center;color:var(--mist);">No testimonials yet.</p>`;
    return;
  }

  const rotations = ["snail-rot-right-1", "snail-rot-left-1", "snail-rot-right-2", "snail-rot-left-2", "snail-rot-zero"];

  const makeTrackHTML = () => {
    return list.map((item, idx) => {
      const rotClass = rotations[idx % rotations.length];
      return `
        <div class="snail-review-card ${rotClass}">
          <div class="snail-review-left">
            <p class="snail-review-text">"${esc(item.text)}"</p>
            <span class="snail-review-author">— ${esc(item.author)}</span>
          </div>
          <div class="snail-review-right">
            <div class="snail-review-stamp">${esc(item.stamp)}</div>
            <div class="snail-review-lines">
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  };

  container.innerHTML = `
    <div class="snail-reviews-track">
      ${makeTrackHTML()}
    </div>
    <div class="snail-reviews-track" aria-hidden="true">
      ${makeTrackHTML()}
    </div>
  `;
}

function renderJournal() {
  const container = document.getElementById("journal-posts-container");
  if (!container) return;
  const list = dbRead("journal-posts", []);

  if (list.length === 0) {
    container.innerHTML = `<p style="padding:40px;text-align:center;color:var(--mist);grid-column: span 6;">No journal entries posted yet.</p>`;
    return;
  }

  container.innerHTML = list.map((essay, idx) => {
    const color = journalCardColors[idx % journalCardColors.length];
    
    let artContent = '';
    if (essay.art && essay.art !== "") {
      artContent = essay.art;
    } else {
      artContent = `<svg viewBox="0 0 160 160" fill="none" width="110" height="110"><circle cx="80" cy="80" r="72" stroke="rgba(201,151,42,0.3)" stroke-width="0.6"/><circle cx="80" cy="80" r="10" stroke="rgba(201,151,42,0.5)" stroke-width="0.6"/></svg>`;
    }

    // Calc reading time
    let readingTime = 1;
    if (essay.body && !essay.body.includes("<img")) {
      const words = essay.body.replace(/<[^>]*>/g, "").split(/\s+/).length;
      readingTime = Math.ceil(words / 180) || 1;
    }

    const snippetText = (essay.body && essay.body.includes("<img")) 
      ? "Scan of handwritten journal entry page." 
      : (essay.body || "").replace(/<[^>]*>/g, "").substring(0, 100) + "...";

    return `
      <article class="journal-card reveal is-visible" data-journal-id="${idx}" style="--spine-color: ${color.val};">
        <div class="journal-card-art" style="background: radial-gradient(circle at center, ${color.bg}, #faf8f2 80%);">
          ${artContent}
        </div>
        <div class="journal-card-body">
          <div class="journal-card-meta">
            <span class="tag">${essay.tag || ""}</span> &middot; <span>${essay.date || ""}</span> &middot; <span style="opacity:0.65;">${readingTime} min read</span>
          </div>
          <h3 class="journal-card-title">${essay.title || ""}</h3>
          <p class="card-desc">${snippetText}</p>
          <span class="read-more-link">Read slowly &rarr;</span>
        </div>
      </article>
    `;
  }).join("");

  // Bind clicks to open modal reader
  container.querySelectorAll(".journal-card").forEach(card => {
    card.addEventListener("click", () => {
      const essayId = parseInt(card.getAttribute("data-journal-id"), 10);
      if (typeof openJournalModal === "function") {
        openJournalModal(essayId);
      }
    });
  });
}


// --- 4. Admin Portal Dashboard Renderers ---

function renderAdminGallery() {
  const listEl = document.getElementById("admin-gallery-items-list");
  if (!listEl) return;
  const items = dbRead("gallery-items", []);
  const q = adminGallerySearch.toLowerCase().trim();
  let rows = items.map((item, idx) => ({ item, idx }));
  if (q) rows = rows.filter(({ item }) => (item.alt || "").toLowerCase().includes(q));

  if (rows.length === 0) {
    listEl.innerHTML = `<p style="color:var(--mist);font-style:italic;padding:10px 2px;">${q ? 'No images match "' + adminGallerySearch + '".' : "No gallery images yet."}</p>`;
    return;
  }

  listEl.innerHTML = rows.map(({ item, idx }) => `
    <div class="admin-gallery-card">
      <img src="${item.src}" alt="${item.alt}" loading="lazy" />
      <div class="admin-gallery-card-info">${item.alt}</div>
      <div class="delete-overlay">
        <button type="button" class="admin-mini-btn" onclick="adminEditGalleryItem(${idx})">Edit</button>
        <button type="button" class="admin-action-btn-danger" onclick="deleteGalleryItem(${idx})">Delete</button>
      </div>
    </div>
  `).join("");
}

// ── ART PORTFOLIO ADMIN ──────────────────────────────────────────
// Each "piece" is one artwork with one or more photos. Visitors see the cover
// (first photo) in the gallery and can swipe the rest when they open it.
function getArtPieces() { return dbRead("art-pieces", []); }
function saveArtPieces(pieces) {
  dbWrite("art-pieces", pieces);
  renderArtAdmin();
  if (typeof renderArtPortfolio === "function") renderArtPortfolio();
}

function renderArtAdmin() {
  const listEl = document.getElementById("admin-artfolio-list");
  if (!listEl) return;
  const pieces = getArtPieces();
  if (!pieces.length) {
    listEl.innerHTML = `<p style="color:var(--mist);font-style:italic;padding:10px 2px;">No art pieces yet — add your first one above.</p>`;
    return;
  }
  listEl.innerHTML = pieces.map((piece, i) => {
    const imgs = Array.isArray(piece.images) ? piece.images : [];
    const thumbs = imgs.map((src, j) => `
      <div class="art-admin-thumb">
        <img src="${esc(src)}" alt="" loading="lazy" />
        ${j === 0 ? `<span class="art-admin-cover">Cover</span>` : ""}
        <button type="button" class="art-admin-thumb-del" title="Remove this photo" onclick="deleteArtImage(${i},${j})">✕</button>
      </div>
    `).join("");
    return `
      <div class="art-admin-piece">
        <div class="art-admin-piece-head">
          <input type="text" class="art-admin-title" value="${esc(piece.title || "")}" placeholder="Piece title" onchange="updateArtTitle(${i}, this.value)" />
          <span class="art-admin-count">${imgs.length} photo${imgs.length === 1 ? "" : "s"}</span>
          <button type="button" class="admin-action-btn-danger" onclick="deleteArtPiece(${i})">Delete piece</button>
        </div>
        <div class="art-admin-thumbs">
          ${thumbs}
          <label class="art-admin-add" title="Add a photo to this piece">
            <span>＋ Add photo</span>
            <input type="file" accept="image/*" onchange="addArtImageFromFile(${i}, this)" hidden />
          </label>
        </div>
        <p class="art-admin-hint">First photo is the cover. Drag isn't needed — delete &amp; re-add to reorder. Visitors swipe through these when they open the piece.</p>
      </div>
    `;
  }).join("");
}

function updateArtTitle(i, val) {
  const pieces = getArtPieces();
  if (!pieces[i]) return;
  pieces[i].title = val;
  saveArtPieces(pieces);
}
function deleteArtPiece(i) {
  const pieces = getArtPieces();
  if (!pieces[i]) return;
  if (!confirm('Delete the piece "' + (pieces[i].title || "Untitled") + '" and all its photos?')) return;
  pieces.splice(i, 1);
  saveArtPieces(pieces);
}
function deleteArtImage(i, j) {
  const pieces = getArtPieces();
  if (!pieces[i] || !Array.isArray(pieces[i].images)) return;
  if (pieces[i].images.length <= 1) { alert("A piece needs at least one photo — delete the whole piece instead."); return; }
  pieces[i].images.splice(j, 1);
  saveArtPieces(pieces);
}
async function addArtImageFromFile(i, input) {
  const pieces = getArtPieces();
  if (!pieces[i]) return;
  if (!input.files || !input.files[0]) return;
  try {
    const src = await hostImage(await fileToBase64(input.files[0]));
    if (!Array.isArray(pieces[i].images)) pieces[i].images = [];
    pieces[i].images.push(src);
    saveArtPieces(pieces);
  } catch (err) { console.error("Error reading file:", err); alert("Sorry — could not read that image file."); }
}

window.updateArtTitle = updateArtTitle;
window.deleteArtPiece = deleteArtPiece;
window.deleteArtImage = deleteArtImage;
window.addArtImageFromFile = addArtImageFromFile;

function renderAdminWorkshops() {
  const tableBody = document.getElementById("admin-workshops-table-body");
  if (!tableBody) return;
  const list = dbRead("workshops", []);
  const capacities = dbRead("workshops-capacities", {});
  const q = adminWorkshopsSearch.toLowerCase().trim();
  let rows = list.map((w, idx) => ({ w, idx }));
  if (q) rows = rows.filter(({ w }) =>
    (w.title || "").toLowerCase().includes(q) ||
    (w.eyebrow || "").toLowerCase().includes(q) ||
    (w.place || "").toLowerCase().includes(q));

  if (rows.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--mist);">${q ? 'No workshops match "' + adminWorkshopsSearch + '".' : "No workshops yet."}</td></tr>`;
    return;
  }

  tableBody.innerHTML = rows.map(({ w, idx }) => {
    const cap = capacities[w.title] || { total: w.capacity, booked: 0 };
    return `
      <tr>
        <td>
          <div class="admin-table-title">${w.title}</div>
          <div class="admin-table-sub">${w.eyebrow}</div>
        </td>
        <td>
          <div style="font-size:0.85rem;">Time: ${w.time}</div>
          <div style="font-size:0.85rem;color:var(--mist);">Place: ${w.place}</div>
        </td>
        <td style="color:var(--aurora-gold);">£${w.price}</td>
        <td>${cap.total - cap.booked} left (${cap.booked} / ${cap.total} booked)</td>
        <td style="white-space:nowrap;">
          <button type="button" class="admin-mini-btn" onclick="adminEditWorkshop(${idx})">Edit</button>
          <button type="button" class="admin-mini-btn" onclick="adminDuplicateWorkshop(${idx})">Duplicate</button>
          <button type="button" class="admin-action-btn-danger" onclick="deleteWorkshop(${idx})">Remove</button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderAdminShop() {
  const tableBody = document.getElementById("admin-shop-table-body");
  if (!tableBody) return;
  const list = dbRead("shop-catalog", []);
  const q = adminShopSearch.toLowerCase().trim();
  let rows = list.map((p, idx) => ({ p, idx }));
  if (q) rows = rows.filter(({ p }) =>
    (p.name || "").toLowerCase().includes(q) ||
    (p.category || "").toLowerCase().includes(q) ||
    (p.description || "").toLowerCase().includes(q));

  if (rows.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--mist);">${q ? 'No products match "' + adminShopSearch + '".' : "No products yet."}</td></tr>`;
    return;
  }

  tableBody.innerHTML = rows.map(({ p, idx }) => {
    const left = Number(p.remainingStock);
    const low = left <= 5;
    const badge = low ? ` <span class="admin-low-badge${left <= 0 ? " sold" : ""}">${left <= 0 ? "Sold out" : "Low"}</span>` : "";
    return `
    <tr${low ? ' class="is-low-stock"' : ""}>
      <td>
        <div class="admin-table-title">${p.name || ""}</div>
        <div class="admin-table-sub">${(p.description || "").substring(0, 45)}...</div>
      </td>
      <td>${p.category}</td>
      <td style="color:var(--aurora-gold);">£${p.price}</td>
      <td style="white-space:nowrap;">
        <button type="button" class="admin-mini-btn stock-step" onclick="adminStepStock(${idx}, -1)" aria-label="One fewer in stock">−</button>
        <strong style="display:inline-block;min-width:2.2ch;text-align:center;">${p.remainingStock}</strong>
        <button type="button" class="admin-mini-btn stock-step" onclick="adminStepStock(${idx}, 1)" aria-label="One more in stock">+</button>
        <span class="admin-table-sub"> / ${p.totalStock}</span>${badge}
      </td>
      <td style="white-space:nowrap;">
        <button type="button" class="admin-mini-btn" onclick="adminEditShopProduct(${idx})">Edit</button>
        <button type="button" class="admin-mini-btn" onclick="adminDuplicateProduct(${idx})">Duplicate</button>
        <button type="button" class="admin-action-btn-danger" onclick="deleteShopProduct(${idx})">Remove</button>
      </td>
    </tr>
  `;
  }).join("");
}

// ════════════════════════════════════════════════════════════════════════
// SNAIL MAIL DISPATCH — every subscriber is anchored to the 5th of the month.
// A "cycle" is one post day, keyed "YYYY-MM". A term (1/3/6/12 months) = that
// many letters on consecutive cycles. Paused subscribers are skipped and do NOT
// use up a letter. Each member keeps a `sentCycles` log so you always know who
// has received what.
// ════════════════════════════════════════════════════════════════════════
const SNAIL_DISPATCH_DAY = 5;
let snailDispatchCycle = null; // the post run currently shown (defaults to this month)

function snailCycleKey(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
function snailParseCycle(key) { const m = String(key || "").match(/(\d{4})-(\d{1,2})/); return m ? { y: +m[1], m: +m[2] } : null; }
function snailCycleLabel(key) {
  const c = snailParseCycle(key); if (!c) return key || "";
  return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][c.m - 1] + " " + c.y;
}
function snailAddCycles(key, n) {
  const c = snailParseCycle(key); if (!c) return key;
  const tot = c.y * 12 + (c.m - 1) + n;
  return Math.floor(tot / 12) + "-" + String((tot % 12) + 1).padStart(2, "0");
}
function snailNowCycle() { return snailCycleKey(new Date()); }
// First dispatch cycle for a join/start date — the 5th-of-the-month rule:
// join on the 1st–5th → this month; after the 5th → next month.
function snailStartCycleFor(dateStr) {
  let d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) d = new Date();
  let y = d.getFullYear(), m = d.getMonth();
  if (d.getDate() > SNAIL_DISPATCH_DAY) { m += 1; if (m > 11) { m = 0; y += 1; } }
  return y + "-" + String(m + 1).padStart(2, "0");
}
// Term length in letters (cycles), from termMonths or the plan label.
function snailTermMonths(m) {
  if ((m.isGift || m.giftOn) && Number(m.giftTermMonths)) return Number(m.giftTermMonths);
  if (Number(m.termMonths)) return Number(m.termMonths);
  const mt = String(m.plan || "").match(/(\d+)\s*month/i);
  return mt ? +mt[1] : 1;
}
// Back-fill startCycle + sentCycles onto a legacy member record. Gifts anchor to
// the gift's start date; everyone else to their subscribe date. Returns true if mutated.
function snailEnsureCycleFields(m) {
  let changed = false;
  if (!m.startCycle) {
    const seed = (m.isGift && m.giftStart) ? m.giftStart : m.dateSubscribed;
    m.startCycle = snailStartCycleFor(seed);
    changed = true;
  }
  if (!Array.isArray(m.sentCycles)) { m.sentCycles = []; changed = true; }
  return changed;
}
// EVERY Snail Mail plan now recurs — it auto-renews until the subscriber cancels.
// Monthly renews monthly; the 3/6/12 plans renew at the end of each block. So a
// subscriber receives a letter every month indefinitely; nothing ever "completes".
// (Gifts are the only fixed-length exception — a gift runs for its bought term.)
function snailIsRolling(m) {
  return !(m.isGift || m.giftOn);
}
// How often the plan renews (its billing block), for display.
function snailRenewLabel(m) {
  const t = snailTermMonths(m);
  if (t <= 1) return "monthly";
  if (t === 12) return "yearly";
  return "every " + t + " months";
}
function snailMemberProgress(m) {
  snailEnsureCycleFields(m);
  const rolling = snailIsRolling(m);
  const term = snailTermMonths(m);
  const sent = (m.sentCycles || []).length;
  return {
    rolling: rolling, term: term, sent: sent,
    remaining: rolling ? Infinity : Math.max(0, term - sent),
    complete: rolling ? false : (sent >= term),
    startCycle: m.startCycle
  };
}
// Due a letter in `cycle`? Active, started, not complete, not already sent.
function snailDueInCycle(m, cycle) {
  if (m.status !== "Active") return false;          // paused/inactive/completed → skip
  const p = snailMemberProgress(m);
  if (p.complete) return false;
  if (m.startCycle > cycle) return false;           // YYYY-MM strings sort correctly
  return (m.sentCycles || []).indexOf(cycle) === -1;
}
// The next cycle an active member will receive a letter (null if complete/paused).
function snailNextDue(m) {
  const p = snailMemberProgress(m);
  if (p.complete || m.status !== "Active") return null;
  let c = snailNowCycle();
  if (m.startCycle > c) c = m.startCycle;
  let guard = 0;
  while ((m.sentCycles || []).indexOf(c) !== -1 && guard++ < 240) c = snailAddCycles(c, 1);
  return c;
}
function snailProgressLabel(m) {
  const p = snailMemberProgress(m);
  if (p.complete) return "✓ gift complete (" + p.sent + "/" + p.term + ")";
  if (m.status !== "Active") return "cancelled · " + p.sent + " sent";
  if (p.rolling) return p.sent + " sent · renews " + snailRenewLabel(m) + " · next " + snailCycleLabel(snailNextDue(m));
  return "gift " + p.sent + "/" + p.term + " sent · next " + snailCycleLabel(snailNextDue(m));
}
// Stamp a letter as sent for a member in a cycle; auto-complete when the term is met.
function snailMarkSent(email, cycle) {
  const members = dbRead("snail-members", []);
  const m = members.find(x => String(x.email || "").toLowerCase() === String(email).toLowerCase());
  if (!m) return;
  snailEnsureCycleFields(m);
  if (m.sentCycles.indexOf(cycle) === -1) m.sentCycles.push(cycle);
  if (!snailIsRolling(m) && m.sentCycles.length >= snailTermMonths(m)) { m.status = "Completed"; m.completedAt = cycle; }
  dbWrite("snail-members", members);
  renderAdminSnailMail();
}
function snailUnmarkSent(email, cycle) {
  const members = dbRead("snail-members", []);
  const m = members.find(x => String(x.email || "").toLowerCase() === String(email).toLowerCase());
  if (!m) return;
  snailEnsureCycleFields(m);
  m.sentCycles = m.sentCycles.filter(c => c !== cycle);
  if (m.status === "Completed" && m.sentCycles.length < snailTermMonths(m)) { m.status = "Active"; delete m.completedAt; }
  dbWrite("snail-members", members);
  renderAdminSnailMail();
}
function snailMarkAllSent(cycle) {
  const members = dbRead("snail-members", []);
  let n = 0;
  members.forEach(m => {
    if (snailDueInCycle(m, cycle)) {
      snailEnsureCycleFields(m);
      m.sentCycles.push(cycle);
      if (!snailIsRolling(m) && m.sentCycles.length >= snailTermMonths(m)) { m.status = "Completed"; m.completedAt = cycle; }
      n++;
    }
  });
  if (n) dbWrite("snail-members", members);
  renderAdminSnailMail();
}
function snailShiftDispatchCycle(delta) {
  if (!snailDispatchCycle) snailDispatchCycle = snailNowCycle();
  snailDispatchCycle = snailAddCycles(snailDispatchCycle, delta);
  snailDispatchPage = 1;
  renderAdminSnailMail();
}
window.snailMarkSent = snailMarkSent;
window.snailUnmarkSent = snailUnmarkSent;
window.snailMarkAllSent = snailMarkAllSent;
window.snailShiftDispatchCycle = snailShiftDispatchCycle;

// ── Post-run console state + actions (scales to thousands of letters) ──────
let snailDispatchPage = 1;
let snailDispatchPageSize = 50;
let snailDispatchSearch = "";

// Everyone who should receive a letter in `cycle`: active, started, and either
// still owed a letter or already ticked this cycle. Paused/cancelled and finished
// gifts drop off.
function snailRunRoster(members, cycle) {
  return members.filter(function (m) {
    if (m.status !== "Active") return false;
    snailEnsureCycleFields(m);
    if (m.startCycle > cycle) return false;
    var p = snailMemberProgress(m);
    if (p.complete && (m.sentCycles || []).indexOf(cycle) === -1) return false;
    return true;
  });
}
function renderSnailDispatchOnly() { renderSnailDispatch(dbRead("snail-members", [])); }
function snailDispatchSetPage(n) { snailDispatchPage = Math.max(1, n); renderSnailDispatchOnly(); }
function snailDispatchSetPageSize(v) { snailDispatchPageSize = parseInt(v, 10) || 50; snailDispatchPage = 1; renderSnailDispatchOnly(); }
function snailDispatchSetSearch(v) {
  snailDispatchSearch = v; snailDispatchPage = 1; renderSnailDispatchOnly();
  var inp = document.getElementById("snail-dispatch-search");
  if (inp) { inp.focus(); var val = inp.value; inp.value = ""; inp.value = val; } // keep cursor at end
}
// Update the live counter/progress bar WITHOUT a full re-render, so ticking
// through a long list never jumps your scroll position.
function snailUpdateRunCounter(cycle) {
  var roster = snailRunRoster(dbRead("snail-members", []), cycle);
  var total = roster.length;
  var sent = roster.filter(function (m) { return (m.sentCycles || []).indexOf(cycle) !== -1; }).length;
  var cEl = document.getElementById("snail-run-counter");
  if (cEl) cEl.innerHTML = '<strong style="color:var(--gold);">' + sent + "</strong> of " + total + " packed";
  var rEl = document.getElementById("snail-run-remaining");
  if (rEl) rEl.textContent = (total - sent) + " left to send";
  var bar = document.getElementById("snail-run-bar");
  if (bar) bar.style.width = (total ? Math.round(sent / total * 100) : 0) + "%";
}
// Tick / untick a single letter in place (no full re-render).
function snailToggleCycle(cb, email, cycle) {
  var members = dbRead("snail-members", []);
  var m = members.find(function (x) { return String(x.email || "").toLowerCase() === String(email).toLowerCase(); });
  if (!m) return;
  snailEnsureCycleFields(m);
  if (cb.checked) { if (m.sentCycles.indexOf(cycle) === -1) m.sentCycles.push(cycle); }
  else { m.sentCycles = m.sentCycles.filter(function (c) { return c !== cycle; }); }
  dbWrite("snail-members", members);
  var row = cb.closest && cb.closest("tr"); if (row) row.classList.toggle("is-sent", cb.checked);
  snailUpdateRunCounter(cycle);
}
function snailUnmarkAll(cycle) {
  var members = dbRead("snail-members", []);
  var changed = false;
  members.forEach(function (m) {
    if ((m.sentCycles || []).indexOf(cycle) !== -1) {
      m.sentCycles = m.sentCycles.filter(function (c) { return c !== cycle; });
      if (m.status === "Completed") { m.status = "Active"; delete m.completedAt; }
      changed = true;
    }
  });
  if (changed) dbWrite("snail-members", members);
  renderAdminSnailMail();
}
// Export the run as CSV — for printing address labels / handing to a fulfilment house.
function snailExportRun(cycle) {
  var roster = snailRunRoster(dbRead("snail-members", []), cycle);
  var lines = [["Name", "Email", "Contact", "Plan", "Letter", "Address", "Status"]];
  roster.forEach(function (m) {
    var p = snailMemberProgress(m);
    var sent = (m.sentCycles || []).indexOf(cycle) !== -1;
    lines.push([m.name || "", m.email || "", m.contact || "", m.plan || "", "letter " + (sent ? p.sent : p.sent + 1), m.address || "", sent ? "sent" : "to send"]);
  });
  var csv = lines.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n");
  var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a"); a.href = url; a.download = "ubhi-post-run-" + cycle + ".csv";
  document.body.appendChild(a); a.click();
  setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 500);
}
window.snailDispatchSetPage = snailDispatchSetPage;
window.snailDispatchSetPageSize = snailDispatchSetPageSize;
window.snailDispatchSetSearch = snailDispatchSetSearch;
window.snailToggleCycle = snailToggleCycle;
window.snailUnmarkAll = snailUnmarkAll;
window.snailExportRun = snailExportRun;

// Render the "This month's post run" panel into #admin-snail-dispatch.
function renderSnailDispatch(members) {
  const el = document.getElementById("admin-snail-dispatch");
  if (!el) return;
  if (!snailDispatchCycle) snailDispatchCycle = snailNowCycle();
  const cycle = snailDispatchCycle;

  // Whole roster for this cycle (to-send + already-sent), to-send first.
  const roster = snailRunRoster(members, cycle).slice().sort((a, b) => {
    const sa = (a.sentCycles || []).indexOf(cycle) !== -1 ? 1 : 0;
    const sb = (b.sentCycles || []).indexOf(cycle) !== -1 ? 1 : 0;
    if (sa !== sb) return sa - sb;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
  const total = roster.length;
  const sentCount = roster.filter(m => (m.sentCycles || []).indexOf(cycle) !== -1).length;
  const toSend = total - sentCount;

  // Search + paginate so thousands of letters stay manageable.
  const q = (snailDispatchSearch || "").toLowerCase().trim();
  const filtered = q ? roster.filter(m =>
    (m.name || "").toLowerCase().includes(q) || (m.email || "").toLowerCase().includes(q) ||
    (m.address || "").toLowerCase().includes(q) || (m.plan || "").toLowerCase().includes(q)) : roster;
  const pageSize = snailDispatchPageSize;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (snailDispatchPage > totalPages) snailDispatchPage = totalPages;
  if (snailDispatchPage < 1) snailDispatchPage = 1;
  const page = snailDispatchPage;
  const startIdx = (page - 1) * pageSize;
  const pageItems = filtered.slice(startIdx, startIdx + pageSize);
  const fromN = filtered.length ? startIdx + 1 : 0;
  const toN = Math.min(startIdx + pageSize, filtered.length);

  const rows = pageItems.map(m => {
    const p = snailMemberProgress(m);
    const sent = (m.sentCycles || []).indexOf(cycle) !== -1;
    const num = sent ? p.sent : p.sent + 1;
    return `<tr class="snail-run-row${sent ? " is-sent" : ""}">
      <td style="text-align:center;width:28px;"><input type="checkbox" class="snail-run-check"${sent ? " checked" : ""} onchange="snailToggleCycle(this,'${m.email}','${cycle}')"></td>
      <td style="white-space:nowrap;"><span class="srun-name" style="color:var(--gold);">${esc(m.name)}</span>${m.isGift ? " 🎁" : ""} <span style="font-size:0.68rem;color:var(--mist);">· ${esc(m.plan || "")}</span></td>
      <td style="font-size:0.72rem;color:var(--aurora-teal);white-space:nowrap;">letter ${num}${p.rolling ? "" : " / " + p.term}</td>
      <td style="font-size:0.72rem;color:var(--mist);max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(m.address || "—")}</td>
    </tr>`;
  }).join("");

  el.innerHTML = `
    <style>
      #admin-snail-dispatch .srun-tbl{width:100%;border-collapse:collapse;}
      #admin-snail-dispatch .srun-tbl thead th{padding:4px 8px;font-size:0.64rem;color:var(--mist);text-transform:uppercase;letter-spacing:0.05em;text-align:left;border-bottom:1px solid var(--border-color);}
      #admin-snail-dispatch .snail-run-row td{padding:3px 8px;border-bottom:1px solid rgba(255,255,255,0.05);vertical-align:middle;font-size:0.78rem;line-height:1.25;}
      #admin-snail-dispatch .snail-run-row.is-sent{opacity:0.45;}
      #admin-snail-dispatch .snail-run-row.is-sent .srun-name{text-decoration:line-through;}
      #admin-snail-dispatch .snail-run-check{width:16px!important;height:16px!important;min-height:0!important;min-width:0!important;padding:0!important;margin:0!important;box-shadow:none!important;border-radius:3px!important;cursor:pointer;accent-color:#a14e5e;flex:none;}
      #admin-snail-dispatch .srun-prog{height:6px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;}
      #admin-snail-dispatch .srun-prog > i{display:block;height:100%;background:#a14e5e;transition:width .2s;}
    </style>
    <div style="background:rgba(201,151,42,0.06);border:1px solid var(--border-color);border-radius:10px;padding:16px 20px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
        <div>
          <div style="font-family:var(--font-header);color:var(--gold);font-size:1.1rem;">📮 This month's post run</div>
          <div style="font-size:0.82rem;color:var(--mist);margin-top:2px;"><span id="snail-run-counter"><strong style="color:var(--gold);">${sentCount}</strong> of ${total} packed</span> · <span id="snail-run-remaining">${toSend} left to send</span></div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <button type="button" class="admin-pagination-btn" onclick="snailShiftDispatchCycle(-1)">‹ Prev</button>
          <span style="min-width:104px;text-align:center;color:var(--gold);font-weight:600;">${snailCycleLabel(cycle)}</span>
          <button type="button" class="admin-pagination-btn" onclick="snailShiftDispatchCycle(1)">Next ›</button>
        </div>
      </div>
      ${total ? `
        <div class="srun-prog" style="margin-top:12px;"><i id="snail-run-bar" style="width:${Math.round(sentCount / total * 100)}%;"></i></div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:14px;">
          <input id="snail-dispatch-search" type="text" value="${esc(snailDispatchSearch)}" oninput="snailDispatchSetSearch(this.value)" placeholder="Search this run — name, address…" style="flex:1;min-width:200px;padding:8px 12px;background:rgba(255,255,255,0.05);border:1px solid var(--border-color);border-radius:4px;color:var(--gold);font-size:0.85rem;">
          <select onchange="snailDispatchSetPageSize(this.value)" style="padding:7px 8px;background:rgba(0,0,0,0.3);border:1px solid var(--border-color);color:var(--gold);border-radius:4px;cursor:pointer;">
            ${[25, 50, 100, 200].map(s => `<option value="${s}"${s === pageSize ? " selected" : ""}>${s} / page</option>`).join("")}
          </select>
          <button type="button" class="admin-pagination-btn" onclick="snailExportRun('${cycle}')">⤓ Export CSV</button>
        </div>
        <table class="srun-tbl" style="margin-top:12px;">
          <thead><tr><th style="width:34px;">✓</th><th>Subscriber</th><th>Letter</th><th>Address</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:12px;">
          <div style="font-size:0.78rem;color:var(--mist);">Showing ${fromN}–${toN} of ${filtered.length}${filtered.length !== total ? ` (filtered from ${total})` : ""}</div>
          <div style="display:flex;align-items:center;gap:6px;">
            <button type="button" class="admin-pagination-btn"${page === 1 ? " disabled" : ""} onclick="snailDispatchSetPage(1)">« First</button>
            <button type="button" class="admin-pagination-btn"${page === 1 ? " disabled" : ""} onclick="snailDispatchSetPage(${page - 1})">‹</button>
            <span style="color:var(--gold);font-size:0.82rem;min-width:96px;text-align:center;">Page ${page} / ${totalPages}</span>
            <button type="button" class="admin-pagination-btn"${page === totalPages ? " disabled" : ""} onclick="snailDispatchSetPage(${page + 1})">›</button>
            <button type="button" class="admin-pagination-btn"${page === totalPages ? " disabled" : ""} onclick="snailDispatchSetPage(${totalPages})">Last »</button>
          </div>
        </div>
        <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;border-top:1px solid var(--border-color);padding-top:14px;">
          <button type="button" class="button button-primary"${toSend ? "" : " disabled"} onclick="if(confirm('Mark all ${toSend} unsent letters in ${snailCycleLabel(cycle)} as sent?'))snailMarkAllSent('${cycle}')">Mark all ${toSend} sent ✓</button>
          <button type="button" class="admin-pagination-btn"${sentCount ? "" : " disabled"} onclick="if(confirm('Clear every sent tick for ${snailCycleLabel(cycle)}?'))snailUnmarkAll('${cycle}')">Undo all</button>
        </div>` :
        `<div style="margin-top:14px;color:var(--mist);font-size:0.9rem;">Nothing to post for ${snailCycleLabel(cycle)} — you're all caught up. 🎉</div>`}
    </div>`;
}

function renderAdminSnailMail() {
  const members = dbRead("snail-members", []);
  // Back-fill cycle fields once so dispatch + progress are accurate for legacy records.
  let _cycleChanged = false;
  members.forEach(m => { if (snailEnsureCycleFields(m)) _cycleChanged = true; });
  if (_cycleChanged) dbWrite("snail-members", members);
  renderSnailDispatch(members);

  // Update Stats Panel
  const totalCountEl = document.getElementById("admin-snail-total-count");
  const activeCountEl = document.getElementById("admin-snail-active-count");
  const inactiveCountEl = document.getElementById("admin-snail-inactive-count");

  const totalCount = members.length;
  const activeCount = members.filter(m => m.status === "Active").length;
  const inactiveCount = members.filter(m => m.status === "Inactive").length;

  if (totalCountEl) totalCountEl.textContent = totalCount;
  if (activeCountEl) activeCountEl.textContent = activeCount;
  if (inactiveCountEl) inactiveCountEl.textContent = inactiveCount;

  // Filter members
  const searchLower = snailMembersSearch.toLowerCase().trim();
  let filtered = members;
  if (searchLower) {
    filtered = members.filter(m => 
      (m.name || "").toLowerCase().includes(searchLower) ||
      (m.email || "").toLowerCase().includes(searchLower) ||
      (m.contact || "").toLowerCase().includes(searchLower) ||
      (m.address || "").toLowerCase().includes(searchLower) ||
      (m.plan || "").toLowerCase().includes(searchLower)
    );
  }

  // Sort members
  filtered.sort((a, b) => {
    let valA = a[snailMembersSortColumn] || "";
    let valB = b[snailMembersSortColumn] || "";
    
    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();
    
    if (valA < valB) return snailMembersSortOrder === "asc" ? -1 : 1;
    if (valA > valB) return snailMembersSortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Paginate members
  const pageSize = parseInt(snailMembersPageSize, 10);
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  if (snailMembersPage > totalPages) snailMembersPage = totalPages;
  if (snailMembersPage < 1) snailMembersPage = 1;

  const startIdx = (snailMembersPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pageItems = filtered.slice(startIdx, endIdx);

  // Render Table Body
  const tableBody = document.getElementById("admin-snail-members-table-body");
  if (tableBody) {
    if (pageItems.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:30px;color:var(--mist);">No subscribers match this criteria.</td></tr>`;
    } else {
      tableBody.innerHTML = pageItems.map((m) => `
        <tr>
          <td class="admin-table-title">${esc(m.name)}${m.isGift ? ' <span style="display:inline-block;font-size:0.64rem;font-weight:600;letter-spacing:0.04em;background:rgba(168,68,47,0.16);color:var(--aurora-rose,#a8442f);padding:2px 7px;border-radius:20px;margin-left:6px;vertical-align:middle;">🎁 GIFT</span>' : ''}${m.isGift ? `<div style="font-size:0.74rem;color:var(--mist);font-weight:400;margin-top:4px;line-height:1.4;">For ${esc(m.giftFor || "—")}${m.giftStart ? ` · starts ${esc(m.giftStart)}` : ""}${m.giftMessage ? `<br>“${esc(m.giftMessage)}”` : ""}</div>` : ""}</td>
          <td>${esc(m.email)}</td>
          <td style="color:var(--aurora-gold);font-family:monospace;">${esc(m.contact || "—")}</td>
          <td>${esc(m.plan)}<div style="font-size:0.72rem;color:var(--mist);margin-top:3px;">${snailProgressLabel(m)}</div></td>
          <td>${esc(m.billing)}</td>
          <td style="max-width: 250px; font-size:0.82rem; white-space: normal; line-height: 1.4;">${esc(m.address)}</td>
          <td>${esc(m.dateSubscribed)}</td>
          <td>
            <label class="admin-checkbox-switch">
              <input type="checkbox" ${m.status === 'Active' ? 'checked' : ''} onchange="toggleMemberStatus('${m.email}')">
              <span class="switch-slider"></span>
              <span style="margin-left:8px;" class="status-badge ${m.status === 'Active' ? 'active' : 'inactive'}">${m.status}</span>${(m.autoExpired && m.status !== 'Active') ? '<span title="Fixed-term subscription has ended" style="margin-left:6px;font-size:0.7rem;color:var(--mist);font-style:italic;">· lapsed</span>' : ''}${snailGiftEndNote(m)}
            </label>
          </td>
          <td style="text-align:center;white-space:nowrap;">
            <button type="button" class="admin-mini-btn" style="padding:4px 8px;font-size:0.72rem;" onclick="adminEditSnailMemberByEmail('${m.email}')">Edit</button>
            <button type="button" class="admin-action-btn-danger" style="padding:4px 8px;font-size:0.75rem;" onclick="deleteSnailMember('${m.email}')">Delete</button>
          </td>
        </tr>
      `).join("");
    }
  }

  // Render Info Text
  const infoEl = document.getElementById("admin-snail-pagination-info");
  if (infoEl) {
    const from = filtered.length ? startIdx + 1 : 0;
    const to = Math.min(endIdx, filtered.length);
    let infoText = `Showing ${from} to ${to} of ${filtered.length} entries`;
    if (filtered.length !== totalCount) {
      infoText += ` (filtered from ${totalCount} total entries)`;
    }
    infoEl.textContent = infoText;
  }

  // Render Pagination Buttons
  const paginationControls = document.getElementById("admin-snail-pagination-controls");
  if (paginationControls) {
    let html = "";
    
    // First & Prev
    html += `<button type="button" class="admin-pagination-btn" ${snailMembersPage === 1 ? 'disabled' : ''} onclick="changeSnailPage(1)">« First</button>`;
    html += `<button type="button" class="admin-pagination-btn" ${snailMembersPage === 1 ? 'disabled' : ''} onclick="changeSnailPage(${snailMembersPage - 1})">‹ Prev</button>`;

    // Page numbers with ellipses
    const maxVisiblePages = 5;
    let startPage = Math.max(1, snailMembersPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      html += `<button type="button" class="admin-pagination-btn" onclick="changeSnailPage(1)">1</button>`;
      if (startPage > 2) {
        html += `<span style="color:var(--mist);padding:0 4px;">...</span>`;
      }
    }

    for (let p = startPage; p <= endPage; p++) {
      html += `<button type="button" class="admin-pagination-btn ${p === snailMembersPage ? 'is-active' : ''}" onclick="changeSnailPage(${p})">${p}</button>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        html += `<span style="color:var(--mist);padding:0 4px;">...</span>`;
      }
      html += `<button type="button" class="admin-pagination-btn" onclick="changeSnailPage(${totalPages})">${totalPages}</button>`;
    }

    // Next & Last
    html += `<button type="button" class="admin-pagination-btn" ${snailMembersPage === totalPages ? 'disabled' : ''} onclick="changeSnailPage(${snailMembersPage + 1})">Next ›</button>`;
    html += `<button type="button" class="admin-pagination-btn" ${snailMembersPage === totalPages ? 'disabled' : ''} onclick="changeSnailPage(${totalPages})">Last »</button>`;

    paginationControls.innerHTML = html;
  }

  // Update table header icons
  const columns = ["name", "email", "contact", "plan", "dateSubscribed", "status"];
  columns.forEach(col => {
    const iconEl = document.getElementById(`sort-${col}-icon`);
    const thEl = document.querySelector(`.sortable[data-sort="${col}"]`);
    if (iconEl && thEl) {
      if (snailMembersSortColumn === col) {
        iconEl.textContent = snailMembersSortOrder === "asc" ? "▲" : "▼";
        thEl.parentElement.querySelectorAll("th").forEach(th => th.className = th.className.replace(/\bsort-(asc|desc)\b/g, ""));
        thEl.classList.add(snailMembersSortOrder === "asc" ? "sort-asc" : "sort-desc");
      } else {
        iconEl.textContent = "↕";
        thEl.classList.remove("sort-asc", "sort-desc");
      }
    }
  });

  // 2. Snail Photos Archive
  const photosEl = document.getElementById("admin-snail-photos-list");
  if (photosEl) {
    const photos = dbRead("snail-photos", []);
    photosEl.innerHTML = photos.map((p, idx) => `
      <div class="admin-slider-card">
        <img class="admin-slider-card-img" src="${esc(p.src)}" alt="${esc(p.caption)}" />
        <div class="admin-slider-card-meta">${esc(p.caption)}${p.month ? ` <span style="color:var(--aurora-gold);font-size:0.72rem;">· ${esc(p.month)}</span>` : ""}</div>
        <div class="admin-slider-card-actions">
          <button type="button" class="admin-action-btn-danger" onclick="deleteSnailPhoto(${idx})">Delete</button>
        </div>
      </div>
    `).join("");
  }

  // 3. Snail Reviews list
  const reviewsEl = document.getElementById("admin-snail-reviews-list");
  if (reviewsEl) {
    const reviews = dbRead("snail-reviews", []);
    reviewsEl.innerHTML = reviews.map((r, idx) => `
      <div class="admin-slider-card">
        <p class="admin-slider-card-quote">"${r.text}"</p>
        <div class="admin-slider-card-meta" style="margin-top:auto;">Author: ${r.author} &middot; Stamp: ${r.stamp}</div>
        <div class="admin-slider-card-actions" style="margin-top:8px;">
          <button type="button" class="admin-action-btn-danger" onclick="deleteSnailReview(${idx})">Delete</button>
        </div>
      </div>
    `).join("");
  }
}

function renderAdminJournal() {
  const tableBody = document.getElementById("admin-journal-table-body");
  if (!tableBody) return;
  const list = dbRead("journal-posts", []);
  const q = adminJournalSearch.toLowerCase().trim();
  let rows = list.map((essay, idx) => ({ essay, idx }));
  if (q) rows = rows.filter(({ essay }) =>
    (essay.title || "").toLowerCase().includes(q) ||
    (essay.tag || "").toLowerCase().includes(q));

  if (rows.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--mist);">${q ? 'No posts match "' + adminJournalSearch + '".' : "No journal posts yet."}</td></tr>`;
    return;
  }

  tableBody.innerHTML = rows.map(({ essay, idx }) => {
    const isImageOnly = essay.body && essay.body.includes("<img");
    const typeLabel = isImageOnly ? "Image Upload" : "Written Essay";
    return `
      <tr>
        <td>
          <div class="admin-table-title">${essay.title}</div>
        </td>
        <td>${essay.tag}</td>
        <td>${essay.date}</td>
        <td>${typeLabel}</td>
        <td style="white-space:nowrap;">
          <button type="button" class="admin-mini-btn" onclick="adminEditJournalPost(${idx})">Edit</button>
          <button type="button" class="admin-action-btn-danger" onclick="deleteJournalPost(${idx})">Delete</button>
        </td>
      </tr>
    `;
  }).join("");
}

/* ───────── Large-list helpers (Orders & Bookings) ───────── */
function orderStatusKey(o) {
  const s = String(o.status || "Preparing with care");
  if (/^shipped/i.test(s)) return "shipped";
  if (/^delivered/i.test(s)) return "delivered";
  if (/^cancel/i.test(s)) return "cancelled";
  return "preparing";
}
function orderRowId(o) { return String(o.reservedAt || o.date || o.orderedAt || ""); }
// Orders have stored their line items under BOTH names over time ("items" at
// checkout, "itemsList" in older admin code) — read whichever is present.
function orderItems(o) {
  if (o && Array.isArray(o.itemsList) && o.itemsList.length) return o.itemsList;
  if (o && Array.isArray(o.items) && o.items.length) return o.items;
  return [];
}

// ── Stock is REAL: checkout takes pieces off the shelf, deleting an order
//    puts them back (never below 0, never above the edition's total). ──
function adjustStockFor(order, direction) {
  try {
    const cat = dbRead("shop-catalog", []);
    let touched = false;
    orderItems(order).forEach((it) => {
      const prod = cat.find(p => p.name === it.name);
      if (!prod || prod.remainingStock == null) return;
      const qty = (Number(it.quantity) || 1) * direction;
      let next = Number(prod.remainingStock) - qty;
      if (next < 0) next = 0;
      const cap = Number(prod.totalStock);
      if (direction < 0 && !isNaN(cap) && cap > 0 && next > cap) next = cap;  // restoring: don't exceed the edition
      prod.remainingStock = next;
      touched = true;
    });
    if (touched) {
      dbWrite("shop-catalog", cat);
      if (typeof renderShop === "function") renderShop();
      if (typeof renderAdminShop === "function") renderAdminShop();
    }
  } catch (e) { /* stock bookkeeping must never break an order */ }
}

// ── Seats are REAL too: deleting a booking hands its places back. ──
function releaseWorkshopSeats(b) {
  try {
    const caps = dbRead("workshops-capacities", {});
    const key = b && b.workshop;
    if (key && caps[key]) {
      caps[key].booked = Math.max(0, Number(caps[key].booked || 0) - (Number(b.tickets) || 1));
      dbWrite("workshops-capacities", caps);
      if (typeof renderWorkshops === "function") renderWorkshops();
      if (typeof renderAdminWorkshops === "function") renderAdminWorkshops();
    }
  } catch (e) {}
}
function orderTotalNum(o) { return parseFloat(o.totalPrice || o.price || 0) || 0; }
function orderDateNum(o) { return new Date(o.reservedAt || o.date || o.orderedAt || 0).getTime() || 0; }
function bookingDateNum(b) { return new Date(b.reservedAt || 0).getTime() || 0; }

// Best-effort parse of a session label like "Sunday 6 September · 11:00–14:30"
// into a Date (end of that day). Yearless dates assume this year; if that
// lands more than ~6 weeks in the past, the session is taken to be next year
// (sessions are booked ahead, not months after they happened). Returns null
// when nothing date-like is found.
function bookingSessionTime(b) {
  const s = String(b.date || b.session_date || "").trim();
  if (!s) return null;
  const m = s.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*(\d{4})?/i);
  if (!m) return null;
  const day = +m[1];
  const monthIdx = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(m[2].slice(0, 3).toLowerCase());
  if (monthIdx === -1 || !day || day > 31) return null;
  const now = new Date();
  const year = m[3] ? +m[3] : now.getFullYear();
  let dt = new Date(year, monthIdx, day, 23, 59, 59);
  if (!m[3] && dt < now && (now - dt) > 45 * 86400000) dt = new Date(year + 1, monthIdx, day, 23, 59, 59);
  return dt;
}
// Upcoming = session day hasn't passed. Unparseable dates stay visible (never
// silently hide a real reservation behind a filter).
function bookingIsUpcoming(b) {
  const t = bookingSessionTime(b);
  return t === null ? true : t >= new Date();
}

function buildPagerHtml(scope, total, start, shown, pages, page) {
  if (total === 0) return "";
  const from = start + 1, to = start + shown;
  let html = '<span class="pager-count">Showing <strong>' + from + '–' + to + '</strong> of <strong>' + total + '</strong></span>';
  if (pages > 1) {
    html += '<span class="pager-nav">' +
      '<button type="button" class="pager-btn" data-' + scope + 'page="prev"' + (page <= 1 ? " disabled" : "") + '>&lsaquo; Prev</button>' +
      '<span class="pager-page">Page ' + page + ' of ' + pages + '</span>' +
      '<button type="button" class="pager-btn" data-' + scope + 'page="next"' + (page >= pages ? " disabled" : "") + '>Next &rsaquo;</button>' +
      '</span>';
  }
  return html;
}

// Reflect the active sort on the clickable column headers (arrow + highlight).
function updateSortHeaders(attr, sortVal) {
  document.querySelectorAll("[" + attr + "]").forEach(th => {
    const f = th.getAttribute(attr);
    const isAsc = sortVal === f + "-asc";
    const isDesc = sortVal === f + "-desc";
    th.classList.toggle("is-sorted", isAsc || isDesc);
    let arrow = th.querySelector(".th-arrow");
    if (!arrow) { arrow = document.createElement("span"); arrow.className = "th-arrow"; th.appendChild(arrow); }
    arrow.textContent = isAsc ? " ▲" : isDesc ? " ▼" : "";
  });
}

// Decide the next sort value when a header is clicked (name defaults A→Z, others high/new→).
function nextSortValue(current, field) {
  const def = field === "name" ? "asc" : "desc";
  const other = def === "asc" ? "desc" : "asc";
  if (current === field + "-" + def) return field + "-" + other;
  if (current === field + "-" + other) return field + "-" + def;
  return field + "-" + def;
}

function renderAdminOrders() {
  renderAdminShopOrders();
  renderAdminWorkshopBookings();
}

function renderAdminShopOrders() {
  const tbody = document.getElementById("admin-shop-orders-table-body");
  if (!tbody) return;
  const controls = document.getElementById("admin-orders-controls");
  const pager = document.getElementById("admin-orders-pagination");
  const all = dbRead("shop-orders", []);
  const cntEl = document.getElementById("subtab-orders-count"); if (cntEl) cntEl.textContent = all.length;
  updateSortHeaders("data-osort", adminOrdersSort);

  if (all.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:24px;color:var(--mist);">No shop orders yet.</td></tr>`;
    if (controls) controls.innerHTML = "";
    if (pager) pager.innerHTML = "";
    updateOrdersBulkBar();
    return;
  }

  // search
  const q = adminOrdersSearch.toLowerCase().trim();
  let rows = all;
  if (q) {
    rows = all.filter(o => {
      const nameVal = o.customerName || o.name || "";
      const emailVal = o.customerEmail || o.email || "";
      const phoneVal = o.phone || o.mobile || o.customerMobile || "";
      const addr = o.shippingAddress || o.address;
      const streetVal = addr?.street || "";
      const cityVal = addr?.city || "";
      return (
        nameVal.toLowerCase().includes(q) ||
        emailVal.toLowerCase().includes(q) ||
        phoneVal.toLowerCase().includes(q) ||
        (o.status || "").toLowerCase().includes(q) ||
        (o.productName || "").toLowerCase().includes(q) ||
        streetVal.toLowerCase().includes(q) ||
        cityVal.toLowerCase().includes(q) ||
        orderItems(o).some(item => (item.name || "").toLowerCase().includes(q))
      );
    });
  }

  // status counts (from search-filtered set) + status filter
  const counts = { all: rows.length, preparing: 0, shipped: 0, delivered: 0, cancelled: 0 };
  rows.forEach(o => { counts[orderStatusKey(o)]++; });
  let filtered = adminOrdersStatus === "all" ? rows.slice() : rows.filter(o => orderStatusKey(o) === adminOrdersStatus);

  // sort
  filtered.sort((a, b) => {
    switch (adminOrdersSort) {
      case "date-asc": return orderDateNum(a) - orderDateNum(b);
      case "total-desc": return orderTotalNum(b) - orderTotalNum(a);
      case "total-asc": return orderTotalNum(a) - orderTotalNum(b);
      case "name-asc": return String(a.customerName || a.name || "").localeCompare(String(b.customerName || b.name || ""));
      case "name-desc": return String(b.customerName || b.name || "").localeCompare(String(a.customerName || a.name || ""));
      default: return orderDateNum(b) - orderDateNum(a);
    }
  });

  // paginate
  const total = filtered.length;
  const perPage = adminOrdersPerPage > 0 ? adminOrdersPerPage : (total || 1);
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (adminOrdersPage > pages) adminOrdersPage = pages;
  if (adminOrdersPage < 1) adminOrdersPage = 1;
  const startIdx = (adminOrdersPage - 1) * perPage;
  const pageRows = filtered.slice(startIdx, startIdx + perPage);
  adminOrdersPageIds = pageRows.map(orderRowId);

  // controls (chips + sort + per-page)
  if (controls) {
    const chip = (key, label) => '<button type="button" class="alc-chip' + (adminOrdersStatus === key ? " is-active" : "") + '" data-ostatus="' + key + '">' + label + ' <span class="alc-n">' + counts[key] + '</span></button>';
    const ppOpts = [25, 50, 100].map(n => '<option value="' + n + '"' + (adminOrdersPerPage === n ? " selected" : "") + '>' + n + '</option>').join("") + '<option value="0"' + (adminOrdersPerPage === 0 ? " selected" : "") + '>All</option>';
    controls.innerHTML =
      '<div class="alc-chips">' + chip("all", "All") + chip("preparing", "Preparing") + chip("shipped", "Shipped") + chip("delivered", "Delivered") + chip("cancelled", "Cancelled") + '</div>' +
      '<div class="alc-right"><label class="alc-field">Show <select id="orders-perpage">' + ppOpts + '</select></label></div>';
  }

  if (total === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:24px;color:var(--mist);">No orders match this filter.</td></tr>`;
  } else {
    tbody.innerHTML = pageRows.map(o => {
      const id = orderRowId(o);
      let dateStr = "—";
      try { if (o.reservedAt || o.date || o.orderedAt) dateStr = new Date(o.reservedAt || o.date || o.orderedAt).toISOString().split('T')[0]; } catch (e) {}
      let itemsStr = "—";
      const oItems = orderItems(o);
      if (oItems.length > 0) itemsStr = oItems.map(item => `${esc(item.name)} (x${esc(item.quantity || 1)})`).join(", ");
      else if (o.productName) itemsStr = `${esc(o.productName)} (x1)`;
      const addr = o.shippingAddress || o.address;
      const addressStr = addr ? `${esc(addr.street || "")}, ${esc(addr.city || "")}, ${esc(addr.postcode || "")}` : "Direct Booking";
      const statusLabel = o.status || "Preparing with care";
      const STATUS_OPTS = ["Preparing with care", "Shipped", "Delivered", "Cancelled"];
      const allStatuses = STATUS_OPTS.includes(statusLabel) ? STATUS_OPTS : [statusLabel].concat(STATUS_OPTS);
      const statusOptionsHtml = allStatuses.map(s => `<option value="${s}"${s === statusLabel ? " selected" : ""}>${s}</option>`).join("");
      const statusClass = statusLabel === "Shipped" ? "st-shipped" : statusLabel === "Delivered" ? "st-delivered" : statusLabel === "Cancelled" ? "st-cancelled" : "st-preparing";
      return `
        <tr>
          <td style="text-align:center;"><input type="checkbox" class="admin-row-check" data-order-id="${esc(id)}"${adminOrdersSelected.has(id) ? " checked" : ""} aria-label="Select order"></td>
          <td style="font-family:monospace;font-size:0.82rem;">${dateStr}</td>
          <td class="admin-table-title">${esc(o.customerName || o.name || "—")}</td>
          <td>${esc(o.customerEmail || o.email || "—")}</td>
          <td style="color:var(--aurora-gold);font-family:monospace;">${esc(o.phone || o.mobile || o.customerMobile || "—")}</td>
          <td style="font-size:0.82rem;max-width:200px;" title="${itemsStr}">${itemsStr}</td>
          <td style="color:var(--aurora-gold);">£${o.totalPrice || o.price || "0"}</td>
          <td style="max-width: 200px; font-size:0.8rem;" title="${addressStr}">${addressStr}</td>
          <td>
            <select class="admin-status-select ${statusClass}" onchange="setOrderStatus('${id}', this.value)" aria-label="Order status">
              ${statusOptionsHtml}
            </select>
          </td>
          <td style="text-align:center;white-space:nowrap;">
            <button type="button" class="admin-mini-btn" style="padding:4px 8px;font-size:0.72rem;" onclick="adminViewOrder('${esc(id)}')">View</button>
            <button type="button" class="admin-action-btn-danger" style="padding:4px 8px;font-size:0.75rem;" onclick="deleteOrder('${id}')">Delete</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  if (pager) pager.innerHTML = buildPagerHtml("o", total, startIdx, pageRows.length, pages, adminOrdersPage);
  const selAll = document.getElementById("orders-select-all");
  if (selAll) selAll.checked = pageRows.length > 0 && adminOrdersPageIds.every(id => adminOrdersSelected.has(id));
  updateOrdersBulkBar();
}

function renderAdminWorkshopBookings() {
  const tbody = document.getElementById("admin-workshop-bookings-table-body");
  if (!tbody) return;
  const controls = document.getElementById("admin-bookings-controls");
  const pager = document.getElementById("admin-bookings-pagination");
  const all = dbRead("workshop-reservations", []);
  const cntElB = document.getElementById("subtab-bookings-count"); if (cntElB) cntElB.textContent = all.length;
  updateSortHeaders("data-bsort", adminBookingsSort);

  if (all.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--mist);">No workshop reservations yet.</td></tr>`;
    if (controls) controls.innerHTML = "";
    if (pager) pager.innerHTML = "";
    updateBookingsBulkBar();
    return;
  }

  const q = adminBookingsSearch.toLowerCase().trim();
  let rows = all;
  if (q) {
    rows = all.filter(b =>
      (b.name || "").toLowerCase().includes(q) ||
      (b.email || "").toLowerCase().includes(q) ||
      (b.phone || b.mobile || "").toLowerCase().includes(q) ||
      (b.workshop || "").toLowerCase().includes(q) ||
      (b.note || "").toLowerCase().includes(q)
    );
  }

  // workshop counts + filter
  // "Upcoming" keeps only sessions whose date hasn't passed yet.
  const allCount = rows.length;
  const upcomingCount = rows.filter(bookingIsUpcoming).length;
  if (adminBookingsWhen === "upcoming") rows = rows.filter(bookingIsUpcoming);

  const wsCounts = {};
  rows.forEach(b => { const w = b.workshop || "—"; wsCounts[w] = (wsCounts[w] || 0) + 1; });
  let filtered = adminBookingsWorkshop === "all" ? rows.slice() : rows.filter(b => (b.workshop || "—") === adminBookingsWorkshop);

  filtered.sort((a, b) => {
    switch (adminBookingsSort) {
      case "date-asc": return bookingDateNum(a) - bookingDateNum(b);
      case "price-desc": return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
      case "price-asc": return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
      case "name-asc": return String(a.name || "").localeCompare(String(b.name || ""));
      case "name-desc": return String(b.name || "").localeCompare(String(a.name || ""));
      default: return bookingDateNum(b) - bookingDateNum(a);
    }
  });

  const total = filtered.length;
  const perPage = adminBookingsPerPage > 0 ? adminBookingsPerPage : (total || 1);
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (adminBookingsPage > pages) adminBookingsPage = pages;
  if (adminBookingsPage < 1) adminBookingsPage = 1;
  const startIdx = (adminBookingsPage - 1) * perPage;
  const pageRows = filtered.slice(startIdx, startIdx + perPage);
  adminBookingsPageIds = pageRows.map(b => String(b.reservedAt || ""));

  if (controls) {
    const wsKeys = Object.keys(wsCounts).sort();
    const wsOptions = '<option value="all"' + (adminBookingsWorkshop === "all" ? " selected" : "") + '>All workshops (' + rows.length + ')</option>' +
      wsKeys.map(w => '<option value="' + esc(w) + '"' + (adminBookingsWorkshop === w ? " selected" : "") + '>' + esc(w) + ' (' + wsCounts[w] + ')</option>').join("");
    const ppOpts = [25, 50, 100].map(n => '<option value="' + n + '"' + (adminBookingsPerPage === n ? " selected" : "") + '>' + n + '</option>').join("") + '<option value="0"' + (adminBookingsPerPage === 0 ? " selected" : "") + '>All</option>';
    const bwChip = (key, label, n) => '<button type="button" class="alc-chip' + (adminBookingsWhen === key ? " is-active" : "") + '" data-bwhen="' + key + '">' + label + ' <span class="alc-n">' + n + '</span></button>';
    // One line per workshop: seats taken vs capacity, at a glance.
    const seatCaps = dbRead("workshops-capacities", {});
    const sessChips = Object.keys(wsCounts).sort().map(k => {
      const cap = seatCaps[k];
      const seats = cap ? (Number(cap.booked) || 0) + "/" + (Number(cap.total) || 0) + " seats" : wsCounts[k] + " booked";
      const full = cap && Number(cap.booked) >= Number(cap.total);
      return '<span class="session-chip' + (full ? " is-full" : "") + '"><strong>' + esc(k) + '</strong> · ' + esc(seats) + '</span>';
    }).join("");
    controls.innerHTML =
      (sessChips ? '<div class="session-summary">' + sessChips + '</div>' : '') +
      '<div class="alc-chips">' + bwChip("all", "All", allCount) + bwChip("upcoming", "Upcoming", upcomingCount) + '</div>' +
      '<div class="alc-right">' +
        '<label class="alc-field">Workshop <select id="bookings-workshop">' + wsOptions + '</select></label>' +
        '<label class="alc-field">Show <select id="bookings-perpage">' + ppOpts + '</select></label>' +
      '</div>';
  }

  if (total === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--mist);">No reservations match this filter.</td></tr>`;
  } else {
    tbody.innerHTML = pageRows.map(b => {
      const id = String(b.reservedAt || "");
      let dateStr = "—";
      try { if (b.reservedAt) dateStr = new Date(b.reservedAt).toISOString().split('T')[0]; } catch (e) {}
      return `
        <tr>
          <td style="text-align:center;"><input type="checkbox" class="admin-row-check-b" data-booking-id="${esc(id)}"${adminBookingsSelected.has(id) ? " checked" : ""} aria-label="Select reservation"></td>
          <td style="font-family:monospace;font-size:0.82rem;">${dateStr}</td>
          <td class="admin-table-title">${esc(b.name)}</td>
          <td>${esc(b.email)}</td>
          <td style="color:var(--aurora-gold);font-family:monospace;">${esc(b.phone || b.mobile || b.contact || "—")}</td>
          <td style="font-size:0.82rem;max-width:200px;" title="${esc(b.workshop)}${b.date ? ' — ' + esc(b.date) : ''}">
            <strong>${esc(b.workshop)}</strong>
            <span style="display:block;color:var(--mist);font-size:0.7rem;">${esc(b.date || "")}</span>
          </td>
          <td style="color:var(--aurora-gold);">£${esc(b.price)}${b.tickets > 1 ? ` <span style="color:var(--mist);font-size:0.8em;">· ${b.tickets} spaces</span>` : ""}</td>
          <td style="max-width: 200px; font-size:0.8rem; color:var(--mist); font-style:italic;" title="${b.note ? esc(b.note) : ''}">
            ${b.note ? `"${esc(b.note)}"` : "—"}
          </td>
          <td style="text-align:center;">
            <button type="button" class="admin-action-btn-danger" style="padding:4px 8px;font-size:0.75rem;" onclick="deleteBooking('${id}')">Delete</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  if (pager) pager.innerHTML = buildPagerHtml("b", total, startIdx, pageRows.length, pages, adminBookingsPage);
  const selAll = document.getElementById("bookings-select-all");
  if (selAll) selAll.checked = pageRows.length > 0 && adminBookingsPageIds.every(id => adminBookingsSelected.has(id));
  updateBookingsBulkBar();
}

function updateOrdersBulkBar() {
  const bar = document.getElementById("admin-orders-bulkbar");
  if (!bar) return;
  const n = adminOrdersSelected.size;
  if (n === 0) { bar.hidden = true; bar.innerHTML = ""; return; }
  bar.hidden = false;
  bar.innerHTML =
    '<span class="bulk-n">' + n + ' selected</span>' +
    '<span class="bulk-actions">' +
      '<button type="button" class="button button-secondary bulk-btn" data-obulk="shipped">Mark Shipped</button>' +
      '<button type="button" class="button button-secondary bulk-btn" data-obulk="delivered">Mark Delivered</button>' +
      '<button type="button" class="button button-secondary bulk-btn" data-obulk="slips">🖨 Packing slips</button>' +
      '<button type="button" class="button button-secondary bulk-btn" data-obulk="delete" style="background:var(--aurora-rose);border-color:var(--aurora-rose);color:var(--dark-cosmos);">Delete</button>' +
      '<button type="button" class="bulk-clear" data-obulk="clear">Clear</button>' +
    '</span>';
}

function updateBookingsBulkBar() {
  const bar = document.getElementById("admin-bookings-bulkbar");
  if (!bar) return;
  const n = adminBookingsSelected.size;
  if (n === 0) { bar.hidden = true; bar.innerHTML = ""; return; }
  bar.hidden = false;
  bar.innerHTML =
    '<span class="bulk-n">' + n + ' selected</span>' +
    '<span class="bulk-actions">' +
      '<button type="button" class="button button-secondary bulk-btn" data-bbulk="delete" style="background:var(--aurora-rose);border-color:var(--aurora-rose);color:var(--dark-cosmos);">Delete selected</button>' +
      '<button type="button" class="bulk-clear" data-bbulk="clear">Clear</button>' +
    '</span>';
}

/* ── Gift certificate — a print-at-home page the buyer can hand over ──
   Gifts are posted to the recipient, so the buyer has nothing to give on the
   day itself. This prints a warm A4 certificate (same reliable iframe
   technique as the packing slips) with the term, start month and their note. */
function printGiftCertificate(cert) {
  if (!cert) return;
  let startLabel = "";
  try {
    const cycle = snailStartCycleFor(cert.start || undefined);
    startLabel = snailCycleLabel(cycle);
  } catch (e) {}
  let frame = document.getElementById("gift-cert-print-frame");
  if (frame) frame.remove();
  frame = document.createElement("iframe");
  frame.id = "gift-cert-print-frame";
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed; right:0; bottom:0; width:1px; height:1px; border:0; opacity:0;";
  document.body.appendChild(frame);
  const d = frame.contentWindow.document;
  d.open();
  d.write(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ubhi gift certificate</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&family=EB+Garamond:ital@0;1&family=Fraunces:ital,opsz,wght@1,9..144,300..500&display=swap" rel="stylesheet">' +
    '<style>' +
    '@page{ size:A4 portrait; margin:16mm; }' +
    'body{ margin:0; font-family:"EB Garamond",Georgia,serif; color:#2b2018; }' +
    '.cert{ border:2.5px solid #a6741f; border-radius:6px; padding:14mm 12mm; text-align:center; position:relative; }' +
    '.cert::before{ content:""; position:absolute; inset:3mm; border:1px solid rgba(166,116,31,0.45); border-radius:4px; pointer-events:none; }' +
    '.brand{ font-size:10pt; letter-spacing:0.34em; text-transform:uppercase; color:#a6741f; margin:0 0 2mm; }' +
    'h1{ font-family:"Fraunces",Georgia,serif; font-style:italic; font-weight:400; font-size:27pt; margin:2mm 0 1mm; }' +
    '.script{ font-family:"Caveat",cursive; font-size:16pt; color:#5a462a; margin:0 0 8mm; }' +
    '.for{ font-size:10pt; letter-spacing:0.22em; text-transform:uppercase; color:#6b5c41; margin:6mm 0 1mm; }' +
    '.to{ font-family:"Fraunces",Georgia,serif; font-style:italic; font-size:21pt; margin:0 0 6mm; }' +
    '.what{ font-size:12.5pt; line-height:1.7; max-width:120mm; margin:0 auto 6mm; }' +
    '.start{ font-size:10.5pt; color:#6b5c41; margin:0 0 8mm; }' +
    '.note{ font-family:"Caveat",cursive; font-size:15.5pt; line-height:1.5; color:#43331f; max-width:120mm; margin:0 auto 8mm; }' +
    '.from{ font-size:11pt; font-style:italic; margin:0 0 10mm; }' +
    '.foot{ font-size:8.5pt; letter-spacing:0.18em; text-transform:uppercase; color:#8a7a5c; }' +
    '.seal{ font-size:22pt; margin:4mm 0 0; }' +
    '</style></head><body>' +
    '<div class="cert">' +
      '<p class="brand">Ubhi · Snail Mail Club</p>' +
      '<h1>' + (cert.months === 12 ? "A year of hand-made post" : "A gift of hand-made post") + '</h1>' +
      '<p class="script">art that arrives in the letterbox</p>' +
      '<p class="for">This certificate belongs to</p>' +
      '<p class="to">' + esc(cert.to) + '</p>' +
      '<p class="what"><strong>' + cert.months + ' month' + (cert.months > 1 ? "s" : "") + '</strong> of letters, original art and small slow rituals — one hand-made envelope, posted on the 5th of every month.</p>' +
      (startLabel ? '<p class="start">The first envelope is posted in <strong>' + esc(startLabel) + '</strong>.</p>' : '') +
      (cert.message ? '<p class="note">&ldquo;' + esc(cert.message) + '&rdquo;</p>' : '') +
      (cert.from ? '<p class="from">With love, ' + esc(cert.from) + '</p>' : '') +
      '<p class="seal">✻</p>' +
      '<p class="foot">Look within, to ascend · hello@ubhi.in</p>' +
    '</div></body></html>'
  );
  d.close();
  const w = frame.contentWindow;
  const go = () => { try { w.focus(); w.print(); } catch (e) {} };
  // Give the webfonts a moment to arrive before the print dialog freezes the frame.
  setTimeout(go, 900);
}
window.printGiftCertificate = printGiftCertificate;
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "snail-gift-cert-btn") printGiftCertificate(window._ubhiGiftCert);
});

/* ── Packing slips — print-ready A4, one slip per selected order ──
   Doubles as a delivery note: bold address block (cut out as a label if
   needed), the parcel contents, and the totals. Printed from an isolated
   iframe — the same reliable technique as the address stickers. */
function printPackingSlips(orders) {
  const money = (v) => {
    const n = Number(v) || 0;
    return "£" + (n % 1 === 0 ? String(n) : n.toFixed(2));
  };
  const slip = (o) => {
    const addr = o.shippingAddress || o.address || {};
    const items = orderItems(o);
    const rows = items.length
      ? items.map(it => '<tr><td>' + esc(it.name || "Item") + '</td><td class="qty">× ' + esc(it.quantity || 1) + '</td></tr>').join("")
      : '<tr><td>' + esc(o.productName || "Order") + '</td><td class="qty">× 1</td></tr>';
    let dateStr = "";
    try { if (o.orderedAt || o.date) dateStr = new Date(o.orderedAt || o.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); } catch (e) {}
    return '<div class="slip">' +
      '<div class="slip-head"><span class="brand">UBHI · Soul Shop</span><span class="ref">' + esc(o.orderRef || o.backendRef || "") + '</span></div>' +
      '<div class="slip-meta">' + esc(dateStr) + (o.status ? " · " + esc(o.status) : "") + '</div>' +
      '<div class="slip-cols">' +
        '<div class="ship-to"><h3>Deliver to</h3><p><strong>' + esc(o.name || o.customerName || "") + '</strong><br>' +
          [addr.street, addr.city, addr.postcode, addr.country].filter(Boolean).map(esc).join("<br>") +
          ((o.phone || o.mobile) ? '<br>' + esc(o.phone || o.mobile) : '') + '</p></div>' +
        '<div class="items"><h3>Inside this parcel</h3><table><tbody>' + rows + '</tbody></table>' +
          '<p class="totals">' + (o.subtotal != null ? 'Subtotal ' + money(o.subtotal) + ' · ' : '') + (o.shipping ? 'Post ' + money(o.shipping) + ' · ' : '') + '<strong>Total ' + money(o.totalPrice || o.price) + '</strong></p></div>' +
      '</div>' +
      '<p class="slip-foot">Packed with care in the Ubhi studio · hello@ubhi.in · Look within, to ascend</p>' +
    '</div>';
  };

  let frame = document.getElementById("slips-print-frame");
  if (frame) frame.remove();
  frame = document.createElement("iframe");
  frame.id = "slips-print-frame";
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed; right:0; bottom:0; width:1px; height:1px; border:0; opacity:0;";
  document.body.appendChild(frame);
  const d = frame.contentWindow.document;
  d.open();
  d.write(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Packing slips</title><style>' +
    '@page{ size:A4 portrait; margin:12mm; }' +
    'body{ font-family:Georgia,"Times New Roman",serif; color:#201409; margin:0; }' +
    '.slip{ page-break-after:always; break-inside:avoid; border:1px solid #d8cdb4; border-radius:6px; padding:10mm; }' +
    '.slip:last-child{ page-break-after:auto; }' +
    '.slip-head{ display:flex; justify-content:space-between; align-items:baseline; border-bottom:2px solid #201409; padding-bottom:4mm; }' +
    '.brand{ font-size:15pt; letter-spacing:0.08em; font-weight:bold; }' +
    '.ref{ font-family:"Courier New",monospace; font-size:11pt; }' +
    '.slip-meta{ color:#6b5c41; font-size:9.5pt; margin:2mm 0 6mm; }' +
    '.slip-cols{ display:flex; gap:10mm; }' +
    '.ship-to,.items{ flex:1; min-width:0; }' +
    'h3{ font-size:8.5pt; text-transform:uppercase; letter-spacing:0.14em; color:#6b5c41; margin:0 0 2mm; font-family:Arial,sans-serif; }' +
    '.ship-to p{ font-size:12pt; line-height:1.55; margin:0; }' +
    '.items table{ width:100%; border-collapse:collapse; font-size:10.5pt; }' +
    '.items td{ padding:1.6mm 0; border-bottom:1px dotted #c9bda0; }' +
    '.items .qty{ text-align:right; white-space:nowrap; }' +
    '.totals{ font-size:9.5pt; color:#4a3c26; margin-top:3mm; }' +
    '.slip-foot{ margin-top:8mm; font-size:8.5pt; color:#8a7a5c; font-style:italic; text-align:center; }' +
    '</style></head><body>' + orders.map(slip).join("") + '</body></html>'
  );
  d.close();
  const w = frame.contentWindow;
  const go = () => { try { w.focus(); w.print(); } catch (e) {} };
  if (d.readyState === "complete") setTimeout(go, 250);
  else { w.onload = () => setTimeout(go, 250); setTimeout(go, 600); }
}
window.printPackingSlips = printPackingSlips;

/* ── Contact-form messages (arrive via the backend /api/contact) ──
   Rendered inside the Email Updates tab. Read/delete write back to the
   server (ubhiPatch/ubhiDelete) so every device stays in step. */
function renderAdminMessages() {
  const wrap = document.getElementById("admin-messages-list");
  if (!wrap) return;
  const list = dbRead("contact-messages", []);
  const countEl = document.getElementById("admin-messages-count");
  const unread = list.filter(m => !m.read).length;
  if (countEl) countEl.textContent = list.length ? (unread ? unread + " new" : String(list.length)) : "";
  if (!list.length) {
    wrap.innerHTML = '<p style="color:var(--mist);font-size:0.88rem;margin:0;">No messages yet. When someone writes through the contact form (with the server connected), it lands here.</p>';
    return;
  }
  const sorted = list.slice().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  wrap.innerHTML = sorted.map(m => {
    const idx = list.indexOf(m);
    let when = "";
    try { if (m.date) when = new Date(m.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch (e) {}
    return '<div class="admin-msg" style="border:1px solid var(--border-color);border-radius:8px;padding:12px 14px;margin-bottom:10px;' + (m.read ? 'opacity:0.72;' : '') + '">' +
      '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline;">' +
        '<strong>' + esc(m.name || m.email || "—") + '</strong>' +
        '<span style="color:var(--mist);font-size:0.78rem;">' + esc(when) + (m.read ? '' : ' · <strong style="color:var(--aurora-gold);">new</strong>') + '</span>' +
      '</div>' +
      '<div style="font-size:0.8rem;color:var(--mist);margin-top:2px;">' + esc(m.email || "") + (m.subject ? ' · ' + esc(m.subject) : '') + '</div>' +
      '<p style="font-size:0.88rem;line-height:1.55;margin:8px 0;white-space:pre-wrap;">' + esc(m.message || "") + '</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<a class="admin-mini-btn" style="text-decoration:none;" href="mailto:' + esc(m.email || "") + '?subject=' + encodeURIComponent('Re: ' + (m.subject || 'your note to Ubhi')) + '">Reply ✉</a>' +
        '<button type="button" class="admin-mini-btn" onclick="adminToggleMessageRead(' + idx + ')">' + (m.read ? 'Mark unread' : 'Mark read') + '</button>' +
        '<button type="button" class="admin-action-btn-danger" style="padding:4px 9px;font-size:0.72rem;" onclick="adminDeleteMessage(' + idx + ')">Delete</button>' +
      '</div>' +
    '</div>';
  }).join("");
}

function adminToggleMessageRead(idx) {
  const list = dbRead("contact-messages", []);
  const m = list[idx];
  if (!m) return;
  m.read = !m.read;
  dbWrite("contact-messages", list);
  if (m._sid && window.ubhiPatch) window.ubhiPatch("contact", m._sid, { read: m.read });
  renderAdminMessages();
  if (typeof updateAdminNavBadges === "function") updateAdminNavBadges();
}

function adminDeleteMessage(idx) {
  if (!confirm("Delete this message?")) return;
  const list = dbRead("contact-messages", []);
  const removed = list.splice(idx, 1)[0];
  dbWrite("contact-messages", list);
  if (removed && removed._sid && window.ubhiDelete) window.ubhiDelete("contact", removed._sid);
  renderAdminMessages();
  if (typeof updateAdminNavBadges === "function") updateAdminNavBadges();
}
window.adminToggleMessageRead = adminToggleMessageRead;
window.adminDeleteMessage = adminDeleteMessage;

function renderAdminDashboard() {
  // Flip any lapsed fixed-term subscriptions to Inactive before drawing figures.
  expireLapsedMembers();
  // Isolate each section: a failure in one (e.g. on corrupt/legacy localStorage)
  // must never blank out the others.
  const safe = (fn, label) => {
    try { fn(); } catch (e) { console.error("Admin section failed to render:", label, e); }
  };
  safe(renderAdminOverview, "overview");
  safe(renderAdminGallery, "gallery");
  safe(renderArtAdmin, "artfolio");
  safe(updateServerPill, "server-pill");
  safe(renderWorkshops, "workshops (front)");
  safe(renderAdminWorkshops, "workshops");
  safe(renderShop, "shop (front)");
  safe(renderAdminShop, "shop");
  safe(renderAdminSnailMail, "members");
  safe(renderAdminSnailPrices, "snail-prices");
  safe(renderAdminCustomers, "customers");
  safe(renderAdminJournal, "journal");
  safe(renderAdminOrders, "orders");
  safe(renderAdminMessages, "messages");
  safe(updateAdminNavBadges, "badges");
  safe(populateSiteSettingsForm, "site-profile");
  safe(restoreAdminTab, "active-tab");
  safe(restoreAdminSubtabs, "subtabs");
  // Connected admin: fetch fresh orders/bookings/subscribers from the server
  // (throttled inside the bridge; fires "ubhi:records-pulled" when new ones land).
  try { if (window.ubhiPullRecords) window.ubhiPullRecords(); } catch (e) {}
}

// When the sync bridge merges fresh server records in, redraw the open admin
// panel once so they appear without a manual refresh.
document.addEventListener("ubhi:records-pulled", () => {
  try {
    const dash = document.getElementById("admin-dashboard");
    if (dash && dash.offsetParent !== null && typeof renderAdminDashboard === "function") renderAdminDashboard();
    if (typeof updateAdminNavBadges === "function") updateAdminNavBadges();
  } catch (e) {}
});

// Restore the last-viewed admin tab after a refresh (so it doesn't jump back to Overview).
function restoreAdminTab() {
  const saved = safeLocalRead("ubhi-admin-active-tab") || "overview";
  const btn = document.querySelector('.admin-tab-btn[data-admin-tab="' + saved + '"]');
  if (!btn) return;
  document.querySelectorAll(".admin-tab-btn").forEach(b => b.classList.toggle("is-active", b === btn));
  document.querySelectorAll(".admin-tab-content").forEach(c => c.classList.toggle("is-active", c.id === "admin-tab-" + saved));
}

/* ════ People — every human across the business, merged by email ════
   One row per person, joined from four sources: sign-in accounts ("members"
   store), Snail-Mail members, the email-updates list, and order/booking
   customers who never made an account. Chips filter by type; the detail
   panel shows one person's whole story. Account management (password /
   pause / delete) applies only to rows that have a sign-in account.
   DEMO security note: passwords are stored locally in plain text here — in the
   live site, replace with a real auth provider + secure password-reset links. */
let adminCustomersSearch = "";
let adminPeopleType = "all";   // all | account | snail | news | shopper

function renderAdminCustomers() {
  const body = document.getElementById("admin-customers-table-body");
  if (!body) return;
  const accounts = dbRead("members", []);
  const orders = dbRead("shop-orders", []);
  const bookings = dbRead("workshop-reservations", []);
  const subs = dbRead("snail-members", []);
  const news = dbRead("email-updates", []);

  // Merge every source into one person per (lowercased) email.
  const people = new Map();
  const personFor = (email, name) => {
    const key = String(email || "").toLowerCase().trim();
    if (!key) return null;
    if (!people.has(key)) people.set(key, { email: String(email).trim(), name: "", types: {}, orders: 0, bookings: 0, sub: null, account: null, onList: false, firstSeen: "" });
    const p = people.get(key);
    if (name && !p.name) p.name = String(name);
    return p;
  };
  const seenDate = (p, d) => { const s = String(d || "").slice(0, 10); if (s && (!p.firstSeen || s < p.firstSeen)) p.firstSeen = s; };
  accounts.forEach(a => { const p = personFor(a.email, a.name); if (p) { p.account = a; p.types.account = true; seenDate(p, a.joinedAt); } });
  subs.forEach(s => { const p = personFor(s.email, s.name); if (p) { p.sub = s; p.types.snail = true; seenDate(p, s.dateSubscribed); } });
  news.forEach(n => { const p = personFor(n.email, n.name); if (p) { p.onList = true; p.types.news = true; seenDate(p, n.date); } });
  orders.forEach(o => { const p = personFor(o.email || o.customerEmail, o.name || o.customerName); if (p) { p.orders++; p.types.shopper = true; seenDate(p, o.orderedAt || o.date); } });
  bookings.forEach(b => { const p = personFor(b.email, b.name); if (p) { p.bookings++; p.types.shopper = true; seenDate(p, b.reservedAt); } });

  let list = Array.from(people.values());
  const counts = {
    all: list.length,
    account: list.filter(p => p.types.account).length,
    snail: list.filter(p => p.types.snail).length,
    news: list.filter(p => p.types.news).length,
    shopper: list.filter(p => p.types.shopper).length,
  };
  const chipsEl = document.getElementById("admin-people-chips");
  if (chipsEl) {
    const chip = (k, label) => '<button type="button" class="alc-chip' + (adminPeopleType === k ? " is-active" : "") + '" data-people-type="' + k + '">' + label + ' <span class="alc-n">' + counts[k] + '</span></button>';
    chipsEl.innerHTML = chip("all", "Everyone") + chip("snail", "Snail Mail") + chip("shopper", "Shoppers") + chip("news", "Email list") + chip("account", "Sign-in accounts");
  }
  const countEl = document.getElementById("admin-customers-count");
  if (countEl) countEl.textContent = counts.all ? String(counts.all) : "";

  if (adminPeopleType !== "all") list = list.filter(p => p.types[adminPeopleType]);
  const q = adminCustomersSearch.toLowerCase().trim();
  if (q) list = list.filter(p => (p.name || "").toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q));
  list.sort((a, b) => String(b.firstSeen || "").localeCompare(String(a.firstSeen || "")));

  if (!list.length) {
    body.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:26px;color:var(--mist);">${counts.all ? "No one matches this filter or search." : "No people yet — they'll appear here as orders, subscriptions and signups come in."}</td></tr>`;
    return;
  }
  body.innerHTML = list.map(p => {
    const enc = encodeURIComponent(p.email);
    const subLabel = p.sub ? esc(p.sub.plan || "Subscriber") + (p.sub.status && p.sub.status !== "Active" ? " · " + esc(p.sub.status) : "") : "—";
    const acct = p.account;
    const acctCell = acct
      ? `<span class="status-badge ${acct.active !== false ? "active" : "inactive"}">${acct.active !== false ? "Active" : "Paused"}</span>`
      : '<span style="color:var(--mist);">—</span>';
    const ordersCell = (p.orders || p.bookings)
      ? String(p.orders) + (p.bookings ? ` <span style="color:var(--mist);font-size:0.78em;">· ${p.bookings} wkshp</span>` : "")
      : "0";
    const actions = [`<button type="button" class="admin-mini-btn" onclick="adminViewCustomer('${enc}')">View</button>`]
      .concat(acct ? [
        `<button type="button" class="admin-mini-btn" onclick="adminSetCustomerPassword('${enc}')">Password</button>`,
        `<button type="button" class="admin-mini-btn" onclick="adminToggleCustomer('${enc}')">${acct.active !== false ? "Pause" : "Activate"}</button>`,
        `<button type="button" class="admin-action-btn-danger" style="padding:4px 9px;font-size:0.72rem;" onclick="adminDeleteCustomer('${enc}')">Delete</button>`,
      ] : []).join(" ");
    return `<tr>
      <td class="admin-table-title">${esc(p.name || "—")}</td>
      <td>${esc(p.email)}</td>
      <td style="white-space:nowrap;">${esc(p.firstSeen || "—")}</td>
      <td style="text-align:center;">${ordersCell}</td>
      <td>${subLabel}</td>
      <td style="text-align:center;">${p.onList ? "✓" : '<span style="color:var(--mist);">—</span>'}</td>
      <td>${acctCell}</td>
      <td style="text-align:center;white-space:nowrap;">${actions}</td>
    </tr>`;
  }).join("");
}

function adminViewCustomer(enc) {
  const email = decodeURIComponent(enc), el = email.toLowerCase();
  const detail = document.getElementById("admin-customer-detail");
  if (!detail) return;
  // A person may exist without a sign-in account (shopper / member / list-only).
  const m = (typeof findMember === "function" ? findMember(email) : null);
  const mine = (o) => String(o.email || o.customerEmail || "").toLowerCase() === el;
  const orders = dbRead("shop-orders", []).filter(mine);
  const books = dbRead("workshop-reservations", []).filter(mine);
  const sub = dbRead("snail-members", []).find(s => String(s.email || "").toLowerCase() === el);
  const onList = dbRead("email-updates", []).some(u => String(u.email || "").toLowerCase() === el);
  const displayName = (m && m.name) || (sub && sub.name) || (orders[0] && (orders[0].name || orders[0].customerName)) || (books[0] && books[0].name) || email;
  const phone = (m && m.phone) || (sub && sub.contact) || (orders[0] && (orders[0].phone || orders[0].mobile)) || "";
  const addr = m
    ? [m.address, m.city, m.postcode, m.country].filter(Boolean).map(esc).join(", ")
    : (sub && sub.address ? esc(sub.address) : "");
  const orderRows = orders.length ? orders.map(o => `<li>${esc(orderItems(o).length ? orderItems(o).map(i => i.name).join(", ") : (o.productName || "Order"))} — £${esc(o.totalPrice || o.price || 0)} <span style="color:var(--mist);">· ${esc(o.status || "")}</span></li>`).join("") : "<li style='color:var(--mist);'>No orders.</li>";
  const bookRows = books.length ? books.map(b => `<li>${esc(b.workshop)} <span style="color:var(--mist);">· ${esc(b.date || "")}</span></li>`).join("") : "<li style='color:var(--mist);'>No bookings.</li>";
  const accountLine = m
    ? "Joined " + esc(m.joinedAt || "—") + " · " + (m.active === false ? "Paused" : "Active") + " sign-in"
    : "No sign-in account";
  detail.innerHTML = `
    <div class="admin-card-header-actions">
      <h4 style="margin:0;">${esc(displayName)}</h4>
      <button type="button" class="admin-mini-btn" onclick="document.getElementById('admin-customer-detail').style.display='none'">Close ✕</button>
    </div>
    <p style="font-size:0.86rem;color:var(--mist);margin:4px 0 14px;line-height:1.5;">
      ${esc(email)}${phone ? " · " + esc(phone) : ""}${addr ? "<br>" + addr : ""}<br>
      ${accountLine} · ${onList ? "On the email list ✓" : "Not on the email list"}
    </p>
    <div class="admin-customer-detail-grid">
      <div><h5>Subscription</h5><p style="font-size:0.86rem;margin:0;">${sub ? esc(sub.plan || "Subscriber") + " · " + esc(sub.billing || "") + " · " + esc(sub.status || "") : "<span style='color:var(--mist);'>No Snail Mail subscription. (Manage in the Snail Mail tab.)</span>"}</p></div>
      <div><h5>Orders (${orders.length})</h5><ul class="admin-customer-list">${orderRows}</ul></div>
      <div><h5>Workshops (${books.length})</h5><ul class="admin-customer-list">${bookRows}</ul></div>
    </div>`;
  detail.style.display = "block";
  detail.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function adminSetCustomerPassword(enc) {
  const email = decodeURIComponent(enc);
  const m = findMember(email);
  if (!m) return;
  const np = prompt("Set a new sign-in password for " + email + ":\n\n(Demo only — in the live site you'd email a secure reset link instead.)", "");
  if (np === null) return;
  if (String(np).length < 4) { alert("Please use at least 4 characters."); return; }
  saveMember({ email: m.email, password: np });
  alert("Password updated for " + email + ".");
}

function adminToggleCustomer(enc) {
  const email = decodeURIComponent(enc);
  const m = findMember(email);
  if (!m) return;
  const active = m.active !== false;
  if (!confirm((active ? "Pause" : "Re-activate") + " sign-in for " + email + "?" + (active ? "\nThey won't be able to log in until re-activated." : ""))) return;
  saveMember({ email: m.email, active: !active });
  renderAdminCustomers();
}

function adminDeleteCustomer(enc) {
  const email = decodeURIComponent(enc);
  if (!confirm("Delete the sign-in account for " + email + "?\nTheir orders & bookings are kept, but they can no longer log in. This cannot be undone.")) return;
  dbWrite("members", getMembers().filter(m => String(m.email || "").toLowerCase() !== email.toLowerCase()));
  const detail = document.getElementById("admin-customer-detail");
  if (detail) detail.style.display = "none";
  renderAdminCustomers();
}

function adminAddCustomer() {
  const name = prompt("Customer's name:", "");
  if (name === null) return;
  const email = prompt("Customer's email (this becomes their sign-in):", "");
  if (email === null) return;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email).trim())) { alert("Please enter a valid email address."); return; }
  if (findMember(email)) { alert("A customer with that email already exists."); return; }
  const pass = prompt("Set an initial password (at least 4 characters; they can change it later):", "");
  if (pass === null) return;
  if (String(pass).length < 4) { alert("Please use at least 4 characters."); return; }
  saveMember({ name: String(name).trim(), email: String(email).trim(), password: pass, joinedAt: new Date().toISOString().split("T")[0], active: true, marketingOptIn: false });
  adminCustomersSearch = "";
  const s = document.getElementById("admin-customers-search"); if (s) s.value = "";
  renderAdminCustomers();
  alert(String(name).trim() + " added. They can now sign in with that email and password.");
}

window.adminViewCustomer = adminViewCustomer;
window.adminSetCustomerPassword = adminSetCustomerPassword;
window.adminToggleCustomer = adminToggleCustomer;
window.adminDeleteCustomer = adminDeleteCustomer;

// At-a-glance dashboard for the Overview tab.
function renderAdminOverview() {
  function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
  function money(x) { return "£" + Math.round(x || 0).toLocaleString("en-GB"); }

  const orders = dbRead("shop-orders", []);
  const bookings = dbRead("workshop-reservations", []);
  const members = dbRead("snail-members", []);
  const subs = dbRead("email-updates", []);
  const shop = dbRead("shop-catalog", []);
  const workshops = dbRead("workshops", []);
  const journal = dbRead("journal-posts", []);
  const gallery = dbRead("gallery-items", []);

  const orderRevenue = orders.reduce((s, o) => s + (Number(o.totalPrice) || 0), 0);
  const bookingRevenue = bookings.reduce((s, b) => s + (parseFloat(b.price) || 0), 0);
  const activeMembers = members.filter(m => m.status !== "Inactive").length;
  const pausedMembers = members.length - activeMembers;
  const lowStock = shop.filter(p => Number(p.remainingStock) <= 5);

  setText("ov-orders-count", orders.length);
  setText("ov-orders-sub", money(orderRevenue) + " received");
  setText("ov-bookings-count", bookings.length);
  setText("ov-bookings-sub", money(bookingRevenue) + " reserved");
  setText("ov-members-count", members.length);
  setText("ov-members-sub", activeMembers + " active · " + pausedMembers + " paused");
  setText("ov-subs-count", subs.length);
  setText("ov-shop-count", shop.length);
  setText("ov-shop-sub", lowStock.length + " low on stock");
  setText("ov-workshops-count", workshops.length);
  setText("ov-journal-count", journal.length);
  setText("ov-gallery-count", gallery.length);

  const shopCard = document.querySelector(".admin-stat-card.stat-shop");
  if (shopCard) shopCard.classList.toggle("is-alert", lowStock.length > 0);

  const att = document.getElementById("admin-overview-attention");
  if (att) {
    const items = [];
    if (lowStock.length) {
      const names = lowStock.map(p => (p.name || "Untitled") + " (" + (Number(p.remainingStock) || 0) + " left)").slice(0, 4).join(", ");
      items.push({ warn: true, text: lowStock.length + " shop piece" + (lowStock.length > 1 ? "s are" : " is") + " low on stock: " + names + (lowStock.length > 4 ? "…" : "") });
    }
    const preparing = orders.filter(o => (o.status || "").toLowerCase().indexOf("prepar") > -1).length;
    if (preparing) items.push({ warn: false, text: preparing + " order" + (preparing > 1 ? "s are" : " is") + " still being prepared." });
    if (pausedMembers) items.push({ warn: false, text: pausedMembers + " snail-mail member" + (pausedMembers > 1 ? "s are" : " is") + " paused." });

    att.innerHTML = items.length
      ? items.map(it => '<li class="' + (it.warn ? "warn" : "") + '"><span class="att-dot"></span>' + it.text + "</li>").join("")
      : '<li class="calm"><span class="att-dot"></span>All calm — nothing needs your attention right now.</li>';
  }

  // ── Business-health insights (MRR, active subs, churn, revenue, trend, top) ──
  const moneyVal = (s) => { const m = String(s == null ? "" : s).match(/[\d.]+/); return m ? parseFloat(m[0]) : 0; };
  // Prepay members' billing string leads with the upfront total, so prefer the
  // stored monthly-equivalent when present to keep MRR correct.
  const monthlyOf = (m) => (m.monthlyEquiv != null && m.monthlyEquiv !== "") ? Number(m.monthlyEquiv) : moneyVal(m.billing || m.price);
  const mKey = (d) => { const dt = new Date(d); return isNaN(dt) ? null : dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0"); };
  const isActive = (m) => String(m.status || "").toLowerCase() === "active";

  const activeSubs = members.filter(isActive);
  const cancelled = members.filter(m => String(m.status || "").toLowerCase() === "inactive");
  const mrr = activeSubs.reduce((s, m) => s + monthlyOf(m), 0);
  setText("ov-mrr", money(mrr));
  setText("ov-mrr-sub", "from " + activeSubs.length + " subscriber" + (activeSubs.length === 1 ? "" : "s"));
  setText("ov-active", activeSubs.length);
  setText("ov-churn", (members.length ? Math.round(cancelled.length / members.length * 1000) / 10 : 0) + "%");
  setText("ov-churn-sub", cancelled.length + " of " + members.length + " members cancelled");

  const now = new Date();
  const curKey = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  const ordMonth = orders.reduce((s, o) => mKey(o.orderedAt || o.date || o.createdAt) === curKey ? s + (Number(o.totalPrice) || 0) : s, 0);
  const bkMonth = bookings.reduce((s, b) => mKey(b.reservedAt || b.createdAt) === curKey ? s + (parseFloat(b.price) || 0) : s, 0);
  setText("ov-revmonth", money(ordMonth + bkMonth + mrr));

  const trend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const oneoff = orders.reduce((s, o) => mKey(o.orderedAt || o.date || o.createdAt) === k ? s + (Number(o.totalPrice) || 0) : s, 0)
                 + bookings.reduce((s, b) => mKey(b.reservedAt || b.createdAt) === k ? s + (parseFloat(b.price) || 0) : s, 0);
    const recurring = activeSubs.reduce((s, m) => { const jd = new Date(m.dateSubscribed || m.joinedAt || 0); return (!isNaN(jd) && jd <= endOfMonth) ? s + monthlyOf(m) : s; }, 0);
    trend.push({ label: d.toLocaleString("en-GB", { month: "short" }), value: oneoff + recurring });
  }
  const maxV = Math.max.apply(null, trend.map(t => t.value).concat([1]));
  const trendEl = document.getElementById("ov-trend");
  if (trendEl) trendEl.innerHTML = trend.map(t => {
    const h = Math.max(3, Math.round(t.value / maxV * 100));
    return '<div class="ov-bar"><span class="ov-bar-val">' + money(t.value) + '</span><div class="ov-bar-fill" style="height:' + h + '%"></div><span class="ov-bar-label">' + t.label + '</span></div>';
  }).join("");

  const ranking = [];
  if (activeSubs.length) ranking.push({ name: "Snail Mail Club", count: activeSubs.length, unit: "active" });
  const prodCount = {};
  orders.forEach(o => orderItems(o).forEach(it => { const n = it.name || "Item"; prodCount[n] = (prodCount[n] || 0) + (Number(it.quantity) || 1); }));
  Object.keys(prodCount).forEach(n => ranking.push({ name: n, count: prodCount[n], unit: "sold" }));
  const wsCount = {};
  bookings.forEach(b => { const n = b.workshop || b.title || "Workshop"; wsCount[n] = (wsCount[n] || 0) + 1; });
  Object.keys(wsCount).forEach(n => ranking.push({ name: n, count: wsCount[n], unit: "booked" }));
  ranking.sort((a, b) => b.count - a.count);
  const topEl = document.getElementById("ov-top");
  if (topEl) topEl.innerHTML = ranking.length
    ? ranking.slice(0, 5).map((r, i) => '<li><span class="ov-top-n">' + (i + 1) + ' · ' + esc(r.name) + '</span><span class="ov-top-v">' + r.count + " " + r.unit + "</span></li>").join("")
    : '<li><span class="ov-top-n">No sales yet — your numbers will appear here.</span></li>';

  renderAdminDesk();
}

/* ════ Today's post desk + new-item badges ════════════════════════════
   The morning queue: everything new since the owner last looked, plus
   what's due (post run, low stock, gifts ending, security nudges) — each
   row is one click from the thing it describes. "Seen" timestamps are
   stamped when the matching tab is opened. */

// Days until a gift subscription's fixed term ends (null for non-gifts,
// inactive members, or unparseable dates).
function snailGiftDaysLeft(m) {
  if (!m || m.status !== "Active" || !(m.isGift || m.giftOn)) return null;
  const term = parseInt(m.giftTermMonths, 10) || 0;
  const startStr = m.giftStart || m.dateSubscribed;
  if (!term || !startStr) return null;
  const start = new Date(startStr);
  if (isNaN(start.getTime())) return null;
  const ends = new Date(start);
  ends.setMonth(ends.getMonth() + term);
  return Math.ceil((ends - new Date()) / 86400000);
}

// Gifts (fixed-term) ending within the next `days` days — for warnings.
function snailGiftsEndingSoon(days) {
  const out = [];
  dbRead("snail-members", []).forEach((m) => {
    const daysLeft = snailGiftDaysLeft(m);
    if (daysLeft !== null && daysLeft >= 0 && daysLeft <= days) out.push({ member: m, daysLeft: daysLeft });
  });
  return out;
}

// Small inline chip for the Members table when a gift ends within 2 weeks —
// a nudge to invite the recipient to carry on with their own subscription.
function snailGiftEndNote(m) {
  const daysLeft = snailGiftDaysLeft(m);
  if (daysLeft === null || daysLeft < 0 || daysLeft > 14) return "";
  const when = daysLeft === 0 ? "today" : "in " + daysLeft + " day" + (daysLeft === 1 ? "" : "s");
  return '<span title="This gift\'s final letter is near — a lovely moment to invite them to continue" style="margin-left:6px;font-size:0.7rem;color:#a8402f;font-weight:600;white-space:nowrap;">🎁 ends ' + when + '</span>';
}

// Jump straight to an admin tab (and optionally a sub-tab) from the desk.
function adminGoTab(tab, subtab) {
  const btn = document.querySelector('.admin-tab-btn[data-admin-tab="' + tab + '"]');
  if (btn) btn.click();
  if (!subtab) return;
  setTimeout(() => {
    const sb = document.querySelector('button[data-subtab="' + subtab + '"]');
    if (sb) sb.click();
  }, 0);
}
window.adminGoTab = adminGoTab;

function setNavBadge(tab, n, warn) {
  const btn = document.querySelector('.admin-tab-btn[data-admin-tab="' + tab + '"]');
  if (!btn) return;
  let b = btn.querySelector(".admin-nav-badge");
  if (!n) { if (b) b.remove(); return; }
  if (!b) { b = document.createElement("span"); b.className = "admin-nav-badge"; btn.appendChild(b); }
  b.textContent = n > 99 ? "99+" : String(n);
  b.classList.toggle("is-warn", !!warn);
}

// Counts of records newer than the per-tab "seen" stamps; also paints the
// sidebar badges. First ever run stamps everything as seen (no noise).
function updateAdminNavBadges() {
  const nowIso = new Date().toISOString();
  if (!safeLocalRead("ubhi-admin-seen-orders")) {
    ["orders", "bookings", "updates"].forEach(c => safeLocalWrite("ubhi-admin-seen-" + c, nowIso));
  }
  const seen = c => safeLocalRead("ubhi-admin-seen-" + c) || nowIso;
  const newO = dbRead("shop-orders", []).filter(o => String(o.orderedAt || o.date || "") > seen("orders")).length;
  const newB = dbRead("workshop-reservations", []).filter(b => String(b.reservedAt || "") > seen("bookings")).length;
  const newU = dbRead("email-updates", []).filter(u => String(u.date || "") > seen("updates")).length;
  const unreadM = dbRead("contact-messages", []).filter(m => !m.read).length;
  const gifts = snailGiftsEndingSoon(14).length;
  setNavBadge("orders", newO + newB);
  setNavBadge("updates", newU + unreadM);
  setNavBadge("snail", gifts, true);
  return { newO: newO, newB: newB, newU: newU, unreadM: unreadM, gifts: gifts };
}

function renderAdminDesk() {
  const list = document.getElementById("admin-desk-list");
  if (!list) return;
  const dateEl = document.getElementById("admin-desk-date");
  const today = new Date();
  if (dateEl) dateEl.textContent = today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  const c = updateAdminNavBadges();
  const orders = dbRead("shop-orders", []);
  const preparing = orders.filter(o => (o.status || "").toLowerCase().indexOf("prepar") > -1).length;
  const members = dbRead("snail-members", []);
  const cycle = snailNowCycle();
  const due = members.filter(m => snailDueInCycle(m, cycle)).length;
  const sentThis = members.filter(m => (m.sentCycles || []).indexOf(cycle) !== -1).length;
  const lowStock = dbRead("shop-catalog", []).filter(p => Number(p.remainingStock) <= 5).length;
  const giftsSoon = snailGiftsEndingSoon(14);

  const rows = [];
  const row = (icon, text, n, go, warn, act) => rows.push({ icon: icon, text: text, n: n, go: go, warn: warn, act: act });

  if (c.newO) row("📦", c.newO + " new order" + (c.newO > 1 ? "s" : "") + " arrived", preparing ? preparing + " to ship" : "", "orders:orders");
  else if (preparing) row("📦", preparing + " order" + (preparing > 1 ? "s" : "") + " waiting to ship", "", "orders:orders");
  if (c.newB) row("🎟️", c.newB + " new workshop booking" + (c.newB > 1 ? "s" : ""), "", "orders:bookings");
  if (due) {
    const d = today.getDate();
    let when;
    if (d < SNAIL_DISPATCH_DAY) when = "post day in " + (SNAIL_DISPATCH_DAY - d) + " day" + (SNAIL_DISPATCH_DAY - d > 1 ? "s" : "");
    else if (d === SNAIL_DISPATCH_DAY) when = "post day is today";
    else when = "past the 5th";
    row("📮", "Post run · " + snailCycleLabel(cycle) + " — " + due + " letter" + (due > 1 ? "s" : "") + " to send" + (sentThis ? " (" + sentThis + " done)" : ""), when, "snail:admin-sub-snail-postrun", d >= SNAIL_DISPATCH_DAY, { id: "stickers", label: "🖨 Stickers" });
  }
  if (c.newU) row("✿", c.newU + " new email signup" + (c.newU > 1 ? "s" : ""), "", "updates");
  if (c.unreadM) row("💌", c.unreadM + " unread message" + (c.unreadM > 1 ? "s" : ""), "", "updates");
  if (lowStock) row("⚠️", lowStock + " shop piece" + (lowStock > 1 ? "s" : "") + " low on stock", "", "shop", true);
  if (giftsSoon.length === 1) {
    const g = giftsSoon[0];
    row("🎁", (g.member.name || g.member.email) + "'s gift ends in " + g.daysLeft + " day" + (g.daysLeft === 1 ? "" : "s"), "", "snail:admin-sub-snail-members", true);
  } else if (giftsSoon.length > 1) {
    row("🎁", giftsSoon.length + " gift subscriptions end within 2 weeks", "", "snail:admin-sub-snail-members", true);
  }
  // Backup nudge — while the business data lives in this browser, one cleared
  // cache loses everything. Nudge after 30 days (or if never backed up).
  const hasData = orders.length + members.length + dbRead("workshop-reservations", []).length + dbRead("email-updates", []).length > 0;
  if (hasData) {
    const lastBackup = safeLocalRead("ubhi-last-backup");
    const daysSince = lastBackup ? Math.floor((today - new Date(lastBackup)) / 86400000) : null;
    if (lastBackup === null || lastBackup === "" ) {
      row("💾", "No data backup yet", "", "settings", true, { id: "backup", label: "💾 Back up now" });
    } else if (daysSince > 30) {
      row("💾", "Last data backup was " + daysSince + " days ago", "", "settings", true, { id: "backup", label: "💾 Back up now" });
    }
  }
  if ((safeLocalRead("ubhi-admin-pass") || "ubhi123") === "ubhi123") {
    row("🔐", "You're still using the default admin passcode — change it in Settings", "", "settings", true);
  }

  list.innerHTML = rows.length
    ? rows.map(r =>
        '<li class="' + (r.warn ? "warn" : "") + '" data-desk-go="' + esc(r.go || "") + '" role="button" tabindex="0">' +
        '<span class="desk-ico" aria-hidden="true">' + r.icon + '</span>' +
        '<span class="desk-text">' + esc(r.text) + '</span>' +
        (r.n ? '<span class="desk-n">' + esc(r.n) + '</span>' : '') +
        (r.act ? '<button type="button" class="desk-act" data-desk-act="' + esc(r.act.id) + '">' + esc(r.act.label) + '</button>' : '') +
        '<span class="desk-go" aria-hidden="true">›</span></li>').join("")
    : '<li class="calm"><span class="desk-ico" aria-hidden="true">🌿</span><span class="desk-text">The desk is clear — nothing waiting. Enjoy the quiet.</span></li>';
}

// One click (or Enter) on a desk row jumps to the matching tab/sub-tab.
// Quick-action buttons on a row do their job right there instead.
document.addEventListener("click", (e) => {
  const act = e.target.closest("#admin-desk-list [data-desk-act]");
  if (act) {
    e.stopPropagation();
    const kind = act.getAttribute("data-desk-act");
    if (kind === "stickers") document.getElementById("admin-print-stickers-btn")?.click();
    if (kind === "backup") {
      document.getElementById("admin-db-backup-btn")?.click();
      setTimeout(() => { if (typeof renderAdminDesk === "function") renderAdminDesk(); }, 400);
    }
    return;
  }
  const li = e.target.closest("#admin-desk-list li[data-desk-go]");
  if (!li) return;
  const go = li.getAttribute("data-desk-go");
  if (!go) return;
  const parts = go.split(":");
  adminGoTab(parts[0], parts[1]);
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const li = e.target.closest && e.target.closest("#admin-desk-list li[data-desk-go]");
  if (!li) return;
  e.preventDefault();
  const parts = (li.getAttribute("data-desk-go") || "").split(":");
  adminGoTab(parts[0], parts[1]);
});

// --- 5. Global Action Handlers ---

function deleteGalleryItem(idx) {
  if (!confirm("Remove this gallery image? This cannot be undone.")) return;
  const items = dbRead("gallery-items", []);
  items.splice(idx, 1);
  dbWrite("gallery-items", items);
  renderHomeGallery();
  renderAdminGallery();
}

function deleteWorkshop(idx) {
  if (!confirm("Remove this workshop? This cannot be undone.")) return;
  const list = dbRead("workshops", []);
  const removed = list.splice(idx, 1)[0];
  dbWrite("workshops", list);
  
  const capacities = dbRead("workshops-capacities", {});
  if (removed && capacities[removed.title]) {
    delete capacities[removed.title];
    dbWrite("workshops-capacities", capacities);
  }
  
  renderWorkshops();
  renderAdminWorkshops();
}

function deleteShopProduct(idx) {
  if (!confirm("Remove this product from the shop? This cannot be undone.")) return;
  const list = dbRead("shop-catalog", []);
  list.splice(idx, 1);
  dbWrite("shop-catalog", list);
  renderShop();
  renderAdminShop();
}

// Auto-expire snail-mail members whose fixed-term subscription has elapsed.
// Each member is flipped to Inactive at most once (autoExpired flag), so a
// manual re-activation after an offline renewal is never silently undone.
// "Monthly" is pay-as-you-go and never auto-expires.
function expireLapsedMembers() {
  const members = dbRead("snail-members", []);
  if (!Array.isArray(members) || !members.length) return 0;
  const now = new Date();
  let changed = 0;
  members.forEach((m) => {
    if (!m || m.status !== "Active" || m.autoExpired) return;
    // Only GIFTS are fixed-length and genuinely end. Paid plans now auto-renew
    // (recurring), so they must NEVER be auto-expired by the calendar.
    if (!(m.isGift || m.giftOn)) return;
    const termMonths = parseInt(m.giftTermMonths, 10) || 0;
    const startStr = m.giftStart || m.dateSubscribed;
    if (!termMonths || !startStr) return;
    const start = new Date(startStr);
    if (isNaN(start.getTime())) return;
    const ends = new Date(start);
    ends.setMonth(ends.getMonth() + termMonths);
    if (now > ends) {
      m.status = "Inactive";
      m.autoExpired = true;
      changed++;
    }
  });
  if (changed) dbWrite("snail-members", members);
  return changed;
}

function toggleMemberStatus(email) {
  const members = dbRead("snail-members", []);
  const member = members.find(m => m.email.toLowerCase() === email.toLowerCase());
  if (member) {
    member.status = member.status === 'Active' ? 'Inactive' : 'Active';
    dbWrite("snail-members", members);
    if (member._sid && window.ubhiPatch) window.ubhiPatch("subscriber", member._sid, { status: member.status });
    renderAdminSnailMail();
  }
}

function deleteSnailMember(email) {
  if (confirm("Are you sure you want to delete this subscriber?")) {
    const members = dbRead("snail-members", []);
    const removedMembers = members.filter(m => m.email.toLowerCase() === email.toLowerCase());
    const updated = members.filter(m => m.email.toLowerCase() !== email.toLowerCase());
    dbWrite("snail-members", updated);
    if (window.ubhiDelete) removedMembers.forEach(m => { if (m._sid) window.ubhiDelete("subscriber", m._sid); });
    const pageSize = parseInt(snailMembersPageSize, 10);
    const totalPages = Math.ceil(updated.length / pageSize) || 1;
    if (snailMembersPage > totalPages) {
      snailMembersPage = totalPages;
    }
    renderAdminSnailMail();
  }
}

function changeSnailPage(p) {
  snailMembersPage = p;
  renderAdminSnailMail();
}

function deleteSnailPhoto(idx) {
  const list = dbRead("snail-photos", []);
  list.splice(idx, 1);
  dbWrite("snail-photos", list);
  renderSnailMailArchive();
  renderAdminSnailMail();
}

function deleteSnailReview(idx) {
  const list = dbRead("snail-reviews", []);
  list.splice(idx, 1);
  dbWrite("snail-reviews", list);
  renderSnailMailReviews();
  renderAdminSnailMail();
}

function deleteJournalPost(idx) {
  if (!confirm("Delete this journal entry? This cannot be undone.")) return;
  const list = dbRead("journal-posts", []);
  list.splice(idx, 1);
  dbWrite("journal-posts", list);
  
  journalEssays = list;
  renderJournal();
  renderAdminJournal();
}

function toggleOrderStatus(orderId) {
  const orders = dbRead("shop-orders", []);
  const order = orders.find(o => (o.reservedAt || o.date || o.orderedAt) === orderId);
  if (order) {
    order.status = order.status === "Shipped" ? "Preparing with care" : "Shipped";
    dbWrite("shop-orders", orders);
    if (order._sid && window.ubhiPatch) window.ubhiPatch("order", order._sid, { status: order.status });
    renderAdminOrders();
  }
}

function setOrderStatus(orderId, value) {
  const orders = dbRead("shop-orders", []);
  const order = orders.find(o => (o.reservedAt || o.date || o.orderedAt) === orderId);
  if (order) {
    order.status = value;
    dbWrite("shop-orders", orders);
    // Reflect the change on the server copy so every device sees it.
    if (order._sid && window.ubhiPatch) window.ubhiPatch("order", order._sid, { status: value });
    renderAdminOrders();
    if (typeof renderAdminOverview === "function") renderAdminOverview();
  }
}

function deleteOrder(orderId) {
  if (confirm("Are you sure you want to delete this order record? This cannot be undone.\n(The pieces in it return to stock.)")) {
    const orders = dbRead("shop-orders", []);
    const removed = orders.find(o => (o.reservedAt || o.date || o.orderedAt) === orderId);
    const updated = orders.filter(o => (o.reservedAt || o.date || o.orderedAt) !== orderId);
    dbWrite("shop-orders", updated);
    if (removed) adjustStockFor(removed, -1);   // put the pieces back on the shelf
    if (removed && removed._sid && window.ubhiDelete) window.ubhiDelete("order", removed._sid);
    renderAdminOrders();
  }
}

function deleteBooking(reservedAt) {
  if (confirm("Are you sure you want to delete this booking reservation?\n(Its seats return to the workshop.)")) {
    const bookings = dbRead("workshop-reservations", []);
    const removed = bookings.find(b => b.reservedAt === reservedAt);
    const updated = bookings.filter(b => b.reservedAt !== reservedAt);
    dbWrite("workshop-reservations", updated);
    if (removed) releaseWorkshopSeats(removed);   // free the seats
    if (removed && removed._sid && window.ubhiDelete) window.ubhiDelete("booking", removed._sid);
    renderAdminOrders();
  }
}

// Safety net: any "clear everything" first downloads a full backup, so the
// worst case is an undo (restore the file in Settings), never a loss.
function downloadBackupFirst() {
  const btn = document.getElementById("admin-db-backup-btn");
  if (btn) { btn.click(); return true; }
  return false;
}

function clearAllOrders() {
  const backedUp = downloadBackupFirst();
  if (confirm("WARNING: This will clear all shop order logs permanently." + (backedUp ? "\n(A full backup was just downloaded — restore it in Settings if you change your mind.)" : "") + "\nAre you sure?")) {
    if (confirm("Please confirm once more: Clear all order logs?")) {
      dbRemove("shop-orders");
      renderAdminOrders();
    }
  }
}

function clearAllBookings() {
  const backedUp = downloadBackupFirst();
  if (confirm("WARNING: This will clear all workshop booking logs permanently." + (backedUp ? "\n(A full backup was just downloaded — restore it in Settings if you change your mind.)" : "") + "\nAre you sure?")) {
    if (confirm("Please confirm once more: Clear all booking logs?")) {
      dbRemove("workshop-reservations");
      renderAdminOrders();
    }
  }
}
window.downloadBackupFirst = downloadBackupFirst;

// Bind handlers to window for HTML click triggers
window.deleteGalleryItem = deleteGalleryItem;
window.deleteWorkshop = deleteWorkshop;
window.deleteShopProduct = deleteShopProduct;
window.toggleMemberStatus = toggleMemberStatus;
window.deleteSnailMember = deleteSnailMember;
window.changeSnailPage = changeSnailPage;
window.deleteSnailPhoto = deleteSnailPhoto;
window.deleteSnailReview = deleteSnailReview;
window.deleteJournalPost = deleteJournalPost;
window.toggleOrderStatus = toggleOrderStatus;
window.setOrderStatus = setOrderStatus;
window.deleteOrder = deleteOrder;
window.deleteBooking = deleteBooking;
window.clearAllOrders = clearAllOrders;
window.clearAllBookings = clearAllBookings;

// --- 6. File Uploader and Form Listeners ---

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Resize/compress an uploaded image before storing. With no backend connected the
// image lives as base64 in localStorage — a full-size phone photo (several MB) would
// overflow the ~5MB quota and the save would silently fail (product never appears).
// Downscaling to ~1280px JPEG keeps each image ~80–250KB. Falls back to the original
// data URL if anything goes wrong, so it can never block a save.
function resizeImageFile(file, maxDim, quality) {
  maxDim = maxDim || 1280;
  quality = quality || 0.85;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const img = new Image();
      img.onload = () => {
        try {
          let w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
          if (!w || !h) { resolve(dataUrl); return; }
          const scale = Math.min(1, maxDim / Math.max(w, h));
          const cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
          const canvas = document.createElement("canvas");
          canvas.width = cw; canvas.height = ch;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, cw, ch);   // flatten transparency to white
          ctx.drawImage(img, 0, 0, cw, ch);
          // Always use the downscaled JPEG so every stored image is bounded in BOTH
          // dimensions (≤maxDim) and size — guarantees it fits localStorage.
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch (e) { resolve(dataUrl); }
      };
      img.onerror = () => resolve(dataUrl);   // not a resizable image — keep as-is
      img.src = dataUrl;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Turn a base64 data URL into a hosted image URL when the backend is connected
// (keeps localStorage / the DB small); otherwise keep the base64 string.
async function hostImage(dataUrl) {
  if (typeof window !== "undefined" && window.ubhiUpload) {
    try { const url = await window.ubhiUpload(dataUrl); if (url) return url; } catch (e) { /* fall back */ }
  }
  return dataUrl;
}

async function getFormImageSource(urlInputId, fileInputId) {
  const fileInput = document.getElementById(fileInputId);
  if (fileInput && fileInput.files && fileInput.files[0]) {
    try {
      return await hostImage(await resizeImageFile(fileInput.files[0]));
    } catch (err) {
      console.error("Error reading file:", err);
    }
  }
  const urlInput = document.getElementById(urlInputId);
  return urlInput ? urlInput.value.trim() : "";
}

// Like getFormImageSource but returns an ARRAY — ALL selected files (each resized)
// plus any comma/newline-separated URLs. For records that hold an image gallery.
async function getFormImageList(urlInputId, fileInputId) {
  const out = [];
  const fileInput = document.getElementById(fileInputId);
  if (fileInput && fileInput.files && fileInput.files.length) {
    for (let i = 0; i < fileInput.files.length; i++) {
      try { out.push(await hostImage(await resizeImageFile(fileInput.files[i]))); }
      catch (err) { console.error("Error reading file:", err); }
    }
  }
  const urlInput = document.getElementById(urlInputId);
  if (urlInput && urlInput.value.trim()) {
    urlInput.value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean).forEach(u => out.push(u));
  }
  return out;
}

// Lightweight admin confirmation toast — so publishing/saving gives visible feedback.
function adminToast(msg) {
  let t = document.getElementById("admin-toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "admin-toast";
    t.style.cssText = "position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:99999;background:#2b2018;color:#f7f0da;padding:11px 22px;border-radius:6px;font-family:'EB Garamond',Georgia,serif;font-size:0.92rem;letter-spacing:0.02em;box-shadow:0 14px 36px -10px rgba(40,28,16,0.6);opacity:0;transition:opacity .25s ease;pointer-events:none;";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = "1";
  clearTimeout(t._hideTimer);
  t._hideTimer = setTimeout(function () { t.style.opacity = "0"; }, 2400);
}
window.adminToast = adminToast;

// Bind Submit Forms
/* ════ EDIT-IN-PLACE ═══════════════════════════════════════════════════
   Every content list reuses its "add" form as the editor: Edit loads the
   record into the form, the submit button becomes "Save changes", and a
   Cancel button appears. Hidden fields (photos, dispatch history, server
   ids) are merge-preserved — editing never destroys what the form
   doesn't show. */
function adminFormEditMode(form, onLabel, cancelFn) {
  if (!form) return;
  const submit = form.querySelector('[type="submit"]');
  if (!submit) return;
  if (!submit.dataset.origLabel) submit.dataset.origLabel = submit.textContent;
  let cancel = form.querySelector(".edit-cancel-btn");
  if (onLabel) {
    submit.textContent = onLabel;
    if (!cancel) {
      cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "button button-ghost edit-cancel-btn";
      cancel.style.marginLeft = "10px";
      cancel.textContent = "Cancel edit";
      submit.insertAdjacentElement("afterend", cancel);
    }
    cancel.onclick = cancelFn;
    cancel.style.display = "";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    submit.textContent = submit.dataset.origLabel;
    if (cancel) cancel.style.display = "none";
  }
}
const setFormVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v == null ? "" : v; };
// Prefill an image-URL field only with real URLs — never a base64 blob.
const urlishOnly = (v) => (v && String(v).indexOf("data:") !== 0 ? v : "");

let adminGalleryEditIdx = null;
function adminEditGalleryItem(idx) {
  const items = dbRead("gallery-items", []);
  const g = items[idx]; if (!g) return;
  adminGalleryEditIdx = idx;
  setFormVal("admin-gallery-url", urlishOnly(g.src));
  setFormVal("admin-gallery-alt", g.alt);
  adminFormEditMode(document.getElementById("admin-add-gallery-form"), "Save changes ✓", () => {
    adminGalleryEditIdx = null;
    document.getElementById("admin-add-gallery-form").reset();
    adminFormEditMode(document.getElementById("admin-add-gallery-form"), null);
  });
}
window.adminEditGalleryItem = adminEditGalleryItem;

let adminShopEditIdx = null;
function adminEditShopProduct(idx) {
  const list = dbRead("shop-catalog", []);
  const p = list[idx]; if (!p) return;
  adminShopEditIdx = idx;
  setFormVal("admin-shop-name", p.name);
  setFormVal("admin-shop-eyebrow", p.category);
  setFormVal("admin-shop-price", p.price);
  setFormVal("admin-shop-stock-total", p.totalStock);
  setFormVal("admin-shop-stock-remaining", p.remainingStock);
  setFormVal("admin-shop-desc-text", p.description);
  const vec = document.getElementById("admin-shop-vector-theme");
  if (vec) vec.value = p.vector || vec.value;
  const urls = (Array.isArray(p.images) ? p.images : [p.image]).filter(Boolean).map(urlishOnly).filter(Boolean);
  setFormVal("admin-shop-img-url", urls.join(", "));
  adminFormEditMode(document.getElementById("admin-add-shop-form"), "Save changes ✓", () => {
    adminShopEditIdx = null;
    document.getElementById("admin-add-shop-form").reset();
    adminFormEditMode(document.getElementById("admin-add-shop-form"), null);
  });
  adminToast('Editing "' + (p.name || "product") + '"');
}
window.adminEditShopProduct = adminEditShopProduct;

let adminWorkshopEditIdx = null;
function adminEditWorkshop(idx) {
  const list = dbRead("workshops", []);
  const w = list[idx]; if (!w) return;
  adminWorkshopEditIdx = idx;
  const caps = dbRead("workshops-capacities", {});
  setFormVal("admin-workshop-title", w.title);
  setFormVal("admin-workshop-eyebrow", w.eyebrow);
  setFormVal("admin-workshop-time", w.time);
  setFormVal("admin-workshop-place", w.place);
  setFormVal("admin-workshop-price", w.price);
  setFormVal("admin-workshop-capacity", (caps[w.title] && caps[w.title].total) != null ? caps[w.title].total : w.capacity);
  setFormVal("admin-workshop-desc", w.desc);
  setFormVal("admin-workshop-img-url", urlishOnly(w.image));
  adminFormEditMode(document.getElementById("admin-add-workshop-form"), "Save changes ✓", () => {
    adminWorkshopEditIdx = null;
    document.getElementById("admin-add-workshop-form").reset();
    adminFormEditMode(document.getElementById("admin-add-workshop-form"), null);
  });
  adminToast('Editing "' + (w.title || "workshop") + '"');
}
window.adminEditWorkshop = adminEditWorkshop;

let adminJournalEditIdx = null;
function adminEditJournalPost(idx) {
  const list = dbRead("journal-posts", []);
  const post = list[idx]; if (!post) return;
  adminJournalEditIdx = idx;
  setFormVal("admin-journal-title", post.title);
  setFormVal("admin-journal-tag", post.tag);
  setFormVal("admin-journal-date", post.date);
  // written essays flow back into the textarea; image-posts keep their image
  const plain = (post.body || "").indexOf("<img") === -1
    ? String(post.body || "").replace(/<\/p>\s*<p>/g, "\n\n").replace(/<\/?p>/g, "").trim()
    : "";
  setFormVal("admin-journal-content", plain);
  adminFormEditMode(document.getElementById("admin-add-journal-form"), "Save changes ✓", () => {
    adminJournalEditIdx = null;
    document.getElementById("admin-add-journal-form").reset();
    adminFormEditMode(document.getElementById("admin-add-journal-form"), null);
  });
  adminToast('Editing "' + (post.title || "post") + '"');
}
window.adminEditJournalPost = adminEditJournalPost;

let adminMemberEditIdx = null;
function adminEditSnailMemberByEmail(email) {
  const members = dbRead("snail-members", []);
  const idx = members.findIndex(m => String(m.email || "").toLowerCase() === String(email).toLowerCase());
  if (idx === -1) return;
  const m = members[idx];
  adminMemberEditIdx = idx;
  // the form lives in the "Add Member" sub-tab — open it first
  const sb = document.querySelector('button[data-subtab="admin-sub-snail-addmember"]');
  if (sb) sb.click();
  setFormVal("admin-m-name", m.name);
  setFormVal("admin-m-email", m.email);
  setFormVal("admin-m-contact", m.contact);
  setFormVal("admin-m-plan", m.plan);
  setFormVal("admin-m-billing", m.billing);
  setFormVal("admin-m-date", m.dateSubscribed);
  setFormVal("admin-m-address", m.address);
  adminFormEditMode(document.getElementById("admin-add-member-form"), "Save changes ✓", () => {
    adminMemberEditIdx = null;
    document.getElementById("admin-add-member-form").reset();
    adminFormEditMode(document.getElementById("admin-add-member-form"), null);
  });
  adminToast('Editing "' + (m.name || m.email) + '" — their letter history is kept');
}
window.adminEditSnailMemberByEmail = adminEditSnailMemberByEmail;

// ── Restock in one click: −/+ stepper on the Shop list (0 … total). ──
function adminStepStock(idx, delta) {
  const list = dbRead("shop-catalog", []);
  const p = list[idx]; if (!p) return;
  let next = (Number(p.remainingStock) || 0) + delta;
  if (next < 0) next = 0;
  const cap = Number(p.totalStock);
  if (!isNaN(cap) && cap > 0 && next > cap) next = cap;
  p.remainingStock = next;
  dbWrite("shop-catalog", list);
  renderAdminShop();
  if (typeof renderShop === "function") renderShop();
  if (typeof renderAdminOverview === "function") renderAdminOverview();
}
window.adminStepStock = adminStepStock;

// ── Duplicate: most new pieces are variants of old ones. ──
function adminDuplicateProduct(idx) {
  const list = dbRead("shop-catalog", []);
  const p = list[idx]; if (!p) return;
  const copy = Object.assign({}, p, { name: (p.name || "Product") + " (copy)" });
  delete copy._sid;
  list.splice(idx + 1, 0, copy);
  dbWrite("shop-catalog", list);
  renderAdminShop();
  if (typeof renderShop === "function") renderShop();
  adminToast('✓ Duplicated — now edit "' + copy.name + '"');
}
window.adminDuplicateProduct = adminDuplicateProduct;

function adminDuplicateWorkshop(idx) {
  const list = dbRead("workshops", []);
  const w = list[idx]; if (!w) return;
  const copy = Object.assign({}, w, { title: (w.title || "Workshop") + " (copy)" });
  list.splice(idx + 1, 0, copy);
  dbWrite("workshops", list);
  const caps = dbRead("workshops-capacities", {});
  const prevCap = caps[w.title];
  caps[copy.title] = { total: (prevCap && prevCap.total) || w.capacity || 10, booked: 0 };
  dbWrite("workshops-capacities", caps);
  renderAdminWorkshops();
  if (typeof renderWorkshops === "function") renderWorkshops();
  adminToast('✓ Duplicated — now edit "' + copy.title + '"');
}
window.adminDuplicateWorkshop = adminDuplicateWorkshop;

// ── One order, opened: everything needed to pack it, address copy-ready. ──
function adminViewOrder(orderId) {
  const o = dbRead("shop-orders", []).find(x => orderRowId(x) === orderId);
  const box = document.getElementById("admin-order-detail");
  if (!o || !box) return;
  const addr = o.shippingAddress || o.address || {};
  const addrLines = [o.name || o.customerName, addr.street, addr.city, addr.postcode, addr.country].filter(Boolean);
  const phone = o.phone || o.mobile || o.customerMobile || "";
  const copyText = addrLines.concat(phone ? [phone] : []).join("\n");
  const items = orderItems(o);
  const rowsH = items.length
    ? items.map(it => `<tr><td>${esc(it.name || "Item")}</td><td style="text-align:center;">× ${esc(it.quantity || 1)}</td><td style="text-align:right;">${it.price != null ? "£" + esc(it.price) : ""}</td></tr>`).join("")
    : `<tr><td>${esc(o.productName || "Order")}</td><td style="text-align:center;">× 1</td><td></td></tr>`;
  let placed = "";
  try { if (o.orderedAt) placed = new Date(o.orderedAt).toLocaleString("en-GB"); } catch (e) {}
  box.innerHTML = `
    <div class="admin-card-header-actions">
      <h4 style="margin:0;">Order ${esc(o.orderRef || o.backendRef || "")} <span class="admin-table-sub">· ${esc(o.status || "Preparing with care")}</span></h4>
      <div style="display:flex;gap:8px;">
        <button type="button" class="admin-mini-btn" id="order-copy-addr">📋 Copy address</button>
        <button type="button" class="admin-mini-btn" onclick="document.getElementById('admin-order-detail').style.display='none'">Close ✕</button>
      </div>
    </div>
    <div class="admin-customer-detail-grid">
      <div><h5>Deliver to</h5><p style="white-space:pre-line;font-size:0.92rem;line-height:1.55;margin:0;">${esc(copyText)}</p></div>
      <div><h5>Inside the parcel</h5>
        <table class="admin-table" style="width:100%;"><tbody>${rowsH}</tbody></table>
        <p style="font-size:0.86rem;margin:8px 0 0;">${o.subtotal != null ? "Subtotal £" + esc(o.subtotal) + " · " : ""}${o.shipping ? "Post £" + esc(o.shipping) + " · " : ""}<strong>Total £${esc(o.totalPrice || o.price || 0)}</strong></p>
      </div>
      <div><h5>Contact</h5><p style="font-size:0.88rem;margin:0;line-height:1.6;">${esc(o.email || o.customerEmail || "—")}${placed ? "<br>Placed " + esc(placed) : ""}</p></div>
    </div>`;
  box.style.display = "block";
  const cp = document.getElementById("order-copy-addr");
  if (cp) cp.onclick = () => {
    const done = () => { cp.textContent = "✓ Copied"; setTimeout(() => { cp.textContent = "📋 Copy address"; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(copyText).then(done, () => window.prompt("Copy the address:", copyText.replace(/\n/g, ", ")));
    } else {
      window.prompt("Copy the address:", copyText.replace(/\n/g, ", "));
    }
  };
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
window.adminViewOrder = adminViewOrder;

const addGalleryForm = document.getElementById("admin-add-gallery-form");
if (addGalleryForm) {
  addGalleryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const src = await getFormImageSource("admin-gallery-url", "admin-gallery-file");
    const alt = document.getElementById("admin-gallery-alt")?.value || "";

    const items = dbRead("gallery-items", []);
    if (adminGalleryEditIdx != null && items[adminGalleryEditIdx]) {
      const prev = items[adminGalleryEditIdx];
      items[adminGalleryEditIdx] = { src: src || prev.src, alt };
      dbWrite("gallery-items", items);
      adminGalleryEditIdx = null;
      adminFormEditMode(addGalleryForm, null);
      adminToast("✓ Gallery image updated");
    } else {
      if (!src) {
        alert("Please enter an image URL or select a local file.");
        return;
      }
      items.push({ src, alt });
      dbWrite("gallery-items", items);
    }

    addGalleryForm.reset();
    renderHomeGallery();
    renderAdminGallery();
  });
}

// Art Portfolio — add a new piece (title + first photo)
const addArtPieceForm = document.getElementById("admin-add-artpiece-form");
if (addArtPieceForm) {
  addArtPieceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = (document.getElementById("admin-artpiece-title")?.value || "").trim();
    const src = await getFormImageSource("admin-artpiece-url", "admin-artpiece-file");
    if (!title) { alert("Please give the piece a title."); return; }
    if (!src) { alert("Please add a first photo — paste a URL or choose a file."); return; }
    const pieces = dbRead("art-pieces", []);
    pieces.push({ title, images: [src] });
    dbWrite("art-pieces", pieces);
    addArtPieceForm.reset();
    if (typeof renderArtAdmin === "function") renderArtAdmin();
    if (typeof renderArtPortfolio === "function") renderArtPortfolio();
  });
}

// ── Admin "Server connection" panel (Settings tab) ───────────────────────────
// Lets the owner / staff sign in to the backend so edits are saved server-side
// and shared everywhere. Works only when ubhi-sync.js reports a reachable API.
function updateServerPill() {
  const pill = document.getElementById("srv-status-pill");
  const disc = document.getElementById("srv-disconnect");
  const emailInput = document.getElementById("srv-email");
  if (!pill) return;
  const st = (typeof window.ubhiSyncStatus === "function") ? window.ubhiSyncStatus() : { reachable: false, connected: false, email: "" };
  if (!st.reachable) {
    pill.textContent = "Server offline"; pill.className = "srv-pill srv-off";
  } else if (st.connected) {
    pill.textContent = "Connected"; pill.className = "srv-pill srv-on";
  } else {
    pill.textContent = "Not connected"; pill.className = "srv-pill srv-off";
  }
  if (disc) disc.style.display = st.connected ? "" : "none";
  if (emailInput && st.email && !emailInput.value) emailInput.value = st.email;
}
window.updateServerPill = updateServerPill;

(function initServerConnect() {
  const form = document.getElementById("admin-srv-form");
  if (!form) return;
  const msg = document.getElementById("srv-msg");
  const disc = document.getElementById("srv-disconnect");
  const showMsg = (text, ok) => { if (!msg) return; msg.style.display = "block"; msg.textContent = text; msg.style.color = ok ? "#3a6a55" : "#9e3429"; };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (typeof window.ubhiSyncConnect !== "function") { showMsg("The server connector isn't loaded.", false); return; }
    const email = (document.getElementById("srv-email")?.value || "").trim();
    const password = document.getElementById("srv-pass")?.value || "";
    if (!email || !password) { showMsg("Enter your email and password.", false); return; }
    showMsg("Connecting…", true);
    const res = await window.ubhiSyncConnect(email, password);
    if (res && res.ok) {
      showMsg("Connected — your edits now save to the server.", true);
      const p = document.getElementById("srv-pass"); if (p) p.value = "";
    } else {
      showMsg((res && res.error) || "Could not connect.", false);
    }
    updateServerPill();
  });

  if (disc) disc.addEventListener("click", () => {
    if (typeof window.ubhiSyncDisconnect === "function") window.ubhiSyncDisconnect();
    showMsg("Disconnected. Edits are saved on this device only.", true);
    updateServerPill();
  });

  updateServerPill();
})();

const addWorkshopForm = document.getElementById("admin-add-workshop-form");
if (addWorkshopForm) {
  addWorkshopForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("admin-workshop-title")?.value || "";
    const eyebrow = document.getElementById("admin-workshop-eyebrow")?.value || "";
    const image = await getFormImageSource("admin-workshop-img-url", "admin-workshop-img-file");
    const time = document.getElementById("admin-workshop-time")?.value || "";
    const place = document.getElementById("admin-workshop-place")?.value || "";
    const price = parseInt(document.getElementById("admin-workshop-price")?.value || "0", 10);
    const capacity = parseInt(document.getElementById("admin-workshop-capacity")?.value || "10", 10);
    const desc = document.getElementById("admin-workshop-desc")?.value || "";

    const list = dbRead("workshops", []);
    if (adminWorkshopEditIdx != null && list[adminWorkshopEditIdx]) {
      // EDIT: merge over the existing workshop; capacity entry follows a
      // rename and keeps its booked count (never above the new total).
      const prev = list[adminWorkshopEditIdx];
      const oldTitle = prev.title;
      list[adminWorkshopEditIdx] = Object.assign({}, prev, { title, eyebrow, desc, time, place, price, capacity, image: image || prev.image });
      dbWrite("workshops", list);
      const capacities = dbRead("workshops-capacities", {});
      const prevCap = capacities[oldTitle] || { total: capacity, booked: 0 };
      if (oldTitle !== title) delete capacities[oldTitle];
      capacities[title] = { total: capacity, booked: Math.min(Number(prevCap.booked) || 0, capacity) };
      dbWrite("workshops-capacities", capacities);
      adminWorkshopEditIdx = null;
      adminFormEditMode(addWorkshopForm, null);
      addWorkshopForm.reset();
      renderWorkshops();
      renderAdminWorkshops();
      adminToast("✓ Workshop updated");
      return;
    }
    list.push({ title, eyebrow, desc, time, place, price, capacity, image });
    dbWrite("workshops", list);
    // Confirm it persisted — a too-large poster can overflow localStorage.
    if (dbRead("workshops", []).length < list.length) {
      adminToast("⚠ Couldn't save — the poster image is too large. Please use a smaller image.");
      return;
    }

    const capacities = dbRead("workshops-capacities", {});
    capacities[title] = { total: capacity, booked: 0 };
    dbWrite("workshops-capacities", capacities);

    addWorkshopForm.reset();
    renderWorkshops();
    renderAdminWorkshops();
    adminToast("✓ Workshop published");
  });
}

const addShopForm = document.getElementById("admin-add-shop-form");
if (addShopForm) {
  addShopForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("admin-shop-name")?.value || "";
    const category = document.getElementById("admin-shop-eyebrow")?.value || "";
    const price = parseInt(document.getElementById("admin-shop-price")?.value || "0", 10);
    const totalStock = parseInt(document.getElementById("admin-shop-stock-total")?.value || "10", 10);
    const remainingStock = parseInt(document.getElementById("admin-shop-stock-remaining")?.value || "10", 10);
    const vector = document.getElementById("admin-shop-vector-theme")?.value || "";
    const images = await getFormImageList("admin-shop-img-url", "admin-shop-img-file");
    const image = images[0] || "";   // primary image (card thumbnail + back-compat)
    const description = document.getElementById("admin-shop-desc-text")?.value || "";

    const list = dbRead("shop-catalog", []);
    if (adminShopEditIdx != null && list[adminShopEditIdx]) {
      // EDIT: merge over the existing product — photos are kept unless new
      // ones were provided (the URL field carries existing links through).
      const prev = list[adminShopEditIdx];
      list[adminShopEditIdx] = Object.assign({}, prev, {
        name, category, price, totalStock, remainingStock, vector, description,
        image: image || prev.image,
        images: (images && images.length) ? images : prev.images
      });
      dbWrite("shop-catalog", list);
      adminShopEditIdx = null;
      adminFormEditMode(addShopForm, null);
      addShopForm.reset();
      renderShop();
      renderAdminShop();
      adminToast("✓ Product updated");
      return;
    }
    // Guard against accidental duplicates (e.g. a double-click on Publish).
    const dupe = list.some(p => String(p.name || "").trim().toLowerCase() === name.trim().toLowerCase());
    if (dupe && !confirm('A product called "' + name.trim() + '" already exists. Add it again anyway?')) {
      return;
    }
    list.push({ name, category, price, totalStock, remainingStock, vector, image, images, description });
    dbWrite("shop-catalog", list);
    // Confirm it persisted — a too-large image can overflow localStorage and the
    // write fails silently, so the product would never appear.
    if (dbRead("shop-catalog", []).length < list.length) {
      adminToast("⚠ Couldn't save — the image is too large. Please use a smaller image.");
      return;
    }

    addShopForm.reset();
    renderShop();
    renderAdminShop();
    adminToast("✓ Product published");
  });
}

const addSnailPhotoForm = document.getElementById("admin-add-snail-photo-form");
if (addSnailPhotoForm) {
  addSnailPhotoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const src = await getFormImageSource("admin-snail-photo-url", "admin-snail-photo-file");
    const caption = document.getElementById("admin-snail-photo-caption")?.value || "";
    const month = document.getElementById("admin-snail-photo-month")?.value || "";

    if (!src) {
      alert("Please enter an image URL or select a local file.");
      return;
    }

    const list = dbRead("snail-photos", []);
    list.push({ src, caption, month });
    dbWrite("snail-photos", list);

    addSnailPhotoForm.reset();
    renderSnailMailArchive();
    renderAdminSnailMail();
  });
}

const addSnailReviewForm = document.getElementById("admin-add-snail-review-form");
if (addSnailReviewForm) {
  addSnailReviewForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const author = document.getElementById("admin-snail-review-author")?.value || "";
    const stamp = document.getElementById("admin-snail-review-stamp")?.value || "🪷";
    const text = document.getElementById("admin-snail-review-text")?.value || "";

    const list = dbRead("snail-reviews", []);
    list.push({ author, stamp, text });
    dbWrite("snail-reviews", list);

    addSnailReviewForm.reset();
    renderSnailMailReviews();
    renderAdminSnailMail();
  });
}

const addJournalForm = document.getElementById("admin-add-journal-form");
if (addJournalForm) {
  // Handle toggling of file uploader based on radio choice for headers
  const uploader = document.getElementById("journal-image-uploader-wrapper");
  const radioButtons = document.querySelectorAll('input[name="journal-visual-type"]');
  radioButtons.forEach(radio => {
    radio.addEventListener("change", (e) => {
      if (uploader) {
        uploader.style.display = e.target.value === "image" ? "flex" : "none";
      }
    });
  });

  // Handle toggling of image uploader vs text essay content type
  const textContentWrapper = document.getElementById("journal-text-content-wrapper");
  const imageContentWrapper = document.getElementById("journal-image-content-wrapper");
  const contentRadioButtons = document.querySelectorAll('input[name="journal-content-type"]');
  
  contentRadioButtons.forEach(radio => {
    radio.addEventListener("change", (e) => {
      if (textContentWrapper && imageContentWrapper) {
        if (e.target.value === "image") {
          textContentWrapper.style.display = "none";
          imageContentWrapper.style.display = "flex";
        } else {
          textContentWrapper.style.display = "flex";
          imageContentWrapper.style.display = "none";
        }
      }
    });
  });

  addJournalForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("admin-journal-title")?.value || "";
    const tag = document.getElementById("admin-journal-tag")?.value || "Philosophy";
    const date = document.getElementById("admin-journal-date")?.value || "";
    const visualType = document.querySelector('input[name="journal-visual-type"]:checked')?.value || "vector";
    const contentType = document.querySelector('input[name="journal-content-type"]:checked')?.value || "text";
    
    // 1. Process Visual Header
    let art = "";
    if (visualType === "vector") {
      const vectors = [
        `<svg viewBox="0 0 160 160" fill="none" width="110" height="110"><circle cx="80" cy="80" r="76" stroke="rgba(201,151,42,0.35)" stroke-width="0.6"/><circle cx="80" cy="80" r="50" stroke="rgba(201,151,42,0.25)" stroke-width="0.5"/><circle cx="80" cy="80" r="25" stroke="rgba(201,151,42,0.4)" stroke-width="0.6"/><polygon points="80,14 138,116 22,116" stroke="rgba(201,151,42,0.4)" stroke-width="0.6" fill="rgba(201,151,42,0.04)"/><polygon points="80,146 138,44 22,44" stroke="rgba(181,96,122,0.3)" stroke-width="0.6" fill="none"/><circle cx="80" cy="80" r="5" fill="rgba(201,151,42,0.6)"/></svg>`,
        `<svg viewBox="0 0 160 160" fill="none" width="110" height="110"><circle cx="80" cy="80" r="76" stroke="rgba(201,151,42,0.3)" stroke-width="0.6"/><circle cx="80" cy="22" r="58" stroke="rgba(201,151,42,0.1)" stroke-width="0.4"/><circle cx="130" cy="51" r="58" stroke="rgba(201,151,42,0.1)" stroke-width="0.4"/><circle cx="130" cy="109" r="58" stroke="rgba(201,151,42,0.1)" stroke-width="0.4"/><circle cx="80" cy="80" r="8" stroke="rgba(201,151,42,0.5)" stroke-width="0.6"/><circle cx="80" cy="80" r="3" fill="rgba(201,151,42,0.6)"/></svg>`,
        `<svg viewBox="0 0 160 160" fill="none" width="110" height="110"><rect x="20" y="20" width="120" height="120" stroke="rgba(45,139,124,0.35)" stroke-width="0.6" fill="none"/><rect x="40" y="40" width="80" height="80" stroke="rgba(45,139,124,0.28)" stroke-width="0.5" fill="none" transform="rotate(45 80 80)"/><circle cx="80" cy="80" r="40" stroke="rgba(45,139,124,0.35)" stroke-width="0.6"/><circle cx="80" cy="18" r="18" stroke="rgba(45,139,124,0.5)" stroke-width="0.6"/><circle cx="80" cy="80" r="5" fill="rgba(45,139,124,0.6)"/></svg>`
      ];
      art = vectors[Math.floor(Math.random() * vectors.length)];
    } else {
      const src = await getFormImageSource("admin-journal-img-url", "admin-journal-img-file");
      if (src) {
        art = `<div style="background:url('${src}') center/cover no-repeat;width:100%;height:100%;border-radius:2px;"></div>`;
      }
    }

    // 2. Process Content (Text vs Image)
    let body = "";
    if (contentType === "image") {
      const imageSrc = await getFormImageSource("admin-journal-content-img-url", "admin-journal-content-img-file");
      if (!imageSrc) {
        alert("Please select an image file or type a URL for the journal page image content.");
        return;
      }
      body = `<img src="${imageSrc}" style="width:100%; max-height: 700px; object-fit: contain; border-radius: 4px; border: 1px solid var(--border-color); box-shadow:var(--shadow);" alt="Handwritten journal entry ${title}" />`;
    } else {
      const content = document.getElementById("admin-journal-content")?.value || "";
      body = content.split("\n\n").map(paragraph => `<p>${paragraph.trim()}</p>`).join("\n");
    }

    const list = dbRead("journal-posts", []);
    if (adminJournalEditIdx != null && list[adminJournalEditIdx]) {
      // EDIT: keep the existing header art unless a new image was chosen, and
      // keep an image-body when the textarea was left untouched.
      const prev = list[adminJournalEditIdx];
      const keepArt = (visualType === "vector") ? prev.art : (art || prev.art);
      const textareaVal = (document.getElementById("admin-journal-content")?.value || "").trim();
      const keepBody = (contentType === "image")
        ? (body || prev.body)
        : (textareaVal ? body : prev.body);
      list[adminJournalEditIdx] = Object.assign({}, prev, { title, tag, date, art: keepArt, body: keepBody });
      adminJournalEditIdx = null;
      adminFormEditMode(addJournalForm, null);
      adminToast("✓ Journal entry updated");
    } else {
      list.push({ title, tag, date, art, body });
    }
    dbWrite("journal-posts", list);

    journalEssays = list;
    
    // Reset forms
    addJournalForm.reset();
    if (uploader) uploader.style.display = "none";
    if (textContentWrapper) textContentWrapper.style.display = "flex";
    if (imageContentWrapper) imageContentWrapper.style.display = "none";

    renderJournal();
    renderAdminJournal();
  });
}

// --- 7. Passcode Auth & Lock Actions ---

// The unlock passcode — admin can change it from Settings (defaults to ubhi123).
function getAdminPass() {
  return safeLocalRead("ubhi-admin-pass") || "ubhi123";
}

const loginForm = document.getElementById("admin-login-form");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const passcode = document.getElementById("admin-passcode")?.value || "";
    const errorMsg = document.getElementById("admin-login-error");

    if (passcode === getAdminPass()) {
      safeLocalWrite("ubhi-admin-authenticated", "true");
      if (errorMsg) errorMsg.style.display = "none";
      
      const gate = document.getElementById("admin-gate");
      const dashboard = document.getElementById("admin-dashboard");
      if (gate) gate.style.display = "none";
      if (dashboard) {
        dashboard.style.display = "grid";
        renderAdminDashboard();
      }
    } else {
      if (errorMsg) {
        errorMsg.textContent = "Invalid credentials. Try again.";
        errorMsg.style.display = "block";
      }
    }
  });
}

const logoutBtn = document.getElementById("admin-logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    safeLocalRemove("ubhi-admin-authenticated");
    const gate = document.getElementById("admin-gate");
    const dashboard = document.getElementById("admin-dashboard");
    if (gate) gate.style.display = "flex";
    if (dashboard) dashboard.style.display = "none";
    const passcodeEl = document.getElementById("admin-passcode");
    if (passcodeEl) passcodeEl.value = "";
  });
}

// Change passcode (Settings tab)
const changePassForm = document.getElementById("admin-change-pass-form");
if (changePassForm) {
  changePassForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const cur = document.getElementById("admin-current-pass")?.value || "";
    const nw = document.getElementById("admin-new-pass")?.value || "";
    const cf = document.getElementById("admin-confirm-pass")?.value || "";
    const msg = document.getElementById("admin-pass-msg");
    const show = (text, ok) => {
      if (!msg) return;
      msg.textContent = text;
      msg.style.display = "block";
      msg.style.color = ok ? "#1f6b5e" : "#a23b52";
    };
    if (cur !== getAdminPass()) { show("Current passcode is incorrect.", false); return; }
    if (nw.length < 4) { show("New passcode must be at least 4 characters.", false); return; }
    if (nw !== cf) { show("New passcodes do not match.", false); return; }
    safeLocalWrite("ubhi-admin-pass", nw);
    changePassForm.reset();
    show("Passcode updated — use it next time you unlock the desk.", true);
  });
}

// Reset to fresh data (Settings · danger zone). Wipes all ubhi- content keys
// (keeping the passcode + login) and reloads so the defaults re-seed.
const resetDataBtn = document.getElementById("admin-reset-data-btn");
if (resetDataBtn) {
  resetDataBtn.addEventListener("click", () => {
    if (!confirm("Reset to fresh data?\n\nThis erases ALL saved content in this browser — orders, bookings, members, subscribers, and any workshops, products or posts you've added — and restores the original samples.\n\nThis cannot be undone.")) return;
    if (!confirm("Last check: really erase everything and start fresh? There is no undo.")) return;
    try {
      const keep = { "ubhi-admin-pass": true, "ubhi-admin-authenticated": true };
      const toRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf("ubhi-") === 0 && !keep[k]) toRemove.push(k);
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.error("Reset to fresh data failed:", e);
    }
    alert("Fresh data restored. Reloading the desk…");
    location.reload();
  });
}

// ── Member account ("Your Almanac") ──────────────────────────────
// DEMO ONLY. ░ FOR THE DEVELOPER ░ Replace the sign-in below with real
// authentication, and replace DEMO_MEMBER_ACCOUNT with the signed-in
// customer's real records (subscription synced from Stripe; orders &
// workshops from your database, filtered to this customer).
// ── Member accounts (demo store) ─────────────────────────────────
// INTEGRATION: replace with real auth + a real database. A member is
// { name, email, password, phone, address, city, postcode, country,
//   marketingOptIn, joinedAt }. Orders/bookings are matched by email.
function getMembers() { return dbRead("members", []); }
function findMember(email) {
  const e = String(email || "").trim().toLowerCase();
  return getMembers().find((m) => String(m.email || "").toLowerCase() === e) || null;
}
function saveMember(member) {
  const members = getMembers();
  const i = members.findIndex((m) => String(m.email || "").toLowerCase() === String(member.email || "").toLowerCase());
  if (i > -1) members[i] = Object.assign({}, members[i], member);
  else members.push(member);
  dbWrite("members", members);
}

function memberBillingPortal() {
  // Until online billing (Stripe Customer Portal) is switched on, plan changes
  // are handled personally — open the member's email app with a ready note.
  let email = "";
  try { email = localStorage.getItem("ubhi-member-email") || ""; } catch (e) {}
  if (!confirm("Plan changes are handled personally by the studio — your email app will open with a ready-made note. We reply within a day.")) return;
  const subject = encodeURIComponent("My Snail Mail plan — change request");
  const body = encodeURIComponent(
    "Hello Chelsea,\n\nI'd like to make a change to my Snail Mail subscription.\n\n" +
    "My account email: " + email + "\nWhat I'd like to change: \n\nThank you!"
  );
  window.location.href = "mailto:hello@ubhi.in?subject=" + subject + "&body=" + body;
}
window.memberBillingPortal = memberBillingPortal;

function memberBadge(status) {
  return '<span class="m-badge ' + String(status).toLowerCase() + '">' + status + '</span>';
}

// Renders the signed-in customer's REAL history — orders, bookings and
// subscription matched to their email — with friendly empty states.
function renderMemberDashboard() {
  const email = (safeLocalRead("ubhi-member-email") || "").toLowerCase();
  const member = findMember(email) || {};
  const nameEl = document.getElementById("member-name");
  if (nameEl) nameEl.textContent = member.name || safeLocalRead("ubhi-member-name") || "friend";

  const mine = (o) => String(o.email || o.customerEmail || "").toLowerCase() === email;
  const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return ""; } };

  // ── Snail Mail subscription (from the members sheet) ──
  const sub = dbRead("snail-members", []).find((m) => String(m.email || "").toLowerCase() === email);
  const subEl = document.getElementById("member-subscription");
  if (subEl) {
    subEl.innerHTML = sub
      ? '<div class="sub-top"><span class="sub-plan">' + esc(sub.plan || "Subscription") + '</span>' + memberBadge(sub.status === "Active" ? "Active" : "Paused") + '</div>' +
        '<div class="sub-meta">' +
          '<div><span>Billing</span><strong>' + esc(sub.billing || "—") + '</strong></div>' +
          '<div><span>Member since</span><strong>' + esc(sub.dateSubscribed || "—") + '</strong></div>' +
        '</div>' +
        '<div class="sub-actions">' +
          '<button type="button" class="button button-primary" onclick="memberBillingPortal()">Manage payment &amp; plan</button>' +
          '<button type="button" class="button button-ghost" onclick="memberBillingPortal()">Pause or cancel</button>' +
        '</div>' +
        '<p class="sub-note">Payments are handled securely by Stripe — we never see or store your card.</p>'
      : '<p class="sub-note">You don\'t have a Snail Mail subscription yet. <a href="#snail-mail" data-page-link="snail-mail">Join the club &rarr;</a></p>';
  }

  // ── Shop orders (only this customer's) ──
  const orders = dbRead("shop-orders", []).filter(mine).sort((a, b) => new Date(b.orderedAt || 0) - new Date(a.orderedAt || 0));
  const ordEl = document.getElementById("member-orders");
  if (ordEl) {
    ordEl.innerHTML = orders.length
      ? orders.map((o) => {
          const items = (o.items && o.items.length) ? o.items.map((i) => esc(i.name) + (i.quantity > 1 ? " ×" + i.quantity : "")).join(", ") : esc(o.productName || "Order");
          return '<div class="member-row"><div class="member-row-main">' +
            '<span class="member-row-title">' + items + '</span>' +
            '<span class="member-row-sub">' + fmtDate(o.orderedAt) + '</span>' +
          '</div><div class="member-row-side">' +
            '<span class="member-row-total">£' + (o.totalPrice || o.price || 0) + '</span>' + memberBadge(o.status || "Preparing") +
          '</div></div>';
        }).join("")
      : '<p class="sub-note">No orders yet. <a href="#shop" data-page-link="shop">Visit the shop &rarr;</a></p>';
  }

  // ── Workshop bookings (only this customer's) ──
  const bookings = dbRead("workshop-reservations", []).filter(mine).sort((a, b) => new Date(b.reservedAt || 0) - new Date(a.reservedAt || 0));
  const wsEl = document.getElementById("member-workshops");
  if (wsEl) {
    wsEl.innerHTML = bookings.length
      ? bookings.map((b) =>
          '<div class="member-row"><div class="member-row-main">' +
            '<span class="member-row-title">' + esc(b.workshop) + '</span>' +
            '<span class="member-row-sub">' + esc(b.date || "") + '</span>' +
          '</div><div class="member-row-side">' + memberBadge(b.status || "Confirmed") + '</div></div>'
        ).join("")
      : '<p class="sub-note">No workshops booked yet. <a href="#workshops" data-page-link="workshops">See the workshops &rarr;</a></p>';
  }
}

// (LAUNCH-CLEAN: the demo member "Abhi" and his fabricated order/booking
// history are no longer seeded — real accounts are created at the admin's
// People tab, and existing browsers are cleaned by purgeDemoData() above.)

const memberLoginForm = document.getElementById("member-login-form");
let memberGateMode = "signin";   // "signin" | "create" — toggled by the "Create an account" link
if (memberLoginForm) {
  memberLoginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = (document.getElementById("member-email")?.value || "").trim();
    const pass = document.getElementById("member-pass")?.value || "";
    const msg = document.getElementById("member-login-msg");
    const say = (text) => { if (msg) { msg.style.display = "block"; msg.style.color = "#a23b52"; msg.textContent = text; } };

    const finishSignIn = (member) => {
      if (msg) msg.style.display = "none";
      safeLocalWrite("ubhi-member-authenticated", "true");
      safeLocalWrite("ubhi-member-email", member.email);
      safeLocalWrite("ubhi-member-name", member.name || member.email.split("@")[0]);
      const mGate = document.getElementById("member-gate");
      const mDash = document.getElementById("member-dashboard");
      if (mGate) mGate.style.display = "none";
      if (mDash) mDash.style.display = "block";
      renderMemberDashboard();
    };

    // Create mode: a small local sign-up (stored in this browser until real
    // authentication is wired in). Uses the same email their orders live under.
    if (memberGateMode === "create") {
      const nameNew = (document.getElementById("member-name")?.value || "").trim();
      if (!nameNew) { say("Mind telling us your name?"); return; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { say("That email looks off — mind checking it?"); return; }
      if (String(pass).length < 4) { say("Please pick a password of at least 4 characters."); return; }
      if (findMember(email)) { say("An account with that email already exists — sign in instead."); return; }
      saveMember({ name: nameNew, email: email, password: pass, joinedAt: new Date().toISOString().split("T")[0], active: true, marketingOptIn: false });
      finishSignIn({ name: nameNew, email: email });
      return;
    }

    // INTEGRATION: verify credentials against your real auth provider here.
    const member = findMember(email);
    if (!member || member.password !== pass) {
      say("Those details don't match an account. New here? Tap “Create an account” below.");
      return;
    }
    if (member.active === false) {
      say("This account is currently paused. Please email hello@ubhi.in for help.");
      return;
    }
    finishSignIn(member);
  });
}

const memberLogoutBtn = document.getElementById("member-logout-btn");
if (memberLogoutBtn) {
  memberLogoutBtn.addEventListener("click", () => {
    safeLocalRemove("ubhi-member-authenticated");
    safeLocalRemove("ubhi-member-email");
    safeLocalRemove("ubhi-member-name");
    const mGate = document.getElementById("member-gate");
    const mDash = document.getElementById("member-dashboard");
    if (mGate) mGate.style.display = "";
    if (mDash) mDash.style.display = "none";
    const pw = document.getElementById("member-pass");
    if (pw) pw.value = "";
  });
}

// "Create an account" flips the sign-in card into a small sign-up and back.
const memberCreateLink = document.getElementById("member-create");
if (memberCreateLink) memberCreateLink.addEventListener("click", (e) => {
  e.preventDefault();
  memberGateMode = memberGateMode === "create" ? "signin" : "create";
  const creating = memberGateMode === "create";
  const nameField = document.getElementById("member-name-field");
  const submitBtn = document.querySelector("#member-login-form .member-login-btn");
  const msg = document.getElementById("member-login-msg");
  if (nameField) nameField.style.display = creating ? "" : "none";
  if (submitBtn) submitBtn.textContent = creating ? "Create my account" : "Sign in";
  memberCreateLink.textContent = creating ? "I already have an account" : "Create an account";
  if (msg) msg.style.display = "none";
  if (creating) document.getElementById("member-name")?.focus();
});

// "Forgot password" — handled personally until real auth: opens a ready email.
const memberForgotLink = document.getElementById("member-forgot");
if (memberForgotLink) memberForgotLink.addEventListener("click", (e) => {
  e.preventDefault();
  const emailVal = (document.getElementById("member-email")?.value || "").trim();
  const msg = document.getElementById("member-login-msg");
  if (msg) {
    msg.style.display = "block";
    msg.style.color = "var(--mist)";
    msg.textContent = "Your email app is opening — we'll sort your password personally, usually within a day.";
  }
  window.location.href = "mailto:hello@ubhi.in?subject=" + encodeURIComponent("Password help — Your Almanac") +
    "&body=" + encodeURIComponent("Hello Chelsea,\n\nI can't get into my account" + (emailVal ? " (" + emailVal + ")" : "") + " — could you help me reset the password?\n\nThank you!");
});

// --- 8. CSV Exporter & Address Stickers Printer ---

const exportCsvBtn = document.getElementById("admin-export-csv-btn");
if (exportCsvBtn) {
  exportCsvBtn.addEventListener("click", () => {
    const members = dbRead("snail-members", []);
    if (members.length === 0) {
      alert("No members found in the subscriber database.");
      return;
    }

    let csvContent = "Name,Email,Contact Number,Plan,Billing,Shipping Address,Date Subscribed,Status\n";

    members.forEach(m => {
      const row = [
        m.name,
        m.email,
        m.contact || "",
        m.plan,
        m.billing,
        m.address,
        m.dateSubscribed,
        m.status
      ].map(field => {
        let f = String(field || "").replace(/"/g, '""');
        if (f.includes(",") || f.includes("\n") || f.includes('"')) {
          f = `"${f}"`;
        }
        return f;
      }).join(",");
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ubhi_snail_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

const printStickersBtn = document.getElementById("admin-print-stickers-btn");
if (printStickersBtn) {
  const mailCycle = () => new Date().toISOString().slice(0, 7);                 // "2026-06"
  const cycleLabel = () => new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  function stickerLabelHtml(m) {
    const addr = String(m.address || "").split(",").map(s => esc(s.trim())).filter(Boolean).join("<br>");
    const contact = m.contact ? esc(m.contact) : "";
    return '<div class="address-label">' +
      '<div class="al-name">' + esc(m.name || "") + '</div>' +
      '<div class="al-address">' + (addr || '<span style="color:#999">No address on file</span>') + '</div>' +
      (contact ? '<div class="al-contact">' + contact + '</div>' : '') +
      '</div>';
  }

  // Print a label sheet from an ISOLATED hidden iframe — the reliable cross-browser way.
  // (Avoids the fragile "hide the whole page, print the overlay" trick that printed blank.)
  function printLabelSheet(members) {
    const labels = members.map(stickerLabelHtml).join("");
    let frame = document.getElementById("sticker-print-frame");
    if (frame) frame.remove();
    frame = document.createElement("iframe");
    frame.id = "sticker-print-frame";
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed; right:0; bottom:0; width:1px; height:1px; border:0; opacity:0;";
    document.body.appendChild(frame);
    const d = frame.contentWindow.document;
    d.open();
    d.write(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Address labels</title><style>' +
      '@page{ size:A4 portrait; margin:8mm 5mm; }' +
      '*{ box-sizing:border-box; }' +
      'html,body{ margin:0; padding:0; }' +
      '.sheet{ font-size:0; }' +
      '.address-label{ display:inline-block; vertical-align:top; width:33.33%; height:38mm; padding:4mm 4.5mm; border:1px dashed #c8c8c8; overflow:hidden; font-family:Arial,Helvetica,sans-serif; font-size:10pt; line-height:1.3; color:#111; page-break-inside:avoid; break-inside:avoid; }' +
      '.al-name{ font-weight:bold; text-transform:uppercase; font-size:10.5pt; letter-spacing:.3px; margin-bottom:1.6mm; }' +
      '.al-address{ font-size:9.5pt; }' +
      '.al-contact{ margin-top:1.6mm; font-size:8.5pt; color:#555; }' +
      '</style></head><body><div class="sheet">' + labels + '</div></body></html>'
    );
    d.close();
    const w = frame.contentWindow;
    const go = () => { try { w.focus(); w.print(); } catch (e) {} };
    if (d.readyState === "complete") setTimeout(go, 250);
    else { w.onload = () => setTimeout(go, 250); setTimeout(go, 600); }
  }

  function closeStickerPreview() {
    const o = document.getElementById("sticker-preview-overlay");
    if (o) o.remove();
    document.body.classList.remove("sticker-preview-open");
    document.removeEventListener("keydown", onStickerEsc);
  }
  function onStickerEsc(e) { if (e.key === "Escape") closeStickerPreview(); }

  function showStickerPreview(members, headingNote, isReprint) {
    closeStickerPreview();
    const cycle = mailCycle();
    const emails = members.map(m => String(m.email || "").toLowerCase());
    const overlay = document.createElement("div");
    overlay.id = "sticker-preview-overlay";
    overlay.innerHTML =
      '<div class="sticker-toolbar">' +
        '<span class="stk-count">' + headingNote + '</span>' +
        '<span class="stk-actions">' +
          '<button type="button" class="button button-primary" id="sticker-do-print">🖨️ Print labels</button>' +
          (isReprint ? '' : '<button type="button" class="button button-secondary" id="sticker-mark-sent">Mark as posted ✓</button>') +
          '<button type="button" class="button button-secondary" id="sticker-close">Close</button>' +
        '</span>' +
      '</div>' +
      '<div class="sticker-sheet">' + members.map(stickerLabelHtml).join("") + '</div>';
    document.body.appendChild(overlay);
    document.body.classList.add("sticker-preview-open");

    document.getElementById("sticker-do-print").addEventListener("click", () => printLabelSheet(members));
    document.getElementById("sticker-close").addEventListener("click", closeStickerPreview);
    const markBtn = document.getElementById("sticker-mark-sent");
    if (markBtn) markBtn.addEventListener("click", () => {
      const all = dbRead("snail-members", []);
      all.forEach(m => { if (emails.includes(String(m.email || "").toLowerCase())) m.lastSentCycle = cycle; });
      dbWrite("snail-members", all);
      if (typeof renderAdminSnailMail === "function") renderAdminSnailMail();
      closeStickerPreview();
      alert(members.length + " subscriber" + (members.length > 1 ? "s" : "") + " marked as posted for " + cycleLabel() +
        ". They won't appear on the next print run until next month's cycle.");
    });
    document.addEventListener("keydown", onStickerEsc);
  }

  printStickersBtn.addEventListener("click", () => {
    const members = dbRead("snail-members", []);
    const active = members.filter(m => m.status === "Active");
    if (active.length === 0) { alert("No active subscribers found to make labels for."); return; }
    // Oldest members first — the order they're next in line for the mailing.
    active.sort((a, b) => new Date(a.dateSubscribed || 0) - new Date(b.dateSubscribed || 0));

    const cycle = mailCycle();
    const due = active.filter(m => m.lastSentCycle !== cycle);   // not yet posted this month

    if (due.length === 0) {
      if (confirm("All " + active.length + " active subscriber" + (active.length > 1 ? "s have" : " has") +
          " already been posted for " + cycleLabel() + ".\n\nReprint labels for all of them?")) {
        showStickerPreview(active, active.length + " active subscriber" + (active.length > 1 ? "s" : "") + " · reprint for " + cycleLabel(), true);
      }
      return;
    }
    const sheets = Math.ceil(due.length / 21);
    showStickerPreview(due, due.length + " due for " + cycleLabel() + "’s mailing &middot; ~" + sheets + " A4 sheet" + (sheets > 1 ? "s" : ""), false);
  });
}

// --- 9. Tab Click Toggles ---
const tabButtons = document.querySelectorAll(".admin-tab-btn");
tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");

    const targetTab = btn.getAttribute("data-admin-tab");
    safeLocalWrite("ubhi-admin-active-tab", targetTab);
    const tabContents = document.querySelectorAll(".admin-tab-content");
    tabContents.forEach(content => {
      content.classList.remove("is-active");
      if (content.id === `admin-tab-${targetTab}`) {
        content.classList.add("is-active");
      }
    });

    // Opening a tab marks its arrivals as seen — the badge starts fresh.
    const seenIso = new Date().toISOString();
    if (targetTab === "orders") {
      safeLocalWrite("ubhi-admin-seen-orders", seenIso);
      safeLocalWrite("ubhi-admin-seen-bookings", seenIso);
    }
    if (targetTab === "updates") safeLocalWrite("ubhi-admin-seen-updates", seenIso);
    if (typeof updateAdminNavBadges === "function") updateAdminNavBadges();

    if (targetTab === "overview" && typeof renderAdminOverview === "function") {
      renderAdminOverview();
    }
  });
});

// Admin sidebar: collapse on desktop (hide for more room) / off-canvas drawer on mobile.
(function initAdminNav() {
  const dash = document.getElementById("admin-dashboard");
  const toggle = document.getElementById("admin-nav-toggle");
  const scrim = document.getElementById("admin-nav-scrim");
  const nav = document.getElementById("admin-tabs-nav");
  if (!dash || !toggle) return;
  const isMobile = () => window.matchMedia("(max-width: 760px)").matches;
  const syncAria = () => toggle.setAttribute("aria-expanded", String(!dash.classList.contains("is-nav-collapsed")));
  if (safeLocalRead("ubhi-admin-nav-collapsed") === "true") dash.classList.add("is-nav-collapsed");
  syncAria();
  const closeDrawer = () => { dash.classList.remove("is-drawer-open"); if (scrim) scrim.hidden = true; };
  const openDrawer = () => { dash.classList.add("is-drawer-open"); if (scrim) scrim.hidden = false; };
  toggle.addEventListener("click", () => {
    if (isMobile()) {
      if (dash.classList.contains("is-drawer-open")) closeDrawer(); else openDrawer();
    } else {
      dash.classList.toggle("is-nav-collapsed");
      safeLocalWrite("ubhi-admin-nav-collapsed", dash.classList.contains("is-nav-collapsed") ? "true" : "false");
      syncAria();
    }
  });
  if (scrim) scrim.addEventListener("click", closeDrawer);
  if (nav) nav.addEventListener("click", (e) => { if (e.target.closest(".admin-tab-btn") && isMobile()) closeDrawer(); });
  window.addEventListener("resize", () => { if (!isMobile()) closeDrawer(); });
})();

// Add-customer button (Customers tab)
(function initAdminCustomerControls() {
  const addBtn = document.getElementById("admin-customer-add-btn");
  if (addBtn) addBtn.addEventListener("click", adminAddCustomer);
  // People-type filter chips (Everyone / Snail Mail / Shoppers / Email list / Accounts).
  const chips = document.getElementById("admin-people-chips");
  if (chips) chips.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-people-type]");
    if (!chip) return;
    adminPeopleType = chip.getAttribute("data-people-type");
    renderAdminCustomers();
  });
})();

// Per-list search inputs (Gallery / Workshops / Shop / Journal)
[
  ["admin-gallery-search", (v) => { adminGallerySearch = v; renderAdminGallery(); }],
  ["admin-workshops-search", (v) => { adminWorkshopsSearch = v; renderAdminWorkshops(); }],
  ["admin-shop-search", (v) => { adminShopSearch = v; renderAdminShop(); }],
  ["admin-journal-search", (v) => { adminJournalSearch = v; renderAdminJournal(); }],
  ["admin-customers-search", (v) => { adminCustomersSearch = v; renderAdminCustomers(); }],
].forEach(([id, fn]) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", (e) => fn(e.target.value));
});

// --- 10. Initial Rendering and Navigation Launch ---

function initSnailMailCRMListeners() {
  // 1. Search Bar
  const searchInput = document.getElementById("admin-snail-members-search");
  const searchClear = document.getElementById("admin-snail-search-clear");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      snailMembersSearch = e.target.value;
      snailMembersPage = 1;
      if (searchClear) {
        searchClear.style.display = snailMembersSearch ? "block" : "none";
      }
      renderAdminSnailMail();
    });
  }

  if (searchClear) {
    searchClear.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      snailMembersSearch = "";
      snailMembersPage = 1;
      searchClear.style.display = "none";
      renderAdminSnailMail();
    });
  }

  // 2. Page Size Selector
  const pageSizeSelect = document.getElementById("admin-snail-members-page-size");
  if (pageSizeSelect) {
    pageSizeSelect.addEventListener("change", (e) => {
      snailMembersPageSize = parseInt(e.target.value, 10);
      snailMembersPage = 1;
      renderAdminSnailMail();
    });
  }

  // 3. Sort Headers
  const sortHeaders = document.querySelectorAll(".sortable");
  sortHeaders.forEach(th => {
    th.addEventListener("click", () => {
      const col = th.getAttribute("data-sort");
      if (snailMembersSortColumn === col) {
        snailMembersSortOrder = snailMembersSortOrder === "asc" ? "desc" : "asc";
      } else {
        snailMembersSortColumn = col;
        snailMembersSortOrder = "asc";
      }
      renderAdminSnailMail();
    });
  });

  // 4. Toggle Add Subscriber Form Panel
  const toggleAddBtn = document.getElementById("admin-toggle-add-member-btn");
  const cancelAddBtn = document.getElementById("admin-cancel-add-member-btn");
  const addPanel = document.getElementById("admin-add-member-panel");
  const addForm = document.getElementById("admin-add-member-form");
  const memberDateEl = document.getElementById("admin-m-date");
  const ADD_MEMBER_LABEL = "✚ Add an offline subscriber";
  const CLOSE_MEMBER_LABEL = "✕ Close form";

  // The offline sign-up form opens from the toolbar button, so the members
  // sheet stays compact until you actually need to add someone.
  function openAddMember() {
    if (addPanel) addPanel.style.display = "block";
    if (toggleAddBtn) toggleAddBtn.textContent = CLOSE_MEMBER_LABEL;
    if (memberDateEl) memberDateEl.value = new Date().toISOString().split("T")[0];
    const nameEl = document.getElementById("admin-m-name");
    if (nameEl) nameEl.focus();
  }
  function closeAddMember() {
    // The form lives in its own "Add Member" sub-tab now, so "Clear form" just
    // resets the fields (nothing to hide).
    if (addForm) addForm.reset();
  }

  if (toggleAddBtn && addPanel) {
    toggleAddBtn.addEventListener("click", () => {
      if (addPanel.style.display === "none") openAddMember();
      else closeAddMember();
    });
  }

  if (cancelAddBtn) {
    cancelAddBtn.addEventListener("click", closeAddMember);
  }

  // 5. Add Subscriber Form Submission
  if (addForm) {
    addForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const name = document.getElementById("admin-m-name")?.value || "";
      const email = document.getElementById("admin-m-email")?.value || "";
      const contact = document.getElementById("admin-m-contact")?.value || "";
      const plan = document.getElementById("admin-m-plan")?.value || "Monthly";
      const billing = document.getElementById("admin-m-billing")?.value || "£14 / month";
      const dateSubscribed = document.getElementById("admin-m-date")?.value || new Date().toISOString().split('T')[0];
      const address = document.getElementById("admin-m-address")?.value || "";

      const members = dbRead("snail-members", []);
      
      // EDIT: merge over the existing member — sentCycles / gift fields /
      // server id all survive, and the change is PATCHed to the server.
      if (adminMemberEditIdx != null && members[adminMemberEditIdx]) {
        const dupe = members.find((m, i) => i !== adminMemberEditIdx && m.email.toLowerCase() === email.toLowerCase());
        if (dupe) { alert("Another subscriber already uses that email address."); return; }
        const prev = members[adminMemberEditIdx];
        members[adminMemberEditIdx] = Object.assign({}, prev, { name, email, contact, plan, billing, address, dateSubscribed });
        dbWrite("snail-members", members);
        if (prev._sid && window.ubhiPatch) {
          window.ubhiPatch("subscriber", prev._sid, { name, email, contact, plan, address, date_subscribed: dateSubscribed });
        }
        adminMemberEditIdx = null;
        adminFormEditMode(addForm, null);
        addForm.reset();
        renderAdminSnailMail();
        adminToast("✓ Subscriber updated — letter history kept");
        // back to the members sheet
        const back = document.querySelector('button[data-subtab="admin-sub-snail-members"]');
        if (back) back.click();
        return;
      }

      // Check duplicate email
      const duplicate = members.find(m => m.email.toLowerCase() === email.toLowerCase());
      if (duplicate) {
        alert("A subscriber with this email address already exists.");
        return;
      }

      const newMember = {
        name,
        email,
        contact,
        plan,
        billing,
        address,
        dateSubscribed,
        status: "Active"
      };

      members.push(newMember);
      dbWrite("snail-members", members);

      closeAddMember();
      alert(`Successfully added subscriber: ${name}`);
      renderAdminSnailMail();
    });
  }
}

// Front-facing renders run immediately
renderHomeGallery();
renderWorkshops();
renderShop();
renderSnailMailArchive();
renderSnailMailReviews();
renderJournal();

/* ── Sliding carousels: faster auto-loop + pause-on-hover + drag (mouse) / swipe (touch) ──
   Progressive enhancement over the CSS marquee. Adds .js-marquee (CSS turns the container
   into a hidden-scrollbar scroller and disables the keyframe animation), then auto-advances
   scrollLeft each frame — looping seamlessly because each track is duplicated. loopSeconds =
   time for one set to pass (lower = faster). Falls back to the pure-CSS marquee if JS fails. */
function enhanceMarquee(container, loopSeconds) {
  if (!container || container.dataset.marquee === "on") return;
  container.dataset.marquee = "on";
  container.classList.add("js-marquee");

  const reduce = false; // owner wants the gentle marquees to keep gliding regardless of the OS setting
  const DRAG_THRESHOLD = 10;
  let hovering = false, pressing = false, dragging = false, startX = 0, startOff = 0, moved = 0, last = 0, off = 0, activeId = null;
  const setWidth = () => { const t = container.firstElementChild; return t ? t.offsetWidth : 0; };  // one set's width
  const wrapOff = () => { const w = setWidth(); if (w > 0) { off %= w; if (off < 0) off += w; } };
  const apply = () => { const tx = "translateX(" + (-off) + "px)"; for (const t of container.children) t.style.transform = tx; };

  const tick = (ts) => {
    if (!last) last = ts;
    let dt = ts - last; last = ts;
    if (dt > 100) dt = 16;   // returning from a hidden tab shouldn't make it leap
    if (!pressing && !hovering && !reduce) {
      const w = setWidth();
      if (w > 0) { off += (w / loopSeconds) * (dt / 1000); wrapOff(); apply(); }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // pause while the pointer rests on the strip
  container.addEventListener("mouseenter", () => { hovering = true; });
  container.addEventListener("mouseleave", () => { hovering = false; });
  container.addEventListener("dragstart", (e) => e.preventDefault());

  // Drag to move left / right (mouse + touch). CRUCIAL: we do NOT capture the
  // pointer on pointerdown. Capturing there retargets the pointerup to this
  // container, so the browser sees down-on-image / up-on-container and never
  // fires a `click` — which silently killed the tap-to-open-lightbox. We only
  // start capturing once real movement crosses the drag threshold, so a plain
  // click never captures and its native `click` fires normally.
  container.addEventListener("pointerdown", (e) => {
    if (e.button != null && e.button > 0) return;         // primary button / touch only
    pressing = true; dragging = false; moved = 0;
    startX = e.clientX; startOff = off; activeId = e.pointerId;
  });
  container.addEventListener("pointermove", (e) => {
    if (!pressing) return;
    const dx = e.clientX - startX;
    // Peak distance from the press point — NOT accumulated per event, or the
    // tiny tremor inside a normal click would read as a "drag".
    moved = Math.max(moved, Math.abs(dx));
    if (!dragging && moved > DRAG_THRESHOLD) {
      dragging = true;
      container.classList.add("is-dragging");
      if (container.setPointerCapture && activeId != null) { try { container.setPointerCapture(activeId); } catch (_) {} }
    }
    if (dragging) { off = startOff - dx; wrapOff(); apply(); }
  });
  const end = () => {
    if (!pressing) return;
    pressing = false;
    if (dragging) {
      dragging = false; container.classList.remove("is-dragging");
      // Flag a real drag briefly so the click that follows (if any) is ignored.
      container.dataset.justDragged = "1";
      setTimeout(() => { delete container.dataset.justDragged; }, 150);
    }
    activeId = null;
  };
  container.addEventListener("pointerup", end);
  container.addEventListener("pointercancel", end);
  container.addEventListener("lostpointercapture", end);
  // belt-and-braces: a real drag must never also fire a click (open the lightbox)
  container.addEventListener("click", (e) => { if (container.dataset.justDragged) { e.preventDefault(); e.stopPropagation(); } }, true);
}

enhanceMarquee(document.getElementById("home-gallery-container"), 42);
enhanceMarquee(document.getElementById("snail-photos-carousel-container"), 45);
enhanceMarquee(document.getElementById("snail-reviews-carousel-container"), 50);

function initOrdersAndBackupListeners() {
  // 1. Search Shop Orders
  const ordersSearch = document.getElementById("admin-orders-search");
  if (ordersSearch) {
    ordersSearch.addEventListener("input", (e) => {
      adminOrdersSearch = e.target.value;
      adminOrdersPage = 1;
      renderAdminShopOrders();
    });
  }

  // 2. Search Workshop Bookings
  const bookingsSearch = document.getElementById("admin-bookings-search");
  if (bookingsSearch) {
    bookingsSearch.addEventListener("input", (e) => {
      adminBookingsSearch = e.target.value;
      adminBookingsPage = 1;
      renderAdminWorkshopBookings();
    });
  }

  /* ── Orders: filter chips + sort + per-page + pagination + bulk (delegated) ── */
  const ordersControls = document.getElementById("admin-orders-controls");
  if (ordersControls) {
    ordersControls.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-ostatus]");
      if (chip) { adminOrdersStatus = chip.getAttribute("data-ostatus"); adminOrdersPage = 1; renderAdminShopOrders(); }
    });
    ordersControls.addEventListener("change", (e) => {
      if (e.target.id === "orders-sort") { adminOrdersSort = e.target.value; renderAdminShopOrders(); }
      else if (e.target.id === "orders-perpage") { adminOrdersPerPage = parseInt(e.target.value, 10) || 0; adminOrdersPage = 1; renderAdminShopOrders(); }
    });
  }
  const ordersPager = document.getElementById("admin-orders-pagination");
  if (ordersPager) ordersPager.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-opage]");
    if (!btn || btn.disabled) return;
    const v = btn.getAttribute("data-opage");
    if (v === "prev") adminOrdersPage--; else if (v === "next") adminOrdersPage++;
    renderAdminShopOrders();
  });
  const ordersTbody = document.getElementById("admin-shop-orders-table-body");
  if (ordersTbody) ordersTbody.addEventListener("change", (e) => {
    const cb = e.target.closest(".admin-row-check");
    if (!cb) return;
    const id = cb.getAttribute("data-order-id");
    if (cb.checked) adminOrdersSelected.add(id); else adminOrdersSelected.delete(id);
    const selAll = document.getElementById("orders-select-all");
    if (selAll) selAll.checked = adminOrdersPageIds.length > 0 && adminOrdersPageIds.every(x => adminOrdersSelected.has(x));
    updateOrdersBulkBar();
  });
  const ordersSelAll = document.getElementById("orders-select-all");
  if (ordersSelAll) ordersSelAll.addEventListener("change", (e) => {
    if (e.target.checked) adminOrdersPageIds.forEach(id => adminOrdersSelected.add(id));
    else adminOrdersPageIds.forEach(id => adminOrdersSelected.delete(id));
    renderAdminShopOrders();
  });
  const ordersBulk = document.getElementById("admin-orders-bulkbar");
  if (ordersBulk) ordersBulk.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-obulk]");
    if (!btn) return;
    const action = btn.getAttribute("data-obulk");
    if (action === "clear") { adminOrdersSelected.clear(); renderAdminShopOrders(); return; }
    if (action === "slips") {
      const sel = dbRead("shop-orders", []).filter(o => adminOrdersSelected.has(orderRowId(o)));
      if (sel.length) printPackingSlips(sel);
      return;
    }
    if (action === "delete") {
      if (!confirm("Delete " + adminOrdersSelected.size + " selected order(s)? This cannot be undone.")) return;
      const allOrders = dbRead("shop-orders", []);
      const dropped = allOrders.filter(o => adminOrdersSelected.has(orderRowId(o)));
      const kept = allOrders.filter(o => !adminOrdersSelected.has(orderRowId(o)));
      dbWrite("shop-orders", kept);
      dropped.forEach(o => adjustStockFor(o, -1));   // pieces return to stock
      if (window.ubhiDelete) dropped.forEach(o => { if (o._sid) window.ubhiDelete("order", o._sid); });
      adminOrdersSelected.clear();
    } else {
      const newStatus = action === "shipped" ? "Shipped" : "Delivered";
      const orders = dbRead("shop-orders", []);
      orders.forEach(o => {
        if (adminOrdersSelected.has(orderRowId(o))) {
          o.status = newStatus;
          if (o._sid && window.ubhiPatch) window.ubhiPatch("order", o._sid, { status: newStatus });
        }
      });
      dbWrite("shop-orders", orders);
      adminOrdersSelected.clear();
    }
    renderAdminShopOrders();
    if (typeof renderAdminOverview === "function") renderAdminOverview();
  });

  /* ── Bookings: filter + sort + per-page + pagination + bulk (delegated) ── */
  const bookingsControls = document.getElementById("admin-bookings-controls");
  if (bookingsControls) bookingsControls.addEventListener("change", (e) => {
    if (e.target.id === "bookings-workshop") { adminBookingsWorkshop = e.target.value; adminBookingsPage = 1; renderAdminWorkshopBookings(); }
    else if (e.target.id === "bookings-sort") { adminBookingsSort = e.target.value; renderAdminWorkshopBookings(); }
    else if (e.target.id === "bookings-perpage") { adminBookingsPerPage = parseInt(e.target.value, 10) || 0; adminBookingsPage = 1; renderAdminWorkshopBookings(); }
  });
  if (bookingsControls) bookingsControls.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-bwhen]");
    if (!chip) return;
    adminBookingsWhen = chip.getAttribute("data-bwhen");
    adminBookingsPage = 1;
    renderAdminWorkshopBookings();
  });
  const bookingsPager = document.getElementById("admin-bookings-pagination");
  if (bookingsPager) bookingsPager.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-bpage]");
    if (!btn || btn.disabled) return;
    const v = btn.getAttribute("data-bpage");
    if (v === "prev") adminBookingsPage--; else if (v === "next") adminBookingsPage++;
    renderAdminWorkshopBookings();
  });
  const bookingsTbody = document.getElementById("admin-workshop-bookings-table-body");
  if (bookingsTbody) bookingsTbody.addEventListener("change", (e) => {
    const cb = e.target.closest(".admin-row-check-b");
    if (!cb) return;
    const id = cb.getAttribute("data-booking-id");
    if (cb.checked) adminBookingsSelected.add(id); else adminBookingsSelected.delete(id);
    const selAll = document.getElementById("bookings-select-all");
    if (selAll) selAll.checked = adminBookingsPageIds.length > 0 && adminBookingsPageIds.every(x => adminBookingsSelected.has(x));
    updateBookingsBulkBar();
  });
  const bookingsSelAll = document.getElementById("bookings-select-all");
  if (bookingsSelAll) bookingsSelAll.addEventListener("change", (e) => {
    if (e.target.checked) adminBookingsPageIds.forEach(id => adminBookingsSelected.add(id));
    else adminBookingsPageIds.forEach(id => adminBookingsSelected.delete(id));
    renderAdminWorkshopBookings();
  });
  const bookingsBulk = document.getElementById("admin-bookings-bulkbar");
  if (bookingsBulk) bookingsBulk.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-bbulk]");
    if (!btn) return;
    const action = btn.getAttribute("data-bbulk");
    if (action === "clear") { adminBookingsSelected.clear(); renderAdminWorkshopBookings(); return; }
    if (action === "delete") {
      if (!confirm("Delete " + adminBookingsSelected.size + " selected reservation(s)? This cannot be undone.")) return;
      const allBookings = dbRead("workshop-reservations", []);
      const droppedB = allBookings.filter(b => adminBookingsSelected.has(String(b.reservedAt || "")));
      const kept = allBookings.filter(b => !adminBookingsSelected.has(String(b.reservedAt || "")));
      dbWrite("workshop-reservations", kept);
      droppedB.forEach(b => releaseWorkshopSeats(b));   // seats return to the workshops
      if (window.ubhiDelete) droppedB.forEach(b => { if (b._sid) window.ubhiDelete("booking", b._sid); });
      adminBookingsSelected.clear();
      renderAdminWorkshopBookings();
      if (typeof renderAdminOverview === "function") renderAdminOverview();
    }
  });

  /* ── Sortable column headers (click Date / Customer / Total / Price) ── */
  const ordersThead = document.querySelector("#admin-sub-orders thead");
  if (ordersThead) ordersThead.addEventListener("click", (e) => {
    const th = e.target.closest("[data-osort]");
    if (!th) return;
    adminOrdersSort = nextSortValue(adminOrdersSort, th.getAttribute("data-osort"));
    renderAdminShopOrders();
  });
  const bookingsThead = document.querySelector("#admin-sub-bookings thead");
  if (bookingsThead) bookingsThead.addEventListener("click", (e) => {
    const th = e.target.closest("[data-bsort]");
    if (!th) return;
    adminBookingsSort = nextSortValue(adminBookingsSort, th.getAttribute("data-bsort"));
    renderAdminWorkshopBookings();
  });

  /* ── Sub-tabs: switch between Shop Orders and Workshop Bookings ── */
  const ordersSubtabs = document.getElementById("admin-orders-subtabs");
  if (ordersSubtabs) ordersSubtabs.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-subtab]");
    if (!btn) return;
    const which = btn.getAttribute("data-subtab");
    ordersSubtabs.querySelectorAll(".admin-subtab").forEach(b => b.classList.toggle("is-active", b === btn));
    const op = document.getElementById("admin-sub-orders");
    const bp = document.getElementById("admin-sub-bookings");
    if (op) op.classList.toggle("is-active", which === "orders");
    if (bp) bp.classList.toggle("is-active", which === "bookings");
    if (which === "orders") renderAdminShopOrders(); else renderAdminWorkshopBookings();
    safeLocalWrite("ubhi-admin-ob-subtab", which);   // remember across refresh
  });

  // 3. Clear Buttons
  const clearOrdersBtn = document.getElementById("admin-clear-orders-btn");
  if (clearOrdersBtn) {
    clearOrdersBtn.addEventListener("click", () => {
      clearAllOrders();
    });
  }

  const clearBookingsBtn = document.getElementById("admin-clear-bookings-btn");
  if (clearBookingsBtn) {
    clearBookingsBtn.addEventListener("click", () => {
      clearAllBookings();
    });
  }

  // 4. Export CSV Shop Orders
  const exportOrdersCsvBtn = document.getElementById("admin-export-orders-csv-btn");
  if (exportOrdersCsvBtn) {
    exportOrdersCsvBtn.addEventListener("click", () => {
      const orders = dbRead("shop-orders", []);
      if (orders.length === 0) {
        alert("No shop orders found to export.");
        return;
      }

      let csvContent = "Date,Customer Name,Email,Mobile,Product(s) Ordered,Total Paid,Street,City,Postcode,Status\n";

      orders.forEach(o => {
        let itemsStr = "";
        const csvItems = orderItems(o);
        if (csvItems.length > 0) {
          itemsStr = csvItems.map(item => `${item.name} (x${item.quantity || 1})`).join("; ");
        } else if (o.productName) {
          itemsStr = `${o.productName} (x1)`;
        }

        const addr = o.shippingAddress || o.address;
        const row = [
          o.reservedAt || o.date || o.orderedAt || "",
          o.customerName || o.name || "",
          o.customerEmail || o.email || "",
          o.phone || o.mobile || o.customerMobile || "",
          itemsStr,
          `£${o.totalPrice || o.price || 0}`,
          addr?.street || "",
          addr?.city || "",
          addr?.postcode || "",
          o.status || "Preparing with care"
        ].map(field => {
          let f = String(field || "").replace(/"/g, '""');
          if (f.includes(",") || f.includes("\n") || f.includes('"')) {
            f = `"${f}"`;
          }
          return f;
        }).join(",");
        csvContent += row + "\n";
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `ubhi_shop_orders_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // 5. Export CSV Workshop Bookings
  const exportBookingsCsvBtn = document.getElementById("admin-export-bookings-csv-btn");
  if (exportBookingsCsvBtn) {
    exportBookingsCsvBtn.addEventListener("click", () => {
      const bookings = dbRead("workshop-reservations", []);
      if (bookings.length === 0) {
        alert("No bookings found to export.");
        return;
      }

      let csvContent = "Date Reserved,Customer Name,Email,Mobile,Workshop Name,Price,Notes,Status\n";

      bookings.forEach(b => {
        const row = [
          b.reservedAt || "",
          b.name || "",
          b.email || "",
          b.phone || b.mobile || "",
          `${b.workshop} (${b.date || ""})`,
          `£${b.price || 0}`,
          b.note || "",
          b.status || "Confirmed"
        ].map(field => {
          let f = String(field || "").replace(/"/g, '""');
          if (f.includes(",") || f.includes("\n") || f.includes('"')) {
            f = `"${f}"`;
          }
          return f;
        }).join(",");
        csvContent += row + "\n";
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `ubhi_workshop_bookings_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // 6. Database Backup Download
  const dbBackupBtn = document.getElementById("admin-db-backup-btn");
  if (dbBackupBtn) {
    dbBackupBtn.addEventListener("click", () => {
      let backupData = {};
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("ubhi-")) {
            backupData[key] = localStorage.getItem(key);
          }
        }
      } catch (localErr) {
        console.warn("localStorage backup fallback blocked:", localErr);
        Object.entries(memoryDb).forEach(([key, val]) => {
          backupData[key] = val;
        });
      }

      if (Object.keys(backupData).length === 0) {
        alert("No database records found to backup.");
        return;
      }

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `ubhi_database_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Remember when — the post desk nudges after 30 days without a backup.
      safeLocalWrite("ubhi-last-backup", new Date().toISOString());
      if (typeof renderAdminDesk === "function") try { renderAdminDesk(); } catch (e) {}
    });
  }

  // 7. Database Restore Upload
  const dbRestoreFile = document.getElementById("admin-db-restore-file");
  const dbRestoreFilename = document.getElementById("admin-db-restore-filename");
  const dbRestoreConfirmBtn = document.getElementById("admin-db-restore-confirm-btn");
  let parsedRestoreData = null;

  if (dbRestoreFile) {
    dbRestoreFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) {
        if (dbRestoreFilename) dbRestoreFilename.textContent = "No file selected";
        if (dbRestoreConfirmBtn) dbRestoreConfirmBtn.style.display = "none";
        parsedRestoreData = null;
        return;
      }

      if (dbRestoreFilename) dbRestoreFilename.textContent = file.name;

      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          const validKeys = Object.keys(data).filter(k => k.startsWith("ubhi-"));
          if (validKeys.length === 0) {
            alert("Error: This JSON file does not appear to contain a valid Ubhi backup.");
            dbRestoreFile.value = "";
            if (dbRestoreFilename) dbRestoreFilename.textContent = "No file selected";
            if (dbRestoreConfirmBtn) dbRestoreConfirmBtn.style.display = "none";
            parsedRestoreData = null;
            return;
          }

          parsedRestoreData = data;
          if (dbRestoreConfirmBtn) dbRestoreConfirmBtn.style.display = "inline-block";
        } catch (err) {
          alert("Error: Failed to parse backup file as valid JSON.");
          dbRestoreFile.value = "";
          if (dbRestoreFilename) dbRestoreFilename.textContent = "No file selected";
          if (dbRestoreConfirmBtn) dbRestoreConfirmBtn.style.display = "none";
          parsedRestoreData = null;
        }
      };
    });
  }

  if (dbRestoreConfirmBtn) {
    dbRestoreConfirmBtn.addEventListener("click", () => {
      if (!parsedRestoreData) return;
      if (confirm("WARNING: Restoring this backup will overwrite your current site data. Are you sure?")) {
        try {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith("ubhi-")) {
              safeLocalRemove(key);
            }
          }

          Object.entries(parsedRestoreData).forEach(([key, val]) => {
            safeLocalWrite(key, val);
          });

          alert("Database restored successfully! Reloading site...");
          location.reload();
        } catch (localErr) {
          console.error("Local database restore error:", localErr);
          alert("Restoration failed due to localStorage restrictions.");
        }
      }
    });
  }
}

try { initSnailMailCRMListeners(); } catch (e) { console.error("Snail CRM listeners failed to bind:", e); }
// initOrdersAndBackupListeners() is registered above via ensureOrdersListeners()
// (DOMContentLoaded-safe + try/catch), so it runs even if earlier startup code throws.

// ── COOKIE CONSENT ────────────────────────────────────────────
// Stores the visitor's choice ("all" | "essential") in localStorage so the
// banner only appears on first visit. Exposes window.ubhiConsent for the dev
// to gate analytics behind ("all" = OK to load analytics).
(function initCookieConsent() {
  const KEY = "ubhi-cookie-consent";
  const banner = document.getElementById("cookie-banner");
  window.ubhiConsent = safeLocalRead(KEY) || null;

  function showBanner() { if (banner) banner.hidden = false; }
  function hideBanner() { if (banner) banner.hidden = true; }

  function setConsent(choice) {
    safeLocalWrite(KEY, choice);
    window.ubhiConsent = choice;
    hideBanner();
    // INTEGRATION: if (choice === "all") loadAnalytics();  // load analytics only after opt-in
  }

  // Show on first visit (no stored choice yet).
  if (!window.ubhiConsent) showBanner();

  if (banner) {
    banner.querySelectorAll("[data-cookie-choice]").forEach((btn) => {
      btn.addEventListener("click", () => setConsent(btn.getAttribute("data-cookie-choice")));
    });
  }

  // "Change cookie preferences" link on the Cookie Policy page re-opens the banner.
  const reopen = document.getElementById("reopen-cookie-banner");
  if (reopen) reopen.addEventListener("click", showBanner);
})();

// ── CONTACT FORM ──────────────────────────────────────────────
// Messages POST to the backend (/api/contact) and appear in the admin panel's
// Messages list on every device. If the backend is unreachable, the visitor's
// email app opens pre-filled (mailto:) so the message can still reach the owner.
(function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = (document.getElementById("contact-name")?.value || "").trim();
    const email = (document.getElementById("contact-email")?.value || "").trim();
    const message = (document.getElementById("contact-message")?.value || "").trim();
    const msg = document.getElementById("contact-msg");
    const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    if (!name || !emailOk || !message) {
      if (msg) {
        msg.style.display = "block";
        msg.style.color = "#a23b52";
        msg.textContent = "Please add your name, a valid email, and a message.";
      }
      return;
    }
    const subject = document.getElementById("contact-subject")?.value || "Website enquiry";

    // Preferred path: hand the message to the backend, where it lands in the
    // owner's admin inbox on every device. Falls back to the old mailto:
    // behaviour whenever the server can't take it.
    const openMailApp = () => {
      const body = "From: " + name + " <" + email + ">\n\n" + message;
      const mailto = "mailto:hello@ubhi.in?subject=" + encodeURIComponent("Ubhi enquiry — " + subject) + "&body=" + encodeURIComponent(body);
      const a = document.createElement("a");
      a.href = mailto; document.body.appendChild(a); a.click(); document.body.removeChild(a);
      if (msg) {
        msg.style.display = "block";
        msg.style.color = "var(--forest, #3a6b52)";
        msg.textContent = "Thank you, " + name + " — your email app is opening so you can send this to hello@ubhi.in. (No app? Write to us directly at hello@ubhi.in.)";
      }
    };
    const submitP = (typeof window !== "undefined" && typeof window.ubhiSubmit === "function")
      ? window.ubhiSubmit("contact", { name: name, email: email, subject: subject, message: message })
      : Promise.resolve({ ok: false, offline: true });
    submitP.then((r) => {
      form.reset();
      if (r && r.ok) {
        if (msg) {
          msg.style.display = "block";
          msg.style.color = "var(--forest, #3a6b52)";
          msg.textContent = "Thank you, " + name + " — your message is on its way. We reply to " + email + ", usually within a day or two.";
        }
      } else {
        openMailApp();
      }
    });
  });
})();

/* ── Gift subscriptions + Add-to-calendar (.ics) ─────────────────────────── */
(function () {
  function initGiftToggle() {
    var t = document.getElementById("snail-gift-toggle");
    var f = document.getElementById("snail-gift-fields");
    if (t && f && !t._wired) {
      t._wired = true;
      t.addEventListener("change", function () {
        f.style.display = t.checked ? "" : "none";
        // A gift is always prepaid for its term — refresh the summary/checkout.
        if (typeof refreshSnailSelection === "function") refreshSnailSelection();
      });
    }
    // Gift-term radios override the self-subscribe plan while the gift is on.
    document.querySelectorAll('input[name="snail-gift-term"]').forEach(function (r) {
      if (r._wired) return;
      r._wired = true;
      r.addEventListener("change", function () {
        if (typeof refreshSnailSelection === "function") refreshSnailSelection();
      });
    });
  }
  function pad(n) { return String(n).padStart(2, "0"); }
  function icsDate(d) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T" + pad(d.getHours()) + pad(d.getMinutes()) + "00"; }
  function icsEsc(s) {
    return String(s == null ? "" : s)
      .replace(/\\/g, "\\\\")
      .replace(/[;,]/g, function (c) { return "\\" + c; })
      .replace(/\r?\n/g, "\\n");
  }
  function parseDT(dateStr) {
    var parts = String(dateStr || "").split("·").map(function (s) { return s.trim(); });
    var dm = (parts[0] || "").match(/(\d{1,2})\s+([A-Za-z]+)/);
    if (!dm) return null;
    var months = { january: 0, february: 1, march: 2, april: 3, may: 4, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11 };
    var mon = months[dm[2].toLowerCase()];
    if (mon == null) return null;
    var day = parseInt(dm[1], 10);
    var times = (parts[1] || "").match(/(\d{1,2}):(\d{2})/g) || [];
    var sh = 10, sm = 0, eh = null, em = null;
    if (times[0]) { sh = parseInt(times[0].split(":")[0], 10); sm = parseInt(times[0].split(":")[1], 10); }
    if (times[1]) { eh = parseInt(times[1].split(":")[0], 10); em = parseInt(times[1].split(":")[1], 10); }
    var now = new Date(), y = now.getFullYear();
    var start = new Date(y, mon, day, sh, sm);
    if (start.getTime() < now.getTime() - 86400000) start = new Date(y + 1, mon, day, sh, sm);
    var end = (eh != null) ? new Date(start.getFullYear(), mon, day, eh, em) : null;
    if (!end || end <= start) end = new Date(start.getTime() + 2 * 3600 * 1000);
    return { start: start, end: end };
  }
  function workshopPlace(title) {
    try { var w = dbRead("workshops", []).find(function (x) { return x.title === title; }); return (w && w.place) ? w.place : ""; }
    catch (e) { return ""; }
  }
  function buildICS(res) {
    var dt = parseDT(res.date);
    if (!dt) return null;
    var place = workshopPlace(res.workshop);
    var loc = (place ? place + ", " : "") + "London";
    return [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Ubhi//Workshops//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "BEGIN:VEVENT", "UID:ubhi-" + icsDate(dt.start) + "-" + String((res.workshop || "").length) + "@ubhi.studio",
      "DTSTAMP:" + icsDate(new Date()), "DTSTART:" + icsDate(dt.start), "DTEND:" + icsDate(dt.end),
      "SUMMARY:" + icsEsc((res.workshop || "Workshop") + " — Ubhi"),
      "LOCATION:" + icsEsc(loc),
      "DESCRIPTION:" + icsEsc("Your Ubhi workshop. Chelsea will send preparation notes before the gathering." + (res.note ? (" Note: " + res.note) : "")),
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
  }
  function downloadICS() {
    var res; try { res = JSON.parse(localStorage.getItem("ubhi-workshop-reservation")); } catch (e) {}
    if (!res) return;
    var ics = buildICS(res);
    if (!ics) { alert("This booking has a custom date — Chelsea will confirm the timing with you directly."); return; }
    var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = (res.workshop || "ubhi-workshop").replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".ics";
    document.body.appendChild(a); a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 500);
  }
  function initICSBtn() {
    var b = document.getElementById("booking-ics-btn");
    if (b && !b._wired) { b._wired = true; b.addEventListener("click", downloadICS); }
  }

  // ── DOWNLOADABLE RECEIPTS (orders + workshop bookings) ──────────
  function rEsc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function money(n) {
    var v = Number(n);
    if (!isFinite(v)) return String(n == null ? "" : n);
    return "£" + (Number.isInteger(v) ? v : v.toFixed(2));
  }
  function fmtDate(iso) {
    var d = iso ? new Date(iso) : new Date();
    if (isNaN(d.getTime())) return "";
    var M = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return d.getDate() + " " + M[d.getMonth()] + " " + d.getFullYear();
  }
  function bookingRef(r) {
    var t = r && r.reservedAt ? new Date(r.reservedAt).getTime() : 0;
    if (!t) t = (String(r && r.workshop || "").length + 1) * 100000;
    return "WS-" + t.toString(36).toUpperCase().slice(-6);
  }
  function receiptShell(opts) {
    // opts: { title, ref, date, status, parties:[{label,lines:[]}], rowsHTML, totalsHTML, footNote }
    var partiesHTML = (opts.parties || []).map(function (p) {
      var lines = (p.lines || []).filter(Boolean).map(function (l) { return rEsc(l); }).join("<br>");
      return '<div class="party"><span class="lbl">' + rEsc(p.label) + '</span>' + lines + '</div>';
    }).join("");
    return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>Ubhi Receipt · ' + rEsc(opts.ref) + '</title><style>' +
      '*{box-sizing:border-box}body{margin:0;background:#e7dcc4;color:#46372a;' +
      'font-family:Georgia,"Iowan Old Style","Palatino Linotype",serif;line-height:1.5;padding:28px 16px}' +
      '.sheet{max-width:680px;margin:0 auto;background:#f7f0df;border:1px solid #d8c9a6;' +
      'border-radius:6px;padding:34px 38px;box-shadow:0 8px 30px rgba(70,55,42,.14)}' +
      '.hint{max-width:680px;margin:0 auto 14px auto;font-size:.85rem;color:#6b5b49;display:flex;' +
      'align-items:center;gap:12px;flex-wrap:wrap}.hint button{font:inherit;font-size:.85rem;cursor:pointer;' +
      'background:#46372a;color:#f7f0df;border:0;border-radius:4px;padding:7px 14px}' +
      'header{text-align:center;border-bottom:1px solid #d8c9a6;padding-bottom:18px;margin-bottom:22px}' +
      '.brand{font-size:2rem;letter-spacing:.32em;text-transform:uppercase;color:#46372a}' +
      '.tag{font-size:.82rem;letter-spacing:.18em;text-transform:uppercase;color:#9a8a6f;margin-top:6px}' +
      'h1{font-size:1.15rem;letter-spacing:.14em;text-transform:uppercase;color:#8a6d2e;margin:0 0 18px}' +
      '.meta{display:flex;flex-wrap:wrap;gap:18px 32px;margin-bottom:24px;font-size:.92rem}' +
      '.meta span{display:block;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:#9a8a6f}' +
      '.meta strong{font-weight:700}' +
      '.parties{display:flex;flex-wrap:wrap;gap:24px 48px;margin-bottom:24px;font-size:.92rem}' +
      '.party .lbl{display:block;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:#9a8a6f;margin-bottom:4px}' +
      'table{width:100%;border-collapse:collapse;margin-bottom:18px;font-size:.94rem}' +
      'th{text-align:left;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:#9a8a6f;' +
      'border-bottom:1px solid #d8c9a6;padding:0 0 8px}td{padding:9px 0;border-bottom:1px solid #ece2cb}' +
      '.c{text-align:center}.r{text-align:right}.totals{margin-left:auto;width:260px;font-size:.95rem}' +
      '.totals .row{display:flex;justify-content:space-between;padding:5px 0}' +
      '.totals .grand{border-top:1px solid #d8c9a6;margin-top:6px;padding-top:10px;font-size:1.1rem;font-weight:700}' +
      'footer{margin-top:26px;border-top:1px solid #d8c9a6;padding-top:16px;font-size:.86rem;color:#6b5b49;text-align:center}' +
      'footer a{color:#8a6d2e}@media print{body{background:#fff;padding:0}.hint{display:none}' +
      '.sheet{box-shadow:none;border:0}}</style></head><body>' +
      '<div class="hint">Tip: use Print → “Save as PDF” to keep this receipt.' +
      '<button onclick="window.print()">Print / Save as PDF</button></div>' +
      '<div class="sheet"><header><div class="brand">Ubhi</div><div class="tag">Look within to ascend</div></header>' +
      '<h1>' + rEsc(opts.title) + '</h1>' +
      '<div class="meta"><div><span>Reference</span><strong>' + rEsc(opts.ref) + '</strong></div>' +
      '<div><span>Date</span><strong>' + rEsc(opts.date) + '</strong></div>' +
      (opts.status ? '<div><span>Status</span><strong>' + rEsc(opts.status) + '</strong></div>' : '') + '</div>' +
      '<div class="parties">' + partiesHTML + '</div>' +
      (opts.rowsHTML ? '<table><thead>' + opts.thead + '</thead><tbody>' + opts.rowsHTML + '</tbody></table>' : '') +
      (opts.totalsHTML || '') +
      '<footer>' + (opts.footNote || '') + '<br>Ubhi · hello@ubhi.in · Made by hand in the United Kingdom</footer>' +
      '</div></body></html>';
  }
  function buildOrderReceipt(o) {
    var rows = (o.items || []).map(function (it) {
      var qty = Number(it.quantity) || 1, price = Number(it.price) || 0, line = price * qty;
      return '<tr><td>' + rEsc(it.name || "Item") + '</td><td class="c">' + qty +
        '</td><td class="r">' + money(price) + '</td><td class="r">' + money(line) + '</td></tr>';
    }).join("");
    var a = o.address || {};
    var ship = Number(o.shipping) || 0;
    var totals = '<div class="totals"><div class="row"><span>Subtotal</span><span>' + money(o.subtotal) + '</span></div>' +
      '<div class="row"><span>Shipping</span><span>' + (ship === 0 ? "Free" : money(ship)) + '</span></div>' +
      '<div class="row grand"><span>Total</span><span>' + money(o.totalPrice) + '</span></div></div>';
    return receiptShell({
      title: "Order Receipt", ref: o.orderRef || "—", date: fmtDate(o.orderedAt),
      status: o.status || "Preparing with care",
      parties: [
        { label: "Billed to", lines: [o.name, o.email, o.phone] },
        { label: "Ship to", lines: [a.street, [a.city, a.postcode].filter(Boolean).join(" "), a.country] }
      ],
      thead: '<tr><th>Item</th><th class="c">Qty</th><th class="r">Price</th><th class="r">Total</th></tr>',
      rowsHTML: rows, totalsHTML: totals,
      footNote: "Thank you for supporting handmade work."
    });
  }
  function buildBookingReceipt(r) {
    var tickets = Number(r.tickets) || 1;
    var priceTxt = (r.price === "custom" || r.price == null) ? "To be confirmed" : money(r.price);
    var rows = '<tr><td>' + rEsc(r.workshop || "Workshop") +
      (r.date ? '<br><span style="color:#9a8a6f;font-size:.86rem">' + rEsc(r.date) + '</span>' : '') +
      '</td><td class="c">' + tickets + '</td><td class="r">' + priceTxt + '</td></tr>';
    var totals = '<div class="totals"><div class="row grand"><span>Total</span><span>' + priceTxt + '</span></div></div>';
    return receiptShell({
      title: "Booking Receipt", ref: bookingRef(r), date: fmtDate(r.reservedAt),
      status: r.status || "Confirmed",
      parties: [
        { label: "Attendee", lines: [r.name, r.email, r.phone] },
        { label: "Note", lines: [r.note] }
      ],
      thead: '<tr><th>Workshop</th><th class="c">Places</th><th class="r">Total</th></tr>',
      rowsHTML: rows, totalsHTML: totals,
      footNote: "We look forward to gathering with you."
    });
  }
  function downloadReceiptDoc(html, ref) {
    var blob = new Blob([html], { type: "text/html;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "ubhi-receipt-" + String(ref || "order").replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".html";
    document.body.appendChild(a); a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 500);
  }
  function downloadOrderReceipt() {
    var o; try { o = JSON.parse(localStorage.getItem("ubhi-shop-order")); } catch (e) {}
    if (!o) { alert("No recent order found to receipt."); return; }
    downloadReceiptDoc(buildOrderReceipt(o), o.orderRef);
  }
  function downloadBookingReceipt() {
    var r; try { r = JSON.parse(localStorage.getItem("ubhi-workshop-reservation")); } catch (e) {}
    if (!r) { alert("No recent booking found to receipt."); return; }
    downloadReceiptDoc(buildBookingReceipt(r), bookingRef(r));
  }
  function initReceiptBtns() {
    var s = document.getElementById("shop-receipt-btn");
    if (s && !s._wired) { s._wired = true; s.addEventListener("click", downloadOrderReceipt); }
    var b = document.getElementById("booking-receipt-btn");
    if (b && !b._wired) { b._wired = true; b.addEventListener("click", downloadBookingReceipt); }
  }
  function init() { initGiftToggle(); initICSBtn(); initReceiptBtns(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

// ── Click-to-expand image zoom WITH left/right navigation ──────────────────
// Workshop posters open a single image; shop products open their whole image
// gallery (prev/next + counter). Any <img class="zoomable"> works too.
(function initImageZoom() {
  // Gallery items are plain src strings, or { src, label } objects — the label
  // (e.g. "January — Vol. 01: AUM") is shown in a pill above the counter.
  let imgs = [], idx = 0, capLabel = "";
  function itemSrc(it) { return typeof it === "string" ? it : (it && it.src) || ""; }
  function itemLabel(it) { return (it && typeof it === "object" && it.label) || capLabel || ""; }
  function show() {
    const el = document.getElementById("ubhi-img-zoom-img");
    if (!el || !imgs.length) return;
    idx = (idx % imgs.length + imgs.length) % imgs.length;
    el.src = itemSrc(imgs[idx]);
    el.alt = itemLabel(imgs[idx]);
    const multi = imgs.length > 1;
    const p = document.getElementById("ubhi-img-zoom-prev");
    const n = document.getElementById("ubhi-img-zoom-next");
    const c = document.getElementById("ubhi-img-zoom-count");
    const lab = document.getElementById("ubhi-img-zoom-label");
    if (p) p.style.display = multi ? "flex" : "none";
    if (n) n.style.display = multi ? "flex" : "none";
    if (c) { c.style.display = multi ? "block" : "none"; c.textContent = (idx + 1) + " / " + imgs.length; }
    if (lab) {
      const t = imgs[idx] && typeof imgs[idx] === "object" ? (imgs[idx].label || "") : "";
      lab.textContent = t;
      lab.style.display = t ? "block" : "none";
    }
  }
  function step(d) { if (imgs.length > 1) { idx += d; show(); } }
  function ensureOverlay() {
    let ov = document.getElementById("ubhi-img-zoom");
    if (ov) return ov;
    ov = document.createElement("div");
    ov.id = "ubhi-img-zoom";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.style.cssText = "position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;padding:4vmin;background:rgba(28,18,10,0.9);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);opacity:0;transition:opacity .2s ease;";
    const navBtn = "position:absolute;top:50%;transform:translateY(-50%);width:48px;height:48px;display:none;align-items:center;justify-content:center;border:0;border-radius:50%;background:rgba(255,255,255,0.16);color:#fbf3df;font-size:1.9rem;line-height:1;cursor:pointer;";
    ov.innerHTML =
      '<button id="ubhi-img-zoom-prev" type="button" aria-label="Previous image" style="' + navBtn + 'left:16px;">&#8249;</button>' +
      '<img id="ubhi-img-zoom-img" alt="" style="max-width:90vw;max-height:90vh;border-radius:5px;background:#fff;box-shadow:0 30px 80px -18px rgba(0,0,0,0.75);" />' +
      '<button id="ubhi-img-zoom-next" type="button" aria-label="Next image" style="' + navBtn + 'right:16px;">&#8250;</button>' +
      '<div id="ubhi-img-zoom-count" style="position:absolute;bottom:20px;left:50%;transform:translateX(-50%);display:none;color:#fbf3df;font-family:\'EB Garamond\',serif;font-size:0.9rem;letter-spacing:0.08em;background:rgba(0,0,0,0.4);padding:5px 14px;border-radius:20px;"></div>' +
      '<div id="ubhi-img-zoom-label" style="position:absolute;bottom:58px;left:50%;transform:translateX(-50%);display:none;max-width:84vw;text-align:center;color:#fbf3df;font-family:\'EB Garamond\',serif;font-size:1rem;letter-spacing:0.04em;background:rgba(0,0,0,0.4);padding:6px 16px;border-radius:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>' +
      '<button id="ubhi-img-zoom-close" type="button" aria-label="Close" style="position:absolute;top:16px;right:20px;width:42px;height:42px;border:0;border-radius:50%;background:rgba(255,255,255,0.16);color:#fbf3df;font-size:1.7rem;line-height:1;cursor:pointer;">&times;</button>';
    document.body.appendChild(ov);
    function close() {
      ov.style.opacity = "0";
      document.body.style.overflow = "";
      setTimeout(function () { ov.style.display = "none"; }, 200);
    }
    ov.addEventListener("click", function (e) {
      const t = e.target;
      if (t === ov || t.id === "ubhi-img-zoom-close") { close(); return; }
      if (t.id === "ubhi-img-zoom-prev") { step(-1); return; }
      if (t.id === "ubhi-img-zoom-next") { step(1); return; }
    });
    document.addEventListener("keydown", function (e) {
      if (ov.style.display === "none") return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    });
    return ov;
  }
  window.openImageZoom = function (images, startIndex, alt) {
    const arr = (Array.isArray(images) ? images : [images]).filter(Boolean);
    if (!arr.length) return;
    imgs = arr; idx = Math.max(0, Math.min(startIndex || 0, arr.length - 1)); capLabel = alt || "";
    const ov = ensureOverlay();
    show();
    ov.style.display = "flex";
    document.body.style.overflow = "hidden";
    setTimeout(function () { ov.style.opacity = "1"; }, 10);
  };
  // ── Snail Mail archive: group photos month by month ────────────────────
  const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function snailPhotoMonthLabel(p) {
    const m = String(p.month || "").match(/^(\d{4})-(\d{1,2})/);
    if (m) return MONTH_NAMES[Math.min(11, Math.max(0, +m[2] - 1))] + " " + m[1];
    const c = String(p.caption || "").trim().match(/^(January|February|March|April|May|June|July|August|September|October|November|December)/i);
    if (c) return c[1].charAt(0).toUpperCase() + c[1].slice(1).toLowerCase();
    return "The archive";
  }
  // One group per month, in the order the archive presents them, so browsing
  // runs through all of January's photos, then February's, and so on.
  function snailPhotoGroups(list) {
    const order = [], byLabel = {};
    list.forEach(function (p) {
      const label = snailPhotoMonthLabel(p);
      if (!byLabel[label]) { byLabel[label] = { label: label, photos: [] }; order.push(byLabel[label]); }
      byLabel[label].photos.push(p);
    });
    return order;
  }

  // cursor hint on expandable images
  const st = document.createElement("style");
  st.textContent = "#page-workshops .card-image-wrap img, #page-shop .product-image-wrap img, #page-snail-mail .snail-photo-card img, #home-gallery-container .gallery-item img, img.zoomable { cursor: zoom-in; }";
  document.head.appendChild(st);
  // delegated click → expand. Shop products open their whole gallery (prev/next).
  document.addEventListener("click", function (e) {
    const img = e.target.closest && e.target.closest("#page-workshops .card-image-wrap img, #page-shop .product-image-wrap img, #page-snail-mail .snail-photo-card img, #home-gallery-container .gallery-item img, img.zoomable");
    if (!img) return;
    // A drag along a carousel must not open the lightbox on release.
    const marquee = img.closest(".js-marquee");
    if (marquee && marquee.dataset.justDragged) return;
    e.preventDefault();
    e.stopPropagation();
    // Use the RAW src attribute (relative path or base64) so it matches what the
    // catalog stored — img.currentSrc would be the absolute URL and never match.
    const src = img.getAttribute("src") || img.currentSrc;
    // Home gallery: open the whole carousel as one gallery from the clicked photo.
    if (img.closest("#home-gallery-container")) {
      try {
        const items = dbRead("gallery-items", []);
        if (items.length) {
          const scope = marquee || document.getElementById("home-gallery-container");
          const gImgs = Array.prototype.slice.call(scope.querySelectorAll(".gallery-item img"));
          const recIdx = Math.max(0, gImgs.indexOf(img)) % items.length;   // track is duplicated for the loop
          const flat = items.map(function (g) { return { src: g.src, label: g.alt || g.caption || "" }; });
          window.openImageZoom(flat, recIdx, "Ubhi gallery");
          return;
        }
      } catch (err) { /* fall through to single image */ }
    }
    // Snail Mail archive: the whole archive opens as ONE gallery, ordered
    // month by month, starting from the photo that was clicked.
    if (img.closest("#page-snail-mail") && img.closest(".snail-photo-card")) {
      try {
        const list = dbRead("snail-photos", []);
        if (list.length) {
          const scope = marquee || document.getElementById("snail-photos-carousel-container") || document;
          const cards = Array.prototype.slice.call(scope.querySelectorAll(".snail-photo-card img"));
          const recIdx = Math.max(0, cards.indexOf(img)) % list.length;   // the track is duplicated for the loop
          const flat = [];
          snailPhotoGroups(list).forEach(function (g) {
            g.photos.forEach(function (p) {
              const cap = String(p.caption || "");
              const monthWord = g.label.split(" ")[0].toLowerCase();
              const label = cap
                ? (cap.toLowerCase().indexOf(monthWord) === 0 ? cap : g.label + " · " + cap)
                : g.label;
              flat.push({ src: p.src, label: label, _rec: p });
            });
          });
          let start = 0;
          for (let i = 0; i < flat.length; i++) { if (flat[i]._rec === list[recIdx]) { start = i; break; } }
          window.openImageZoom(flat, start, "Snail Mail archive");
          return;
        }
      } catch (err) { /* fall through to single image */ }
    }
    if (img.closest("#page-shop")) {
      try {
        const prod = dbRead("shop-catalog", []).find(function (p) {
          return (Array.isArray(p.images) && p.images.indexOf(src) !== -1) || p.image === src;
        });
        const gallery = prod && Array.isArray(prod.images) && prod.images.length ? prod.images : [src];
        const start = Math.max(0, gallery.indexOf(src));
        window.openImageZoom(gallery, start, prod ? prod.name : img.getAttribute("alt"));
        return;
      } catch (err) { /* fall through to single image */ }
    }
    window.openImageZoom(src, 0, img.getAttribute("alt"));
  }, true);
})();

// ── Ink underlines: a hand-drawn stroke draws itself beneath section headings
//    the first time they scroll into view (public pages only; one-shot). ──
(function initInkUnderlines() {
  if (!("IntersectionObserver" in window)) return;
  const SEL = [
    "#page-home .intro h2",
    "#page-home .practice-journey h2",
    "#page-home .gallery-section h2",
    "#page-home .subscribe-section h2",
    "#page-shop .shop h2",
    "#page-workshops .workshops h2",
    "#page-journal .journal-section h2",
    "#page-journal .subscribe-section h2",
    "#page-snail-mail .snail-anatomy-section h2",
    "#page-snail-mail .snail-plans-section h2",
    "#page-snail-mail .snail-archive-section h2",
    "#page-snail-mail .snail-testimonials-section h2",
    "#page-art .section-heading h2",
    "#page-about .about-content h2"
  ].join(", ");
  let heads = [];
  try { heads = Array.prototype.slice.call(document.querySelectorAll(SEL)); } catch (e) { return; }
  // never ink the handwritten letter or anything inside a card/modal
  heads = heads.filter(h => !h.closest(".snail-letter-story") && !h.closest(".modal") && !h.closest("[class*='card']"));
  if (!heads.length) return;

  const VARIANTS = [
    "M4 8 C 40 2, 80 12, 116 6 S 180 4, 216 8",
    "M4 6 C 50 12, 90 2, 140 9 S 190 10, 216 5",
    "M4 9 C 36 4, 96 11, 150 5 S 196 7, 216 9"
  ];
  heads.forEach(function (h, i) {
    if (h.querySelector(".ink-underline-svg")) return;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "ink-underline-svg");
    svg.setAttribute("viewBox", "0 0 220 14");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", VARIANTS[i % VARIANTS.length]);
    path.setAttribute("pathLength", "100");   // dash math stays 0–100 whatever the real length
    svg.appendChild(path);
    h.appendChild(svg);
  });
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("is-inked"); io.unobserve(en.target); }
    });
  }, { threshold: 0.6 });
  heads.forEach(function (h) { io.observe(h); });
})();

// ── Hero art rotator — slowly cross-fade the full-bleed background slides. ──
(function initHeroArtRotator() {
  var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-art-slide"));
  if (slides.length < 2) return;                 // nothing to rotate
  var i = 0;
  setInterval(function () {
    slides[i].classList.remove("is-active");
    i = (i + 1) % slides.length;
    slides[i].classList.add("is-active");
  }, 5500);                                       // dwell ~5.5s; CSS handles the 1.6s fade
})();

// ── INITIAL PAGE LOAD (called LAST — all helpers defined above) ──
navigate(location.hash || "#home");

