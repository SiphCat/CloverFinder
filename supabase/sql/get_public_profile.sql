-- Returns public profile info (username + avatar) for a user
CREATE OR REPLACE FUNCTION get_public_profile(uid uuid)
RETURNS TABLE (username text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    coalesce(
      nullif(trim(raw_user_meta_data->>'username'), ''),
      split_part(email, '@', 1),
      'Finder'
    ) AS username,
    nullif(trim(raw_user_meta_data->>'avatar_url'), '') AS avatar_url
  FROM auth.users
  WHERE id = uid
  LIMIT 1;
$$;
