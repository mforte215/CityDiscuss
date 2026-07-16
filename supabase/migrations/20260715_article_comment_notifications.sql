-- Repoints notifications from forum posts to article comments.
--
-- Additive only: the forum tables, their triggers, and existing notification
-- rows are left untouched. The old on_comment_insert / on_upvote_insert
-- triggers can no longer fire because nothing writes to comments or
-- post_votes now that the forum UI is gone.

-- ── link notifications to articles ────────────────────────────────────────
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS article_id uuid REFERENCES articles(id) ON DELETE CASCADE;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS article_comment_id uuid REFERENCES article_comments(id) ON DELETE CASCADE;

-- ── trigger: comment on your article ──────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_on_article_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type, article_id, article_comment_id)
  SELECT a.author_id, NEW.user_id, 'comment', NEW.article_id, NEW.id
  FROM articles a
  WHERE a.id = NEW.article_id
    AND a.author_id IS NOT NULL
    AND a.author_id != NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_article_comment_insert ON article_comments;
CREATE TRIGGER on_article_comment_insert
  AFTER INSERT ON article_comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_article_comment();
