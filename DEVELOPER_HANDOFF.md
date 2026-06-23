# Ubhi — Developer Handoff

This is the master document for the developer taking the Ubhi site to
production. It explains how the system is put together, exactly **what is
already done** and **what you must finish before go-live**, the owner/staff role
model, how to migrate the existing browser-only frontend onto the new API, and a
security checklist to sign off against.

Read this first, then:
- `backend/README.md` — how to run and configure the API.
- `backend/docs/API_SPEC.md` — every endpoint in a table.
- `backend/docs/openapi.yaml` — the same endpoints as OpenAPI 3 (import into
  Postman / Swagger UI / Insomnia).

---

## 1. Architecture overview

Ubhi is two cleanly separated pieces:

```
┌──────────────────────────────┐         HTTPS / JSON          ┌───────────────────────────┐
│  Frontend (static SPA)        │  ───────────────────────────▶ │  Backend API (Node/Express)│
│  index.html, script.js,       │   Authorization: Bearer <jwt>  │  /api/* routes             │
│  styles.css, world.*,         │ ◀───────────────────────────  │                            │
│  artwork.*, updates.js        │                                │  store (pluggable)         │
│  + assets/api.js (NEW client) │                                │   ├── JSON files (dev)     │
└──────────────────────────────┘                                │   └── PostgreSQL (prod)    │
                                                                 │  services: Stripe, Mailer  │
                                                                 └───────────────────────────┘
```

### Frontend — static single-page site (unchanged build)
The live site is plain static files served by `serve.js` (or any static host /
CDN): `index.html`, `script.js`, `styles.css`, `world.*`, `artwork.*`,
`updates.js`, plus `assets/`. There is **no build step**. Today it stores all
data in the browser's `localStorage` via two helpers in `script.js`:

```js
function dbRead(tableKey, defaultValue = []) { /* reads localStorage "ubhi-"+key */ }
function dbWrite(tableKey, value)            { /* writes localStorage "ubhi-"+key */ }
```

That is fine for a demo but the data lives only in one browser. The new
`assets/api.js` client replaces those reads/writes with real API calls so data
is shared, durable, and secured server-side. See §5 for the migration.

### Backend — Node.js + Express API (this handoff)
Lives entirely under `backend/`. Stateless, JSON in/out, JWT-secured. Key
design choices:

- **Pluggable storage.** Routes only ever call a shared `store` object (`all`,
  `get`, `find`, `findOne`, `insert`, `update`, `remove`, `count`) — never raw
  SQL. With no `DATABASE_URL` it uses a zero-config JSON file store
  (`backend/db/data/*.json`); set `DATABASE_URL` and it uses PostgreSQL with
  parameterised queries. **No route code changes between the two.**
- **Auth.** `POST /api/auth/login` returns a 7-day JWT. Admin routes require
  `Authorization: Bearer <jwt>` and are guarded by role + per-section
  permissions.
- **Graceful optional services.** Stripe and SMTP are optional: with no keys,
  checkout returns `{ configured: false }` and the mailer logs to the console
  instead of sending. The site still runs end-to-end.

### Request lifecycle (admin example)
1. Admin logs in → receives `{ token, user }`.
2. Frontend stores the token and sends it as `Authorization: Bearer <jwt>`.
3. `requireAuth` verifies the JWT and sets `req.user = {id, role, permissions, email}`.
4. `requirePermission('<section>')` allows owners always; staff only if the
   section is in their permissions.
5. The route reads/writes through `store`; the response is JSON.
6. Any thrown error is normalised by `errorHandler` to
   `{ error: "<message>" }` with the right status code.

---

## 2. What is DONE

The backend is feature-complete for handoff. Already built and working:

- **Express app** (`server.js`) with `helmet`, CORS, JSON body parsing (raw
  body reserved for the Stripe webhook), health check, all routes mounted, and
  a final error handler.
- **Config** (`config.js`) driven entirely by environment variables via
  `dotenv`, with safe development defaults and a loud warning if `JWT_SECRET`
  is left at its insecure default.
- **Pluggable store** (`db/store.js`, `jsonStore.js`, `postgresStore.js`) with
  the documented async interface. JSON store whitelists table names (no path
  traversal); Postgres store uses parameterised queries only and runs
  `schema.sql` on boot.
- **Auth + guards** (`middleware/auth.js`): `signToken`, `requireAuth`,
  `requireRole`, `requirePermission`. bcrypt password hashing (10 rounds).
- **Error + validation helpers** (`middleware/errors.js`, `validate.js`).
- **All routes** under `/api`: `auth`, `users`, `orders`, `bookings`,
  `workshops`, `shop`, `gallery`, `journal`, `subscribers`, `updates`,
  `customers`, `settings`. Public endpoints for the storefront, admin endpoints
  guarded per-section. Money on orders is computed server-side.
- **Seed** (`db/seed.js`, `npm run seed`): idempotent; creates the owner admin
  and a few sample published workshops/products so the API returns data
  immediately.
- **Security baseline**: rate-limited login, password hashes never returned,
  uniform "invalid email or password" message, last-owner protections.
- **Docs**: `backend/README.md`, `backend/docs/API_SPEC.md`,
  `backend/docs/openapi.yaml`.
- **Containerisation**: `Dockerfile` and `docker-compose.yml` (API + Postgres).

> Runs today with `npm install && npm run seed && npm start` — no external
> services required.

---

## 3. What you must FINISH before go-live

These are deliberately left to you because they need real accounts, secrets,
hosting, and legal decisions. None require changing the route code.

### 3.1 Provision PostgreSQL
- Create a managed Postgres database (Render, Railway, Supabase, RDS, Neon,
  etc.). Postgres 13+.
- Set `DATABASE_URL` in the backend environment, e.g.
  `postgres://user:password@host:5432/ubhi`.
- On boot the server runs `db/schema.sql` automatically (idempotent). Then run
  `npm run seed` **once** against the production DB to create the owner.
- Confirm `GET /api/health` returns `{ "store": "postgres" }`.
- Decide on backups / point-in-time recovery with your provider.

### 3.2 Set real Stripe keys + webhook
- Create a Stripe account; get the **secret key** (`sk_live_…`).
- Set `STRIPE_SECRET_KEY`. Checkout will then create real sessions instead of
  returning `{ configured: false }`.
- In the Stripe dashboard add a webhook endpoint pointing at
  `https://<your-api-domain>/api/stripe/webhook` and subscribe to the checkout
  completion events. Copy the **signing secret** into `STRIPE_WEBHOOK_SECRET`.
- The webhook route receives the **raw** body (already wired in `server.js`) so
  the signature verifies. Test with the Stripe CLI:
  `stripe listen --forward-to localhost:8090/api/stripe/webhook`.
- Verify an end-to-end test order flips `paid: true`.

### 3.3 Configure SMTP email
- Choose an email provider (Postmark, SendGrid, SES, Mailgun, etc.).
- Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `FROM_EMAIL`
  (use a domain you control; set SPF/DKIM/DMARC so mail isn't spam-filtered).
- With no SMTP config the mailer logs to console — fine for dev, not for
  production order/booking confirmations.

### 3.4 Set a strong JWT secret
- Generate one:
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- Set `JWT_SECRET`. If you skip this the server boots but **warns** and tokens
  are forgeable — do not ship without it.
- Changing the secret later invalidates all existing tokens (everyone must log
  in again) — expected.

### 3.5 Deploy + domain + HTTPS
- Deploy the backend (the included `Dockerfile` works on any container host; or
  run `node server.js` behind a process manager).
- Put it behind HTTPS (the platform's TLS, or a reverse proxy). `server.js`
  already calls `app.set('trust proxy', 1)` so rate-limiting sees real client
  IPs behind one proxy hop.
- Set `NODE_ENV=production` and `PORT` per your host.
- Set `CORS_ORIGIN` to your real site origin(s), comma-separated — **do not
  leave it `*` in production.** Example:
  `CORS_ORIGIN=https://ubhi.co.uk,https://www.ubhi.co.uk`.
- Host the static frontend (same domain or a CDN). If frontend and API are on
  different origins, the API origin must be in `CORS_ORIGIN`.
- Point `assets/api.js`'s base URL at the deployed API (see §5).

### 3.6 GDPR / privacy
The site collects personal data (customer accounts, orders with shipping
addresses, bookings, newsletter and snail-mail signups). Before launch:
- Publish a **privacy policy** and **cookie/storage notice**; link them from
  signup, checkout, and booking forms.
- Capture **explicit marketing consent** — the API already stores
  `marketing_opt_in` on customers; only email people who opted in.
- Support **data subject requests**: you can read a customer via
  `GET /api/customers` and erase them via `DELETE /api/customers/:id`
  (and the equivalent for subscribers / signups). Document your process for
  access/erasure requests.
- Keep order/booking data only as long as you need it; define a retention
  period.
- Ensure your DB and email providers are covered by appropriate data-processing
  terms.

> This is operational/legal guidance, not legal advice — confirm with your own
> counsel for UK GDPR compliance.

### 3.7 Migrate the frontend off localStorage onto the API
Wire `assets/api.js` into `script.js`, replacing `dbRead`/`dbWrite` and the
passcode gate. Full before/after in §5.

---

## 4. Owner / staff role model

Two roles. Access is checked on the server for **every** admin route — the UI
hiding a tab is convenience only, never the security boundary.

### Owner
- Role `owner`. **Full access to everything.** `permissions` is stored as `[]`
  because it is implicit — owners pass every `requirePermission` check.
- Can manage admin users (`/api/users`), customers, settings, journal and
  gallery — the owner-only sections.

### Staff
- Role `staff`. Access is limited to the back-office sections listed in their
  `permissions` array.
- **Default staff permissions:**
  `['workshops','shop','subscribers','orders','bookings']`.
- Sections that are **owner-only** and are never granted to staff by default
  (and are stripped from any staff permissions you submit):
  `overview`, `customers`, `settings`, `users`, `journal`, `gallery`.

### Which section guards which endpoint

| Section | Endpoints it unlocks |
| --- | --- |
| `orders` | `GET/PATCH/DELETE /api/orders` (+ `/:id`) |
| `bookings` | `GET/PATCH/DELETE /api/bookings` (+ `/:id`) |
| `subscribers` | `GET/PATCH/DELETE /api/subscribers`, `GET/DELETE /api/updates` |
| `workshops` | `GET /api/workshops/all`, `POST/PATCH/DELETE /api/workshops` |
| `shop` | `GET /api/shop/all`, `POST/PATCH/DELETE /api/shop` |
| `customers` *(owner-only)* | `GET/PATCH/DELETE /api/customers` |
| `gallery` *(owner-only)* | `GET /api/gallery/all`, `POST/PATCH/DELETE /api/gallery` |
| `journal` *(owner-only)* | `GET /api/journal/all`, `POST/PATCH/DELETE /api/journal` |
| `settings` / `users` *(owner-only)* | `/api/settings/*`, `/api/users/*` (role `owner` required) |

### Built-in safety rails (in `/api/users`)
- Cannot delete the **last owner**.
- Cannot demote the **last owner** to staff.
- Cannot deactivate the **last active owner**.
- An owner cannot delete **their own** account.
- Creating/patching a user with `role: "owner"` forces `permissions: []`.
- Owner-only sections are stripped out of any staff permissions array you send.

---

## 5. Migrating the frontend (`dbRead`/`dbWrite` → `assets/api.js`)

The plan: keep the UI, replace the data layer. `assets/api.js` exposes a small
client (`UbhiAPI`) that wraps `fetch`, attaches the bearer token, and exposes
typed helpers. Include it **before** `script.js`:

```html
<!-- index.html, before script.js -->
<script src="assets/api.js"></script>
<script src="script.js"></script>
```

Set the API base URL once at the top of `assets/api.js` (localhost in dev, your
deployed API in prod), e.g. `const API_BASE = "https://api.ubhi.co.uk/api";`.

The client signature you can rely on:

```js
// assets/api.js exposes window.UbhiAPI
UbhiAPI.setToken(token);            // persist + attach Authorization header
UbhiAPI.getToken();                 // current token or null
UbhiAPI.clearToken();               // logout
await UbhiAPI.login(email, pass);   // -> { token, user }; stores token
await UbhiAPI.me();                 // -> { user }
await UbhiAPI.get(path);            // GET  /api + path
await UbhiAPI.post(path, body);     // POST
await UbhiAPI.patch(path, body);    // PATCH
await UbhiAPI.del(path);            // DELETE
```

### 5.1 Login + roles

**Before — single shared passcode in `localStorage` (script.js ~line 4053):**

```js
const loginForm = document.getElementById("admin-login-form");
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const passcode = document.getElementById("admin-passcode").value || "";
  if (passcode === getAdminPass()) {
    safeLocalWrite("ubhi-admin-authenticated", "true");
    // show dashboard...
    renderAdminDashboard();
  } else {
    // show "Invalid credentials"
  }
});
```

Problems: one shared secret, no real accounts, no roles, anyone with the
passcode can do anything, and the check is client-side only.

**After — real email/password login returning a JWT + role:**

```js
const loginForm = document.getElementById("admin-login-form");
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-passcode").value || "";
  const errorMsg = document.getElementById("admin-login-error");
  try {
    const { user } = await UbhiAPI.login(email, password); // token stored by the client
    if (errorMsg) errorMsg.style.display = "none";
    currentUser = user;                 // { id, role, permissions, email, name }
    applyRoleVisibility(user);          // hide tabs the user can't access (UX only)
    renderAdminDashboard();
  } catch (err) {
    if (errorMsg) {
      errorMsg.textContent = "Invalid email or password.";
      errorMsg.style.display = "block";
    }
  }
});

// Gate the back-office tabs by role/permission. Server still enforces access;
// this is purely so staff don't see controls they can't use.
function applyRoleVisibility(user) {
  const ownerOnly = ["overview", "customers", "settings", "users", "journal", "gallery"];
  document.querySelectorAll("[data-admin-section]").forEach((el) => {
    const section = el.getAttribute("data-admin-section");
    const allowed =
      user.role === "owner" ||
      (user.role === "staff" && (user.permissions || []).includes(section));
    el.style.display = allowed ? "" : "none";
  });
}

// On page load, restore a session if a valid token exists.
async function restoreAdminSession() {
  if (!UbhiAPI.getToken()) return;
  try {
    const { user } = await UbhiAPI.me();
    currentUser = user;
    applyRoleVisibility(user);
    // show dashboard...
  } catch {
    UbhiAPI.clearToken(); // expired/invalid -> back to login
  }
}

// Logout
document.getElementById("admin-logout-btn")?.addEventListener("click", () => {
  UbhiAPI.clearToken();
  currentUser = null;
  // show the login gate...
});
```

Notes:
- Add an **email** field to the admin login form (`#admin-email`); the old form
  only had a passcode.
- "Change passcode" becomes `POST /api/auth/change-password`
  `{ current, next }`. The old client-side `ubhi-admin-pass` key and the
  "reset to fresh data" button (which wiped `localStorage`) are removed.
- Read lists from the API instead of `localStorage`, e.g.
  `const orders = await UbhiAPI.get("/orders");` (owner or staff-with-`orders`),
  `const workshops = await UbhiAPI.get("/workshops/all");` for the admin view.

### 5.2 Order submission (checkout)

**Before — order saved to `localStorage` only (script.js ~line 824):**

```js
const orderData = {
  items: itemsList,                          // [{ name, price, quantity }]
  subtotal, shipping, totalPrice,
  orderRef: ubhiOrderRef(),                  // generated client-side
  name, email, phone: mobile,
  address: { street: address, city, postcode, country },
  orderedAt: new Date().toISOString(),
  status: "Preparing with care",
};
localStorage.setItem("ubhi-shop-order", JSON.stringify(orderData));
const prevOrders = JSON.parse(localStorage.getItem("ubhi-shop-orders")) || [];
prevOrders.push(orderData);
localStorage.setItem("ubhi-shop-orders", JSON.stringify(prevOrders));
localStorage.removeItem("ubhi-cart");
```

Problems: totals and order ref are trusted from the browser, the order lives in
one browser, and the shop owner can't actually see it.

**After — POST to the API; the server computes money + ref and persists it:**

```js
// Map the cart to the API's item shape: { name, price, qty }.
const items = itemsList.map((it) => ({
  name: it.name,
  price: it.price,
  qty: it.quantity || 1,
}));

let order;
try {
  order = await UbhiAPI.post("/orders", {
    customer_email: email,        // required + validated server-side
    customer_name: name,
    phone: mobile,
    items,                        // subtotal/shipping/total are computed by the server
    ship_street: address,
    ship_city: city,
    ship_postcode: postcode,
    ship_country: country,
  });
} catch (err) {
  // show "Sorry, we couldn't place your order. Please try again."
  return;
}

// order = { order_ref, subtotal, shipping, total, status: "Preparing with care", paid: false, ... }
localStorage.removeItem("ubhi-cart");
if (typeof updateCartDOM === "function") updateCartDOM();
// Show success using the SERVER values (do not trust client-side totals):
showOrderSuccess(order.order_ref, order.total, order.shipping);
```

Optional — to take real payment instead of a "pay later" order, call
`POST /api/checkout/session` with the same items and redirect to the returned
Stripe URL; the webhook then marks the order `paid`. If Stripe isn't configured
yet, that endpoint returns `{ configured: false }` and you keep the
create-order-only flow above.

### 5.3 Other public forms (same pattern)

| Frontend action | Old | New |
| --- | --- | --- |
| Workshop booking | `dbWrite("bookings", …)` | `UbhiAPI.post("/bookings", { name, email, phone, workshop_id, … })` |
| Snail-mail signup | `dbWrite("subscribers", …)` | `UbhiAPI.post("/subscribers", { name, email, … })` |
| Newsletter signup | `dbWrite("updates", …)` | `UbhiAPI.post("/updates", { email, name, interest })` |
| Storefront register | `dbWrite("members", …)` | `UbhiAPI.post("/customers", { email, password, … })` |
| Public catalogues | `dbRead("workshops"/"shop"/"gallery"/"journal")` | `UbhiAPI.get("/workshops" / "/shop" / "/gallery" / "/journal")` (published only) |

### 5.4 Migration tips
- Migrate one screen at a time; keep `dbRead`/`dbWrite` around until each screen
  is converted, then delete them.
- All API calls are async — make handlers `async` and `await`, and handle
  failures with user-friendly messages.
- Field names change from camelCase to `snake_case` (e.g. `totalPrice` → the
  server's `total`, `address.street` → `ship_street`). The tables above list
  the exact field names; `backend/docs/API_SPEC.md` is the source of truth.
- Existing browser `localStorage` data does **not** auto-migrate. If any real
  data matters, export it and POST it to the API once.

---

## 6. Security checklist (sign off before launch)

**Secrets & config**
- [ ] `JWT_SECRET` set to a long random value (no boot warning in logs).
- [ ] `.env` is **not** committed (`backend/.gitignore` covers it); only
      `.env.example` (placeholders) is in the repo.
- [ ] All real keys (DB URL, Stripe, SMTP) live in the host's secret store /
      environment, not in code.
- [ ] `NODE_ENV=production`.

**Transport & access**
- [ ] API served over **HTTPS** only.
- [ ] `CORS_ORIGIN` restricted to your real site origin(s) — not `*`.
- [ ] `app.set('trust proxy', 1)` matches your proxy depth (it ships as 1).
- [ ] `helmet` is active (default in `server.js`).

**Authentication & authorization**
- [ ] Owner account created via seed; default seed password **changed**.
- [ ] Login is rate-limited (10 / 15 min per IP — built in).
- [ ] Every admin route requires `requireAuth` + the correct
      `requirePermission`/`requireRole` (verified — do not relax).
- [ ] Staff accounts created with least-privilege permissions only.
- [ ] Last-owner protections verified (can't delete/demote/deactivate the last
      owner).

**Data handling**
- [ ] Passwords are bcrypt-hashed (10 rounds) and **never** returned — confirm
      no `password_hash` appears in any response.
- [ ] Order totals are computed server-side (client totals ignored — built in).
- [ ] Postgres store uses parameterised queries only; JSON store table names are
      whitelisted (built in — keep it that way).
- [ ] Input validation rejects missing required fields with `400`.

**Payments**
- [ ] Stripe webhook endpoint registered and `STRIPE_WEBHOOK_SECRET` set;
      signature verification passes.
- [ ] A test order completes and flips `paid: true`.

**Privacy / GDPR**
- [ ] Privacy policy + storage notice published and linked from forms.
- [ ] Marketing consent (`marketing_opt_in`) honoured.
- [ ] Data access/erasure process documented; deletion endpoints tested.
- [ ] Data-processing terms in place with DB and email providers.

**Operations**
- [ ] Database backups configured.
- [ ] `GET /api/health` monitored; alerting on downtime.
- [ ] Server logs captured (500s are logged with stack traces; 4xx are not
      noisy).
- [ ] Dependencies installed from a locked, audited set (`npm audit`).

---

## 7. Quick reference

| Thing | Where |
| --- | --- |
| Run the API | `cd backend && npm install && npm run seed && npm start` |
| Health check | `GET /api/health` → `{ ok, store }` |
| Log in | `POST /api/auth/login { email, password }` → `{ token, user }` |
| Auth header | `Authorization: Bearer <jwt>` |
| Switch to Postgres | set `DATABASE_URL` (schema auto-applied on boot) |
| Frontend client | `assets/api.js` (`window.UbhiAPI`) |
| Full endpoint list | `backend/docs/API_SPEC.md` |
| OpenAPI spec | `backend/docs/openapi.yaml` |
| Env template | `backend/.env.example` |

---

## ✅ Post-build hardening (applied & verified end-to-end)

After the initial build a security + correctness review was run; these were fixed and tested (all passing):

1. **No insecure JWT secret in production.** `config.js` refuses to start when `NODE_ENV=production` and `JWT_SECRET` is unset, the built-in default, or shorter than 32 chars. Dev still boots (with a warning). Generate one: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
2. **No default owner password.** `npm run seed` refuses to create the owner login unless `OWNER_PASSWORD` is set to a real value. `docker-compose.yml` requires `JWT_SECRET` and `OWNER_PASSWORD` in `.env`.
3. **Live session checks.** `requireAuth` re-loads the admin user on every request, so deactivating/deleting a staff account or changing their permissions takes effect immediately (verified: a deactivated staff token is rejected 401 on its next request) — not after the 7-day token lifetime.
4. **No mass-assignment on orders/bookings.** The admin `PATCH` endpoints accept only an allow-listed set of fields (status + delivery/contact corrections). `paid`, `total`, `subtotal`, `customer_email`, `items` can NOT be changed via the API — `paid` is set ONLY by the verified Stripe webhook.

**Payment routes are now implemented** (they were missing from the first build):
- `POST /api/checkout/session { order_id }` → creates a Stripe Checkout session for a stored order, returns `{ url }` to redirect to (or `{ configured:false }` when no Stripe key is set). Amounts come from the stored order, never the client.
- `POST /api/stripe/webhook` → verifies the Stripe signature and is the ONLY place that marks an order `paid:true` (and sends a best-effort confirmation email).

### Quick start (verified working)
```
cd backend
cp .env.example .env          # set JWT_SECRET, OWNER_EMAIL, OWNER_PASSWORD
npm install
npm run seed                  # creates the owner login + sample workshops/products
npm start                     # http://localhost:8090/api/health
```
Default is a zero-config JSON file store; set `DATABASE_URL` to use PostgreSQL (schema applied automatically on boot).

### Still TODO before go-live
Provision Postgres, set real Stripe keys + register the webhook URL in Stripe, configure SMTP email, lock `CORS_ORIGIN` to your real domain, deploy behind HTTPS, complete GDPR/privacy, and migrate the frontend's `dbRead/dbWrite` calls to `assets/api.js` (see the migration section above).
