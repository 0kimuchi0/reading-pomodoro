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
  IconSettings,
  IconRuler,
  IconTags,
  IconArrowsSort,
  IconSearch,
} from '@tabler/icons-react'
import type { Book, BookStatus, Genre } from '../types'
import { searchSuggestions, addUserSuggestion } from '../suggestBooks'
import { addSuggestBook } from '../lib/db'
import { useAuth } from '../auth/AuthContext'
import { validateBookFields, hasErrors, formatCcode } from '../lib/validate'
import type { FieldErrors } from '../lib/validate'
import { getReading } from '../lib/japanese'
import { normalize } from '../suggestBooks'
import HelpModal from './HelpModal'

const BOOKSHELF_HELP = [
  {
    icon: <IconPlus size={18} />,
    title: '本の追加',
    desc: 'タイトルと著者名を入力して「＋」ボタンで登録。Enterキーでも追加できます',
    detail: 'タイトルと著者名を入力して「＋」ボタン（またはEnterキー）で本を登録します。有名な作品はタイトル入力中に候補が自動表示されます。選択すると著者・ジャンルが自動入力されます。',
    image: <img src="/help/bookshelf-add.svg" width="280" height="160" alt="" />,
  },
  {
    icon: <IconSettings size={18} />,
    title: '詳細設定',
    desc: '「詳細設定」を開くと出版社・ページ数・ジャンル・ISBN・Cコード・NDC・整理番号なども設定できます',
    detail: '「詳細設定」を開くと出版社・総ページ数・ジャンル・初期ステータスを設定できます。総ページ数を設定するとプログレスバーと進捗スライダーが表示されます。さらにISBN・Cコード・NDC・整理番号などの書誌情報も登録でき、本棚の検索対象にもなります。',
    image: <img src="/help/bookshelf-detail.svg" width="280" height="160" alt="" />,
  },
  {
    icon: <IconTags size={18} />,
    title: 'ステータス管理',
    desc: '読みたい・読書中・読了の3段階で本の状態を管理できます',
    detail: '各本には「読みたい」「読書中」「読了」の3つのステータスがあります。本カードのバッジをクリックするか、ドロップダウンから変更できます。タイマーで使用できるのは「読みたい」と「読書中」の本のみです。',
    image: <img src="/help/bookshelf-status.svg" width="280" height="160" alt="" />,
  },
  {
    icon: <IconRuler size={18} />,
    title: '読書進捗の記録',
    desc: 'ページ数を設定した本はスライダーや数値クリックで現在ページを記録できます',
    detail: '総ページ数を設定した本では現在ページを記録できます。ページ数の数値をクリックすると直接入力できます。スライダーで大まかに調整することも可能です。進捗はプログレスバーで視覚的に確認できます。',
    image: <img src="/help/bookshelf-progress.svg" width="280" height="160" alt="" />,
  },
  {
    icon: <IconSearch size={18} />,
    title: '本の検索',
    desc: 'タイトル・著者・出版社・ISBN など全フィールドを横断検索。ひらがなで漢字タイトルも検索できます',
    detail: '本棚上部の検索バーにキーワードを入力すると、タイトル・著者名・出版社・ジャンル・ISBN・Cコード・NDC・整理番号が一致する本をリアルタイムで絞り込みます。ひらがなで入力すると漢字タイトルも検索できます（例：「なつめ」→「夏目漱石」の本がヒット）。ステータスフィルターや並び替えと組み合わせて使用できます。入力欄右端の × ボタンで検索をクリアできます。',
    image: <img src="/help/bookshelf-search.svg" width="280" height="160" alt="" />,
  },
  {
    icon: <IconArrowsSort size={18} />,
    title: '並び替え',
    desc: '登録日・タイトル・セッション数・進捗で昇順/降順に並び替えられます',
    detail: '本棚上部の並び替えボタンで登録日・タイトル・セッション数・進捗（ページ）の4種類のキーで並び替えられます。同じキーを再度クリックすると昇順・降順が切り替わります。',
    image: <img src="/help/bookshelf-sort.svg" width="280" height="160" alt="" />,
  },
  {
    icon: <IconPencil size={18} />,
    title: 'メモ',
    desc: '各本に読書メモ・感想を自由に記録できます',
    detail: '本カードの編集モード（鉛筆アイコン）を開くとメモ欄が表示されます。読書中の気づきや感想などを自由に入力でき、保存後は本カードにそのまま表示されます。メモは検索対象外です。',
    image: <img src="/help/bookshelf-memo.svg" width="280" height="160" alt="" />,
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

import { formatAuthor } from '../lib/format'

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
  memo: '',
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

type EditForm = { title: string; author: string; publisher: string; totalPages: number; genre: Genre; isbn: string; ccode: string; catalogNumber: string; ndc: string; memo: string }

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
  const { user } = useAuth()
  const [showHelp, setShowHelp] = useState(false)
  const [addErrors, setAddErrors] = useState<FieldErrors>({})
  const [editErrors, setEditErrors] = useState<FieldErrors>({})
  const [editingBookId, setEditingBookId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ title: '', author: '', publisher: '', totalPages: 0, genre: 'その他', isbn: '', ccode: '', catalogNumber: '', ndc: '', memo: '' })
  const [quickTitle, setQuickTitle] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [details, setDetails] = useState(emptyDetails)
  const [sortKey, setSortKey] = useState<SortKey>('created')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filterStatus, setFilterStatus] = useState<BookStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
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
    setDetails(prev => ({ ...prev, author: s.author, publisher: s.publisher ?? '', genre: s.genre as Genre, totalPages: s.totalPages ?? prev.totalPages, isbn: s.isbn ?? prev.isbn, ccode: s.ccode ?? prev.ccode, catalogNumber: s.catalogNumber ?? prev.catalogNumber, ndc: s.ndc ?? prev.ndc }))
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
    const errs = validateBookFields(details)
    setAddErrors(errs)
    if (hasErrors(errs)) return
    const book: Book = {
      id: crypto.randomUUID(),
      title: quickTitle.trim(),
      ...details,
      currentPage: 0,
      sessions: 0,
      createdAt: new Date().toISOString(),
    }
    if (book.publisher && book.totalPages > 0) {
      const suggestion = { title: book.title, author: book.author, genre: book.genre, publisher: book.publisher, totalPages: book.totalPages, isbn: book.isbn, ccode: book.ccode, catalogNumber: book.catalogNumber, ndc: book.ndc }
      if (user) {
        addSuggestBook(suggestion)
      } else {
        addUserSuggestion(suggestion)
      }
    }
    onAdd(book)
    setQuickTitle('')
    setAddErrors({})
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
    setEditForm({ title: book.title, author: book.author, publisher: book.publisher ?? '', totalPages: book.totalPages, genre: book.genre, isbn: book.isbn ?? '', ccode: book.ccode ?? '', catalogNumber: book.catalogNumber ?? '', ndc: book.ndc ?? '', memo: book.memo ?? '' })
  }

  const saveEdit = (book: Book) => {
    if (!editForm.title.trim() || !editForm.author.trim()) return
    const errs = validateBookFields(editForm)
    setEditErrors(errs)
    if (hasErrors(errs)) return
    onUpdate({ ...book, ...editForm, title: editForm.title.trim(), author: editForm.author.trim(), publisher: editForm.publisher.trim() })
    setEditingBookId(null)
    setEditErrors({})
  }

  const statusIcon = (status: BookStatus) => {
    if (status === 'want') return <IconBookmark size={16} />
    if (status === 'reading') return <IconBook size={16} />
    return <IconCheck size={16} />
  }

  const q = normalize(searchQuery)
  const statusFiltered = filterStatus === 'all' ? books : books.filter(b => b.status === filterStatus)
  const displayBooks = q
    ? statusFiltered.filter(b => {
        if (
          normalize(b.title).includes(q) ||
          normalize(b.author).includes(q) ||
          normalize(b.publisher ?? '').includes(q) ||
          normalize(b.genre).includes(q) ||
          normalize(b.isbn ?? '').includes(q) ||
          normalize(b.ccode ?? '').includes(q) ||
          normalize(b.catalogNumber ?? '').includes(q) ||
          normalize(b.ndc ?? '').includes(q)
        ) return true
        const tr = getReading(b.title)
        const ar = getReading(b.author)
        return (tr?.includes(q) ?? false) || (ar?.includes(q) ?? false)
      })
    : statusFiltered

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
        <div className="quick-add-header">
          <span>本を追加</span>
        </div>
        <div className="quick-add-row">
          <div className="inputs-wrap">
            <div className="suggest-wrap">
              <input
                ref={inputRef}
                className="quick-add-input"
                value={quickTitle}
                onChange={e => handleTitleChange(e.target.value)}
                onCompositionUpdate={e => setSuggestions(searchSuggestions((e.target as HTMLInputElement).value))}
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
                      <span className="suggest-meta">{formatAuthor(s.author)}{s.publisher ? ` / ${s.publisher}` : ''}</span>
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
                onChange={e => { setDetails({ ...details, isbn: e.target.value }); setAddErrors(p => ({ ...p, isbn: undefined })) }}
                placeholder="978-4-..."
                className={addErrors.isbn ? 'field-error' : ''}
              />
              {addErrors.isbn && <span className="field-error-msg">{addErrors.isbn}</span>}
            </div>
            <div className="form-field">
              <label>Cコード</label>
              <input
                value={details.ccode}
                onChange={e => { setDetails({ ...details, ccode: formatCcode(e.target.value) }); setAddErrors(p => ({ ...p, ccode: undefined })) }}
                placeholder="0193"
                className={addErrors.ccode ? 'field-error' : ''}
              />
              {addErrors.ccode && <span className="field-error-msg">{addErrors.ccode}</span>}
            </div>
            <div className="form-field">
              <label>NDC</label>
              <input
                value={details.ndc}
                onChange={e => { setDetails({ ...details, ndc: e.target.value }); setAddErrors(p => ({ ...p, ndc: undefined })) }}
                placeholder="913.6"
                className={addErrors.ndc ? 'field-error' : ''}
              />
              {addErrors.ndc && <span className="field-error-msg">{addErrors.ndc}</span>}
            </div>
            <div className="form-field">
              <label>文庫整理番号</label>
              <input
                value={details.catalogNumber}
                onChange={e => { setDetails({ ...details, catalogNumber: e.target.value }); setAddErrors(p => ({ ...p, catalogNumber: undefined })) }}
                placeholder="な-1-1"
                className={addErrors.catalogNumber ? 'field-error' : ''}
              />
              {addErrors.catalogNumber && <span className="field-error-msg">{addErrors.catalogNumber}</span>}
            </div>
          </div>
        )}
      </div>

      <div className="bookshelf-search-wrap">
        <IconSearch size={15} className="bookshelf-search-icon" />
        <input
          className="bookshelf-search-input"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="タイトル・著者・出版社で検索..."
          autoComplete="off"
        />
        {searchQuery && (
          <button className="bookshelf-search-clear" onClick={() => setSearchQuery('')} title="クリア">
            <IconX size={13} />
          </button>
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
          <span className="book-count-label">
            {q ? `${displayBooks.length}件ヒット / 全${books.length}冊` : `全${books.length}冊`}
          </span>
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
        {books.length > 0 && displayBooks.length === 0 && (
          <p className="empty-msg">「{searchQuery}」に一致する本が見つかりません</p>
        )}
        {sortBooks(displayBooks, sortKey, sortDir).map(book => {
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
                          <input value={editForm.isbn} onChange={e => { setEditForm(f => ({ ...f, isbn: e.target.value })); setEditErrors(p => ({ ...p, isbn: undefined })) }} placeholder="978-4-..." className={editErrors.isbn ? 'field-error' : ''} />
                          {editErrors.isbn && <span className="field-error-msg">{editErrors.isbn}</span>}
                        </div>
                        <div className="form-field">
                          <label>Cコード</label>
                          <input value={editForm.ccode} onChange={e => { setEditForm(f => ({ ...f, ccode: formatCcode(e.target.value) })); setEditErrors(p => ({ ...p, ccode: undefined })) }} placeholder="0193" className={editErrors.ccode ? 'field-error' : ''} />
                          {editErrors.ccode && <span className="field-error-msg">{editErrors.ccode}</span>}
                        </div>
                        <div className="form-field">
                          <label>NDC</label>
                          <input value={editForm.ndc} onChange={e => { setEditForm(f => ({ ...f, ndc: e.target.value })); setEditErrors(p => ({ ...p, ndc: undefined })) }} placeholder="913.6" className={editErrors.ndc ? 'field-error' : ''} />
                          {editErrors.ndc && <span className="field-error-msg">{editErrors.ndc}</span>}
                        </div>
                        <div className="form-field">
                          <label>文庫整理番号</label>
                          <input value={editForm.catalogNumber} onChange={e => { setEditForm(f => ({ ...f, catalogNumber: e.target.value })); setEditErrors(p => ({ ...p, catalogNumber: undefined })) }} placeholder="な-1-1" className={editErrors.catalogNumber ? 'field-error' : ''} />
                          {editErrors.catalogNumber && <span className="field-error-msg">{editErrors.catalogNumber}</span>}
                        </div>
                      </div>
                      <div className="form-field form-field-full">
                        <label>メモ</label>
                        <textarea
                          className="book-memo-input"
                          value={editForm.memo}
                          onChange={e => setEditForm(f => ({ ...f, memo: e.target.value }))}
                          placeholder="読書メモ・感想など（任意）"
                          rows={3}
                        />
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
                      {book.author && <p className="author">{formatAuthor(book.author)}{book.publisher ? ` / ${book.publisher}` : ''}</p>}
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

              {!isEditing && book.memo && (
                <p className="book-memo-display">{book.memo}</p>
              )}

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
