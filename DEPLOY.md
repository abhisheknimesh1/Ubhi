# Deploying the Ubhi backend — the 30-minute guide

**Why this matters:** the live Netlify site is currently a static shop window.
Until the backend is deployed, an order placed by a real customer stays in
*their* browser and never reaches you. Deploying the backend gives the site a
letterbox: orders, bookings, subscriptions, email signups and contact messages
all land in your admin panel on every device.

The backend is already production-shaped: `backend/Dockerfile`, a Postgres
mode, input validation and rate-limited login are all in place. You only have
to host it and set a few environment variables.

---

## Option A — Render.com (recommended, simplest)

### 1. Create the database
1. Sign in at [render.com](https://render.com) (GitHub login works).
2. **New → PostgreSQL** → name it `ubhi-db` → Free plan → Create.
3. Copy its **Internal Database URL** (starts `postgres://`).

### 2. Create the backend service
1. **New → Web Service** → connect the `abhisheknimesh1/Ubhi` repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Docker (it finds `backend/Dockerfile` automatically)
   - **Instance type:** Free is fine to start.
3. **Environment variables** (names only — pick your own values):

   | Name | What to put |
   |---|---|
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | a long random string — generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
   | `CORS_ORIGIN` | `https://harmonious-fairy-85012e.netlify.app` (add your custom domain later, comma-separated) |
   | `DATABASE_URL` | the Internal Database URL from step 1 |
   | `OWNER_EMAIL` | the email you'll sign in with |
   | `OWNER_PASSWORD` | a strong password (change from any default!) |
   | `SHIPPING_FLAT` | `3.95` (or your rate) |
   | `FREE_SHIP_THRESHOLD` | `50` |

   Leave the Stripe and SMTP variables unset for now — payments and email are
   the next phase and the backend runs happily without them.
4. Deploy. When it's live you get a URL like `https://ubhi-backend.onrender.com`.
5. Seed your owner account once: in the service's **Shell** tab run `npm run seed`.

### 3. Point the website at it
1. Open `index.html`, find the `UBHI_API_BASE` comment near the bottom, and
   un-comment it with your URL:
   ```html
   <script>window.UBHI_API_BASE = "https://ubhi-backend.onrender.com/api";</script>
   ```
2. Commit + push — Netlify redeploys automatically.

### 4. Connect the admin
Open your live site → Admin → **Settings → Server connection** → sign in with
`OWNER_EMAIL` / `OWNER_PASSWORD`. From that moment:
- your content edits save to the server and appear for every visitor;
- every order/booking/subscriber/signup/message from any device flows into
  your admin panel (Orders, Snail Mail, People, Email Updates);
- images you upload are hosted properly instead of bloating browser storage.

---

## Option B — any Docker host (Fly.io, Railway, a VPS)

`backend/Dockerfile` and `backend/docker-compose.yml` (API + Postgres) work
anywhere Docker runs. Set the same environment variables as above.

---

## Two honest warnings

1. **Uploaded images on Render's free tier** live on an ephemeral disk — they
   vanish on each deploy. Add a Render **Disk** mounted at `/app/uploads`
   (1 GB is plenty) or move uploads to S3/Cloudinary later.
2. **Free instances sleep** after idle periods; the first request can take
   ~30s to wake. The site tolerates this (it falls back to local storage and
   syncs when the server answers), but a paid instance (~$7/mo) removes the
   sleep entirely — worth it once real orders flow.

## What's deliberately NOT in this phase

- **Stripe payments** — the endpoints exist (`backend/routes/checkout.js`,
  `stripe.js`); wiring them needs your Stripe account keys.
- **Transactional email** — the mailer exists (`backend/services/mailer.js`);
  it needs SMTP credentials (e.g. Resend, Postmark) to start sending order
  confirmations.

Both switch on with environment variables when you're ready — no redeploy of
the site needed.
