CREATE TABLE IF NOT EXISTS comments (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  find_id    uuid NOT NULL REFERENCES finds(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body       text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comments_find_idx ON comments (find_id, created_at);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select" ON comments
  FOR SELECT USING (true);

CREATE POLICY "comments_insert" ON comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_delete" ON comments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- RPC to fetch comments with usernames
CREATE OR REPLACE FUNCTION get_comments_for_find(fid uuid, lim int DEFAULT 50)
RETURNS TABLE (
  id uuid,
  body text,
  created_at timestamptz,
  user_id uuid,
  username text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    c.id,
    c.body,
    c.created_at,
    c.user_id,
    coalesce(
      u.raw_user_meta_data->>'username',
      split_part(u.email, '@', 1)
    ) AS username
  FROM comments c
  JOIN auth.users u ON u.id = c.user_id
  WHERE c.find_id = fid
  ORDER BY c.created_at ASC
  LIMIT lim;
$$;
