import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Cookie の有効期限: 30 日
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

/**
 * Supabase のセッションを Cookie に保存するストレージアダプター。
 * デフォルトの localStorage の代わりに使用することで、
 * ブラウザを閉じて再度開いたときも自動ログインが維持される。
 */
const cookieStorage = {
  getItem(key: string): string | null {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${encodeURIComponent(key).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`)
    )
    return match ? decodeURIComponent(match[1]) : null
  },
  setItem(key: string, value: string): void {
    document.cookie = [
      `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
      `max-age=${COOKIE_MAX_AGE}`,
      'path=/',
      'SameSite=Lax',
    ].join('; ')
  },
  removeItem(key: string): void {
    document.cookie = `${encodeURIComponent(key)}=; max-age=0; path=/`
  },
}

export const supabase = createClient(url, key, {
  auth: {
    storage: cookieStorage,
    autoRefreshToken: true,   // トークンを自動更新
    persistSession: true,     // セッションを永続化
    detectSessionInUrl: true, // OAuth コールバック URL からセッションを検出
  },
})
