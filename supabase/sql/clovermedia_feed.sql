-- Returns clovermedia feed posts with user info, engagement counts,
-- ordered by weighted random (popular posts float up with randomness)
CREATE OR REPLACE FUNCTION get_clovermedia_feed(lim int DEFAULT 96)
RETURNS TABLE (
  id          uuid,
  user_id     uuid,
  title       text,
  description text,
  image_path  text,
  leaf_count  int,
  lat         float8,
  lng         float8,
  created_at  timestamptz,
  username    text,
  avatar_url  text,
  like_count  bigint,
  comment_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    f.id,
    f.user_id,
    f.title,
    f.description,
    f.image_path,
    f.leaf_count,
    f.lat,
    f.lng,
    f.created_at,
    COALESCE(
      NULLIF(TRIM(u.raw_user_meta_data->>'username'), ''),
      SPLIT_PART(u.email, '@', 1),
      'Finder'
    ) AS username,
    NULLIF(TRIM(u.raw_user_meta_data->>'avatar_url'), '') AS avatar_url,
    COALESCE(lk.cnt, 0) AS like_count,
    COALESCE(cm.cnt, 0) AS comment_count
  FROM finds f
  JOIN auth.users u ON u.id = f.user_id
  LEFT JOIN (SELECT find_id, COUNT(*) AS cnt FROM likes GROUP BY find_id) lk ON lk.find_id = f.id
  LEFT JOIN (SELECT find_id, COUNT(*) AS cnt FROM comments GROUP BY find_id) cm ON cm.find_id = f.id
  WHERE f.share_clovermedia = true
    AND f.image_path IS NOT NULL
  ORDER BY
    (COALESCE(lk.cnt, 0) * 3 + COALESCE(cm.cnt, 0) * 2 + 1) * random() DESC
  LIMIT lim;
$$;
