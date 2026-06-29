import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { AuthProvider, useAuth } from '../auth/AuthContext'
import { getMyProfile } from '../lib/db'

const mocks = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => false),
  resetPasswordForEmail: vi.fn(() =>
    Promise.resolve({ error: null as { message: string } | null })
  ),
  socialLoginInitialize: vi.fn(() => Promise.resolve()),
  socialLoginLogin: vi.fn(),
  supabaseSignInWithIdToken: vi.fn(() => Promise.resolve({ error: null })),
  onAuthStateChange: vi.fn((..._args: unknown[]) => ({
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
      signInWithIdToken: mocks.supabaseSignInWithIdToken,
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

vi.mock('@capgo/capacitor-social-login', () => ({
  SocialLogin: {
    initialize: mocks.socialLoginInitialize,
    login: mocks.socialLoginLogin,
  },
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
    mocks.socialLoginInitialize.mockResolvedValue(undefined)
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

describe('SocialLogin.initialize', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.socialLoginInitialize.mockResolvedValue(undefined)
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('ネイティブでは google オプションで初期化される', async () => {
    mocks.isNativePlatform.mockReturnValue(true)
    renderHook(() => useAuth(), { wrapper })

    await vi.waitFor(() => {
      expect(mocks.socialLoginInitialize).toHaveBeenCalledWith(
        expect.objectContaining({
          google: expect.objectContaining({ iOSClientId: expect.any(String) }),
        })
      )
    })
  })

  it('Web では SocialLogin.initialize を呼ばない', () => {
    mocks.isNativePlatform.mockReturnValue(false)
    renderHook(() => useAuth(), { wrapper })

    expect(mocks.socialLoginInitialize).not.toHaveBeenCalled()
  })
})

describe('signInWithGoogle (native)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.socialLoginInitialize.mockResolvedValue(undefined)
    mocks.supabaseSignInWithIdToken.mockResolvedValue({ error: null })
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('SocialLogin.login を呼んで idToken で Supabase にログインする', async () => {
    mocks.isNativePlatform.mockReturnValue(true)
    mocks.socialLoginLogin.mockResolvedValue({
      provider: 'google',
      result: {
        responseType: 'online',
        idToken: 'google-id-token-123',
        accessToken: null,
        profile: { email: null, familyName: null, givenName: null, id: null, name: null, imageUrl: null },
      },
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    let error: string | null = 'sentinel'
    await act(async () => {
      error = await result.current.signInWithGoogle()
    })

    expect(mocks.socialLoginLogin).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' })
    )
    expect(mocks.supabaseSignInWithIdToken).toHaveBeenCalledWith({
      provider: 'google',
      token: 'google-id-token-123',
    })
    expect(error).toBeNull()
  })

  it('idToken が null のとき日本語エラーを返す', async () => {
    mocks.isNativePlatform.mockReturnValue(true)
    mocks.socialLoginLogin.mockResolvedValue({
      provider: 'google',
      result: { responseType: 'online', idToken: null, accessToken: null, profile: null },
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    let error: string | null = null
    await act(async () => {
      error = await result.current.signInWithGoogle()
    })

    expect(error).toBe('Google ログインに失敗しました')
  })
})

describe('signInWithApple (native)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.socialLoginInitialize.mockResolvedValue(undefined)
    mocks.supabaseSignInWithIdToken.mockResolvedValue({ error: null })
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('nonce を生成して SocialLogin.login を呼び idToken で Supabase にログインする', async () => {
    mocks.isNativePlatform.mockReturnValue(true)
    mocks.socialLoginLogin.mockResolvedValue({
      provider: 'apple',
      result: {
        idToken: 'apple-id-token-456',
        accessToken: null,
        profile: { user: 'apple-user-id', email: null, givenName: null, familyName: null },
      },
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    let error: string | null = 'sentinel'
    await act(async () => {
      error = await result.current.signInWithApple()
    })

    expect(mocks.socialLoginLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'apple',
        options: expect.objectContaining({ nonce: expect.any(String) }),
      })
    )
    expect(mocks.supabaseSignInWithIdToken).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'apple',
        token: 'apple-id-token-456',
        nonce: expect.any(String),
      })
    )

    // PKCE invariant: rawNonce (→ Supabase) ≠ hashedNonce (→ SocialLogin)
    const hashedNonceUsed = (mocks.socialLoginLogin.mock.calls[0][0] as { options: { nonce: string } }).options.nonce
    const rawNonceUsed = ((mocks.supabaseSignInWithIdToken.mock.calls as unknown as unknown[][])[0][0] as { nonce: string }).nonce
    expect(rawNonceUsed).not.toBe(hashedNonceUsed)
    expect(rawNonceUsed).toHaveLength(32)    // hex(Uint8Array(16))
    expect(hashedNonceUsed).toHaveLength(64) // hex(SHA-256)

    expect(error).toBeNull()
  })

  it('idToken が null のとき日本語エラーを返す', async () => {
    mocks.isNativePlatform.mockReturnValue(true)
    mocks.socialLoginLogin.mockResolvedValue({
      provider: 'apple',
      result: { idToken: null, accessToken: null, profile: { user: '', email: null, givenName: null, familyName: null } },
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    let error: string | null = null
    await act(async () => {
      error = await result.current.signInWithApple()
    })

    expect(error).toBe('Apple ログインに失敗しました')
  })
})

describe('PASSWORD_RECOVERY と socialLoginInitError', () => {
  let fireAuthState: ((event: string, session: unknown) => Promise<void>) | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.socialLoginInitialize.mockResolvedValue(undefined)
    mocks.onAuthStateChange.mockImplementation((...args: unknown[]) => {
      fireAuthState = args[0] as (event: string, session: unknown) => Promise<void>
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

  it('SocialLogin init 失敗後に signInWithGoogle が日本語エラーを返す', async () => {
    mocks.isNativePlatform.mockReturnValue(true)
    mocks.socialLoginInitialize.mockRejectedValue(new Error('serverClientId missing'))
    const { result } = renderHook(() => useAuth(), { wrapper })

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

describe('admin role loading', () => {
  let fireAuthState: ((event: string, session: unknown) => Promise<void>) | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.socialLoginInitialize.mockResolvedValue(undefined)
    mocks.onAuthStateChange.mockImplementation((...args: unknown[]) => {
      fireAuthState = args[0] as (event: string, session: unknown) => Promise<void>
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
  })

  it('getMyProfile が admin プロフィールを返すと SIGNED_IN 後に role が admin になる', async () => {
    mocks.isNativePlatform.mockReturnValue(false)
    vi.mocked(getMyProfile).mockResolvedValueOnce({
      id: 'user-admin-123',
      email: 'admin@example.com',
      role: 'admin',
      banned: false,
      createdAt: '2024-01-01T00:00:00Z',
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await fireAuthState?.('SIGNED_IN', { user: { id: 'user-admin-123' } })
    })

    expect(result.current.role).toBe('admin')
  })

  it('getMyProfile が null を返すと SIGNED_IN 後も role は null（RLS ブロック時の挙動）', async () => {
    mocks.isNativePlatform.mockReturnValue(false)
    vi.mocked(getMyProfile).mockResolvedValueOnce(null)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await fireAuthState?.('SIGNED_IN', { user: { id: 'user-123' } })
    })

    expect(result.current.role).toBeNull()
  })
})

describe('signInWithApple - error 1000 ハンドリング', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.socialLoginInitialize.mockResolvedValue(undefined)
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('ASAuthorizationError error 1000 はユーザーフレンドリーなメッセージを返す', async () => {
    mocks.isNativePlatform.mockReturnValue(true)
    mocks.socialLoginLogin.mockRejectedValue(
      new Error("The operation couldn't be completed. (com.apple.AuthenticationServices.AuthorizationError error 1000.)")
    )

    const { result } = renderHook(() => useAuth(), { wrapper })
    let error: string | null = null
    await act(async () => {
      error = await result.current.signInWithApple()
    })

    expect(error).toBe('Apple ログインに失敗しました。しばらくしてから再試行してください。')
  })

  it('ASAuthorizationError error 1001（キャンセル）は null を返す', async () => {
    mocks.isNativePlatform.mockReturnValue(true)
    mocks.socialLoginLogin.mockRejectedValue(
      new Error("The operation couldn't be completed. (com.apple.AuthenticationServices.AuthorizationError error 1001.)")
    )

    const { result } = renderHook(() => useAuth(), { wrapper })
    let error: string | null = 'sentinel'
    await act(async () => {
      error = await result.current.signInWithApple()
    })

    expect(error).toBeNull()
  })
})

describe('BAN ハンドリング', () => {
  let fireAuthState: ((event: string, session: unknown) => Promise<void>) | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.socialLoginInitialize.mockResolvedValue(undefined)
    mocks.onAuthStateChange.mockImplementation((...args: unknown[]) => {
      fireAuthState = args[0] as (event: string, session: unknown) => Promise<void>
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
  })

  it('BAN済み admin ユーザーが SIGNED_IN したとき bannedError が設定され role は null のまま', async () => {
    mocks.isNativePlatform.mockReturnValue(false)
    vi.mocked(getMyProfile).mockResolvedValueOnce({
      id: 'user-banned-123',
      email: 'banned-admin@example.com',
      role: 'admin',
      banned: true,
      createdAt: '2024-01-01T00:00:00Z',
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await fireAuthState?.('SIGNED_IN', { user: { id: 'user-banned-123' } })
    })

    expect(result.current.bannedError).toBe('このアカウントは利用が停止されています。')
    expect(result.current.role).toBeNull()
    expect(result.current.user).toBeNull()
  })

  it('bannedError は clearBannedError で解除できる', async () => {
    mocks.isNativePlatform.mockReturnValue(false)
    vi.mocked(getMyProfile).mockResolvedValueOnce({
      id: 'user-banned-123',
      email: 'banned-admin@example.com',
      role: 'admin',
      banned: true,
      createdAt: '2024-01-01T00:00:00Z',
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await fireAuthState?.('SIGNED_IN', { user: { id: 'user-banned-123' } })
    })
    expect(result.current.bannedError).not.toBeNull()

    act(() => {
      result.current.clearBannedError()
    })

    expect(result.current.bannedError).toBeNull()
  })
})

describe('signInWithGoogle - clientId 未設定', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.socialLoginInitialize.mockResolvedValue(undefined)
    mocks.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('VITE_GOOGLE_CLIENT_ID が未設定のとき SocialLogin.login を呼ばずにエラーを返す', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '')
    mocks.isNativePlatform.mockReturnValue(true)

    const { result } = renderHook(() => useAuth(), { wrapper })
    let error: string | null = null
    await act(async () => {
      error = await result.current.signInWithGoogle()
    })

    expect(error).toBe('Google ログインが設定されていません')
    expect(mocks.socialLoginLogin).not.toHaveBeenCalled()
  })
})
