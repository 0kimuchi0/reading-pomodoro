-- ユーザーからのフィードバックを格納するテーブル
CREATE TABLE IF NOT EXISTS feedback (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは自分のフィードバックを送信可
DROP POLICY IF EXISTS "feedback_insert" ON feedback;
CREATE POLICY "feedback_insert" ON feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 未ログインユーザーも送信可（user_id は NULL）
DROP POLICY IF EXISTS "feedback_insert_anon" ON feedback;
CREATE POLICY "feedback_insert_anon" ON feedback
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

-- 管理者のみ読み取り可
DROP POLICY IF EXISTS "feedback_admin_read" ON feedback;
CREATE POLICY "feedback_admin_read" ON feedback
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
