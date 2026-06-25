import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SettingsTab from '../components/SettingsTab'

const mocks = vi.hoisted(() => ({
  passwordRecoveryMode: false,
  clearPasswordRecoveryMode: vi.fn(),
  signOut: vi.fn(),
  deleteAccount: vi.fn(),
  updateUser: vi.fn(() => Promise.resolve({ error: null as { message: string } | null })),
}))

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    signOut: mocks.signOut,
    deleteAccount: mocks.deleteAccount,
    passwordRecoveryMode: mocks.passwordRecoveryMode,
    clearPasswordRecoveryMode: mocks.clearPasswordRecoveryMode,
  }),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser: mocks.updateUser,
    },
  },
}))

vi.mock('../lib/db', () => ({
  submitFeedback: vi.fn(),
}))

const defaultProps = {
  theme: 'system' as const,
  onThemeChange: vi.fn(),
  user: null,
  onOpenAuth: vi.fn(),
  onSignOut: vi.fn(),
}

describe('passwordRecoveryMode が false の場合', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.passwordRecoveryMode = false
  })

  it('パスワード変更フォームが表示されない', () => {
    render(<SettingsTab {...defaultProps} />)
    expect(screen.queryByText('パスワードを変更')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('新しいパスワード')).not.toBeInTheDocument()
  })
})

describe('passwordRecoveryMode が true の場合', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.passwordRecoveryMode = true
    mocks.updateUser.mockResolvedValue({ error: null })
  })

  it('パスワード変更セクションが表示される', () => {
    render(<SettingsTab {...defaultProps} />)
    expect(screen.getByText('パスワードを変更')).toBeInTheDocument()
  })

  it('新しいパスワードと確認用パスワードのフィールドがある', () => {
    render(<SettingsTab {...defaultProps} />)
    expect(screen.getByPlaceholderText('新しいパスワード（8文字以上）')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('パスワードを再入力')).toBeInTheDocument()
  })

  it('パスワードが一致しない場合はエラーメッセージを表示', async () => {
    render(<SettingsTab {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText('新しいパスワード（8文字以上）'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByPlaceholderText('パスワードを再入力'), { target: { value: 'different123' } })
    fireEvent.click(screen.getByRole('button', { name: /パスワードを更新/i }))

    expect(await screen.findByText('パスワードが一致しません')).toBeInTheDocument()
    expect(mocks.updateUser).not.toHaveBeenCalled()
  })

  it('パスワードが8文字未満の場合はエラーメッセージを表示', async () => {
    render(<SettingsTab {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText('新しいパスワード（8文字以上）'), { target: { value: 'short' } })
    fireEvent.change(screen.getByPlaceholderText('パスワードを再入力'), { target: { value: 'short' } })
    fireEvent.click(screen.getByRole('button', { name: /パスワードを更新/i }))

    expect(await screen.findByText('パスワードは8文字以上で入力してください')).toBeInTheDocument()
    expect(mocks.updateUser).not.toHaveBeenCalled()
  })

  it('成功時に clearPasswordRecoveryMode が呼ばれる', async () => {
    render(<SettingsTab {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText('新しいパスワード（8文字以上）'), { target: { value: 'newpassword123' } })
    fireEvent.change(screen.getByPlaceholderText('パスワードを再入力'), { target: { value: 'newpassword123' } })
    fireEvent.click(screen.getByRole('button', { name: /パスワードを更新/i }))

    await waitFor(() => {
      expect(mocks.updateUser).toHaveBeenCalledWith({ password: 'newpassword123' })
      expect(mocks.clearPasswordRecoveryMode).toHaveBeenCalledTimes(1)
    })
  })

  it('成功時に完了メッセージが表示される', async () => {
    render(<SettingsTab {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText('新しいパスワード（8文字以上）'), { target: { value: 'newpassword123' } })
    fireEvent.change(screen.getByPlaceholderText('パスワードを再入力'), { target: { value: 'newpassword123' } })
    fireEvent.click(screen.getByRole('button', { name: /パスワードを更新/i }))

    expect(await screen.findByText('パスワードを変更しました')).toBeInTheDocument()
  })

  it('Supabase エラー時にエラーメッセージを表示', async () => {
    mocks.updateUser.mockResolvedValue({ error: { message: 'Password too weak' } })
    render(<SettingsTab {...defaultProps} />)
    fireEvent.change(screen.getByPlaceholderText('新しいパスワード（8文字以上）'), { target: { value: 'newpassword123' } })
    fireEvent.change(screen.getByPlaceholderText('パスワードを再入力'), { target: { value: 'newpassword123' } })
    fireEvent.click(screen.getByRole('button', { name: /パスワードを更新/i }))

    expect(await screen.findByText('パスワードの変更に失敗しました')).toBeInTheDocument()
    expect(mocks.clearPasswordRecoveryMode).not.toHaveBeenCalled()
  })
})
