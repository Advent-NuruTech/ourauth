-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  Ants — initial schema (0001)                                              ║
-- ║  Multi-tenant authentication platform. "Secured by Ants."                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Safe to run multiple times (idempotent via IF NOT EXISTS).

create extension if not exists pgcrypto;     -- gen_random_uuid()
create extension if not exists citext;        -- case-insensitive email

-- Tracks which migrations have been applied (used by scripts/migrate.ts).
create table if not exists ants_migrations (
  id          text primary key,
  applied_at  timestamptz not null default now()
);

-- ── Tenants (Ants customers) ────────────────────────────────────────────────
create table if not exists developers (
  id            uuid primary key default gen_random_uuid(),
  email         citext not null unique,
  password_hash text not null,
  name          text,
  status        text not null default 'active' check (status in ('active','suspended')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Applications (each developer's apps; isolated user pools) ────────────────
create table if not exists applications (
  id            uuid primary key default gen_random_uuid(),
  developer_id  uuid not null references developers(id) on delete cascade,
  name          text not null,
  environment   text not null default 'test' check (environment in ('live','test')),
  -- settings: { allowed_origins: [], redirect_uris: [], providers: {google:{enabled,client_id,client_secret_enc}},
  --             access_ttl, refresh_ttl, require_email_verification }
  settings      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_applications_developer on applications(developer_id);

-- ── API keys (publishable pk_ / secret sk_; secret stored only as hash) ──────
create table if not exists api_keys (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references applications(id) on delete cascade,
  type            text not null check (type in ('pk','sk')),
  key_prefix      text not null,             -- e.g. pk_test_ab12cd34 (shown in UI)
  key_hash        text not null,             -- sha256(full key); unique lookup
  last_used_at    timestamptz,
  revoked_at      timestamptz,
  created_at      timestamptz not null default now()
);
create unique index if not exists idx_api_keys_hash on api_keys(key_hash);
create index if not exists idx_api_keys_app on api_keys(application_id);

-- ── End users (scoped per application) ───────────────────────────────────────
create table if not exists app_users (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references applications(id) on delete cascade,
  email           citext not null,
  email_verified  boolean not null default false,
  password_hash   text,                       -- null for OAuth-only users
  full_name       text,
  avatar_url      text,
  status          text not null default 'active' check (status in ('active','blocked')),
  failed_logins   integer not null default 0,
  locked_until    timestamptz,
  last_login_at   timestamptz,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (application_id, email)
);
create index if not exists idx_app_users_app on app_users(application_id);

-- ── OAuth identities linked to an app_user ──────────────────────────────────
create table if not exists identities (
  id                uuid primary key default gen_random_uuid(),
  app_user_id       uuid not null references app_users(id) on delete cascade,
  application_id    uuid not null references applications(id) on delete cascade,
  provider          text not null,            -- 'google'
  provider_user_id  text not null,
  profile           jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  unique (application_id, provider, provider_user_id)
);
create index if not exists idx_identities_user on identities(app_user_id);

-- ── Sessions + rotating refresh tokens (with reuse detection) ────────────────
create table if not exists sessions (
  id            uuid primary key default gen_random_uuid(),
  app_user_id   uuid not null references app_users(id) on delete cascade,
  user_agent    text,
  ip            text,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  revoked_at    timestamptz
);
create index if not exists idx_sessions_user on sessions(app_user_id);

create table if not exists refresh_tokens (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references sessions(id) on delete cascade,
  family_id   uuid not null,                  -- all rotations share a family
  parent_id   uuid references refresh_tokens(id) on delete set null,
  token_hash  text not null,                  -- sha256(token)
  expires_at  timestamptz not null,
  used_at     timestamptz,                    -- set when rotated (consumed)
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);
create unique index if not exists idx_refresh_hash on refresh_tokens(token_hash);
create index if not exists idx_refresh_family on refresh_tokens(family_id);
create index if not exists idx_refresh_session on refresh_tokens(session_id);

-- ── Single-use email tokens (verification + password reset) ──────────────────
create table if not exists email_verification_tokens (
  id          uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references app_users(id) on delete cascade,
  token_hash  text not null,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
create unique index if not exists idx_evt_hash on email_verification_tokens(token_hash);
create index if not exists idx_evt_expires on email_verification_tokens(expires_at);

create table if not exists password_reset_tokens (
  id          uuid primary key default gen_random_uuid(),
  app_user_id uuid not null references app_users(id) on delete cascade,
  token_hash  text not null,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_at  timestamptz not null default now()
);
create unique index if not exists idx_prt_hash on password_reset_tokens(token_hash);
create index if not exists idx_prt_expires on password_reset_tokens(expires_at);

-- ── JWT signing keys (Ed25519; private key encrypted at rest) ────────────────
create table if not exists signing_keys (
  kid              text primary key,
  alg              text not null default 'EdDSA',
  public_jwk       jsonb not null,
  private_key_enc  text not null,             -- AES-256-GCM(private PKCS8 PEM)
  status           text not null default 'active' check (status in ('active','retiring','revoked')),
  created_at       timestamptz not null default now()
);
create index if not exists idx_signing_keys_status on signing_keys(status);

-- ── OAuth transient state (PKCE + CSRF) ──────────────────────────────────────
create table if not exists oauth_states (
  state           text primary key,
  application_id  uuid not null references applications(id) on delete cascade,
  provider        text not null,
  code_verifier   text not null,
  redirect_uri    text not null,             -- where to send the user after callback
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null
);
create index if not exists idx_oauth_states_expires on oauth_states(expires_at);

-- ── Rate limiting (fixed window; Redis-swappable) ────────────────────────────
create table if not exists rate_limits (
  bucket_key    text not null,
  window_start  timestamptz not null,
  count         integer not null default 0,
  primary key (bucket_key, window_start)
);
create index if not exists idx_rate_limits_window on rate_limits(window_start);

-- ── Audit log ────────────────────────────────────────────────────────────────
create table if not exists audit_logs (
  id              bigint generated always as identity primary key,
  application_id  uuid references applications(id) on delete set null,
  app_user_id     uuid references app_users(id) on delete set null,
  event           text not null,
  ip              text,
  user_agent      text,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists idx_audit_app on audit_logs(application_id, created_at desc);
create index if not exists idx_audit_user on audit_logs(app_user_id, created_at desc);

-- ── MFA factors (schema reserved for phase 2; unused in v1) ──────────────────
create table if not exists mfa_factors (
  id            uuid primary key default gen_random_uuid(),
  app_user_id   uuid not null references app_users(id) on delete cascade,
  type          text not null default 'totp' check (type in ('totp')),
  secret_enc    text not null,
  verified_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists idx_mfa_user on mfa_factors(app_user_id);
