-- get_my_role() を PUBLIC（anon を含む未認証ロール）から剥奪する。
-- PostgreSQL はデフォルトで関数を PUBLIC に公開するため、
-- 20260629000000 の GRANT だけでは anon ロールも呼び出せてしまう。
-- authenticated だけに絞り込む。

REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC;
