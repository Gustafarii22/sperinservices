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
  period text not null check (period ~ '^[0-9]{4}-[0-9]{2}$'),
  used integer not null default 0 check (used >= 0),
  primary key(org_id,period)
);
-- One private site/job links multiple certificates, equipment, photos and reminders.
create table if not exists cert_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references cert_orgs(id) on delete cascade,
  asset_id uuid not null unique default gen_random_uuid(),
  details jsonb not null default '{}'::jsonb,
  revision integer not null default 1,
  updated_by text not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists cert_jobs_by_org on cert_jobs (org_id,updated_at desc);
create table if not exists cert_evidence (
  id uuid primary key,
  org_id uuid not null references cert_orgs(id) on delete cascade,
  job_id uuid not null references cert_jobs(id) on delete cascade,
  document_id uuid,
  file_type text not null check (file_type in ('image/jpeg','image/png','image/webp')),
  label text not null default '',
  circuit_ref text,
  observation_ref text,
  uploaded_by text not null,
  body bytea not null check(octet_length(body)<=2200000),
  created_at timestamptz not null default now()
);
create index if not exists cert_evidence_by_job on cert_evidence (org_id,job_id);
-- Password-equivalent handover tokens are stored ONLY as SHA-256 hashes.
create table if not exists cert_handover_links (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references cert_orgs(id) on delete cascade,
  job_id uuid not null references cert_jobs(id) on delete cascade,
  token_hash text not null unique,
  customer_email text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by text not null,
  created_at timestamptz not null default now()
);
create table if not exists cert_handover_files (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references cert_handover_links(id) on delete cascade,
  org_id uuid not null references cert_orgs(id) on delete cascade,
  label text not null,
  filename text not null,
  mime_type text not null check(mime_type='application/pdf'),
  body bytea not null check(octet_length(body)<=6000000)
);
create index if not exists cert_handover_files_lookup on cert_handover_files(link_id);
create table if not exists cert_reminders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references cert_orgs(id) on delete cascade,
  job_id uuid not null references cert_jobs(id) on delete cascade,
  kind text not null check (kind in ('eicr','emergency','fire','pat','ev','solar','custom')),
  description text not null,
  due_date date not null,
  engineer_email text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists cert_reminders_due on cert_reminders(due_date) where active;
create table if not exists cert_reminder_sent (
  reminder_id uuid not null references cert_reminders(id) on delete cascade,
  notice_days int not null,
  due_date date not null,
  sent_at timestamptz not null default now(),
  primary key(reminder_id,notice_days,due_date)
);
-- All app access is via the verified server session and tenant-scoped SQL.
-- No server database credential is ever sent to Android or the web interface.

-- Optional Stripe SaaS billing. Existing cloud records remain exportable if unpaid.
alter table cert_orgs add column if not exists trial_ends_at timestamptz not null default now()+interval '14 days';
alter table cert_orgs add column if not exists stripe_customer_id text;
alter table cert_orgs add column if not exists stripe_subscription_id text;
alter table cert_orgs add column if not exists subscription_status text not null default 'trial';
alter table cert_orgs add column if not exists subscription_period_end timestamptz;
create unique index if not exists cert_orgs_stripe_customer on cert_orgs(stripe_customer_id) where stripe_customer_id is not null;
create table if not exists cert_stripe_events (
  id text primary key,
  kind text not null,
  received_at timestamptz not null default now()
);

-- Field-level collaborative edits: no last-writer-wins, explicit audit evidence.
create table if not exists cert_live_presence(
  org_id uuid not null references cert_orgs(id) on delete cascade,
  document_id uuid not null,
  email text not null,
  last_seen timestamptz not null default now(),
  primary key(org_id,document_id,email)
);
create index if not exists cert_live_presence_recent on cert_live_presence(org_id,document_id,last_seen desc);
create table if not exists cert_live_edits(
  id bigint generated always as identity primary key,
  org_id uuid not null references cert_orgs(id) on delete cascade,
  document_id uuid not null,
  revision int not null,
  field_path text[] not null,
  previous_value jsonb,
  new_value jsonb,
  actor text not null,
  edited_at timestamptz not null default now()
);
create index if not exists cert_live_edits_by_doc on cert_live_edits(org_id,document_id,id);

-- This Supabase project is used only through the privileged certificates API.
-- Anonymous and signed-in Supabase REST users must NEVER be able to read any
-- certificate, health/safety observation, customer details, or authentication code.
do $rls$
declare t record;
begin
  for t in select tablename from pg_tables
      where schemaname='public' and tablename like 'cert_%'
  loop
    execute format('alter table public.%I enable row level security',t.tablename);
    execute format('revoke all privileges on table public.%I from anon, authenticated',t.tablename);
  end loop;
end
$rls$;
-- Auth is owned by the HTTPS server's session cookie + tenant-scoped SQL;
-- never expose the privileged server database password to the mobile client.
