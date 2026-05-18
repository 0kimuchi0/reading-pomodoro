import { useEffect, useState } from 'react'
import { IconShield, IconUser, IconBan, IconRefresh, IconChartBar, IconBook, IconHistory, IconArrowBackUp, IconBookmark, IconPlus, IconTrash, IconPencil, IconDeviceFloppy, IconX, IconSearch, IconQuestionMark } from '@tabler/icons-react'
import { getAllProfiles, updateUserRole, updateUserBanned, getAllBooksAdmin, getAllSessionsAdmin, logAdminAction, getAdminActions, revertAdminAction, getSuggestBooks, addSuggestBook, updateSuggestBook, deleteSuggestBook } from '../lib/db'
import { validateBookFields, hasErrors, formatCcode } from '../lib/validate'
import type { FieldErrors } from '../lib/validate'
import { setAdminBooksCache, SUGGEST_BOOKS } from '../suggestBooks'
import type { Profile, UserRole, Book, Session, SuggestBookDB } from '../types'
import type { AdminAction } from '../types'
import { useAuth } from '../auth/AuthContext'
import ConfirmDialog from './ConfirmDialog'
import HelpModal from './HelpModal'
import type { HelpItem } from './HelpModal'

const ADMIN_HELP: HelpItem[] = [
  {
    icon: <IconUser size={18} />,
    title: 'ユーザー管理',
    desc: 'ロール変更・BAN・BAN解除を行えます',
    detail: 'ユーザー一覧でロール（一般/管理者）の変更、BAN（利用停止）・BAN解除ができます。変更時には必ず理由の入力が必要で、操作は履歴に記録されます。BANされたユーザーは次回ログイン時に強制サインアウトされます。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8"/>
        <rect x="12" y="12" width="256" height="136" rx="10" fill="#fff" stroke="#E2E1F0" strokeWidth="1.5"/>
        <text x="24" y="32" fontSize="11" fontWeight="700" fill="#534AB7" fontFamily="sans-serif">ユーザー管理</text>
        {/* ユーザーカード1 */}
        <rect x="20" y="40" width="240" height="32" rx="6" fill="#F7F7FB" stroke="#E2E1F0" strokeWidth="1"/>
        <text x="30" y="60" fontSize="10" fill="#1A1A2E" fontFamily="sans-serif">user@example.com</text>
        <rect x="168" y="46" width="44" height="20" rx="4" fill="#F7F7FB" stroke="#E2E1F0" strokeWidth="1"/>
        <text x="175" y="60" fontSize="9" fill="#6B6B8A" fontFamily="sans-serif">一般 ▾</text>
        <rect x="216" y="46" width="36" height="20" rx="4" fill="#FFF0F0" stroke="#E53E3E" strokeWidth="1"/>
        <text x="226" y="60" fontSize="9" fill="#E53E3E" fontFamily="sans-serif">BAN</text>
        {/* ユーザーカード2（BAN済み） */}
        <rect x="20" y="78" width="240" height="32" rx="6" fill="#FFF5F5" stroke="#FEB2B2" strokeWidth="1"/>
        <text x="30" y="98" fontSize="10" fill="#C53030" fontFamily="sans-serif">banned@example.com</text>
        <rect x="168" y="84" width="44" height="20" rx="4" fill="#F7F7FB" stroke="#E2E1F0" strokeWidth="1"/>
        <text x="175" y="98" fontSize="9" fill="#6B6B8A" fontFamily="sans-serif">一般 ▾</text>
        <rect x="216" y="84" width="36" height="20" rx="4" fill="#E53E3E"/>
        <text x="221" y="98" fontSize="9" fill="#fff" fontFamily="sans-serif">解除</text>
        {/* 件数 */}
        <text x="24" y="128" fontSize="10" fill="#6B6B8A" fontFamily="sans-serif">2 アカウント</text>
      </svg>
    ),
  },
  {
    icon: <IconChartBar size={18} />,
    title: '全体統計',
    desc: '全ユーザーの読書状況をまとめて確認できます',
    detail: '総ユーザー数・登録冊数・読了冊数・セッション数・総集中時間・平均セッション数を一覧表示します。ユーザー別アクティビティでは各ユーザーの登録冊数とセッション数を多い順に確認できます。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8"/>
        <rect x="12" y="12" width="256" height="136" rx="10" fill="#fff" stroke="#E2E1F0" strokeWidth="1.5"/>
        <text x="24" y="32" fontSize="11" fontWeight="700" fill="#534AB7" fontFamily="sans-serif">全体統計</text>
        {[
          ['総ユーザー', '12'],['登録冊数', '87'],['読了冊数', '34'],
          ['セッション', '256'],['集中時間(分)', '6400'],['平均/人', '21'],
        ].map(([label, val], i) => (
          <g key={i} transform={`translate(${20 + (i % 3) * 82}, ${42 + Math.floor(i / 3) * 54})`}>
            <rect width="74" height="44" rx="6" fill="#F7F7FB" stroke="#E2E1F0" strokeWidth="1"/>
            <text x="37" y="20" textAnchor="middle" fontSize="14" fontWeight="700" fill="#534AB7" fontFamily="sans-serif">{val}</text>
            <text x="37" y="36" textAnchor="middle" fontSize="8" fill="#6B6B8A" fontFamily="sans-serif">{label}</text>
          </g>
        ))}
      </svg>
    ),
  },
  {
    icon: <IconBookmark size={18} />,
    title: 'サジェスト管理',
    desc: '全ユーザーの検索候補に表示される本を追加・インライン編集・削除できます',
    detail: '管理者が追加したサジェストは全ユーザーのタイトル入力候補として表示されます。タイトル・著者・出版社・ジャンル・ページ数・ISBN・Cコード・NDC・整理番号を登録できます。検索バーで絞り込み、各行の「編集」ボタンでインライン編集が可能です。削除時は理由の入力が必須で、すべての操作が操作履歴に記録されます。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8"/>
        <rect x="12" y="12" width="256" height="136" rx="10" fill="#fff" stroke="#E2E1F0" strokeWidth="1.5"/>
        <text x="24" y="32" fontSize="11" fontWeight="700" fill="#534AB7" fontFamily="sans-serif">サジェスト管理</text>
        {/* 検索バー */}
        <rect x="20" y="38" width="240" height="22" rx="5" fill="#F7F7FB" stroke="#E2E1F0" strokeWidth="1"/>
        <text x="32" y="53" fontSize="10" fill="#C0C0D8" fontFamily="sans-serif">タイトル・著者・出版社で検索...</text>
        {/* サジェストカード */}
        {[['こころ', '夏目漱石 · 小説 · 岩波書店'],['坊っちゃん', '夏目漱石 · 小説 · 岩波書店']].map(([title, meta], i) => (
          <g key={i} transform={`translate(0, ${i * 36})`}>
            <rect x="20" y="66" width="240" height="30" rx="6" fill="#F7F7FB" stroke="#E2E1F0" strokeWidth="1"/>
            <text x="30" y="83" fontSize="10" fontWeight="600" fill="#1A1A2E" fontFamily="sans-serif">{title}</text>
            <text x="30" y="93" fontSize="8" fill="#6B6B8A" fontFamily="sans-serif">{meta}</text>
            <rect x="210" y="71" width="22" height="18" rx="4" fill="#F7F7FB" stroke="#E2E1F0" strokeWidth="1"/>
            <text x="221" y="83" textAnchor="middle" fontSize="9" fill="#534AB7" fontFamily="sans-serif">編</text>
            <rect x="234" y="71" width="22" height="18" rx="4" fill="#FFF0F0" stroke="#FEB2B2" strokeWidth="1"/>
            <text x="245" y="83" textAnchor="middle" fontSize="9" fill="#E53E3E" fontFamily="sans-serif">削</text>
          </g>
        ))}
      </svg>
    ),
  },
  {
    icon: <IconHistory size={18} />,
    title: '操作履歴',
    desc: 'ロール変更・BAN操作・サジェスト操作の履歴を確認・巻き戻せます',
    detail: 'ユーザー管理で行ったロール変更・BAN・BAN解除、およびサジェストの追加・編集・削除の操作が時系列で記録されます。ユーザー管理操作は「巻き戻し」ボタンで直前の状態に戻すことができます。巻き戻し操作も新たな履歴として記録されます。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8"/>
        <rect x="12" y="12" width="256" height="136" rx="10" fill="#fff" stroke="#E2E1F0" strokeWidth="1.5"/>
        <text x="24" y="32" fontSize="11" fontWeight="700" fill="#534AB7" fontFamily="sans-serif">操作履歴</text>
        {[
          ['user@ex.com のロールを「一般」→「管理者」に変更', '理由: テスト用', '2026/05/18 12:34'],
          ['banned@ex.com をBAN', '理由: 規約違反', '2026/05/17 09:00'],
        ].map(([desc, reason, date], i) => (
          <g key={i} transform={`translate(0, ${i * 52})`}>
            <rect x="20" y="40" width="240" height="44" rx="6" fill="#F7F7FB" stroke="#E2E1F0" strokeWidth="1"/>
            <text x="30" y="56" fontSize="9" fontWeight="600" fill="#1A1A2E" fontFamily="sans-serif">{desc}</text>
            <text x="30" y="68" fontSize="8" fill="#6B6B8A" fontFamily="sans-serif">{reason}</text>
            <text x="30" y="78" fontSize="8" fill="#A0A0B8" fontFamily="sans-serif">{date}</text>
            <rect x="204" y="52" width="48" height="20" rx="4" fill="#EEEDfA" stroke="#534AB7" strokeWidth="1"/>
            <text x="228" y="65" textAnchor="middle" fontSize="9" fill="#534AB7" fontFamily="sans-serif">巻き戻し</text>
          </g>
        ))}
      </svg>
    ),
  },
]

interface PendingAction {
  message: string
  confirmLabel: string
  danger: boolean
  onConfirm: (reason: string) => Promise<void>
}

export default function AdminTab() {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [actions, setActions] = useState<AdminAction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'users' | 'stats' | 'history' | 'suggests'>('users')
  const [showHelp, setShowHelp] = useState(false)
  const [suggestBooks, setSuggestBooks] = useState<SuggestBookDB[]>([])
  const [suggestForm, setSuggestForm] = useState({ title: '', author: '', genre: 'その他', publisher: '', totalPages: '', isbn: '', ccode: '', catalogNumber: '', ndc: '' })
  const [suggestAdding, setSuggestAdding] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [seedProgress, setSeedProgress] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', author: '', genre: 'その他', publisher: '', totalPages: '', isbn: '', ccode: '', catalogNumber: '', ndc: '' })
  const [suggestSearch, setSuggestSearch] = useState('')
  const [suggestAddErrors, setSuggestAddErrors] = useState<FieldErrors>({})
  const [suggestEditErrors, setSuggestEditErrors] = useState<FieldErrors>({})
  const [pending, setPending] = useState<PendingAction | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [p, b, s, a, sb] = await Promise.all([getAllProfiles(), getAllBooksAdmin(), getAllSessionsAdmin(), getAdminActions(), getSuggestBooks()])
      setProfiles(p)
      setBooks(b)
      setSessions(s)
      setActions(a)
      setSuggestBooks(sb)
      setAdminBooksCache(sb)
    } finally {
      setLoading(false)
    }
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

  const handleSeedSuggests = async () => {
    setSeeding(true)
    setSeedProgress('投入中...')
    let count = 0
    for (const book of SUGGEST_BOOKS) {
      await addSuggestBook({
        title: book.title,
        author: book.author,
        genre: book.genre,
        publisher: book.publisher,
        totalPages: book.totalPages,
      })
      count++
      setSeedProgress(`${count} / ${SUGGEST_BOOKS.length} 件処理中...`)
    }
    const sb = await getSuggestBooks()
    setSuggestBooks(sb)
    setAdminBooksCache(sb)
    setSeedProgress(null)
    setSeeding(false)
  }

  const handleAddSuggest = async () => {
    if (!suggestForm.title.trim() || !suggestForm.author.trim() || !suggestForm.publisher.trim()) return
    const errs = validateBookFields(suggestForm)
    setSuggestAddErrors(errs)
    if (hasErrors(errs)) return
    setSuggestAdding(true)
    const newTitle = suggestForm.title.trim()
    await addSuggestBook({
      title: newTitle,
      author: suggestForm.author.trim(),
      genre: suggestForm.genre,
      publisher: suggestForm.publisher.trim(),
      totalPages: Number(suggestForm.totalPages) || 0,
      isbn: suggestForm.isbn.trim() || undefined,
      ccode: suggestForm.ccode.trim() || undefined,
      catalogNumber: suggestForm.catalogNumber.trim() || undefined,
      ndc: suggestForm.ndc.trim() || undefined,
    })
    await logAdminAction(user?.id ?? '', 'suggest_add', '', newTitle, '')
    const sb = await getSuggestBooks()
    setSuggestBooks(sb)
    setAdminBooksCache(sb)
    setActions(prev => [{
      id: crypto.randomUUID(),
      adminId: user?.id ?? '',
      targetUserId: user?.id ?? '',
      actionType: 'suggest_add',
      previousValue: '',
      newValue: newTitle,
      reason: '',
      createdAt: new Date().toISOString(),
    }, ...prev])
    setSuggestForm({ title: '', author: '', genre: 'その他', publisher: '', totalPages: '', isbn: '', ccode: '', catalogNumber: '', ndc: '' })
    setSuggestAddErrors({})
    setSuggestAdding(false)
  }

  const handleEditStart = (sb: SuggestBookDB) => {
    setEditingId(sb.id)
    setEditForm({ title: sb.title, author: sb.author, genre: sb.genre, publisher: sb.publisher, totalPages: String(sb.totalPages || ''), isbn: sb.isbn ?? '', ccode: sb.ccode ?? '', catalogNumber: sb.catalogNumber ?? '', ndc: sb.ndc ?? '' })
  }

  const handleEditSave = async (id: string) => {
    const errs = validateBookFields(editForm)
    setSuggestEditErrors(errs)
    if (hasErrors(errs)) return
    const oldBook = suggestBooks.find(b => b.id === id)
    const oldTitle = oldBook?.title ?? ''
    const newTitle = editForm.title.trim()
    await updateSuggestBook({
      id,
      title: newTitle,
      author: editForm.author.trim(),
      genre: editForm.genre,
      publisher: editForm.publisher.trim(),
      totalPages: Number(editForm.totalPages) || 0,
      isbn: editForm.isbn.trim() || undefined,
      ccode: editForm.ccode.trim() || undefined,
      catalogNumber: editForm.catalogNumber.trim() || undefined,
      ndc: editForm.ndc.trim() || undefined,
    })
    await logAdminAction(user?.id ?? '', 'suggest_edit', oldTitle, newTitle, '')
    setEditingId(null)
    setSuggestEditErrors({})
    const sb = await getSuggestBooks()
    setSuggestBooks(sb)
    setAdminBooksCache(sb)
    setActions(prev => [{
      id: crypto.randomUUID(),
      adminId: user?.id ?? '',
      targetUserId: user?.id ?? '',
      actionType: 'suggest_edit',
      previousValue: oldTitle,
      newValue: newTitle,
      reason: '',
      createdAt: new Date().toISOString(),
    }, ...prev])
  }

  const handleDeleteSuggest = (id: string) => {
    const book = suggestBooks.find(b => b.id === id)
    const title = book?.title ?? ''
    confirm({
      message: `サジェスト「${title}」を削除しますか？`,
      confirmLabel: '削除する',
      danger: true,
      onConfirm: async (reason) => {
        await deleteSuggestBook(id)
        await logAdminAction(user?.id ?? '', 'suggest_delete', title, '', reason)
        const sb = await getSuggestBooks()
        setSuggestBooks(sb)
        setAdminBooksCache(sb)
        setActions(prev => [{
          id: crypto.randomUUID(),
          adminId: user?.id ?? '',
          targetUserId: user?.id ?? '',
          actionType: 'suggest_delete',
          previousValue: title,
          newValue: '',
          reason,
          createdAt: new Date().toISOString(),
        }, ...prev])
      },
    })
  }

  const totalSessions = sessions.length
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0)
  const totalBooks = books.length
  const doneBooks = books.filter(b => b.status === 'done').length

  const actionLabel = (a: AdminAction) => {
    if (a.actionType === 'suggest_add') return `サジェスト「${a.newValue}」を追加`
    if (a.actionType === 'suggest_edit') return `サジェスト「${a.previousValue}」→「${a.newValue}」に編集`
    if (a.actionType === 'suggest_delete') return `サジェスト「${a.previousValue}」を削除`
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
        <div className="admin-header-actions">
          <button className="help-btn" onClick={() => setShowHelp(true)}>
            <IconQuestionMark size={15} />
            使い方
          </button>
          <button className="admin-refresh-btn" onClick={load} title="更新">
            <IconRefresh size={16} />
          </button>
        </div>
      </div>

      <div className="admin-nav">
        <button className={`admin-nav-btn${activeSection === 'users' ? ' active' : ''}`} onClick={() => setActiveSection('users')}>
          <IconUser size={16} /> ユーザー管理
        </button>
        <button className={`admin-nav-btn${activeSection === 'stats' ? ' active' : ''}`} onClick={() => setActiveSection('stats')}>
          <IconChartBar size={16} /> 全体統計
        </button>
        <button className={`admin-nav-btn${activeSection === 'suggests' ? ' active' : ''}`} onClick={() => setActiveSection('suggests')}>
          <IconBookmark size={16} /> サジェスト
        </button>
        <button className={`admin-nav-btn${activeSection === 'history' ? ' active' : ''}`} onClick={() => setActiveSection('history')}>
          <IconHistory size={16} /> 操作履歴
          {actions.length > 0 && <span className="admin-history-badge">{actions.length}</span>}
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
              placeholder="出版社 *"
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
            <div style={{ display: 'contents' }}>
              <input className={`admin-suggest-input${suggestAddErrors.isbn ? ' field-error' : ''}`} placeholder="ISBN" value={suggestForm.isbn} onChange={e => { setSuggestForm(f => ({ ...f, isbn: e.target.value })); setSuggestAddErrors(p => ({ ...p, isbn: undefined })) }} />
              {suggestAddErrors.isbn && <span className="field-error-msg admin-suggest-error">{suggestAddErrors.isbn}</span>}
            </div>
            <div style={{ display: 'contents' }}>
              <input className={`admin-suggest-input${suggestAddErrors.ccode ? ' field-error' : ''}`} placeholder="Cコード（例：0093）" value={suggestForm.ccode} onChange={e => { setSuggestForm(f => ({ ...f, ccode: formatCcode(e.target.value) })); setSuggestAddErrors(p => ({ ...p, ccode: undefined })) }} />
              {suggestAddErrors.ccode && <span className="field-error-msg admin-suggest-error">{suggestAddErrors.ccode}</span>}
            </div>
            <div style={{ display: 'contents' }}>
              <input className={`admin-suggest-input${suggestAddErrors.catalogNumber ? ' field-error' : ''}`} placeholder="整理番号" value={suggestForm.catalogNumber} onChange={e => { setSuggestForm(f => ({ ...f, catalogNumber: e.target.value })); setSuggestAddErrors(p => ({ ...p, catalogNumber: undefined })) }} />
              {suggestAddErrors.catalogNumber && <span className="field-error-msg admin-suggest-error">{suggestAddErrors.catalogNumber}</span>}
            </div>
            <div style={{ display: 'contents' }}>
              <input className={`admin-suggest-input${suggestAddErrors.ndc ? ' field-error' : ''}`} placeholder="NDC" value={suggestForm.ndc} onChange={e => { setSuggestForm(f => ({ ...f, ndc: e.target.value })); setSuggestAddErrors(p => ({ ...p, ndc: undefined })) }} />
              {suggestAddErrors.ndc && <span className="field-error-msg admin-suggest-error">{suggestAddErrors.ndc}</span>}
            </div>
            <button
              className="admin-suggest-add-btn"
              onClick={handleAddSuggest}
              disabled={suggestAdding || !suggestForm.title.trim() || !suggestForm.author.trim() || !suggestForm.publisher.trim()}
            >
              <IconPlus size={15} /> 追加
            </button>
          </div>
          {suggestBooks.length < SUGGEST_BOOKS.length && (
            <div className="admin-seed-row">
              <span className="admin-seed-hint">初期サジェスト（{SUGGEST_BOOKS.length}件）がDBに未登録です</span>
              <button className="admin-suggest-add-btn" onClick={handleSeedSuggests} disabled={seeding}>
                <IconPlus size={15} /> 初期データを投入
              </button>
              {seedProgress && <span className="admin-seed-progress">{seedProgress}</span>}
            </div>
          )}
          <div className="bookshelf-search-wrap" style={{ margin: '8px 0' }}>
            <IconSearch size={15} className="bookshelf-search-icon" />
            <input
              className="bookshelf-search-input"
              value={suggestSearch}
              onChange={e => setSuggestSearch(e.target.value)}
              placeholder="タイトル・著者・出版社で検索..."
              autoComplete="off"
            />
            {suggestSearch && (
              <button className="bookshelf-search-clear" onClick={() => setSuggestSearch('')} title="クリア">
                <IconX size={13} />
              </button>
            )}
          </div>
          {(() => {
            const q = suggestSearch.trim().toLowerCase()
            const filtered = q ? suggestBooks.filter(sb =>
              sb.title.toLowerCase().includes(q) ||
              sb.author.toLowerCase().includes(q) ||
              sb.publisher.toLowerCase().includes(q) ||
              sb.genre.toLowerCase().includes(q) ||
              (sb.isbn ?? '').toLowerCase().includes(q) ||
              (sb.ccode ?? '').toLowerCase().includes(q) ||
              (sb.catalogNumber ?? '').toLowerCase().includes(q) ||
              (sb.ndc ?? '').toLowerCase().includes(q)
            ) : suggestBooks
            if (suggestBooks.length === 0) return <p className="admin-empty">サジェストはありません</p>
            if (filtered.length === 0) return <p className="admin-empty">「{suggestSearch}」に一致するサジェストが見つかりません</p>
            return (
              <>
                <p className="admin-count">{filtered.length} / {suggestBooks.length} 件</p>
                <div className="admin-user-list">
                  {filtered.map(sb => editingId === sb.id ? (
                <div key={sb.id} className="admin-user-card admin-suggest-edit-card">
                  <div className="admin-suggest-edit-fields">
                    <input className="admin-suggest-input" placeholder="タイトル *" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
                    <input className="admin-suggest-input" placeholder="著者 *" value={editForm.author} onChange={e => setEditForm(f => ({ ...f, author: e.target.value }))} />
                    <select className="admin-role-select" value={editForm.genre} onChange={e => setEditForm(f => ({ ...f, genre: e.target.value }))}>
                      {['小説', 'ビジネス', '自己啓発', '技術', '歴史', 'その他'].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <input className="admin-suggest-input" placeholder="出版社" value={editForm.publisher} onChange={e => setEditForm(f => ({ ...f, publisher: e.target.value }))} />
                    <input className="admin-suggest-input admin-suggest-pages" placeholder="ページ数" type="number" min="0" value={editForm.totalPages} onChange={e => setEditForm(f => ({ ...f, totalPages: e.target.value }))} />
                    <div style={{ display: 'contents' }}>
                      <input className={`admin-suggest-input${suggestEditErrors.isbn ? ' field-error' : ''}`} placeholder="ISBN" value={editForm.isbn} onChange={e => { setEditForm(f => ({ ...f, isbn: e.target.value })); setSuggestEditErrors(p => ({ ...p, isbn: undefined })) }} />
                      {suggestEditErrors.isbn && <span className="field-error-msg admin-suggest-error">{suggestEditErrors.isbn}</span>}
                    </div>
                    <div style={{ display: 'contents' }}>
                      <input className={`admin-suggest-input${suggestEditErrors.ccode ? ' field-error' : ''}`} placeholder="Cコード（例：0093）" value={editForm.ccode} onChange={e => { setEditForm(f => ({ ...f, ccode: formatCcode(e.target.value) })); setSuggestEditErrors(p => ({ ...p, ccode: undefined })) }} />
                      {suggestEditErrors.ccode && <span className="field-error-msg admin-suggest-error">{suggestEditErrors.ccode}</span>}
                    </div>
                    <div style={{ display: 'contents' }}>
                      <input className={`admin-suggest-input${suggestEditErrors.catalogNumber ? ' field-error' : ''}`} placeholder="整理番号" value={editForm.catalogNumber} onChange={e => { setEditForm(f => ({ ...f, catalogNumber: e.target.value })); setSuggestEditErrors(p => ({ ...p, catalogNumber: undefined })) }} />
                      {suggestEditErrors.catalogNumber && <span className="field-error-msg admin-suggest-error">{suggestEditErrors.catalogNumber}</span>}
                    </div>
                    <div style={{ display: 'contents' }}>
                      <input className={`admin-suggest-input${suggestEditErrors.ndc ? ' field-error' : ''}`} placeholder="NDC" value={editForm.ndc} onChange={e => { setEditForm(f => ({ ...f, ndc: e.target.value })); setSuggestEditErrors(p => ({ ...p, ndc: undefined })) }} />
                      {suggestEditErrors.ndc && <span className="field-error-msg admin-suggest-error">{suggestEditErrors.ndc}</span>}
                    </div>
                  </div>
                  <div className="admin-suggest-edit-actions">
                    <button className="admin-suggest-add-btn" onClick={() => handleEditSave(sb.id)} disabled={!editForm.title.trim() || !editForm.author.trim() || !editForm.publisher.trim()}><IconDeviceFloppy size={15} /> 保存</button>
                    <button className="admin-ban-btn" onClick={() => setEditingId(null)}><IconX size={15} /> キャンセル</button>
                  </div>
                </div>
              ) : (
                <div key={sb.id} className="admin-user-card">
                  <div className="admin-user-info">
                    <span className="admin-user-email">{sb.title}</span>
                    <span className="admin-user-meta">{sb.author.replace(/[・/]\s*/g, ', ')} / {sb.genre}{sb.publisher ? ` / ${sb.publisher}` : ''}{sb.totalPages ? ` / ${sb.totalPages}p` : ''}</span>
                  </div>
                  <div className="admin-user-actions">
                    <button className="admin-edit-btn" onClick={() => handleEditStart(sb)} title="編集"><IconPencil size={15} /> 編集</button>
                    <button className="admin-delete-btn" onClick={() => handleDeleteSuggest(sb.id)} title="削除"><IconTrash size={15} /> 削除</button>
                  </div>
                </div>
              ))}
                </div>
              </>
            )
          })()}
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
      {showHelp && <HelpModal title="管理者パネルの使い方" items={ADMIN_HELP} onClose={() => setShowHelp(false)} />}
    </div>
  )
}
