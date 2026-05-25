-- Follows table: tracks who follows whom
CREATE TABLE IF NOT EXISTS follows (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS follows_follower_idx ON follows (follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON follows (following_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see follow relationships
CREATE POLICY "follows_select" ON follows
  FOR SELECT TO authenticated
  USING (true);

-- Users can only insert their own follows
CREATE POLICY "follows_insert" ON follows
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = follower_id);

-- Users can only delete their own follows
CREATE POLICY "follows_delete" ON follows
  FOR DELETE TO authenticated
  USING (auth.uid() = follower_id);
