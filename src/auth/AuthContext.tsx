import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { migrateLocalDataToSupabase, getMyProfile } from '../lib/db'
import type { UserRole } from '../types'

interface AuthContextValue {
  user: User | null
  role: UserRole | null
  loading: boolean
  bannedError: string | null
  clearBannedError: () => void
  signUp: (email: string, password: string) => Promise<string | null>
  signIn: (email: string, password: string) => Promise<string | null>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string): Promise<string | null> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    return error?.message ?? null
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, bannedError, clearBannedError, signUp, signIn, signInWithGoogle, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
