-- DAM processing transformation: source harvest LOT -> processed output LOT.
-- Apply after 004_harvest_lot_code.sql in staging, then test with two tenants.
begin;

create table if not exists public.processing_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  source_batch_id uuid not null,
  output_batch_id uuid not null,
  process_code text not null,
  process_name text not null,
  processed_on date not null,
  input_quantity numeric(14,3) not null check (input_quantity > 0),
  input_unit text not null,
  output_quantity numeric(14,3) not null check (output_quantity > 0),
  output_unit text not null,
  yield_rate numeric(8,3) generated always as
    (round((output_quantity / input_quantity) * 100, 3)) stored,
  facility_name text,
  operator_name text,
  notes text,
  created_at timestamptz not null default now(),
  unique (tenant_id, output_batch_id),
  check (source_batch_id <> output_batch_id),
  foreign key (tenant_id, source_batch_id)
    references public.harvest_batches(tenant_id, id) on delete restrict,
  foreign key (tenant_id, output_batch_id)
    references public.harvest_batches(tenant_id, id) on delete restrict
);

create index if not exists idx_processing_source
  on public.processing_records(tenant_id, source_batch_id, processed_on desc);
create index if not exists idx_processing_output
  on public.processing_records(tenant_id, output_batch_id);

alter table public.processing_records enable row level security;
drop policy if exists tenant_member_access on public.processing_records;
create policy tenant_member_access on public.processing_records
  for all to authenticated
  using (public.is_tenant_member(tenant_id))
  with check (public.is_tenant_member(tenant_id));

-- One-source/one-output processing is atomic. Further source lots can be supported
-- through multiple processing_records in a future merge workflow.
create or replace function public.create_processing_batch(
  p_source_batch_id uuid,
  p_process_code text,
  p_process_name text,
  p_processed_on date,
  p_input_quantity numeric,
  p_input_unit text,
  p_output_crop_name text,
  p_output_cultivar text,
  p_output_quantity numeric,
  p_output_unit text,
  p_output_grade text default null,
  p_facility_name text default null,
  p_operator_name text default null,
  p_notes text default null
) returns table(output_batch_id uuid, output_batch_code text, processing_record_id uuid, yield_rate numeric)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_source public.harvest_batches%rowtype;
  v_output_id uuid;
  v_output_code text;
  v_record_id uuid;
  v_yield numeric;
  v_previously_used numeric := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_input_quantity <= 0 or p_output_quantity <= 0 then
    raise exception 'Input and output quantities must be greater than zero';
  end if;
  if p_input_unit <> p_output_unit then
    raise exception 'Use the same unit for input and output to calculate a valid yield rate';
  end if;
  if nullif(trim(p_process_name), '') is null or nullif(trim(p_output_crop_name), '') is null then
    raise exception 'Process name and output product name are required';
  end if;

  select tm.tenant_id into v_tenant_id
  from public.tenant_memberships tm
  where tm.profile_id = auth.uid() and tm.status = 'active'
  order by tm.created_at asc limit 1;
  if v_tenant_id is null or not public.is_tenant_member(v_tenant_id) then
    raise exception 'Active tenant membership required';
  end if;

  select hb.* into v_source
  from public.harvest_batches hb
  where hb.id = p_source_batch_id and hb.tenant_id = v_tenant_id
  for update;
  if not found then raise exception 'Source harvest lot not found'; end if;
  select coalesce(sum(pr.input_quantity), 0) into v_previously_used
  from public.processing_records pr
  where pr.tenant_id = v_tenant_id and pr.source_batch_id = v_source.id;
  if p_input_quantity + v_previously_used > v_source.quantity then
    raise exception 'Input quantity exceeds the remaining source lot quantity';
  end if;
  if p_input_unit <> v_source.quantity_unit then
    raise exception 'Input unit must match source lot unit';
  end if;

  insert into public.harvest_batches (
    tenant_id, farm_id, batch_code, crop_name, cultivar, harvested_on,
    quantity, quantity_unit, grade, notes, status, plot_id, cultivation_cycle_id, crop_id
  ) values (
    v_tenant_id, v_source.farm_id, default, p_output_crop_name, p_output_cultivar,
    p_processed_on, p_output_quantity, p_output_unit, p_output_grade,
    p_notes, 'stored', v_source.plot_id, v_source.cultivation_cycle_id, v_source.crop_id
  ) returning id, batch_code into v_output_id, v_output_code;

  insert into public.harvest_batch_lineage (
    tenant_id, parent_batch_id, child_batch_id, relationship_type,
    input_quantity, output_quantity, quantity_unit, notes
  ) values (
    v_tenant_id, v_source.id, v_output_id, 'processed_into',
    p_input_quantity, p_output_quantity, p_input_unit, p_notes
  );

  insert into public.processing_records (
    tenant_id, source_batch_id, output_batch_id, process_code, process_name,
    processed_on, input_quantity, input_unit, output_quantity, output_unit,
    facility_name, operator_name, notes
  ) values (
    v_tenant_id, v_source.id, v_output_id, p_process_code, p_process_name,
    p_processed_on, p_input_quantity, p_input_unit, p_output_quantity, p_output_unit,
    p_facility_name, p_operator_name, p_notes
  ) returning id, processing_records.yield_rate into v_record_id, v_yield;

  return query select v_output_id, v_output_code, v_record_id, v_yield;
end;
$$;

grant execute on function public.create_processing_batch(
  uuid,text,text,date,numeric,text,text,text,numeric,text,text,text,text,text
) to authenticated;

commit;
