ALTER TABLE feedback
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'in_progress', 'done', 'rejected'));

DROP POLICY IF EXISTS "feedback_admin_update" ON feedback;
CREATE POLICY "feedback_admin_update" ON feedback
  FOR UPDATE TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );
