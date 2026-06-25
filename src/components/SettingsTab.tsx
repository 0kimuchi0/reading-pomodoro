import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { IconSun, IconMoon, IconDeviceDesktop, IconUser, IconLogout, IconLogin, IconMessage, IconX, IconSend, IconShieldLock, IconTrash, IconKey } from '@tabler/icons-react'
import type { User } from '@supabase/supabase-js'
import type { Theme } from '../App'
import { useAuth } from '../auth/AuthContext'
import { submitFeedback } from '../lib/db'
import { supabase } from '../lib/supabase'

interface Props {
  theme: Theme
  onThemeChange: (t: Theme) => void
  user: User | null
  onOpenAuth: () => void
  onSignOut: () => Promise<void>
}

const THEMES: { value: Theme; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'light', label: 'ライト', icon: <IconSun size={20} />, desc: '常に明るい表示' },
  { value: 'dark',  label: 'ダーク',  icon: <IconMoon size={20} />, desc: '常に暗い表示' },
  { value: 'system', label: 'システム', icon: <IconDeviceDesktop size={20} />, desc: 'デバイスの設定に従う' },
]

export default function SettingsTab({ theme, onThemeChange, user, onOpenAuth }: Props) {
  const { signOut, deleteAccount, passwordRecoveryMode, clearPasswordRecoveryMode } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState(false)

  useEffect(() => {
    if (!feedbackOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setFeedbackOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [feedbackOpen])

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) return
    setSending(true)
    setSendError(false)
    try {
      await submitFeedback(feedbackText.trim(), user?.id ?? null)
      setSent(true)
      setFeedbackText('')
      setTimeout(() => {
        setSent(false)
        setFeedbackOpen(false)
      }, 1500)
    } catch {
      setSendError(true)
    } finally {
      setSending(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError(null)
    if (newPassword.length < 8) {
      setPasswordError('パスワードは8文字以上で入力してください')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('パスワードが一致しません')
      return
    }
    setPasswordSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordSubmitting(false)
    if (error) {
      setPasswordError('パスワードの変更に失敗しました')
      return
    }
    setPasswordSuccess(true)
    clearPasswordRecoveryMode()
  }

  return (
    <div className="settings-tab">
      {passwordRecoveryMode && (
        <section className="settings-section settings-section--recovery">
          <h2 className="settings-section-title">
            <IconKey size={18} />
            パスワードを変更
          </h2>
          {passwordSuccess ? (
            <p className="recovery-success-msg">パスワードを変更しました</p>
          ) : (
            <>
              <p className="account-desc">新しいパスワードを設定してください</p>
              <input
                type="password"
                className="recovery-input"
                placeholder="新しいパスワード（8文字以上）"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                disabled={passwordSubmitting}
              />
              <input
                type="password"
                className="recovery-input"
                placeholder="パスワードを再入力"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={passwordSubmitting}
              />
              {passwordError && <p className="recovery-error-msg">{passwordError}</p>}
              <button
                className="btn-primary recovery-submit"
                onClick={handleChangePassword}
                disabled={passwordSubmitting || !newPassword || !confirmPassword}
              >
                {passwordSubmitting ? '変更中...' : 'パスワードを更新'}
              </button>
            </>
          )}
        </section>
      )}

      <section className="settings-section">
        <h2 className="settings-section-title">アカウント</h2>
        {user ? (
          <div className="account-info">
            <div className="account-row">
              <IconUser size={18} />
              <span className="account-email">{user.email}</span>
            </div>
            <p className="account-desc">データはクラウドに同期されています</p>
            <div className="account-actions">
              <button className="btn-ghost account-signout" onClick={signOut}>
                <IconLogout size={16} />
                ログアウト
              </button>
              {!deleteConfirm ? (
                <button className="btn-ghost account-delete-btn" onClick={() => setDeleteConfirm(true)}>
                  <IconTrash size={16} />
                  アカウント削除
                </button>
              ) : (
                <div className="account-delete-confirm">
                  <p className="account-delete-warning">すべてのデータが削除されます。この操作は取り消せません。</p>
                  {deleteError && <p className="account-delete-error">削除に失敗しました。再度お試しください。</p>}
                  <div className="account-delete-actions">
                    <button className="btn-ghost" onClick={() => { setDeleteConfirm(false); setDeleteError(false) }} disabled={deleting}>キャンセル</button>
                    <button
                      className="btn-danger"
                      disabled={deleting}
                      onClick={async () => {
                        setDeleting(true)
                        setDeleteError(false)
                        try { await deleteAccount() } catch { setDeleting(false); setDeleteError(true) }
                      }}
                    >
                      {deleting ? '削除中...' : '削除する'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="account-info">
            <p className="account-desc">ログインするとデバイス間でデータを同期できます</p>
            <button className="btn-primary account-login" onClick={onOpenAuth}>
              <IconLogin size={16} />
              ログイン / 新規登録
            </button>
          </div>
        )}
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">テーマ</h2>
        <div className="theme-options">
          {THEMES.map(t => (
            <button
              key={t.value}
              className={`theme-option${theme === t.value ? ' active' : ''}`}
              onClick={() => onThemeChange(t.value)}
            >
              <span className="theme-option-icon">{t.icon}</span>
              <span className="theme-option-label">{t.label}</span>
              <span className="theme-option-desc">{t.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">フィードバック</h2>
        <p className="account-desc">ご意見・ご要望・不具合報告をお送りください</p>
        <button className="btn-ghost feedback-btn" onClick={() => setFeedbackOpen(true)}>
          <IconMessage size={16} />
          フィードバックを送る
        </button>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">法的情報</h2>
        <a className="btn-ghost privacy-link" href="/privacy.html" target="_blank" rel="noopener">
          <IconShieldLock size={16} />
          プライバシーポリシー
        </a>
      </section>

      {feedbackOpen && createPortal(
        <div className="feedback-overlay" onClick={() => setFeedbackOpen(false)}>
          <div className="feedback-modal" onClick={e => e.stopPropagation()}>
            <div className="feedback-modal-header">
              <h3 className="feedback-modal-title">フィードバック</h3>
              <button className="feedback-close" onClick={() => setFeedbackOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            {sent ? (
              <p className="feedback-sent-msg">送信しました！ありがとうございます</p>
            ) : (
              <>
                <p className="feedback-modal-desc">ご意見・ご要望・不具合などをお知らせください</p>
                <textarea
                  className="feedback-textarea"
                  placeholder="フィードバックを入力してください..."
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  rows={6}
                  disabled={sending}
                />
                {sendError && <p className="feedback-error-msg">送信に失敗しました。時間をおいて再度お試しください。</p>}
                <div className="feedback-actions">
                  <button className="btn-ghost" onClick={() => setFeedbackOpen(false)} disabled={sending}>キャンセル</button>
                  <button
                    className="btn-primary feedback-send"
                    onClick={handleSendFeedback}
                    disabled={!feedbackText.trim() || sending}
                  >
                    <IconSend size={16} />
                    {sending ? '送信中...' : '送信'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
