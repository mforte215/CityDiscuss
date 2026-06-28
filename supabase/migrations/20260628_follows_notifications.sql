-- ── follows ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  follower_id  uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at   timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (follower_id, following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read follows"       ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others"       ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow"            ON follows FOR DELETE USING (auth.uid() = follower_id);

-- ── notifications ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id   uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type       text NOT NULL CHECK (type IN ('comment', 'upvote', 'follow')),
  post_id    uuid REFERENCES posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  read       boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications"   ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications"    ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can mark own as read"         ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ── trigger: comment on your post ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type, post_id, comment_id)
  SELECT p.user_id, NEW.user_id, 'comment', NEW.post_id, NEW.id
  FROM posts p
  WHERE p.id = NEW.post_id AND p.user_id != NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_insert ON comments;
CREATE TRIGGER on_comment_insert
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- ── trigger: upvote on your post ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_on_upvote()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.value = 1 THEN
    INSERT INTO notifications (user_id, actor_id, type, post_id)
    SELECT p.user_id, NEW.user_id, 'upvote', NEW.post_id
    FROM posts p
    WHERE p.id = NEW.post_id AND p.user_id != NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_upvote_insert ON post_votes;
CREATE TRIGGER on_upvote_insert
  AFTER INSERT ON post_votes
  FOR EACH ROW EXECUTE FUNCTION notify_on_upvote();

-- ── trigger: someone followed you ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type)
  VALUES (NEW.following_id, NEW.follower_id, 'follow');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_follow_insert ON follows;
CREATE TRIGGER on_follow_insert
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

-- ── realtime ───────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE follows;
