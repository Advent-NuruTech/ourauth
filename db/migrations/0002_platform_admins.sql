-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  Ants — platform managers (0002)                                           ║
-- ║  Operators of the Ants platform itself. Distinct identity layer from        ║
-- ║  `developers` (tenants): platform admins oversee ALL tenants & apps.        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Safe to run multiple times (idempotent via IF NOT EXISTS).

-- ── Platform managers (Ants operators) ───────────────────────────────────────
create table if not exists platform_admins (
  id            uuid primary key default gen_random_uuid(),
  email         citext not null unique,
  password_hash text not null,
  name          text,
  status        text not null default 'active' check (status in ('active','suspended')),
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
