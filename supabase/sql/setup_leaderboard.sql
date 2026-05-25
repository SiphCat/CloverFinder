-- Run this ENTIRE file in Supabase → SQL Editor (select all, then Run).
-- Creates user_badges + leaderboard function. Safe to run more than once.

-- 1) Table for verified clover badges
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_id text not null,
  proof_image_url text,
  created_at timestamptz not null default now()
);

create index if not exists user_badges_user_idx on public.user_badges (user_id);
create index if not exists user_badges_user_badge_idx on public.user_badges (user_id, badge_id);

alter table public.user_badges enable row level security;

drop policy if exists "user_badges_select_own" on public.user_badges;
create policy "user_badges_select_own"
on public.user_badges for select
to authenticated
using (auth.uid() = user_id);

-- 2) Leaderboard function (needs user_badges above)
drop function if exists public.get_leaderboard(text);

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

notify pgrst, 'reload schema';
