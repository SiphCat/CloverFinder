-- Run ONCE in Supabase → SQL Editor → Run (whole file).
-- Username login: maps username or email → auth email for signInWithPassword.
-- Requires SUPABASE_SERVICE_ROLE_KEY in your app .env.local (server only).

-- Safer search_path for SECURITY DEFINER (avoid search_path hijacking)
create or replace function public.lookup_email_by_login_identifier(p_identifier text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select u.email::text
  from auth.users u
  where lower(trim(u.email)) = lower(trim(p_identifier))
     or lower(trim(coalesce(u.raw_user_meta_data->>'username', ''))) = lower(trim(p_identifier))
  limit 1;
$$;

revoke all on function public.lookup_email_by_login_identifier(text) from public;

-- service_role exists on Supabase-hosted Postgres; if this line errors, paste the message to support/forums
grant execute on function public.lookup_email_by_login_identifier(text) to service_role;
