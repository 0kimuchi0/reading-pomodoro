-- profiles の RLS ポリシーで自己参照サブクエリが再帰を引き起こす問題を修正。
-- SECURITY DEFINER 関数を使って RLS を迂回してロールを取得する。

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- profiles: admin ポリシーを SECURITY DEFINER 関数で再作成
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT TO authenticated
  USING (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- admin_actions: 同様に修正
DROP POLICY IF EXISTS "admin_actions_admin_only" ON admin_actions;
CREATE POLICY "admin_actions_admin_only" ON admin_actions
  FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- suggest_books: 書き込みポリシーを修正
DROP POLICY IF EXISTS "suggest_books_write" ON suggest_books;
CREATE POLICY "suggest_books_write" ON suggest_books
  FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- feedback: 読み取りポリシーを修正
DROP POLICY IF EXISTS "feedback_admin_read" ON feedback;
CREATE POLICY "feedback_admin_read" ON feedback
  FOR SELECT TO authenticated
  USING (public.get_my_role() = 'admin');
