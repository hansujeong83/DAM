-- DAM agriculture operations domain
-- Adds field/plot, crop, cultivation, input and harvest-quality records.
-- Apply after 001_initial_schema.sql and 002_tenant_rls.sql in staging first.

begin;

-- Composite keys enforce that a child record cannot point across tenants.
alter table public.farms
  add constraint farms_tenant_id_id_key unique (tenant_id, id);

create table if not exists public.plots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  farm_id uuid not null,
  plot_code text not null,
  name text not null,
  area_m2 numeric(14,2) check (area_m2 is null or area_m2 > 0),
  soil_type text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, farm_id, plot_code),
  foreign key (tenant_id, farm_id)
    references public.farms(tenant_id, id) on delete cascade
);

create table if not exists public.crop_catalog (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  crop_code text not null,
  crop_name text not null,
  cultivar text,
  scientific_name text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, crop_code)
);

create table if not exists public.cultivation_cycles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  farm_id uuid not null,
  plot_id uuid not null,
  crop_id uuid not null,
  cycle_code text not null,
  started_on date not null,
  expected_harvest_on date,
  ended_on date,
  status text not null default 'planned'
    check (status in ('planned','active','harvesting','completed','cancelled')),
  target_yield_kg numeric(14,3) check (target_yield_kg is null or target_yield_kg >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, cycle_code),
  check (expected_harvest_on is null or expected_harvest_on >= started_on),
  check (ended_on is null or ended_on >= started_on),
  foreign key (tenant_id, farm_id)
    references public.farms(tenant_id, id) on delete restrict,
  foreign key (tenant_id, plot_id)
    references public.plots(tenant_id, id) on delete restrict,
  foreign key (tenant_id, crop_id)
    references public.crop_catalog(tenant_id, id) on delete restrict
);

create table if not exists public.cultivation_tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  cycle_id uuid not null,
  task_type text not null,
  title text not null,
  description text,
  planned_at timestamptz,
  completed_at timestamptz,
  status text not null default 'planned'
    check (status in ('planned','in_progress','completed','skipped')),
  assigned_profile_id uuid references public.profiles(id) on delete set null,
  evidence_uri text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, cycle_id)
    references public.cultivation_cycles(tenant_id, id) on delete cascade
);

create table if not exists public.input_applications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  cycle_id uuid not null,
  applied_at timestamptz not null,
  input_category text not null
    check (input_category in ('fertilizer','pesticide','soil_amendment','water','biological','other')),
  input_name text not null,
  amount numeric(14,3) not null check (amount >= 0),
  unit text not null,
  application_method text,
  registration_number text,
  safety_interval_days integer check (safety_interval_days is null or safety_interval_days >= 0),
  operator_profile_id uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, cycle_id)
    references public.cultivation_cycles(tenant_id, id) on delete cascade
);

alter table public.harvest_batches
  add column if not exists plot_id uuid,
  add column if not exists cultivation_cycle_id uuid,
  add column if not exists crop_id uuid,
  add column if not exists harvested_by uuid references public.profiles(id) on delete set null;

alter table public.harvest_batches
  add constraint harvest_batches_tenant_id_id_key unique (tenant_id, id);

alter table public.harvest_batches
  add constraint harvest_batches_plot_tenant_fk
    foreign key (tenant_id, plot_id)
    references public.plots(tenant_id, id) on delete restrict,
  add constraint harvest_batches_cycle_tenant_fk
    foreign key (tenant_id, cultivation_cycle_id)
    references public.cultivation_cycles(tenant_id, id) on delete restrict,
  add constraint harvest_batches_crop_tenant_fk
    foreign key (tenant_id, crop_id)
    references public.crop_catalog(tenant_id, id) on delete restrict;

create table if not exists public.harvest_quality_measurements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  harvest_batch_id uuid not null,
  measured_at timestamptz not null default now(),
  metric_code text not null,
  value_numeric numeric(18,6),
  value_text text,
  unit text,
  method text,
  measured_by uuid references public.profiles(id) on delete set null,
  evidence_uri text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (value_numeric is not null or value_text is not null),
  foreign key (tenant_id, harvest_batch_id)
    references public.harvest_batches(tenant_id, id) on delete cascade
);

-- A transformation can consume multiple source batches and produce a new batch.
create table if not exists public.harvest_batch_lineage (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  parent_batch_id uuid not null,
  child_batch_id uuid not null,
  relationship_type text not null
    check (relationship_type in ('processed_into','split_into','merged_into','repacked_into')),
  input_quantity numeric(14,3) check (input_quantity is null or input_quantity >= 0),
  output_quantity numeric(14,3) check (output_quantity is null or output_quantity >= 0),
  quantity_unit text not null default 'kg',
  recorded_at timestamptz not null default now(),
  notes text,
  check (parent_batch_id <> child_batch_id),
  unique (tenant_id, parent_batch_id, child_batch_id, relationship_type),
  foreign key (tenant_id, parent_batch_id)
    references public.harvest_batches(tenant_id, id) on delete restrict,
  foreign key (tenant_id, child_batch_id)
    references public.harvest_batches(tenant_id, id) on delete restrict
);

create index if not exists idx_plots_farm on public.plots(tenant_id, farm_id);
create index if not exists idx_cycles_plot_status on public.cultivation_cycles(tenant_id, plot_id, status);
create index if not exists idx_cycles_crop_dates on public.cultivation_cycles(tenant_id, crop_id, started_on desc);
create index if not exists idx_tasks_cycle_planned on public.cultivation_tasks(tenant_id, cycle_id, planned_at);
create index if not exists idx_inputs_cycle_date on public.input_applications(tenant_id, cycle_id, applied_at desc);
create index if not exists idx_harvest_quality_batch on public.harvest_quality_measurements(tenant_id, harvest_batch_id, measured_at desc);
create index if not exists idx_batch_lineage_parent on public.harvest_batch_lineage(tenant_id, parent_batch_id);
create index if not exists idx_batch_lineage_child on public.harvest_batch_lineage(tenant_id, child_batch_id);
create index if not exists idx_harvest_batches_cycle on public.harvest_batches(tenant_id, cultivation_cycle_id);

-- All new tenant-owned tables use the same membership boundary as core records.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'plots',
    'crop_catalog',
    'cultivation_cycles',
    'cultivation_tasks',
    'input_applications',
    'harvest_quality_measurements',
    'harvest_batch_lineage'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists tenant_member_access on public.%I', table_name);
    execute format(
      'create policy tenant_member_access on public.%I for all to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id))',
      table_name
    );
  end loop;
end $$;

commit;
