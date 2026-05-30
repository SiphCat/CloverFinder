-- Public site counters: visitor count + total finds for the home page.
-- Run in Supabase → SQL Editor → Run.

create table if not exists public.site_stats (
  id int primary key default 1 check (id = 1),
  visitor_count bigint not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.site_stats (id, visitor_count)
values (1, 0)
on conflict (id) do nothing;

alter table public.site_stats enable row level security;

-- No direct table access; use security definer functions below.

create or replace function public.get_site_stats()
returns table (
  visitor_count bigint,
  finds_count bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce((select s.visitor_count from public.site_stats s where s.id = 1), 0)::bigint,
    (select count(*)::bigint from public.finds);
$$;

create or replace function public.increment_site_visitors()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count bigint;
begin
  update public.site_stats
  set
    visitor_count = visitor_count + 1,
    updated_at = now()
  where id = 1
  returning visitor_count into new_count;

  if new_count is null then
    insert into public.site_stats (id, visitor_count)
    values (1, 1)
    on conflict (id) do update
    set visitor_count = public.site_stats.visitor_count + 1,
        updated_at = now()
    returning visitor_count into new_count;
  end if;

  return new_count;
end;
$$;

revoke all on function public.get_site_stats() from public;
grant execute on function public.get_site_stats() to anon, authenticated;

revoke all on function public.increment_site_visitors() from public;
grant execute on function public.increment_site_visitors() to anon, authenticated;

notify pgrst, 'reload schema';
