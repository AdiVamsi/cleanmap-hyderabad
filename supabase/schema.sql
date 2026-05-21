create extension if not exists pgcrypto;

-- Run in Supabase SQL Editor to apply severity migration:
-- ALTER TABLE spots DROP CONSTRAINT spots_severity_check;
-- ALTER TABLE spots ADD CONSTRAINT spots_severity_check
--   CHECK (severity IN ('chhota','dikkat','zabardast','khatarnak'));
-- ALTER TABLE spots ALTER COLUMN reported_by_name SET DEFAULT 'Anonymous';

create table if not exists spots (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  address text not null,
  ward text not null,
  latitude float8 not null,
  longitude float8 not null,
  severity text not null check (severity in ('chhota', 'dikkat', 'zabardast', 'khatarnak')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'cleanup_planned', 'cleaned', 'rejected')),
  reported_by_name text not null default 'Anonymous',
  reported_by_phone text,
  admin_note text,
  cleanup_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots(id) on delete cascade,
  type text not null check (type in ('before', 'after')),
  storage_path text not null,
  public_url text not null,
  uploaded_at timestamptz default now()
);

create table if not exists status_history (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  changed_at timestamptz default now()
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists spots_set_updated_at on spots;
create trigger spots_set_updated_at
before update on spots
for each row
execute function set_updated_at();

alter table spots enable row level security;
alter table photos enable row level security;
alter table status_history enable row level security;

drop policy if exists spots_public_status_select on spots;
create policy spots_public_status_select
on spots
for select
to anon
using (status in ('approved', 'cleanup_planned', 'cleaned'));

drop policy if exists photos_public_select on photos;
create policy photos_public_select
on photos
for select
to anon
using (true);

drop policy if exists status_history_public_select on status_history;
create policy status_history_public_select
on status_history
for select
to anon
using (true);

create or replace view public_spots
with (security_barrier = true)
as
select
  id,
  title,
  address,
  ward,
  latitude,
  longitude,
  severity,
  status,
  cleanup_date,
  created_at
from spots
where status in ('approved', 'cleanup_planned', 'cleaned');

create or replace view public_status_history
with (security_barrier = true)
as
select
  spot_id,
  to_status,
  changed_at,
  note
from status_history;

revoke all on spots from anon, authenticated;
revoke all on photos from anon, authenticated;
revoke all on status_history from anon, authenticated;
revoke all on public_spots from anon, authenticated;
revoke all on public_status_history from anon, authenticated;

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on spots to service_role;
grant select, insert, update, delete on photos to service_role;
grant select, insert, update, delete on status_history to service_role;
grant select on public_spots to service_role;
grant select on public_status_history to service_role;
grant select on public_spots to anon, authenticated;
grant select on photos to anon, authenticated;
grant select (spot_id, to_status, changed_at, note) on status_history to anon, authenticated;
grant select on public_status_history to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('spot-photos', 'spot-photos', true)
on conflict (id) do update
set public = true;

drop policy if exists spot_photos_public_read on storage.objects;
create policy spot_photos_public_read
on storage.objects
for select
to anon
using (bucket_id = 'spot-photos');
