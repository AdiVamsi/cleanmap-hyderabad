-- Run this in Supabase SQL Editor after schema.sql
-- If existing data still has old severity values, run these first:
-- UPDATE spots SET severity = 'noticeable' WHERE severity = 'medium';
-- UPDATE spots SET severity = 'minor' WHERE severity = 'low';
-- UPDATE spots SET severity = 'severe' WHERE severity = 'high';

create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots(id) on delete cascade,
  headline text not null,
  caption text not null,
  published boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists stories_spot_id_unique on stories(spot_id);

drop trigger if exists stories_set_updated_at on stories;
create trigger stories_set_updated_at
before update on stories
for each row execute function set_updated_at();

alter table stories enable row level security;

drop policy if exists stories_public_select on stories;
create policy stories_public_select on stories
for select to anon using (published = true);

revoke all on stories from anon, authenticated;
grant select on stories to anon, authenticated;
grant select, insert, update, delete on stories to service_role;
