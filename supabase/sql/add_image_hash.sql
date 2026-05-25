-- Add image_hash column to prevent duplicate photo uploads
ALTER TABLE finds ADD COLUMN IF NOT EXISTS image_hash text;

CREATE INDEX IF NOT EXISTS finds_image_hash_idx ON finds (image_hash)
  WHERE image_hash IS NOT NULL;
