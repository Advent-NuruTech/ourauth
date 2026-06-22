-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  Ants — developer (platform) Google sign-in (0004)                         ║
-- ║  Lets people sign up to Ants itself with Google OR email+password, with a   ║
-- ║  SINGLE source of truth: one `developers` row per email. A Google login and ║
-- ║  a password login for the same (verified) email resolve to the same row.    ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Safe to run multiple times (idempotent).

-- Google-only accounts have no password, so password_hash becomes optional.
alter table developers alter column password_hash drop not null;

-- Link to the Google account + cache profile bits for the dashboard UI.
alter table developers add column if not exists google_id      text unique;
alter table developers add column if not exists avatar_url     text;
alter table developers add column if not exists email_verified boolean not null default false;

-- CSRF + PKCE state for the PLATFORM Google flow. Distinct from `oauth_states`,
-- which is scoped to a tenant application (and requires an application_id).
create table if not exists developer_oauth_states (
  state         text primary key,
  provider      text not null default 'google',
  code_verifier text not null,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null
);
create index if not exists idx_dev_oauth_states_expires on developer_oauth_states(expires_at);
