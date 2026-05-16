import { IconSun, IconMoon, IconDeviceDesktop, IconUser, IconLogout, IconLogin } from '@tabler/icons-react'
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
    </div>
  )
}
