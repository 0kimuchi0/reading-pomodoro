import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'
import { SocialLogin } from '@capgo/capacitor-social-login'
import { supabase } from '../lib/supabase'
import { migrateLocalDataToSupabase, getMyProfile, deleteAccount } from '../lib/db'
import type { UserRole } from '../types'
import { APP_URL_SCHEME } from '../lib/constants'

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
  const socialLoginInitError = useRef<Error | null>(null)

  const clearPasswordRecoveryMode = () => setPasswordRecoveryMode(false)

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      SocialLogin.initialize({
        google: {
          iOSClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
          webClientId: import.meta.env.VITE_GOOGLE_SERVER_CLIENT_ID ?? '',
        },
      }).catch((err) => {
        console.error('[SocialLogin] initialize failed:', err)
        socialLoginInitError.current = err instanceof Error ? err : new Error(String(err))
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecoveryMode(true)
        setLoading(false)
        initialDone = true
        return
      }

      const newUser = session?.user ?? null

      if (!initialDone) {
        initialDone = true
        setLoading(false)
        if (newUser) {
          const banned = await checkBan(newUser.id)
          if (!banned) setUser(newUser)
        }
        return
      }

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
        if (socialLoginInitError.current) {
          return 'Google 認証の初期化に失敗しました（設定を確認してください）'
        }
        const iOSClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
        if (!iOSClientId) {
          return 'Google ログインが設定されていません'
        }
        const { result } = await SocialLogin.login({
          provider: 'google',
          options: { scopes: ['email', 'profile'] },
        })
        if (result.responseType !== 'online') return 'Google ログインに失敗しました'
        const { idToken } = result
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
      if (e instanceof Error && /cancel|dismiss|interrupt|USER_CANCELLED/i.test(e.message)) return null
      return e instanceof Error ? e.message : 'Google ログインに失敗しました'
    }
  }

  const signInWithApple = async (): Promise<string | null> => {
    try {
      if (Capacitor.isNativePlatform()) {
        const rawNonce = generateRawNonce()
        const hashedNonce = await sha256(rawNonce)
        const { result } = await SocialLogin.login({
          provider: 'apple',
          options: {
            scopes: ['name', 'email'],
            nonce: hashedNonce,
          },
        })
        const { idToken } = result
        if (!idToken) return 'Apple ログインに失敗しました'
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: idToken,
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
      if (e instanceof Error && /cancel|1001|USER_CANCELLED/i.test(e.message)) return null
      if (e instanceof Error && /error 1000\b/.test(e.message)) return 'Apple ログインに失敗しました。しばらくしてから再試行してください。'
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
