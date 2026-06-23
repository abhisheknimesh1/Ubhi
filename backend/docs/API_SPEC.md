# Ubhi API Specification

Base URL (local): `http://localhost:8090`
All endpoints are prefixed with **`/api`**.

- **Format:** JSON request and response bodies. `Content-Type: application/json`.
- **Auth:** stateless JWT. Obtain a token from `POST /api/auth/login`, then send
  `Authorization: Bearer <token>` on every protected request.
- **Errors:** non-2xx responses return `{ "error": "message" }`. Status codes:
  `400` validation, `401` missing/invalid token, `403` insufficient
  role/permission, `404` not found, `500` server error.
- **Success:** create returns the resource with `201`; reads/updates return the
  resource (`200`); deletes return `{ "ok": true }`.

## Auth column legend

| Marker | Meaning |
| --- | --- |
| **PUBLIC** | No authentication. Storefront-facing. |
| **AUTH** | Any authenticated admin user (`requireAuth`). |
| **OWNER** | Authenticated user with role `owner` only. |
| **`<section>`** | `requireAuth` + `requirePermission('<section>')`. Owner always passes; staff passes only if `<section>` is in their permissions. |

---

## System

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | PUBLIC | — | `{ ok: true, store: "json" \| "postgres" }` |

---

## Authentication

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/login` | PUBLIC (rate-limited 10 / 15 min per IP) | `{ email, password }` | `{ token, user }` (no password hash) |
| GET | `/api/auth/me` | AUTH | — | `{ user }` (fresh from store, no hash) |
| POST | `/api/auth/change-password` | AUTH | `{ current, next }` (`next` ≥ 8 chars) | `{ ok: true }` |

---

## Admin users (back-office accounts) — OWNER only

`password_hash` is **never** returned.

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/users` | OWNER | — | `admin_users[]` |
| POST | `/api/users` | OWNER | `{ email, password, role, permissions?, name? }` | created user (`201`) |
| PATCH | `/api/users/:id` | OWNER | `{ role?, permissions?, name?, active? }` | user |
| POST | `/api/users/:id/password` | OWNER | `{ password }` (≥ 8 chars) | `{ ok: true }` |
| DELETE | `/api/users/:id` | OWNER | — | `{ ok: true }` |

Guard rails: cannot delete or demote the **last owner**, cannot deactivate the
last active owner, cannot delete your own account. For `role: "owner"`,
`permissions` is forced to `[]` (owners implicitly have everything). Owner-only
sections are stripped from any staff `permissions` array.

---

## Orders

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| POST | `/api/orders` | PUBLIC (checkout) | `{ customer_email, customer_name?, phone?, items[], ship_street?, ship_city?, ship_postcode?, ship_country?, stripe_session_id? }` | created order (`201`) |
| GET | `/api/orders` | `orders` | — | `orders[]` |
| GET | `/api/orders/:id` | `orders` | — | order |
| PATCH | `/api/orders/:id` | `orders` | partial order (e.g. `{ status, paid }`) | order |
| DELETE | `/api/orders/:id` | `orders` | — | `{ ok: true }` |

`items` is an array of `{ id?, name, price, qty }`. **Money is computed
server-side** — `subtotal`, `shipping` and `total` are derived from the items
and the configured shipping rules; client-supplied totals are ignored. New
orders start `paid: false`, `status: "Preparing with care"`.

---

## Bookings (workshop reservations)

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| POST | `/api/bookings` | PUBLIC (reserve) | `{ name, email, phone?, workshop_id?, workshop_title?, session_date?, price?, note? }` | created booking (`201`) |
| GET | `/api/bookings` | `bookings` | — | `bookings[]` |
| GET | `/api/bookings/:id` | `bookings` | — | booking |
| PATCH | `/api/bookings/:id` | `bookings` | partial booking (e.g. `{ status }`) | booking |
| DELETE | `/api/bookings/:id` | `bookings` | — | `{ ok: true }` |

When a valid `workshop_id` is supplied, the booking copies the workshop's
title / date / price so it stays self-contained. New bookings start
`status: "Reserved"`.

---

## Snail-mail subscribers

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| POST | `/api/subscribers` | PUBLIC (join) | `{ name, email, contact?, plan?, price?, address?, date_subscribed?, last_sent_cycle? }` | created subscriber (`201`) |
| GET | `/api/subscribers` | `subscribers` | — | `snail_subscribers[]` |
| PATCH | `/api/subscribers/:id` | `subscribers` | partial (e.g. `{ status: "Active"\|"Inactive" }`) | subscriber |
| DELETE | `/api/subscribers/:id` | `subscribers` | — | `{ ok: true }` |

New subscribers start `status: "Active"`.

---

## Newsletter signups

Managed under the same back-office section as snail-mail (`subscribers`).
No PATCH by design.

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| POST | `/api/updates` | PUBLIC (signup) | `{ email, name?, interest? }` | created signup (`201`) |
| GET | `/api/updates` | `subscribers` | — | `newsletter_signups[]` |
| DELETE | `/api/updates/:id` | `subscribers` | — | `{ ok: true }` |

---

## Customers (storefront accounts)

`password_hash` is **never** returned.

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| POST | `/api/customers` | PUBLIC (register) | `{ email, password, name?, phone?, address?, city?, postcode?, country?, marketing_opt_in? }` (password ≥ 8) | created customer (`201`) |
| GET | `/api/customers` | `customers` | — | `customers[]` |
| PATCH | `/api/customers/:id` | `customers` | partial (incl. optional `password` reset) | customer |
| DELETE | `/api/customers/:id` | `customers` | — | `{ ok: true }` |

---

## Workshops

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/workshops` | PUBLIC | — | **published** workshops only |
| GET | `/api/workshops/all` | `workshops` | — | all workshops (published or not) |
| POST | `/api/workshops` | `workshops` | `{ title, blurb?, session_date?, price?, spots?, image?, published? }` | created (`201`) |
| PATCH | `/api/workshops/:id` | `workshops` | partial workshop | workshop |
| DELETE | `/api/workshops/:id` | `workshops` | — | `{ ok: true }` |

---

## Shop (products)

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/shop` | PUBLIC | — | **published** products only |
| GET | `/api/shop/all` | `shop` | — | all products |
| POST | `/api/shop` | `shop` | `{ name, blurb?, price?, stock?, image?, published? }` | created (`201`) |
| PATCH | `/api/shop/:id` | `shop` | partial product | product |
| DELETE | `/api/shop/:id` | `shop` | — | `{ ok: true }` |

---

## Gallery

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/gallery` | PUBLIC | — | **published** items only |
| GET | `/api/gallery/all` | `gallery` | — | all items |
| POST | `/api/gallery` | `gallery` | `{ image, caption?, published? }` | created (`201`) |
| PATCH | `/api/gallery/:id` | `gallery` | partial item | item |
| DELETE | `/api/gallery/:id` | `gallery` | — | `{ ok: true }` |

---

## Journal (blog posts)

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/journal` | PUBLIC | — | **published** posts only |
| GET | `/api/journal/all` | `journal` | — | all posts |
| POST | `/api/journal` | `journal` | `{ title, slug?, body?, author?, published? }` | created (`201`) |
| PATCH | `/api/journal/:id` | `journal` | partial post | post |
| DELETE | `/api/journal/:id` | `journal` | — | `{ ok: true }` |

---

## Settings (key/value)

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/settings/:key` | OWNER, **or** PUBLIC for allowlisted safe keys (`shipping`, `announcement`, `storefront`) | — | `{ key, value }` |
| PUT | `/api/settings/:key` | OWNER | `{ value }` (any JSON) | `{ key, value }` (upsert) |

---

## Payments (Stripe)

| Method | Path | Auth | Body | Response |
| --- | --- | --- | --- | --- |
| POST | `/api/checkout/session` | PUBLIC | `{ items[], ... }` | Stripe Checkout session, **or** `200 { configured: false }` when no Stripe key is set |
| POST | `/api/stripe/webhook` | PUBLIC (raw body; Stripe signature verified) | raw Stripe event | `{ received: true }`; marks the matching order `paid` |

The webhook path receives the **raw** request body (not JSON-parsed) so the
Stripe signature can be verified. When `STRIPE_SECRET_KEY` is absent, checkout
returns `{ configured: false }` so the storefront can fall back gracefully.

---

## Notes

- Lists are returned newest-first by `created_at`.
- All IDs are uuid strings.
- Column / field names are `snake_case`.
- Routes never run raw SQL — they use the shared `store` interface, which is
  parameterised on Postgres and whitelisted on the JSON store.
