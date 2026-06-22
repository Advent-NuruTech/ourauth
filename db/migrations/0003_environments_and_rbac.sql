-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  Ants — dual-mode environments + dynamic RBAC (0003)                        ║
-- ║                                                                            ║
-- ║  1. Each application now runs in BOTH `test` and `live` modes              ║
-- ║     simultaneously. The `environment` dimension moves from the application ║
-- ║     onto the data it scopes: API keys, end users, identities, oauth state. ║
-- ║     A live user pool and a test user pool are fully isolated.              ║
-- ║                                                                            ║
-- ║  2. A fully dynamic role/permission system. There are NO built-in roles —  ║
-- ║     every role and permission is created by the tenant's application, and  ║
-- ║     scoped per (application, environment).                                  ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Safe to run multiple times (idempotent).

-- ── 1. Environment dimension on app-scoped data ──────────────────────────────

-- API keys: an app holds both test and live keys. Backfill from the app's
-- (previously fixed) environment, then make the column required.
alter table api_keys add column if not exists environment text;
update api_keys k set environment = a.environment
  from applications a where a.id = k.application_id and k.environment is null;
alter table api_keys alter column environment set default 'test';
update api_keys set environment = 'test' where environment is null;
alter table api_keys alter column environment set not null;
do $$ begin
  alter table api_keys add constraint api_keys_environment_check
    check (environment in ('live','test'));
exception when duplicate_object then null; end $$;
create index if not exists idx_api_keys_app_env on api_keys(application_id, environment);

-- End users: a separate pool per environment. The unique key gains environment.
alter table app_users add column if not exists environment text;
update app_users u set environment = a.environment
  from applications a where a.id = u.application_id and u.environment is null;
alter table app_users alter column environment set default 'test';
update app_users set environment = 'test' where environment is null;
alter table app_users alter column environment set not null;
do $$ begin
  alter table app_users add constraint app_users_environment_check
    check (environment in ('live','test'));
exception when duplicate_object then null; end $$;
alter table app_users drop constraint if exists app_users_application_id_email_key;
create unique index if not exists idx_app_users_app_env_email
  on app_users(application_id, environment, email);
create index if not exists idx_app_users_app_env on app_users(application_id, environment);

-- OAuth identities follow the user's environment.
alter table identities add column if not exists environment text;
update identities i set environment = u.environment
  from app_users u where u.id = i.app_user_id and i.environment is null;
alter table identities alter column environment set default 'test';
update identities set environment = 'test' where environment is null;
alter table identities alter column environment set not null;
do $$ begin
  alter table identities add constraint identities_environment_check
    check (environment in ('live','test'));
exception when duplicate_object then null; end $$;
alter table identities drop constraint if exists identities_application_id_provider_provider_user_id_key;
create unique index if not exists idx_identities_app_env_provider
  on identities(application_id, environment, provider, provider_user_id);

-- Transient OAuth state carries the environment of the publishable key that
-- started the flow, so the callback upserts into the right user pool.
alter table oauth_states add column if not exists environment text not null default 'test';

-- Audit log gains an environment tag for filtering.
alter table audit_logs add column if not exists environment text;
create index if not exists idx_audit_app_env on audit_logs(application_id, environment, created_at desc);

-- ── 2. Dynamic roles & permissions (per application + environment) ───────────

-- A role is a named bundle of permissions. `key` is the stable machine name the
-- application references in code; `is_default` opts new users into it on signup.
create table if not exists roles (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references applications(id) on delete cascade,
  environment     text not null check (environment in ('live','test')),
  key             text not null,
  name            text not null,
  description     text,
  is_default      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (application_id, environment, key)
);
create index if not exists idx_roles_app_env on roles(application_id, environment);

-- A permission is a single capability the application defines, e.g. "invoices:read".
create table if not exists permissions (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references applications(id) on delete cascade,
  environment     text not null check (environment in ('live','test')),
  key             text not null,
  description     text,
  created_at      timestamptz not null default now(),
  unique (application_id, environment, key)
);
create index if not exists idx_permissions_app_env on permissions(application_id, environment);

-- Which permissions a role grants (many-to-many).
create table if not exists role_permissions (
  role_id        uuid not null references roles(id) on delete cascade,
  permission_id  uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);
create index if not exists idx_role_permissions_perm on role_permissions(permission_id);

-- Which roles an end user holds (many-to-many).
create table if not exists user_roles (
  app_user_id  uuid not null references app_users(id) on delete cascade,
  role_id      uuid not null references roles(id) on delete cascade,
  assigned_at  timestamptz not null default now(),
  primary key (app_user_id, role_id)
);
create index if not exists idx_user_roles_role on user_roles(role_id);
