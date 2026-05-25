-- Likes table: tracks which user liked which find
CREATE TABLE IF NOT EXISTS likes (
  id       uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  find_id  uuid NOT NULL REFERENCES finds(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, find_id)
);

CREATE INDEX IF NOT EXISTS likes_find_idx ON likes (find_id);
CREATE INDEX IF NOT EXISTS likes_user_idx ON likes (user_id);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes_select" ON likes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "likes_insert" ON likes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes_delete" ON likes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
