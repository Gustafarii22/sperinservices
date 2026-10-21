-- Sperin Certificates isolated workspace. Apply only to a dedicated Postgres/Neon
-- database pointed to by SPERIN_CERTIFICATES_DATABASE_URL. Do not apply to the
-- Sperin Services reviews database or to EV4i/HouseTradeHome databases.
create extension if not exists pgcrypto;
create table if not exists cert_orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now()
);
create table if not exists cert_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references cert_orgs(id) on delete cascade,
  email text not null check (char_length(email) <= 254),
  role text not null check (role in ('owner','supervisor','electrician','viewer')),
  created_at timestamptz not null default now(),
  invited_by text,
  unique (org_id,email)
);
create index if not exists cert_members_by_email on cert_members (email);
create table if not exists cert_login_codes (
  email text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  requested_at timestamptz not null default now(),
  last_sent_at timestamptz not null default now(),
  sends int not null default 1
);
create table if not exists cert_sessions (
  session_hash text primary key,
  email text not null,
  org_id uuid not null references cert_orgs(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists cert_sessions_expiry on cert_sessions (expires_at);
create table if not exists cert_documents (
  id uuid primary key,
  org_id uuid not null references cert_orgs(id) on delete cascade,
  record jsonb not null,
  revision integer not null default 1 check (revision > 0),
  status text not null default 'draft' check (status in ('draft','submitted','approved')),
  created_by text not null,
  updated_by text not null,
  submitted_by text,
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cert_documents_by_org on cert_documents (org_id,updated_at desc);
create table if not exists cert_audit (
  id bigint generated always as identity primary key,
  org_id uuid not null references cert_orgs(id) on delete cascade,
  document_id uuid not null,
  revision integer not null,
  action text not null check(action in ('create','update','submit','approve')),
  actor text not null,
  recorded_at timestamptz not null default now(),
  data_hash text not null
);
create index if not exists cert_audit_by_document on cert_audit(org_id,document_id,id);
create table if not exists cert_ai_usage (
  org_id uuid not null references cert_orgs(id) on delete cascade,
  period text not null check (period ~ '^[0-9]{4}-[0-9]{2} No credentials are shipped
-- to Android or JavaScript. Every tenant query MUST include org_id.
),
  used integer not null default 0 check (used >= 0),
  primary key(org_id,period)
);
-- App uses ONLY the server-side database credential. No credentials are shipped
-- to Android or JavaScript. Every tenant query MUST include org_id.
