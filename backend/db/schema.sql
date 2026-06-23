-- schema.sql — PostgreSQL schema for the Ubhi backend.
-- Run on boot by PostgresStore.init(). Every statement is idempotent
-- (CREATE ... IF NOT EXISTS). uuid primary keys default to gen_random_uuid()
-- provided by the pgcrypto extension.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Admin / staff accounts (back office).
CREATE TABLE IF NOT EXISTS admin_users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role          text NOT NULL DEFAULT 'staff',      -- 'owner' | 'staff'
  permissions   jsonb NOT NULL DEFAULT '[]'::jsonb,
  name          text,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Storefront customer accounts.
CREATE TABLE IF NOT EXISTS customers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email            text UNIQUE NOT NULL,
  password_hash    text NOT NULL,
  name             text,
  phone            text,
  address          text,
  city             text,
  postcode         text,
  country          text,
  marketing_opt_in boolean NOT NULL DEFAULT false,
  active           boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Snail-mail (physical) subscribers.
CREATE TABLE IF NOT EXISTS snail_subscribers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text,
  email            text,
  contact          text,
  status           text NOT NULL DEFAULT 'Active',   -- 'Active' | 'Inactive'
  plan             text,
  price            numeric,
  address          text,
  date_subscribed  text,
  last_sent_cycle  text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Newsletter (email) signups.
CREATE TABLE IF NOT EXISTS newsletter_signups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text,
  email       text,
  interest    text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Shop orders.
CREATE TABLE IF NOT EXISTS orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref         text,
  customer_name     text,
  customer_email    text,
  phone             text,
  items             jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal          numeric,
  shipping          numeric,
  total             numeric,
  status            text NOT NULL DEFAULT 'pending',
  ship_street       text,
  ship_city         text,
  ship_postcode     text,
  ship_country      text,
  stripe_session_id text,
  paid              boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Workshop bookings / reservations.
CREATE TABLE IF NOT EXISTS bookings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text,
  email           text,
  phone           text,
  workshop_id     text,
  workshop_title  text,
  session_date    text,
  price           numeric,
  note            text,
  status          text NOT NULL DEFAULT 'pending',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Workshops (catalogue).
CREATE TABLE IF NOT EXISTS workshops (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  blurb         text,
  session_date  text,
  price         numeric,
  spots         int,
  image         text,
  published     boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Shop products.
CREATE TABLE IF NOT EXISTS products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  blurb       text,
  price       numeric,
  stock       int,
  image       text,
  published   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Gallery items.
CREATE TABLE IF NOT EXISTS gallery_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image       text,
  caption     text,
  published   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Journal / blog posts.
CREATE TABLE IF NOT EXISTS journal_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  slug        text,
  body        text,
  author      text,
  published   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Key/value settings store.
CREATE TABLE IF NOT EXISTS settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text UNIQUE NOT NULL,
  value       jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Content state-sync: each row holds one storefront content collection
-- (gallery-items, art-pieces, snail-plans, snail-reviews, text-overrides, …),
-- keeping the owner's admin edits real and shared across devices/visitors.
CREATE TABLE IF NOT EXISTS app_state (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text UNIQUE NOT NULL,
  value       jsonb,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);
