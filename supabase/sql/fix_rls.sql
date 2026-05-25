-- Fix: "new row violates row-level security policy"
-- Run the ENTIRE file in Supabase → SQL Editor (same project as .env.local).
-- Then sign out and sign back in on the site, and try again.

-- ─── public.finds (map posts) ──────────────────────────────────────────────
create table if not exists public.finds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  lat double precision not null check (lat >= -90 and lat <= 90),
  lng double precision not null check (lng >= -180 and lng <= 180),
  image_path text,
  share_clovermedia boolean not null default false,
  created_at timestamptz not null default now()
);

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

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on table public.finds to authenticated;
grant select on table public.finds to anon;
grant all on table public.finds to service_role;

-- ─── Storage: finds (photos on post-finds) ─────────────────────────────────
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

-- ─── Storage: avatars (profile photo) ────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars"
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "Users insert own avatar" on storage.objects;
create policy "Users insert own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Users delete own avatar" on storage.objects;
create policy "Users delete own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- ─── Storage: badge-proofs (optional; badge save uses service role in app) ─
insert into storage.buckets (id, name, public)
values ('badge-proofs', 'badge-proofs', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read badge proofs" on storage.objects;
create policy "Public read badge proofs"
on storage.objects for select
using (bucket_id = 'badge-proofs');

notify pgrst, 'reload schema';
