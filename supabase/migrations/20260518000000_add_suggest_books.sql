-- 管理者が編集できるサジェスト本テーブル
CREATE TABLE IF NOT EXISTS suggest_books (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  author       TEXT        NOT NULL,
  genre        TEXT        NOT NULL DEFAULT 'その他',
  publisher    TEXT        NOT NULL DEFAULT '',
  total_pages  INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE suggest_books ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは全員読み取り可
DROP POLICY IF EXISTS "suggest_books_read" ON suggest_books;
CREATE POLICY "suggest_books_read" ON suggest_books
  FOR SELECT TO authenticated USING (true);

-- 管理者のみ書き込み可（profilesテーブルのroleで判定）
DROP POLICY IF EXISTS "suggest_books_write" ON suggest_books;
CREATE POLICY "suggest_books_write" ON suggest_books
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
