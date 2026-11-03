-- DAM initial core schema
-- PostgreSQL / Supabase compatible starting point.
-- Review and test in a non-production database before applying.
create extension if not exists pgcrypto;

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active','suspended','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- profile.id is intended to reference auth.users(id) after Supabase Auth is configured.
create table if not exists profiles (
  id uuid primary key,
  display_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','manager','staff','viewer')),
  status text not null default 'active' check (status in ('invited','active','disabled')),
  created_at timestamptz not null default now(),
  unique (tenant_id, profile_id)
);

create table if not exists farms (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  name text not null,
  farm_code text,
  address_text text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  area_m2 numeric(14,2),
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, farm_code)
);

create table if not exists farm_members (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references farms(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'worker',
  created_at timestamptz not null default now(),
  unique (farm_id, profile_id)
);

create table if not exists sensors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  farm_id uuid not null references farms(id) on delete cascade,
  device_code text not null,
  sensor_type text not null,
  unit text,
  installed_at timestamptz,
  last_seen_at timestamptz,
  status text not null default 'active' check (status in ('active','inactive','maintenance')),
  created_at timestamptz not null default now(),
  unique (tenant_id, device_code)
);

create table if not exists production_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  farm_id uuid not null references farms(id) on delete cascade,
  sensor_id uuid references sensors(id) on delete set null,
  metric_code text not null,
  value_numeric numeric(18,6),
  value_text text,
  unit text,
  observed_at timestamptz not null,
  source text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists harvest_batches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  farm_id uuid not null references farms(id) on delete restrict,
  batch_code text not null,
  crop_name text not null,
  cultivar text,
  harvested_on date not null,
  quantity numeric(14,3) not null check (quantity >= 0),
  quantity_unit text not null default 'kg',
  grade text,
  brix numeric(5,2),
  notes text,
  status text not null default 'harvested' check (status in ('harvested','processing','stored','allocated','sold','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, batch_code)
);

create table if not exists trace_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  harvest_batch_id uuid not null references harvest_batches(id) on delete cascade,
  event_type text not null,
  occurred_at timestamptz not null,
  location_text text,
  actor_profile_id uuid references profiles(id) on delete set null,
  description text,
  evidence_uri text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  name text not null,
  story text,
  status text not null default 'draft' check (status in ('draft','active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  brand_id uuid references brands(id) on delete set null,
  sku text,
  name text not null,
  description text,
  product_type text not null default 'physical',
  status text not null default 'draft' check (status in ('draft','active','inactive','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, sku)
);

create table if not exists product_harvest_batches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  product_id uuid not null references products(id) on delete cascade,
  harvest_batch_id uuid not null references harvest_batches(id) on delete restrict,
  allocated_quantity numeric(14,3),
  quantity_unit text not null default 'kg',
  created_at timestamptz not null default now(),
  unique (product_id, harvest_batch_id)
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  name text not null,
  email text,
  phone text,
  customer_type text not null default 'individual',
  consent_marketing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  customer_id uuid references customers(id) on delete set null,
  order_number text not null,
  status text not null default 'pending' check (status in ('pending','paid','processing','shipped','completed','cancelled','refunded')),
  currency char(3) not null default 'KRW',
  subtotal numeric(14,2) not null default 0,
  shipping_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  ordered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (tenant_id, order_number)
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name_snapshot text not null,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  line_total numeric(14,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  title text not null,
  source_uri text,
  source_type text not null default 'manual',
  content_text text,
  version integer not null default 1,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  job_type text not null,
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed','cancelled')),
  provider text,
  model text,
  prompt_version text,
  input_reference jsonb not null default '{}'::jsonb,
  output_reference jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete set null,
  actor_profile_id uuid references profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_farms_tenant on farms(tenant_id);
create index if not exists idx_harvest_batches_farm_date on harvest_batches(farm_id, harvested_on desc);
create index if not exists idx_trace_events_batch_time on trace_events(harvest_batch_id, occurred_at desc);
create index if not exists idx_production_records_farm_time on production_records(farm_id, observed_at desc);
create index if not exists idx_orders_tenant_date on orders(tenant_id, ordered_at desc);
create index if not exists idx_ai_jobs_tenant_status on ai_jobs(tenant_id, status);

-- IMPORTANT:
-- RLS is intentionally not enabled in this first schema draft.
-- Before production, define and test tenant isolation policies for every tenant-scoped table,
-- map profiles.id to auth.users(id), and validate service-role/server-side access patterns.
