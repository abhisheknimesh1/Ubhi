# Ubhi Backend

A small, secure Node.js + Express API for the Ubhi brand site. It powers the
public storefront (workshops, shop, gallery, journal, bookings, orders,
newsletter / snail-mail signups) and the back-office admin dashboard (auth,
users, customers, settings).

It is a **handoff package**. It runs locally with zero configuration using a
JSON file store, and switches to PostgreSQL in production simply by setting
`DATABASE_URL`. A developer provisions hosting, real keys (Stripe, SMTP, JWT
secret) and deploys — see [`../DEVELOPER_HANDOFF.md`](../DEVELOPER_HANDOFF.md)
for the go-live checklist.

---

## What it is

- **Runtime:** Node.js >= 18, CommonJS, Express 4.
- **Storage:** pluggable. Defaults to a zero-config JSON file store; uses
  PostgreSQL when `DATABASE_URL` is set.
- **Auth:** stateless JWT (7-day expiry), bcrypt-hashed passwords, role +
  per-section permission model.
- **Security:** `helmet`, CORS allowlist, rate-limited login, parameterised SQL,
  no secrets in the repo.
- **Optional integrations:** Stripe Checkout (`services/stripe.js`) and SMTP
  email (`services/mailer.js`). Both degrade gracefully when no keys are set.

All dependencies are pure JavaScript (no native build step). `pg` is an
**optional** dependency — it is only loaded when `DATABASE_URL` is present, so
`npm install` succeeds even on machines without a Postgres toolchain.

---

## Prerequisites

- Node.js **18 or newer** (`node --version`).
- npm (ships with Node).
- *(Production only)* A PostgreSQL 13+ database and connection string.

---

## Quick start (local, zero config)

```bash
cd backend
npm install
npm run seed     # creates the owner admin + sample workshops/products
npm start        # http://localhost:8090
```

Then check it is alive:

```bash
curl http://localhost:8090/api/health
# -> {"ok":true,"store":"json"}
```

Log in as the seeded owner (credentials come from `OWNER_EMAIL` /
`OWNER_PASSWORD`, default `owner@ubhi.example` / `change-me-now`):

```bash
curl -X POST http://localhost:8090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@ubhi.example","password":"change-me-now"}'
# -> {"token":"...","user":{...}}
```

> The JSON store writes to `backend/db/data/*.json` (created on demand, and
> git-ignored). Delete that folder to start from a clean slate, then re-run
> `npm run seed`.

### Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the server (`node server.js`). |
| `npm run dev` | Same as `start` (no watcher dependency, keeps installs lean). |
| `npm run seed` | Create the owner admin + sample content. **Idempotent** — safe to re-run. |

---

## Environment setup

Configuration is read from environment variables via `dotenv`. Copy the example
file and edit it:

```bash
cp .env.example .env
```

`.env` is git-ignored. **Never commit real secrets.** Sensible dev defaults let
the API boot with no `.env` at all (JSON store, payments and email disabled).

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `8090` | HTTP port. |
| `NODE_ENV` | `development` | `production` in deploys. |
| `JWT_SECRET` | insecure dev default (warns on boot) | **Required in production.** Long random string. |
| `DATABASE_URL` | *(empty)* | Set to a Postgres URL to use Postgres; empty = JSON store. |
| `CORS_ORIGIN` | `*` | Comma-separated allowlist of site origins in production. |
| `STRIPE_SECRET_KEY` | *(empty)* | Enables real checkout sessions. |
| `STRIPE_WEBHOOK_SECRET` | *(empty)* | Verifies the Stripe webhook signature. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | *(empty)* / `587` | SMTP relay; empty = mailer logs to console. |
| `FROM_EMAIL` | `hello@ubhi.example` | From address on outbound mail. |
| `OWNER_EMAIL` / `OWNER_PASSWORD` | `owner@ubhi.example` / `change-me-now` | Seed owner account (used by `npm run seed`). |
| `SHIPPING_FLAT` | `3.95` | Flat shipping fee applied below the free-shipping threshold. |
| `FREE_SHIP_THRESHOLD` | `50` | Order subtotal at/above which shipping is free. |

Generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## How the pluggable store works

Every route talks to a single `store` object (`db/store.js`) with an async
interface — never raw SQL. This keeps the routes portable and injection-safe.

```
store.all(table)                -> rows[]            (newest first by created_at)
store.get(table, id)            -> row | null
store.find(table, whereObj)     -> rows[]            (AND equality match)
store.findOne(table, whereObj)  -> row | null
store.insert(table, obj)        -> row               (auto id (uuid) + created_at)
store.update(table, id, patch)  -> row | null
store.remove(table, id)         -> boolean
store.count(table, whereObj?)   -> number
```

`store.js` chooses the backend at boot:

- **`DATABASE_URL` not set → `JsonStore` (default).** Each table is a JSON file
  under `backend/db/data/<table>.json`, created on demand. Table names are
  validated against a whitelist to prevent path traversal. Perfect for local
  development and demos — nothing to install.

- **`DATABASE_URL` set → `PostgresStore`.** Implements the same interface using
  **parameterised queries only** (`$1, $2, …`). On boot the server runs
  `db/schema.sql` (idempotent `CREATE TABLE IF NOT EXISTS`, uuid PKs via
  `pgcrypto`, `jsonb`, `timestamptz`).

Because both stores honour the identical interface, **no route code changes**
when you move from JSON to Postgres — you only set an environment variable.

Column names are `snake_case`. IDs are uuid strings. Every table has `id` and
`created_at`.

---

## Project layout

```
backend/
  server.js              Express entry point (helmet, cors, json, routes, errors)
  config.js              Env-driven configuration (dotenv)
  .env.example           Copy to .env and fill in
  db/
    store.js             Picks JsonStore or PostgresStore; shared interface
    jsonStore.js         Zero-config JSON file backend (default)
    postgresStore.js     PostgreSQL backend (parameterised queries)
    schema.sql           Postgres schema (run on boot when using Postgres)
    seed.js              Idempotent seed (npm run seed)
    data/                JSON store files (git-ignored, created on demand)
  middleware/
    auth.js              requireAuth / requireRole / requirePermission / signToken
    errors.js            asyncWrap + error helpers + final error handler
    validate.js          requireFields / coercion helpers
  routes/                One file per resource (auth, users, orders, …)
  services/
    stripe.js            Stripe Checkout (only file that requires "stripe")
    mailer.js            Nodemailer SMTP (only file that requires "nodemailer")
  docs/
    API_SPEC.md          Human-readable endpoint reference
    openapi.yaml         OpenAPI 3 spec
  Dockerfile
  docker-compose.yml
```

---

## Running with Docker

The included `Dockerfile` builds a small Node 18 image. `docker-compose.yml`
runs the API together with a PostgreSQL service so you can exercise the
production path locally.

```bash
cd backend

# API only, JSON store (no database):
docker build -t ubhi-backend .
docker run --rm -p 8090:8090 --env-file .env ubhi-backend

# API + PostgreSQL (production-like):
docker compose up --build
# The compose file sets DATABASE_URL for the api service so it uses Postgres.
```

To seed inside the running container:

```bash
docker compose exec api npm run seed
```

---

## Authentication & roles (summary)

- **`owner`** — full access to everything.
- **`staff`** — access limited to the back-office sections listed in their
  `permissions` array. Default staff permissions:
  `['workshops','shop','subscribers','orders','bookings']`.
- Owner-only sections, **never** granted to staff by default:
  `overview`, `customers`, `settings`, `users`, `journal`, `gallery`.

Send the token returned by `POST /api/auth/login` on every admin request:

```
Authorization: Bearer <jwt>
```

See [`docs/API_SPEC.md`](docs/API_SPEC.md) for the full endpoint reference and
[`../DEVELOPER_HANDOFF.md`](../DEVELOPER_HANDOFF.md) for deployment, the
frontend migration guide, and the security checklist.
