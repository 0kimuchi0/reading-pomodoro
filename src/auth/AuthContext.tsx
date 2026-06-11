import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { supabase } from '../lib/supabase'
import { migrateLocalDataToSupabase, getMyProfile, deleteAccount } from '../lib/db'
import type { UserRole } from '../types'

const NATIVE_REDIRECT = 'com.readingpomodoro.app://login-callback'

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
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [bannedError, setBannedError] = useState<string | null>(null)

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: NATIVE_REDIRECT, skipBrowserRedirect: true },
        })
        if (error) return error.message
        if (data.url) await Browser.open({ url: data.url })
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin },
        })
        if (error) return error.message
      }
      return null
    } catch (e) {
      return e instanceof Error ? e.message : 'Googleログインに失敗しました'
    }
  }

  const signInWithApple = async (): Promise<string | null> => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: { redirectTo: NATIVE_REDIRECT, skipBrowserRedirect: true },
        })
        if (error) return error.message
        if (data.url) await Browser.open({ url: data.url })
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: { redirectTo: window.location.origin },
        })
        if (error) return error.message
      }
      return null
    } catch (e) {
      return e instanceof Error ? e.message : 'Appleログインに失敗しました'
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    return error?.message ?? null
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, bannedError, clearBannedError, signUp, signIn, signInWithGoogle, signInWithApple, signOut, deleteAccount: handleDeleteAccount, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
