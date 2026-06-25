import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'
import { SignInWithApple } from '@capacitor-community/apple-sign-in'
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'
import { supabase } from '../lib/supabase'
import { migrateLocalDataToSupabase, getMyProfile, deleteAccount } from '../lib/db'
import type { UserRole } from '../types'
import { APP_BUNDLE_ID, APP_URL_SCHEME } from '../lib/constants'

function generateRawNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

interface AuthContextValue {
  user: User | null
  role: UserRole | null
  loading: boolean
  bannedError: string | null
  clearBannedError: () => void
  signUp: (email: string, password: string) => Promise<string | null>
  signIn: (email: string, password: string) => Promise<string | null>
  signInWithGoogle: () => Promise<string | null>
  signInWithApple: () => Promise<string | null>
  signOut: () => Promise<void>
  deleteAccount: () => Promise<void>
  resetPassword: (email: string) => Promise<string | null>
  passwordRecoveryMode: boolean
  clearPasswordRecoveryMode: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [bannedError, setBannedError] = useState<string | null>(null)
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(false)
  const googleInitError = useRef<Error | null>(null)

  const clearPasswordRecoveryMode = () => setPasswordRecoveryMode(false)

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      GoogleAuth.initialize({
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      }).catch((err) => {
        console.error('[GoogleAuth] initialize failed:', err)
        googleInitError.current = err instanceof Error ? err : new Error(String(err))
      })
    }
  }, [])

  const clearBannedError = () => setBannedError(null)

  const checkBan = async (userId: string): Promise<boolean> => {
    try {
      const profile = await getMyProfile(userId)
      if (profile?.banned) {
        await supabase.auth.signOut()
        setBannedError('このアカウントは利用が停止されています。')
        return true
      }
      setRole(profile?.role ?? null)
    } catch {
      setRole(null)
    }
    return false
  }

  useEffect(() => {
    let initialDone = false

    // onAuthStateChange で初回セッション取得 + 以降の変化を一本化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryMode(true)
        setLoading(false)
        initialDone = true
        return
      }

      const newUser = session?.user ?? null

      if (!initialDone) {
        // 初回イベント (INITIAL_SESSION / SIGNED_IN / NO_SESSION など)
        initialDone = true
        setLoading(false)
        if (newUser) {
          const banned = await checkBan(newUser.id)
          if (!banned) setUser(newUser)
        }
        return
      }

      // 以降のイベント（ログイン・ログアウト・トークン更新）
      if (newUser) {
        const banned = await checkBan(newUser.id)
        if (!banned) {
          setUser(newUser)
          migrateLocalDataToSupabase(newUser.id)
        }
      } else {
        setUser(null)
        setRole(null)
      }
    })

    // 万が一 onAuthStateChange が発火しない場合のフォールバック
    const timeout = setTimeout(() => {
      if (!initialDone) {
        initialDone = true
        setLoading(false)
      }
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const signUp = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({ email, password })
    return error?.message ?? null
  }

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const timeout = new Promise<{ error: { message: string } }>(resolve =>
      setTimeout(() => resolve({ error: { message: 'タイムアウトしました。再度お試しください' } }), 15000)
    )
    const { error } = await Promise.race([
      supabase.auth.signInWithPassword({ email, password }),
      timeout,
    ])
    return error?.message ?? null
  }

  const signInWithGoogle = async (): Promise<string | null> => {
    try {
      if (Capacitor.isNativePlatform()) {
        if (googleInitError.current) {
          return 'Google 認証の初期化に失敗しました（設定を確認してください）'
        }
        const googleUser = await GoogleAuth.signIn()
        const idToken = googleUser.authentication.idToken
        if (!idToken) return 'Google ログインに失敗しました'
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        })
        return error?.message ?? null
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin },
        })
        return error?.message ?? null
      }
    } catch (e) {
      if (e instanceof Error && /cancel|dismiss|interrupt/i.test(e.message)) return null
      return e instanceof Error ? e.message : 'Google ログインに失敗しました'
    }
  }

  const signInWithApple = async (): Promise<string | null> => {
    try {
      if (Capacitor.isNativePlatform()) {
        const rawNonce = generateRawNonce()
        const hashedNonce = await sha256(rawNonce)
        const result = await SignInWithApple.authorize({
          clientId: APP_BUNDLE_ID,
          redirectURI: '',
          scopes: 'email name',
          nonce: hashedNonce,
        })
        const identityToken = result.response.identityToken
        if (!identityToken) return 'Apple ログインに失敗しました'
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: identityToken,
          nonce: rawNonce,
        })
        return error?.message ?? null
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: { redirectTo: window.location.origin },
        })
        return error?.message ?? null
      }
    } catch (e) {
      if (e instanceof Error && /cancel|1001/i.test(e.message)) return null
      return e instanceof Error ? e.message : 'Apple ログインに失敗しました'
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const handleDeleteAccount = async () => {
    await deleteAccount()
    setUser(null)
    setRole(null)
  }

  const resetPassword = async (email: string): Promise<string | null> => {
    const redirectTo = Capacitor.isNativePlatform()
      ? APP_URL_SCHEME
      : window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    return error?.message ?? null
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, bannedError, clearBannedError, signUp, signIn, signInWithGoogle, signInWithApple, signOut, deleteAccount: handleDeleteAccount, resetPassword, passwordRecoveryMode, clearPasswordRecoveryMode }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
