import { useState, useRef } from 'react'
import {
  IconPlus,
  IconTrash,
  IconBook,
  IconBookmark,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconSortAscending,
  IconSortDescending,
  IconQuestionMark,
  IconPencil,
  IconX,
  IconDeviceFloppy,
  IconSearch,
  IconSettings,
  IconRuler,
  IconTags,
  IconArrowsSort,
} from '@tabler/icons-react'
import type { Book, BookStatus, Genre } from '../types'
import { searchSuggestions, addUserSuggestion } from '../suggestBooks'
import HelpModal from './HelpModal'

const BOOKSHELF_HELP = [
  {
    icon: <IconPlus size={18} />,
    title: '本の追加',
    desc: 'タイトルと著者名を入力して「＋」ボタンで登録。Enterキーでも追加できます',
    detail: 'タイトルと著者名を入力して「＋」ボタン（またはEnterキー）で本を登録します。有名な作品はタイトル入力中に候補が自動表示されます。選択すると著者・ジャンルが自動入力されます。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8" />
        {/* タイトル入力フィールド */}
        <rect x="30" y="40" width="140" height="32" rx="8" fill="#FFFFFF" stroke="#E2E1F0" strokeWidth="1.5" />
        <text x="44" y="61" fontSize="12" fill="#6B6B8A" fontFamily="sans-serif">タイトル *</text>
        {/* 著者フィールド */}
        <rect x="30" y="82" width="140" height="32" rx="8" fill="#FFFFFF" stroke="#E2E1F0" strokeWidth="1.5" />
        <text x="44" y="103" fontSize="12" fill="#6B6B8A" fontFamily="sans-serif">著者名 *</text>
        {/* ＋ボタン */}
        <rect x="182" y="40" width="60" height="74" rx="8" fill="#534AB7" />
        <text x="212" y="83" textAnchor="middle" fontSize="26" fontWeight="300" fill="#FFFFFF" fontFamily="sans-serif">＋</text>
        {/* オートコンプリート候補 */}
        <rect x="30" y="122" width="140" height="22" rx="4" fill="#EEEDfA" />
        <text x="44" y="137" fontSize="10" fill="#534AB7" fontFamily="sans-serif">▶ 吾輩は猫である — 夏目漱石</text>
      </svg>
    ),
  },
  {
    icon: <IconSettings size={18} />,
    title: '詳細設定',
    desc: '「詳細設定」を開くと出版社・ページ数・ジャンル・初期ステータスを設定できます',
    detail: '「詳細設定」を開くと出版社・総ページ数・ジャンル・初期ステータスを設定できます。総ページ数を設定するとプログレスバーと進捗スライダーが表示され、読書の進み具合を記録できます。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8" />
        {/* 詳細パネル */}
        <rect x="20" y="20" width="240" height="120" rx="10" fill="#FFFFFF" stroke="#E2E1F0" strokeWidth="1.5" />
        {/* フィールド：出版社 */}
        <text x="34" y="44" fontSize="10" fill="#6B6B8A" fontFamily="sans-serif">出版社</text>
        <rect x="34" y="48" width="90" height="22" rx="5" fill="#F7F7FB" stroke="#E2E1F0" strokeWidth="1" />
        <text x="44" y="63" fontSize="10" fill="#1A1A2E" fontFamily="sans-serif">岩波書店</text>
        {/* フィールド：総ページ数 */}
        <text x="136" y="44" fontSize="10" fill="#6B6B8A" fontFamily="sans-serif">総ページ数</text>
        <rect x="136" y="48" width="106" height="22" rx="5" fill="#F7F7FB" stroke="#E2E1F0" strokeWidth="1" />
        <text x="146" y="63" fontSize="10" fill="#1A1A2E" fontFamily="sans-serif">320</text>
        {/* フィールド：ジャンル */}
        <text x="34" y="88" fontSize="10" fill="#6B6B8A" fontFamily="sans-serif">ジャンル</text>
        <rect x="34" y="92" width="90" height="22" rx="5" fill="#F7F7FB" stroke="#E2E1F0" strokeWidth="1" />
        <text x="44" y="107" fontSize="10" fill="#1A1A2E" fontFamily="sans-serif">小説  ▾</text>
        {/* フィールド：ステータス */}
        <text x="136" y="88" fontSize="10" fill="#6B6B8A" fontFamily="sans-serif">ステータス</text>
        <rect x="136" y="92" width="106" height="22" rx="5" fill="#EEEDfA" stroke="#534AB7" strokeWidth="1" />
        <text x="146" y="107" fontSize="10" fill="#534AB7" fontFamily="sans-serif">読みたい</text>
        {/* 詳細設定トグル */}
        <rect x="34" y="122" width="120" height="10" rx="5" fill="#EEEDfA" />
        <text x="44" y="131" fontSize="9" fill="#534AB7" fontFamily="sans-serif">▲ 詳細設定（折りたたむ）</text>
      </svg>
    ),
  },
  {
    icon: <IconTags size={18} />,
    title: 'ステータス管理',
    desc: '読みたい・読書中・読了の3段階で本の状態を管理できます',
    detail: '各本には「読みたい」「読書中」「読了」の3つのステータスがあります。本カードのバッジをクリックするか、ドロップダウンから変更できます。タイマーで使用できるのは「読みたい」と「読書中」の本のみです。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8" />
        {/* バッジ：読みたい */}
        <rect x="20" y="55" width="74" height="50" rx="10" fill="#FFFFFF" stroke="#E2E1F0" strokeWidth="1.5" />
        <text x="57" y="78" textAnchor="middle" fontSize="9" fill="#6B6B8A" fontFamily="sans-serif">🔖</text>
        <text x="57" y="93" textAnchor="middle" fontSize="11" fontWeight="600" fill="#6B6B8A" fontFamily="sans-serif">読みたい</text>
        <text x="57" y="106" textAnchor="middle" fontSize="9" fill="#6B6B8A" fontFamily="sans-serif">積読・予定</text>
        {/* バッジ：読書中（アクティブ） */}
        <rect x="103" y="45" width="74" height="70" rx="10" fill="#EEEDfA" stroke="#534AB7" strokeWidth="2" />
        <text x="140" y="72" textAnchor="middle" fontSize="9" fill="#534AB7" fontFamily="sans-serif">📖</text>
        <text x="140" y="88" textAnchor="middle" fontSize="12" fontWeight="700" fill="#534AB7" fontFamily="sans-serif">読書中</text>
        <text x="140" y="102" textAnchor="middle" fontSize="9" fill="#534AB7" fontFamily="sans-serif">現在読んでいる</text>
        {/* バッジ：読了 */}
        <rect x="186" y="55" width="74" height="50" rx="10" fill="#FFFFFF" stroke="#E2E1F0" strokeWidth="1.5" />
        <text x="223" y="78" textAnchor="middle" fontSize="9" fill="#6B6B8A" fontFamily="sans-serif">✓</text>
        <text x="223" y="93" textAnchor="middle" fontSize="11" fontWeight="600" fill="#6B6B8A" fontFamily="sans-serif">読了</text>
        <text x="223" y="106" textAnchor="middle" fontSize="9" fill="#6B6B8A" fontFamily="sans-serif">読み終えた</text>
      </svg>
    ),
  },
  {
    icon: <IconRuler size={18} />,
    title: '読書進捗の記録',
    desc: 'ページ数を設定した本はスライダーや数値クリックで現在ページを記録できます',
    detail: '総ページ数を設定した本では現在ページを記録できます。ページ数の数値をクリックすると直接入力できます。スライダーで大まかに調整することも可能です。進捗はプログレスバーで視覚的に確認できます。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8" />
        {/* ヘッダー */}
        <text x="34" y="42" fontSize="11" fill="#6B6B8A" fontFamily="sans-serif">進捗</text>
        <text x="210" y="42" fontSize="11" fontWeight="700" fill="#534AB7" fontFamily="sans-serif">160 / 320p</text>
        {/* プログレスバー */}
        <rect x="34" y="52" width="212" height="16" rx="8" fill="#E2E1F0" />
        <rect x="34" y="52" width="106" height="16" rx="8" fill="#534AB7" />
        <text x="87" y="64" textAnchor="middle" fontSize="10" fontWeight="600" fill="#FFFFFF" fontFamily="sans-serif">50%</text>
        {/* スライダー */}
        <rect x="34" y="80" width="212" height="4" rx="2" fill="#E2E1F0" />
        <rect x="34" y="80" width="106" height="4" rx="2" fill="#534AB7" />
        <circle cx="140" cy="82" r="9" fill="#534AB7" stroke="#FFFFFF" strokeWidth="2" />
        {/* ページ入力説明 */}
        <rect x="90" y="106" width="100" height="28" rx="8" fill="#EEEDfA" stroke="#534AB7" strokeWidth="1.5" />
        <text x="140" y="117" textAnchor="middle" fontSize="9" fill="#6B6B8A" fontFamily="sans-serif">クリックで直接入力</text>
        <text x="140" y="129" textAnchor="middle" fontSize="12" fontWeight="700" fill="#534AB7" fontFamily="sans-serif">160</text>
      </svg>
    ),
  },
  {
    icon: <IconArrowsSort size={18} />,
    title: '並び替え',
    desc: '登録日・タイトル・セッション数・進捗で昇順/降順に並び替えられます',
    detail: '本棚上部の並び替えボタンで登録日・タイトル・セッション数・進捗（ページ）の4種類のキーで並び替えられます。同じキーを再度クリックすると昇順・降順が切り替わります。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8" />
        {/* ソートセレクト */}
        <rect x="30" y="30" width="140" height="30" rx="8" fill="#FFFFFF" stroke="#E2E1F0" strokeWidth="1.5" />
        <text x="44" y="50" fontSize="12" fill="#1A1A2E" fontFamily="sans-serif">登録日  ▾</text>
        {/* 昇順/降順ボタン */}
        <rect x="180" y="30" width="68" height="30" rx="8" fill="#EEEDfA" stroke="#534AB7" strokeWidth="1.5" />
        <text x="214" y="50" textAnchor="middle" fontSize="12" fill="#534AB7" fontFamily="sans-serif">↑ 降順</text>
        {/* 4つのオプション一覧 */}
        {[['登録日', true], ['タイトル', false], ['セッション数', false], ['進捗', false]].map(([label, active], i) => (
          <g key={i}>
            <rect x="30" y={76 + i * 20} width="218" height="18" rx="4" fill={active ? '#EEEDfA' : '#FFFFFF'} stroke="#E2E1F0" strokeWidth="0.5" />
            <text x="44" y={89 + i * 20} fontSize="10" fill={active ? '#534AB7' : '#6B6B8A'} fontFamily="sans-serif" fontWeight={active ? '600' : '400'}>{label as string}</text>
            {active && <text x="234" y={89 + i * 20} textAnchor="end" fontSize="10" fill="#534AB7" fontFamily="sans-serif">✓</text>}
          </g>
        ))}
      </svg>
    ),
  },
]

const GENRES: Genre[] = ['小説', 'ビジネス', '自己啓発', '技術', '歴史', 'その他']
const STATUS_OPTIONS: { value: BookStatus; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'want',    label: '読みたい', desc: '積読・予定',    icon: <IconBookmark size={18} /> },
  { value: 'reading', label: '読書中',   desc: '現在読んでいる', icon: <IconBook size={18} /> },
  { value: 'done',    label: '読了',     desc: '読み終えた',    icon: <IconCheck size={18} /> },
]
const STATUS_LABELS: Record<BookStatus, string> = {
  want: '読みたい',
  reading: '読書中',
  done: '読了',
}

interface Props {
  books: Book[]
  onAdd: (book: Book) => void
  onUpdate: (book: Book) => void
  onDelete: (id: string) => void
}

const emptyDetails = {
  author: '',
  publisher: '',
  totalPages: 0,
  genre: 'その他' as Genre,
  status: 'want' as BookStatus,
  isbn: '',
  ccode: '',
  catalogNumber: '',
  ndc: '',
}

type SortKey = 'created' | 'title' | 'sessions' | 'progress'
type SortDir = 'asc' | 'desc'

const SORT_LABELS: Record<SortKey, string> = {
  created:  '登録日',
  title:    'タイトル',
  sessions: 'セッション数',
  progress: '進捗',
}

function sortBooks(books: Book[], key: SortKey, dir: SortDir): Book[] {
  const d = dir === 'asc' ? 1 : -1
  return [...books].sort((a, b) => {
    switch (key) {
      case 'created':  return d * a.createdAt.localeCompare(b.createdAt)
      case 'title':    return d * a.title.localeCompare(b.title, 'ja')
      case 'sessions': return d * (a.sessions - b.sessions)
      case 'progress': {
        const ap = a.totalPages > 0 ? a.currentPage / a.totalPages : 0
        const bp = b.totalPages > 0 ? b.currentPage / b.totalPages : 0
        return d * (ap - bp)
      }
    }
  })
}

type EditForm = { title: string; author: string; publisher: string; totalPages: number; genre: Genre; isbn: string; ccode: string; catalogNumber: string; ndc: string }

function StatusPicker({ value, onChange }: { value: BookStatus; onChange: (s: BookStatus) => void }) {
  return (
    <div className="status-picker">
      {STATUS_OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`status-pick-btn${value === opt.value ? ' active' : ''} ${opt.value}`}
          onClick={() => onChange(opt.value)}
        >
          <span className="status-pick-icon">{opt.icon}</span>
          <span className="status-pick-label">{opt.label}</span>
          <span className="status-pick-desc">{opt.desc}</span>
        </button>
      ))}
    </div>
  )
}

export default function BookshelfTab({ books, onAdd, onUpdate, onDelete }: Props) {
  const [showHelp, setShowHelp] = useState(false)
  const [editingBookId, setEditingBookId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ title: '', author: '', publisher: '', totalPages: 0, genre: 'その他', isbn: '', ccode: '', catalogNumber: '', ndc: '' })
  const [quickTitle, setQuickTitle] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [details, setDetails] = useState(emptyDetails)
  const [sortKey, setSortKey] = useState<SortKey>('created')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filterStatus, setFilterStatus] = useState<BookStatus | 'all'>('all')
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [pageInput, setPageInput] = useState('')
  const [suggestions, setSuggestions] = useState<ReturnType<typeof searchSuggestions>>([])
  const [activeSuggestIdx, setActiveSuggestIdx] = useState(-1)
  const detailsFromSuggestion = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleTitleChange = (value: string) => {
    if (detailsFromSuggestion.current) {
      setDetails(emptyDetails)
      setShowDetails(false)
      detailsFromSuggestion.current = false
    }
    setQuickTitle(value)
    setSuggestions(searchSuggestions(value))
    setActiveSuggestIdx(-1)
  }

  const applySuggestion = (idx: number) => {
    const s = suggestions[idx]
    if (!s) return
    setQuickTitle(s.title)
    setDetails(prev => ({ ...prev, author: s.author, publisher: s.publisher ?? '', genre: s.genre as Genre, totalPages: s.totalPages ?? prev.totalPages }))
    setShowDetails(true)
    detailsFromSuggestion.current = true
    setSuggestions([])
    setActiveSuggestIdx(-1)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) {
      if (e.key === 'Enter') handleSubmit()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggestIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggestIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeSuggestIdx >= 0) {
        applySuggestion(activeSuggestIdx)
      } else {
        setSuggestions([])
        handleSubmit()
      }
    } else if (e.key === 'Escape') {
      setSuggestions([])
    }
  }

  const handleSubmit = () => {
    if (!quickTitle.trim()) return
    const book: Book = {
      id: crypto.randomUUID(),
      title: quickTitle.trim(),
      ...details,
      currentPage: 0,
      sessions: 0,
      createdAt: new Date().toISOString(),
    }
    if (book.publisher && book.totalPages > 0) {
      addUserSuggestion({ title: book.title, author: book.author, genre: book.genre, publisher: book.publisher, totalPages: book.totalPages })
    }
    onAdd(book)
    setQuickTitle('')
    setDetails(emptyDetails)
    setShowDetails(false)
    setSuggestions([])
    inputRef.current?.focus()
  }

  const autoStatus = (page: number, total: number): Book['status'] => {
    if (page >= total) return 'done'
    if (page > 0) return 'reading'
    return 'want'
  }

  const handlePageSlider = (book: Book, value: number) => {
    onUpdate({ ...book, currentPage: value, status: autoStatus(value, book.totalPages) })
  }

  const handlePageInput = (book: Book) => {
    const raw = parseInt(pageInput, 10)
    if (!isNaN(raw) && raw >= 0) {
      const v = Math.min(raw, book.totalPages)
      onUpdate({ ...book, currentPage: v, status: autoStatus(v, book.totalPages) })
    }
    setEditingPageId(null)
  }

  const startEdit = (book: Book) => {
    setEditingBookId(book.id)
    setEditForm({ title: book.title, author: book.author, publisher: book.publisher ?? '', totalPages: book.totalPages, genre: book.genre, isbn: book.isbn ?? '', ccode: book.ccode ?? '', catalogNumber: book.catalogNumber ?? '', ndc: book.ndc ?? '' })
  }

  const saveEdit = (book: Book) => {
    if (!editForm.title.trim() || !editForm.author.trim()) return
    onUpdate({ ...book, ...editForm, title: editForm.title.trim(), author: editForm.author.trim(), publisher: editForm.publisher.trim() })
    setEditingBookId(null)
  }

  const statusIcon = (status: BookStatus) => {
    if (status === 'want') return <IconBookmark size={16} />
    if (status === 'reading') return <IconBook size={16} />
    return <IconCheck size={16} />
  }

  return (
    <div className="bookshelf-tab">
      {showHelp && <HelpModal title="本棚の使い方" items={BOOKSHELF_HELP} onClose={() => setShowHelp(false)} />}
      <div className="tab-help-row">
        <button className="help-btn" onClick={() => setShowHelp(true)}>
          <IconQuestionMark size={15} />
          使い方
        </button>
      </div>
      <div className="quick-add-card">
        <div className="quick-add-row">
          <div className="inputs-wrap">
            <div className="suggest-wrap">
              <input
                ref={inputRef}
                className="quick-add-input"
                value={quickTitle}
                onChange={e => handleTitleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                placeholder="タイトル *"
                autoFocus
                autoComplete="off"
              />
              {suggestions.length > 0 && (
                <ul className="suggest-list">
                  {suggestions.map((s, i) => (
                    <li
                      key={i}
                      className={`suggest-item${i === activeSuggestIdx ? ' active' : ''}`}
                      onMouseDown={() => applySuggestion(i)}
                    >
                      <span className="suggest-title">{s.title}</span>
                      <span className="suggest-meta">{s.author}{s.publisher ? ` / ${s.publisher}` : ''}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <input
              className="quick-add-input author-input"
              value={details.author}
              onChange={e => setDetails({ ...details, author: e.target.value })}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
              placeholder="著者名 *"
              autoComplete="off"
            />
          </div>
          <button className="btn-primary quick-add-btn" onClick={handleSubmit} disabled={!quickTitle.trim() || !details.author.trim()}>
            <IconPlus size={18} />
          </button>
        </div>
        <button
          className="details-toggle"
          onClick={() => setShowDetails(v => !v)}
        >
          {showDetails ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
          詳細設定（出版社・ページ数・ジャンル）
        </button>
        {showDetails && (
          <div className="details-grid">
            <div className="form-field">
              <label>出版社</label>
              <input
                value={details.publisher}
                onChange={e => setDetails({ ...details, publisher: e.target.value })}
                placeholder="出版社名"
              />
            </div>
            <div className="form-field">
              <label>総ページ数</label>
              <input
                type="number" min={0}
                value={details.totalPages || ''}
                onChange={e => setDetails({ ...details, totalPages: Number(e.target.value) })}
              />
            </div>
            <div className="form-field">
              <label>ジャンル</label>
              <select value={details.genre} onChange={e => setDetails({ ...details, genre: e.target.value as Genre })}>
                {GENRES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-field form-field-full">
              <label>ステータス</label>
              <StatusPicker value={details.status} onChange={s => setDetails({ ...details, status: s })} />
            </div>
            <div className="form-field">
              <label>ISBN</label>
              <input
                value={details.isbn}
                onChange={e => setDetails({ ...details, isbn: e.target.value })}
                placeholder="978-4-..."
              />
            </div>
            <div className="form-field">
              <label>Cコード</label>
              <input
                value={details.ccode}
                onChange={e => setDetails({ ...details, ccode: e.target.value })}
                placeholder="C0193"
              />
            </div>
            <div className="form-field">
              <label>NDC</label>
              <input
                value={details.ndc}
                onChange={e => setDetails({ ...details, ndc: e.target.value })}
                placeholder="913.6"
              />
            </div>
            <div className="form-field">
              <label>文庫整理番号</label>
              <input
                value={details.catalogNumber}
                onChange={e => setDetails({ ...details, catalogNumber: e.target.value })}
                placeholder="な-1-1"
              />
            </div>
          </div>
        )}
      </div>

      <div className="sort-filter-row">
        <div className="filter-row">
          {(['all', 'want', 'reading', 'done'] as const).map(s => (
            <button
              key={s}
              className={`filter-btn${s !== 'all' ? ` ${s}` : ''}${filterStatus === s ? ' active' : ''}`}
              onClick={() => setFilterStatus(s)}
            >
              {s === 'all' ? 'すべて' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="sort-row">
          <span className="sort-label">並び替え</span>
          <select
            className="sort-select"
            value={sortKey}
            onChange={e => setSortKey(e.target.value as SortKey)}
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
              <option key={k} value={k}>{SORT_LABELS[k]}</option>
            ))}
          </select>
          <button
            className="sort-dir-btn"
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            title={sortDir === 'asc' ? '昇順' : '降順'}
          >
            {sortDir === 'asc' ? <IconSortAscending size={18} /> : <IconSortDescending size={18} />}
          </button>
        </div>
      </div>

      <div className="book-list">
        {books.length === 0 && (
          <p className="empty-msg">本がまだ登録されていません</p>
        )}
        {sortBooks(filterStatus === 'all' ? books : books.filter(b => b.status === filterStatus), sortKey, sortDir).map(book => {
          const progress = book.totalPages > 0 ? (book.currentPage / book.totalPages) * 100 : 0
          const isEditing = editingBookId === book.id
          return (
            <div key={book.id} className={`book-card${isEditing ? ' editing' : ''}`}>
              <div className="book-card-top">
                <div className="book-info">
                  {isEditing ? (
                    <div className="edit-form">
                      <div className="edit-row">
                        <div className="form-field">
                          <label>タイトル</label>
                          <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} autoFocus />
                        </div>
                        <div className="form-field">
                          <label>著者名</label>
                          <input value={editForm.author} onChange={e => setEditForm(f => ({ ...f, author: e.target.value }))} />
                        </div>
                      </div>
                      <div className="edit-row">
                        <div className="form-field">
                          <label>出版社</label>
                          <input value={editForm.publisher} onChange={e => setEditForm(f => ({ ...f, publisher: e.target.value }))} placeholder="任意" />
                        </div>
                        <div className="form-field">
                          <label>総ページ数</label>
                          <input type="number" min={0} value={editForm.totalPages || ''} onChange={e => setEditForm(f => ({ ...f, totalPages: Number(e.target.value) }))} />
                        </div>
                      </div>
                      <div className="form-field">
                        <label>ジャンル</label>
                        <select value={editForm.genre} onChange={e => setEditForm(f => ({ ...f, genre: e.target.value as Genre }))}>
                          {GENRES.map(g => <option key={g}>{g}</option>)}
                        </select>
                      </div>
                      <div className="edit-row">
                        <div className="form-field">
                          <label>ISBN</label>
                          <input value={editForm.isbn} onChange={e => setEditForm(f => ({ ...f, isbn: e.target.value }))} placeholder="978-4-..." />
                        </div>
                        <div className="form-field">
                          <label>Cコード</label>
                          <input value={editForm.ccode} onChange={e => setEditForm(f => ({ ...f, ccode: e.target.value }))} placeholder="C0193" />
                        </div>
                        <div className="form-field">
                          <label>NDC</label>
                          <input value={editForm.ndc} onChange={e => setEditForm(f => ({ ...f, ndc: e.target.value }))} placeholder="913.6" />
                        </div>
                        <div className="form-field">
                          <label>文庫整理番号</label>
                          <input value={editForm.catalogNumber} onChange={e => setEditForm(f => ({ ...f, catalogNumber: e.target.value }))} placeholder="な-1-1" />
                        </div>
                      </div>
                      <div className="edit-actions">
                        <button className="btn-primary" onClick={() => saveEdit(book)} disabled={!editForm.title.trim() || !editForm.author.trim()}>
                          <IconDeviceFloppy size={15} />保存
                        </button>
                        <button className="btn-ghost" onClick={() => setEditingBookId(null)}>
                          <IconX size={15} />キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className={`status-badge ${book.status}`}>
                        {statusIcon(book.status)}
                        {STATUS_LABELS[book.status]}
                      </span>
                      <h3>{book.title}</h3>
                      {book.author && <p className="author">{book.author}{book.publisher ? ` / ${book.publisher}` : ''}</p>}
                    </>
                  )}
                </div>
                <div className="book-meta">
                  <span className="sessions-count">{book.sessions} セッション</span>
                  <div className="book-actions">
                    {!isEditing && (
                      <button className="btn-icon-ghost" onClick={() => startEdit(book)} title="編集">
                        <IconPencil size={15} />
                      </button>
                    )}
                    <button className="btn-danger-ghost" onClick={() => onDelete(book.id)} title="削除">
                      <IconTrash size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {!isEditing && <span className="genre-tag">{book.genre}</span>}

              {!isEditing && book.totalPages > 0 && (
                <div className="progress-wrap">
                  <div className="progress-header">
                    <span>進捗</span>
                    <span
                      className="page-display"
                      onClick={() => { if (editingPageId !== book.id) { setEditingPageId(book.id); setPageInput(String(book.currentPage)) } }}
                    >
                      {editingPageId === book.id ? (
                        <input
                          className="page-input-inline"
                          type="number" min={0} max={book.totalPages}
                          value={pageInput}
                          onChange={e => setPageInput(e.target.value)}
                          onBlur={() => handlePageInput(book)}
                          onKeyDown={e => e.key === 'Enter' && handlePageInput(book)}
                          autoFocus
                        />
                      ) : (
                        <span className="page-current">{book.currentPage}</span>
                      )}
                      {' / '}{book.totalPages}p
                    </span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                    <span
                      className="progress-bar-label"
                      style={{ color: progress >= 45 ? '#fff' : 'var(--accent)' }}
                    >
                      {Math.round(progress)}%
                    </span>
                    <input
                      type="range" min={0} max={book.totalPages}
                      value={book.currentPage}
                      onChange={e => handlePageSlider(book, Number(e.target.value))}
                      className="progress-slider"
                    />
                  </div>
                </div>
              )}

              {!isEditing && (
                <div className="status-select-row">
                  <StatusPicker value={book.status} onChange={s => onUpdate({ ...book, status: s })} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
