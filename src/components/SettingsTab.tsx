import { useState } from 'react'
import { IconSun, IconMoon, IconDeviceDesktop, IconUser, IconLogout, IconLogin, IconMessage, IconX, IconSend } from '@tabler/icons-react'
import type { User } from '@supabase/supabase-js'
import type { Theme } from '../App'
import { useAuth } from '../auth/AuthContext'

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
  const { signOut } = useAuth()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')

  const handleSendFeedback = () => {
    const subject = encodeURIComponent('PomoRead フィードバック')
    const body = encodeURIComponent(feedbackText)
    window.open(`mailto:koyama.daiki.190710@outlook.jp?subject=${subject}&body=${body}`)
    setFeedbackText('')
    setFeedbackOpen(false)
  }

  return (
    <div className="settings-tab">
      <section className="settings-section">
        <h2 className="settings-section-title">アカウント</h2>
        {user ? (
          <div className="account-info">
            <div className="account-row">
              <IconUser size={18} />
              <span className="account-email">{user.email}</span>
            </div>
            <p className="account-desc">データはクラウドに同期されています</p>
            <button className="btn-ghost account-signout" onClick={signOut}>
              <IconLogout size={16} />
              ログアウト
            </button>
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

      {feedbackOpen && (
        <div className="feedback-overlay" onClick={() => setFeedbackOpen(false)}>
          <div className="feedback-modal" onClick={e => e.stopPropagation()}>
            <div className="feedback-modal-header">
              <h3 className="feedback-modal-title">フィードバック</h3>
              <button className="feedback-close" onClick={() => setFeedbackOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <p className="feedback-modal-desc">ご意見・ご要望・不具合などをお知らせください</p>
            <textarea
              className="feedback-textarea"
              placeholder="フィードバックを入力してください..."
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              rows={6}
              autoFocus
            />
            <div className="feedback-actions">
              <button className="btn-ghost" onClick={() => setFeedbackOpen(false)}>キャンセル</button>
              <button
                className="btn-primary feedback-send"
                onClick={handleSendFeedback}
                disabled={!feedbackText.trim()}
              >
                <IconSend size={16} />
                メールで送信
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
