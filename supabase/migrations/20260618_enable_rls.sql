-- RLS を全テーブルで有効化（未設定のテーブルへの適用）
ALTER TABLE books         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- books: 自分のデータのみ操作可
-- ============================================================
DROP POLICY IF EXISTS "books_select" ON books;
CREATE POLICY "books_select" ON books
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "books_insert" ON books;
CREATE POLICY "books_insert" ON books
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "books_update" ON books;
CREATE POLICY "books_update" ON books
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "books_delete" ON books;
CREATE POLICY "books_delete" ON books
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- sessions: 自分のデータのみ操作可
-- ============================================================
DROP POLICY IF EXISTS "sessions_select" ON sessions;
CREATE POLICY "sessions_select" ON sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "sessions_insert" ON sessions;
CREATE POLICY "sessions_insert" ON sessions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "sessions_update" ON sessions;
CREATE POLICY "sessions_update" ON sessions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "sessions_delete" ON sessions;
CREATE POLICY "sessions_delete" ON sessions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- profiles: 自分のプロフィールは読み書き可 / 管理者は全件読み取り・更新可
-- ============================================================
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- admin_actions: 管理者のみ操作可
-- ============================================================
DROP POLICY IF EXISTS "admin_actions_admin_only" ON admin_actions;
CREATE POLICY "admin_actions_admin_only" ON admin_actions
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
