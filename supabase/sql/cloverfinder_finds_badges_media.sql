-- Run in Supabase → SQL Editor after storage_avatars.sql
-- Finds (map posts), badge proofs, Clovermedia public gallery, stats RPC.

-- ─── Storage: finds (map photos) ─────────────────────────────────────────
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

-- ─── Storage: badge-proofs (scan uploads) ─────────────────────────────────
insert into storage.buckets (id, name, public)
values ('badge-proofs', 'badge-proofs', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read badge proofs" on storage.objects;
create policy "Public read badge proofs"
on storage.objects for select
using (bucket_id = 'badge-proofs');

drop policy if exists "Users insert own badge proofs" on storage.objects;
create policy "Users insert own badge proofs"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'badge-proofs'
  and split_part(name, '/', 1) = auth.uid()::text
);

-- ─── Tables ───────────────────────────────────────────────────────────────
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
create index if not exists finds_clovermedia_idx
  on public.finds (created_at desc)
  where share_clovermedia = true and image_path is not null;

create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_id text not null,
  proof_image_url text,
  created_at timestamptz not null default now()
);

create index if not exists user_badges_user_idx on public.user_badges (user_id);
create index if not exists user_badges_user_badge_idx on public.user_badges (user_id, badge_id);

-- ─── RLS finds ─────────────────────────────────────────────────────────────
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

-- ─── RLS user_badges ─────────────────────────────────────────────────────
alter table public.user_badges enable row level security;

drop policy if exists "user_badges_select_own" on public.user_badges;
create policy "user_badges_select_own"
on public.user_badges for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_badges_insert_own" on public.user_badges;
create policy "user_badges_insert_own"
on public.user_badges for insert
to authenticated
with check (auth.uid() = user_id);

-- ─── Stats: earners per badge + total signed-up users (for %) ──────────────
create or replace function public.get_badge_stats()
returns table (badge_id text, earners bigint, total_users bigint)
language sql
security definer
set search_path = public
as $$
  with tu as (
    select count(*)::bigint as c from auth.users
  ),
  ids as (
    select unnest(ARRAY[
      'leaf-4','leaf-5','leaf-6','leaf-7','leaf-8','leaf-9','leaf-10'
    ]) as badge_id
  )
  select
    i.badge_id,
    coalesce(
      (select count(distinct ub.user_id)::bigint
       from public.user_badges ub
       where ub.badge_id = i.badge_id),
      0
    ) as earners,
    (select c from tu) as total_users
  from ids i;
$$;

revoke all on function public.get_badge_stats() from public;
grant execute on function public.get_badge_stats() to anon, authenticated;

-- ─── Leaderboard (verified clovers by leaf count) ───────────────────────────
create or replace function public.get_leaderboard(
  p_badge_id text default null,
  p_limit int default 500
)
returns table (
  rank bigint,
  user_id uuid,
  display_name text,
  avatar_url text,
  clover_count bigint
)
language sql
security definer
set search_path = public, auth
as $$
  with counts as (
    select
      ub.user_id,
      count(*)::bigint as clover_count
    from public.user_badges ub
    where p_badge_id is null or ub.badge_id = p_badge_id
    group by ub.user_id
  ),
  ranked as (
    select
      row_number() over (
        order by
          c.clover_count desc,
          coalesce(nullif(trim(u.raw_user_meta_data->>'username'), ''), split_part(u.email, '@', 1))
      ) as rank,
      c.user_id,
      coalesce(
        nullif(trim(u.raw_user_meta_data->>'username'), ''),
        split_part(u.email, '@', 1),
        'Finder'
      ) as display_name,
      nullif(trim(u.raw_user_meta_data->>'avatar_url'), '') as avatar_url,
      c.clover_count
    from counts c
    join auth.users u on u.id = c.user_id
  )
  select rank, user_id, display_name, avatar_url, clover_count
  from ranked
  order by rank
  limit greatest(1, least(coalesce(p_limit, 500), 2000));
$$;

revoke all on function public.get_leaderboard(text, int) from public;
grant execute on function public.get_leaderboard(text, int) to anon, authenticated;

-- Help PostgREST pick up new tables without waiting (if you still see "schema cache", run again)
notify pgrst, 'reload schema';
