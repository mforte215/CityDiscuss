-- Full-text search GIN indexes
-- Run this in the Supabase SQL editor to make FTS fast at scale.

CREATE INDEX IF NOT EXISTS posts_title_fts
  ON posts USING gin(to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS posts_body_fts
  ON posts USING gin(to_tsvector('english', coalesce(body, '')));

CREATE INDEX IF NOT EXISTS articles_title_fts
  ON articles USING gin(to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS articles_subtitle_fts
  ON articles USING gin(to_tsvector('english', coalesce(subtitle, '')));
