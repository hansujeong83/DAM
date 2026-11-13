-- DAM harvest lot code generation
-- Apply after 003_agriculture_domain.sql. Database-generated IDs avoid browser-side collisions.
begin;

alter table public.harvest_batches
  alter column batch_code set default (
    'LOT-' || to_char(now() at time zone 'Asia/Seoul', 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  );

comment on column public.harvest_batches.batch_code is
  'Database-generated unique lot code. Unique within tenant_id.';

commit;
