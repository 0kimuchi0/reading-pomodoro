import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { AuthProvider, useAuth } from '../auth/AuthContext'

const mocks = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => false),
  resetPasswordForEmail: vi.fn(() => Promise.resolve({ error: null })),
  googleInitialize: vi.fn(() => Promise.resolve()),
  onAuthStateChange: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  })),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: mocks.isNativePlatform },
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: mocks.onAuthStateChange,
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithIdToken: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

vi.mock('@codetrix-studio/capacitor-google-auth', () => ({
  GoogleAuth: {
    initialize: mocks.googleInitialize,
    signIn: vi.fn(),
  },
}))

vi.mock('@capacitor-community/apple-sign-in', () => ({
  SignInWithApple: { authorize: vi.fn() },
}))

vi.mock('../lib/db', () => ({
  migrateLocalDataToSupabase: vi.fn(),
  getMyProfile: vi.fn(),
  deleteAccount: vi.fn(),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

describe('resetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null })
    mocks.googleInitialize.mockResolvedValue(undefined)
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('ネイティブではカスタム URL スキームでリダイレクトする', async () => {
    mocks.isNativePlatform.mockReturnValue(true)
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.resetPassword('test@example.com')
    })

    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(
      'test@example.com',
      { redirectTo: 'com.readingpomodoro.app://' }
    )
  })

  it('Web では window.location.origin でリダイレクトする', async () => {
    mocks.isNativePlatform.mockReturnValue(false)
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.resetPassword('test@example.com')
    })

    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith(
      'test@example.com',
      { redirectTo: window.location.origin }
    )
  })

  it('エラーがあればメッセージを返す', async () => {
    mocks.isNativePlatform.mockReturnValue(false)
    mocks.resetPasswordForEmail.mockResolvedValue({
      error: { message: 'email rate limit exceeded' },
    })
    const { result } = renderHook(() => useAuth(), { wrapper })

    let err: string | null = null
    await act(async () => {
      err = await result.current.resetPassword('test@example.com')
    })

    expect(err).toBe('email rate limit exceeded')
  })

  it('成功時は null を返す', async () => {
    mocks.isNativePlatform.mockReturnValue(false)
    const { result } = renderHook(() => useAuth(), { wrapper })

    let err: string | null = 'sentinel'
    await act(async () => {
      err = await result.current.resetPassword('test@example.com')
    })

    expect(err).toBeNull()
  })
})

describe('GoogleAuth.initialize', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.googleInitialize.mockResolvedValue(undefined)
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('ネイティブでは grantOfflineAccess: true で初期化される', async () => {
    mocks.isNativePlatform.mockReturnValue(true)
    renderHook(() => useAuth(), { wrapper })

    await vi.waitFor(() => {
      expect(mocks.googleInitialize).toHaveBeenCalledWith(
        expect.objectContaining({ grantOfflineAccess: true })
      )
    })
  })

  it('ネイティブでは serverClientId が渡される', async () => {
    mocks.isNativePlatform.mockReturnValue(true)
    renderHook(() => useAuth(), { wrapper })

    await vi.waitFor(() => {
      expect(mocks.googleInitialize).toHaveBeenCalledWith(
        expect.objectContaining({ serverClientId: expect.any(String) })
      )
    })
  })

  it('Web では GoogleAuth.initialize を呼ばない', () => {
    mocks.isNativePlatform.mockReturnValue(false)
    renderHook(() => useAuth(), { wrapper })

    expect(mocks.googleInitialize).not.toHaveBeenCalled()
  })
})

describe('PASSWORD_RECOVERY と googleInitError', () => {
  // onAuthStateChange に渡されたコールバックをキャプチャして手動で呼べるようにする
  let fireAuthState: ((event: string, session: unknown) => Promise<void>) | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.googleInitialize.mockResolvedValue(undefined)
    mocks.onAuthStateChange.mockImplementation((cb: (event: string, session: unknown) => Promise<void>) => {
      fireAuthState = cb
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
  })

  it('PASSWORD_RECOVERY イベントで passwordRecoveryMode が true になる', async () => {
    mocks.isNativePlatform.mockReturnValue(false)
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await fireAuthState?.('PASSWORD_RECOVERY', null)
    })

    expect(result.current.passwordRecoveryMode).toBe(true)
  })

  it('clearPasswordRecoveryMode で passwordRecoveryMode が false に戻る', async () => {
    mocks.isNativePlatform.mockReturnValue(false)
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await fireAuthState?.('PASSWORD_RECOVERY', null)
    })
    expect(result.current.passwordRecoveryMode).toBe(true)

    act(() => {
      result.current.clearPasswordRecoveryMode()
    })

    expect(result.current.passwordRecoveryMode).toBe(false)
  })

  it('GoogleAuth init 失敗後に signInWithGoogle が日本語エラーを返す', async () => {
    mocks.isNativePlatform.mockReturnValue(true)
    mocks.googleInitialize.mockRejectedValue(new Error('serverClientId missing'))
    const { result } = renderHook(() => useAuth(), { wrapper })

    // useEffect の catch が走るまで待つ
    await act(async () => {
      await new Promise(r => setTimeout(r, 0))
    })

    let error: string | null = null
    await act(async () => {
      error = await result.current.signInWithGoogle()
    })

    expect(error).toBe('Google 認証の初期化に失敗しました（設定を確認してください）')
  })
})
