-- Returns a display username for a given user id
CREATE OR REPLACE FUNCTION get_username_for_user(uid uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT coalesce(
    raw_user_meta_data->>'username',
    split_part(email, '@', 1)
  )
  FROM auth.users
  WHERE id = uid
  LIMIT 1;
$$;
