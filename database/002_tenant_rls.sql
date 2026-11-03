-- DAM tenant isolation and Supabase Row Level Security
-- Apply only after reviewing in a staging Supabase project.
-- Assumes profiles.id values are the same UUIDs as auth.users.id.
-- Authorization is based on tenant_memberships, not a client-supplied tenant_id claim.

begin;

create or replace function public.is_tenant_member(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tenant_memberships tm
    where tm.tenant_id = target_tenant_id
      and tm.profile_id = auth.uid()
      and tm.status = 'active'
  );
$$;

create or replace function public.has_tenant_role(
  target_tenant_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tenant_memberships tm
    where tm.tenant_id = target_tenant_id
      and tm.profile_id = auth.uid()
      and tm.status = 'active'
      and tm.role = any(allowed_roles)
  );
$$;

revoke all on function public.is_tenant_member(uuid) from public;
revoke all on function public.has_tenant_role(uuid, text[]) from public;
grant execute on function public.is_tenant_member(uuid) to authenticated;
grant execute on function public.has_tenant_role(uuid, text[]) to authenticated;

-- Enable RLS on every table created by 001_initial_schema.sql.
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.farms enable row level security;
alter table public.farm_members enable row level security;
alter table public.sensors enable row level security;
alter table public.production_records enable row level security;
alter table public.harvest_batches enable row level security;
alter table public.trace_events enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_harvest_batches enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.ai_jobs enable row level security;
alter table public.audit_logs enable row level security;

-- Tenant and identity boundaries.
drop policy if exists tenants_select_member on public.tenants;
create policy tenants_select_member on public.tenants
  for select to authenticated
  using (public.is_tenant_member(id));

drop policy if exists tenants_update_admin on public.tenants;
create policy tenants_update_admin on public.tenants
  for update to authenticated
  using (public.has_tenant_role(id, array['owner','admin']))
  with check (public.has_tenant_role(id, array['owner','admin']));

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists memberships_select_self_or_admin on public.tenant_memberships;
create policy memberships_select_self_or_admin on public.tenant_memberships
  for select to authenticated
  using (
    profile_id = auth.uid()
    or public.has_tenant_role(tenant_id, array['owner','admin'])
  );

drop policy if exists memberships_insert_admin on public.tenant_memberships;
create policy memberships_insert_admin on public.tenant_memberships
  for insert to authenticated
  with check (public.has_tenant_role(tenant_id, array['owner','admin']));

drop policy if exists memberships_update_admin on public.tenant_memberships;
create policy memberships_update_admin on public.tenant_memberships
  for update to authenticated
  using (public.has_tenant_role(tenant_id, array['owner','admin']))
  with check (public.has_tenant_role(tenant_id, array['owner','admin']));

drop policy if exists memberships_delete_admin on public.tenant_memberships;
create policy memberships_delete_admin on public.tenant_memberships
  for delete to authenticated
  using (public.has_tenant_role(tenant_id, array['owner','admin']));

-- Tenant-scoped tables with a direct tenant_id column.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'farms',
    'sensors',
    'production_records',
    'harvest_batches',
    'trace_events',
    'brands',
    'products',
    'product_harvest_batches',
    'customers',
    'orders',
    'knowledge_documents',
    'ai_jobs'
  ]
  loop
    execute format('drop policy if exists tenant_member_access on public.%I', table_name);
    execute format(
      'create policy tenant_member_access on public.%I for all to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id))',
      table_name
    );
  end loop;
end $$;

-- Child tables inherit authorization through their owning parent record.
drop policy if exists farm_members_access on public.farm_members;
create policy farm_members_access on public.farm_members
  for all to authenticated
  using (
    exists (
      select 1 from public.farms f
      where f.id = farm_members.farm_id
        and public.is_tenant_member(f.tenant_id)
    )
  )
  with check (
    exists (
      select 1 from public.farms f
      where f.id = farm_members.farm_id
        and public.has_tenant_role(f.tenant_id, array['owner','admin','manager'])
    )
  );

drop policy if exists order_items_access on public.order_items;
create policy order_items_access on public.order_items
  for all to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and public.is_tenant_member(o.tenant_id)
    )
  )
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and public.is_tenant_member(o.tenant_id)
    )
  );

-- Audit records are visible only to tenant owners/admins.
drop policy if exists audit_logs_select_admin on public.audit_logs;
create policy audit_logs_select_admin on public.audit_logs
  for select to authenticated
  using (
    tenant_id is not null
    and public.has_tenant_role(tenant_id, array['owner','admin'])
  );

create index if not exists idx_memberships_profile_status
  on public.tenant_memberships(profile_id, status);
create index if not exists idx_memberships_tenant_role
  on public.tenant_memberships(tenant_id, role, status);

commit;

-- Operational notes:
-- 1. Tenant creation and first-owner membership must be provisioned by a trusted server/admin path.
-- 2. Do not expose the Supabase service_role key to browsers.
-- 3. Validate every policy with two separate test tenants before production.
-- 4. This migration intentionally does not grant anonymous access or client-side audit log writes.
