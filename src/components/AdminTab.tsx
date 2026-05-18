import { useEffect, useState } from 'react'
import { IconShield, IconUser, IconBan, IconRefresh, IconChartBar, IconBook, IconHistory, IconArrowBackUp, IconBookmark, IconPlus, IconTrash } from '@tabler/icons-react'
import { getAllProfiles, updateUserRole, updateUserBanned, getAllBooksAdmin, getAllSessionsAdmin, logAdminAction, getAdminActions, revertAdminAction, getSuggestBooks, addSuggestBook, deleteSuggestBook } from '../lib/db'
import { setAdminBooksCache } from '../suggestBooks'
import type { Profile, UserRole, Book, Session, SuggestBookDB } from '../types'
import type { AdminAction } from '../types'
import ConfirmDialog from './ConfirmDialog'

interface PendingAction {
  message: string
  confirmLabel: string
  danger: boolean
  onConfirm: (reason: string) => Promise<void>
}

export default function AdminTab() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [actions, setActions] = useState<AdminAction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'users' | 'stats' | 'history' | 'suggests'>('users')
  const [suggestBooks, setSuggestBooks] = useState<SuggestBookDB[]>([])
  const [suggestForm, setSuggestForm] = useState({ title: '', author: '', genre: 'その他', publisher: '', totalPages: '' })
  const [suggestAdding, setSuggestAdding] = useState(false)
  const [pending, setPending] = useState<PendingAction | null>(null)

  const load = async () => {
    setLoading(true)
    const [p, b, s, a, sb] = await Promise.all([getAllProfiles(), getAllBooksAdmin(), getAllSessionsAdmin(), getAdminActions(), getSuggestBooks()])
    setProfiles(p)
    setBooks(b)
    setSessions(s)
    setActions(a)
    setSuggestBooks(sb)
    setAdminBooksCache(sb)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const confirm = (action: PendingAction) => setPending(action)
  const handleCancel = () => setPending(null)
  const handleConfirm = async (reason: string) => {
    if (!pending) return
    await pending.onConfirm(reason)
    setPending(null)
  }

  const handleRoleChange = (id: string, newRole: UserRole, email: string, currentRole: UserRole) => {
    const label = newRole === 'admin' ? '管理者' : '一般ユーザー'
    confirm({
      message: `${email} のロールを「${label}」に変更しますか？`,
      confirmLabel: '変更する',
      danger: newRole === 'admin',
      onConfirm: async (reason) => {
        await updateUserRole(id, newRole)
        await logAdminAction(id, 'role_change', currentRole, newRole, reason)
        setProfiles(prev => prev.map(p => p.id === id ? { ...p, role: newRole } : p))
        setActions(prev => [{
          id: crypto.randomUUID(),
          adminId: '',
          targetUserId: id,
          actionType: 'role_change',
          previousValue: currentRole,
          newValue: newRole,
          reason,
          createdAt: new Date().toISOString(),
        }, ...prev])
      },
    })
  }

  const handleBanToggle = (id: string, banned: boolean, email: string) => {
    confirm({
      message: banned ? `${email} をBANしますか？` : `${email} のBANを解除しますか？`,
      confirmLabel: banned ? 'BANする' : '解除する',
      danger: banned,
      onConfirm: async (reason) => {
        await updateUserBanned(id, banned)
        const actionType = banned ? 'ban' : 'unban'
        await logAdminAction(id, actionType, String(!banned), String(banned), reason)
        setProfiles(prev => prev.map(p => p.id === id ? { ...p, banned } : p))
        setActions(prev => [{
          id: crypto.randomUUID(),
          adminId: '',
          targetUserId: id,
          actionType,
          previousValue: String(!banned),
          newValue: String(banned),
          reason,
          createdAt: new Date().toISOString(),
        }, ...prev])
      },
    })
  }

  const handleRevert = (action: AdminAction) => {
    const target = profiles.find(p => p.id === action.targetUserId)
    const email = target?.email ?? action.targetUserId
    const actionLabel = action.actionType === 'role_change'
      ? `ロールを「${action.previousValue}」に戻す`
      : action.previousValue === 'true' ? 'BANに戻す' : 'BAN解除に戻す'

    confirm({
      message: `${email} の変更を巻き戻しますか？\n（${actionLabel}）`,
      confirmLabel: '巻き戻す',
      danger: false,
      onConfirm: async (reason) => {
        await revertAdminAction({ ...action, reason })
        await load()
      },
    })
  }

  const handleAddSuggest = async () => {
    if (!suggestForm.title.trim() || !suggestForm.author.trim()) return
    setSuggestAdding(true)
    await addSuggestBook({
      title: suggestForm.title.trim(),
      author: suggestForm.author.trim(),
      genre: suggestForm.genre,
      publisher: suggestForm.publisher.trim(),
      totalPages: Number(suggestForm.totalPages) || 0,
    })
    const sb = await getSuggestBooks()
    setSuggestBooks(sb)
    setAdminBooksCache(sb)
    setSuggestForm({ title: '', author: '', genre: 'その他', publisher: '', totalPages: '' })
    setSuggestAdding(false)
  }

  const handleDeleteSuggest = async (id: string) => {
    await deleteSuggestBook(id)
    const sb = await getSuggestBooks()
    setSuggestBooks(sb)
    setAdminBooksCache(sb)
  }

  const totalSessions = sessions.length
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0)
  const totalBooks = books.length
  const doneBooks = books.filter(b => b.status === 'done').length

  const actionLabel = (a: AdminAction) => {
    const target = profiles.find(p => p.id === a.targetUserId)?.email ?? a.targetUserId
    if (a.actionType === 'role_change') return `${target} のロールを「${a.previousValue}」→「${a.newValue}」に変更`
    if (a.actionType === 'ban') return `${target} をBAN`
    return `${target} のBANを解除`
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  return (
    <div className="admin-tab">
      <div className="admin-header">
        <IconShield size={20} />
        <h2>管理者パネル</h2>
        <button className="admin-refresh-btn" onClick={load} title="更新">
          <IconRefresh size={16} />
        </button>
      </div>

      <div className="admin-nav">
        <button className={`admin-nav-btn${activeSection === 'users' ? ' active' : ''}`} onClick={() => setActiveSection('users')}>
          <IconUser size={16} /> ユーザー管理
        </button>
        <button className={`admin-nav-btn${activeSection === 'stats' ? ' active' : ''}`} onClick={() => setActiveSection('stats')}>
          <IconChartBar size={16} /> 全体統計
        </button>
        <button className={`admin-nav-btn${activeSection === 'history' ? ' active' : ''}`} onClick={() => setActiveSection('history')}>
          <IconHistory size={16} /> 操作履歴
          {actions.length > 0 && <span className="admin-history-badge">{actions.length}</span>}
        </button>
        <button className={`admin-nav-btn${activeSection === 'suggests' ? ' active' : ''}`} onClick={() => setActiveSection('suggests')}>
          <IconBookmark size={16} /> サジェスト
        </button>
      </div>

      {loading ? (
        <div className="admin-loading">読み込み中...</div>
      ) : activeSection === 'users' ? (
        <div className="admin-section">
          <p className="admin-count">{profiles.length} アカウント</p>
          <div className="admin-user-list">
            {profiles.map(p => (
              <div key={p.id} className={`admin-user-card${p.banned ? ' banned' : ''}`}>
                <div className="admin-user-info">
                  <span className="admin-user-email">{p.email || '(メールなし)'}</span>
                  <span className="admin-user-meta">
                    {books.filter(b => (b as any).user_id === p.id).length} 冊 ·{' '}
                    {sessions.filter(s => (s as any).user_id === p.id).length} セッション
                  </span>
                </div>
                <div className="admin-user-actions">
                  <select
                    className="admin-role-select"
                    value={p.role}
                    onChange={e => handleRoleChange(p.id, e.target.value as UserRole, p.email, p.role)}
                  >
                    <option value="user">一般</option>
                    <option value="admin">管理者</option>
                  </select>
                  <button
                    className={`admin-ban-btn${p.banned ? ' unbanning' : ''}`}
                    onClick={() => handleBanToggle(p.id, !p.banned, p.email)}
                    title={p.banned ? 'BANを解除' : 'BANする'}
                  >
                    <IconBan size={15} />
                    {p.banned ? '解除' : 'BAN'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeSection === 'stats' ? (
        <div className="admin-section">
          <div className="admin-stats-grid">
            <div className="admin-stat-card"><span className="admin-stat-value">{profiles.length}</span><span className="admin-stat-label">総ユーザー数</span></div>
            <div className="admin-stat-card"><span className="admin-stat-value">{totalBooks}</span><span className="admin-stat-label">総登録冊数</span></div>
            <div className="admin-stat-card"><span className="admin-stat-value">{doneBooks}</span><span className="admin-stat-label">総読了冊数</span></div>
            <div className="admin-stat-card"><span className="admin-stat-value">{totalSessions}</span><span className="admin-stat-label">総セッション数</span></div>
            <div className="admin-stat-card"><span className="admin-stat-value">{totalMinutes}</span><span className="admin-stat-label">総集中時間（分）</span></div>
            <div className="admin-stat-card"><span className="admin-stat-value">{profiles.length > 0 ? Math.round(totalSessions / profiles.length) : 0}</span><span className="admin-stat-label">平均セッション数/人</span></div>
          </div>
          <h3 className="admin-section-title"><IconBook size={16} /> ユーザー別アクティビティ</h3>
          <div className="admin-user-list">
            {profiles
              .map(p => ({ ...p, bookCount: books.filter(b => (b as any).user_id === p.id).length, sessionCount: sessions.filter(s => (s as any).user_id === p.id).length }))
              .sort((a, b) => b.sessionCount - a.sessionCount)
              .map(p => (
                <div key={p.id} className="admin-user-card">
                  <span className="admin-user-email">{p.email || '(メールなし)'}</span>
                  <div className="admin-user-activity"><span>{p.bookCount} 冊</span><span>{p.sessionCount} セッション</span></div>
                </div>
              ))}
          </div>
        </div>
      ) : activeSection === 'history' ? (
        <div className="admin-section">
          {actions.length === 0 ? (
            <p className="admin-empty">操作履歴はありません</p>
          ) : (
            <div className="admin-action-list">
              {actions.map(a => (
                <div key={a.id} className="admin-action-card">
                  <div className="admin-action-info">
                    <span className="admin-action-desc">{actionLabel(a)}</span>
                    <span className="admin-action-reason">理由: {a.reason}</span>
                    <span className="admin-action-date">{formatDate(a.createdAt)}</span>
                  </div>
                  <button
                    className="admin-revert-btn"
                    onClick={() => handleRevert(a)}
                    title="この変更を巻き戻す"
                  >
                    <IconArrowBackUp size={15} />
                    巻き戻し
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="admin-section">
          <div className="admin-suggest-form">
            <input
              className="admin-suggest-input"
              placeholder="タイトル *"
              value={suggestForm.title}
              onChange={e => setSuggestForm(f => ({ ...f, title: e.target.value }))}
            />
            <input
              className="admin-suggest-input"
              placeholder="著者 *"
              value={suggestForm.author}
              onChange={e => setSuggestForm(f => ({ ...f, author: e.target.value }))}
            />
            <select
              className="admin-role-select"
              value={suggestForm.genre}
              onChange={e => setSuggestForm(f => ({ ...f, genre: e.target.value }))}
            >
              {['小説', 'ビジネス', '自己啓発', '技術', '歴史', 'その他'].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <input
              className="admin-suggest-input"
              placeholder="出版社"
              value={suggestForm.publisher}
              onChange={e => setSuggestForm(f => ({ ...f, publisher: e.target.value }))}
            />
            <input
              className="admin-suggest-input admin-suggest-pages"
              placeholder="ページ数"
              type="number"
              min="0"
              value={suggestForm.totalPages}
              onChange={e => setSuggestForm(f => ({ ...f, totalPages: e.target.value }))}
            />
            <button
              className="admin-suggest-add-btn"
              onClick={handleAddSuggest}
              disabled={suggestAdding || !suggestForm.title.trim() || !suggestForm.author.trim()}
            >
              <IconPlus size={15} /> 追加
            </button>
          </div>
          <p className="admin-count">{suggestBooks.length} 件（管理者追加分）</p>
          {suggestBooks.length === 0 ? (
            <p className="admin-empty">管理者が追加したサジェストはありません</p>
          ) : (
            <div className="admin-user-list">
              {suggestBooks.map(sb => (
                <div key={sb.id} className="admin-user-card">
                  <div className="admin-user-info">
                    <span className="admin-user-email">{sb.title}</span>
                    <span className="admin-user-meta">{sb.author} · {sb.genre}{sb.publisher ? ` · ${sb.publisher}` : ''}{sb.totalPages ? ` · ${sb.totalPages}p` : ''}</span>
                  </div>
                  <button
                    className="admin-ban-btn"
                    onClick={() => handleDeleteSuggest(sb.id)}
                    title="削除"
                  >
                    <IconTrash size={15} /> 削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {pending && (
        <ConfirmDialog
          message={pending.message}
          confirmLabel={pending.confirmLabel}
          danger={pending.danger}
          requireReason
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
