import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { IconX, IconBrandGoogle, IconBrandApple, IconMail, IconLock, IconEye, IconEyeOff } from '@tabler/icons-react'
import { useAuth } from './AuthContext'

interface Props {
  onClose: () => void
}

type Mode = 'login' | 'signup' | 'reset'

export default function AuthModal({ onClose }: Props) {
  const { signIn, signUp, signInWithGoogle, signInWithApple, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (mode === 'reset') {
      setLoading(true)
      const err = await resetPassword(email)
      setLoading(false)
      if (err) { setError(translateError(err)) } else { setDone(true) }
      return
    }
    if (mode === 'signup' && !confirm) {
      setError('パスワード（確認）を入力してください')
      return
    }
    if (mode === 'signup' && password !== confirm) {
      setError('パスワードが一致しません')
      return
    }
    setLoading(true)
    const err = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password)
    setLoading(false)
    if (err) {
      setError(translateError(err))
    } else if (mode === 'signup') {
      setDone(true)
    } else {
      onClose()
    }
  }

  const handleGoogle = async () => {
    setError(null)
    setLoading(true)
    const err = await signInWithGoogle()
    setLoading(false)
    if (err) setError(translateError(err))
    else onClose()
  }

  const handleApple = async () => {
    setError(null)
    setLoading(true)
    const err = await signInWithApple()
    setLoading(false)
    if (err) setError(translateError(err))
    else onClose()
  }

  return createPortal(
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        {done ? (
          <div className="auth-done">
            {mode === 'reset' ? (
              <>
                <p>パスワードリセットメールを送信しました。</p>
                <p>メール内のリンクからパスワードを再設定してください。</p>
              </>
            ) : (
              <>
                <p>確認メールを送信しました。</p>
                <p>メール内のリンクをクリックしてアカウントを有効化してください。</p>
              </>
            )}
            <button className="btn-primary" onClick={onClose}>閉じる</button>
          </div>
        ) : (
          <>
            <div className="auth-header">
              {mode === 'reset' ? (
                <>
                  <button className="auth-back-btn" onClick={() => { setMode('login'); setError(null) }}>← 戻る</button>
                  <span className="auth-header-title">パスワードリセット</span>
                </>
              ) : (
                <div className="auth-tabs">
                  <button
                    className={`auth-tab${mode === 'login' ? ' active' : ''}`}
                    onClick={() => { setMode('login'); setError(null); setConfirm('') }}
                  >ログイン</button>
                  <button
                    className={`auth-tab${mode === 'signup' ? ' active' : ''}`}
                    onClick={() => { setMode('signup'); setError(null); setConfirm('') }}
                  >新規登録</button>
                </div>
              )}
              <button className="auth-close" onClick={onClose}><IconX size={18} /></button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <IconMail size={16} />
                <input
                  type="email"
                  placeholder="メールアドレス"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              {mode !== 'reset' && (
                <div className="auth-field">
                  <IconLock size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="パスワード（8文字以上）"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                    {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  </button>
                </div>
              )}
              {mode === 'login' && (
                <button type="button" className="auth-forgot-btn" onClick={() => { setMode('reset'); setError(null) }}>
                  パスワードをお忘れですか？
                </button>
              )}
              {mode === 'signup' && (
                <div className="auth-field">
                  <IconLock size={16} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="パスワード（確認）"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                    {showConfirm ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  </button>
                </div>
              )}
              {error && <p className="auth-error">{error}</p>}
              <button className="btn-primary auth-submit" type="submit" disabled={loading}>
                {loading ? '処理中...' : mode === 'login' ? 'ログイン' : mode === 'signup' ? 'アカウント作成' : 'リセットメールを送信'}
              </button>
            </form>

            {mode !== 'reset' && (
              <>
                <div className="auth-divider"><span>または</span></div>
                <button className="btn-apple" onClick={handleApple} disabled={loading}>
                  <IconBrandApple size={18} />
                  Apple でログイン
                </button>
                <button className="btn-google" onClick={handleGoogle} disabled={loading}>
                  <IconBrandGoogle size={18} />
                  Google でログイン
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  )
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'メールアドレスまたはパスワードが違います'
  if (msg.includes('Email not confirmed')) return 'メールアドレスの確認が完了していません'
  if (msg.includes('User already registered')) return 'このメールアドレスは既に登録されています'
  if (msg.includes('Password should be at least')) return 'パスワードは8文字以上にしてください'
  if (msg.includes('email rate limit exceeded')) return 'メール送信の上限に達しました。しばらく待ってから再試行してください'
  if (msg.includes('For security purposes')) return 'セキュリティのため、しばらく待ってから再試行してください'
  if (msg.includes('nonce')) return 'ログインの認証に失敗しました。再度お試しください'
  if (msg.includes('expired') || msg.includes('token')) return 'ログインセッションの有効期限が切れました。再度お試しください'
  if (msg.includes('provider') && msg.includes('not enabled')) return 'このログイン方法は現在利用できません'
  if (msg.includes('User already exists')) return 'このアカウントは既に別の方法で登録されています'
  return msg
}
