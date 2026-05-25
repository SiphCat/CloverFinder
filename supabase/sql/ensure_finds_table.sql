-- Minimal fix for: Could not find the table 'public.finds' in the schema cache
-- Run in Supabase Dashboard → SQL Editor → Run (same project as NEXT_PUBLIC_SUPABASE_URL)

create table if not exists public.finds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  lat double precision not null check (lat >= -90 and lat <= 90),
  lng double precision not null check (lng >= -180 and lng <= 180),
  image_path text,
  share_clovermedia boolean not null default false,
  leaf_count int check (leaf_count is null or (leaf_count >= 4 and leaf_count <= 10)),
  created_at timestamptz not null default now()
);

create index if not exists finds_user_idx on public.finds (user_id);

alter table public.finds enable row level security;

drop policy if exists "finds_select_visible" on public.finds;
create policy "finds_select_visible"
on public.finds for select
using (
  auth.uid() = user_id
  or (share_clovermedia = true and image_path is not null)
);

drop policy if exists "finds_insert_own" on public.finds;
create policy "finds_insert_own"
on public.finds for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "finds_update_own" on public.finds;
create policy "finds_update_own"
on public.finds for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "finds_delete_own" on public.finds;
create policy "finds_delete_own"
on public.finds for delete
to authenticated
using (auth.uid() = user_id);

-- Storage bucket + policies for find photos (required or uploads get RLS errors)
insert into storage.buckets (id, name, public)
values ('finds', 'finds', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read finds" on storage.objects;
create policy "Public read finds"
on storage.objects for select
using (bucket_id = 'finds');

drop policy if exists "Users insert own finds images" on storage.objects;
create policy "Users insert own finds images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'finds'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Users update own finds images" on storage.objects;
create policy "Users update own finds images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'finds'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Users delete own finds images" on storage.objects;
create policy "Users delete own finds images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'finds'
  and split_part(name, '/', 1) = auth.uid()::text
);

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on table public.finds to authenticated;
grant select on table public.finds to anon;
grant all on table public.finds to service_role;

notify pgrst, 'reload schema';
