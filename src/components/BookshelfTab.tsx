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
  { icon: <IconPlus size={18} />,       title: '本を追加',         desc: 'タイトルと著者名を入力して「＋」ボタンで登録。Enterキーでも追加できます' },
  { icon: <IconSearch size={18} />,     title: 'オートコンプリート', desc: '有名な作品はタイトル入力中に候補が表示されます。選ぶと著者・ジャンルが自動入力されます' },
  { icon: <IconSettings size={18} />,   title: '詳細設定',         desc: '「詳細設定」を開くと出版社・ページ数・ジャンル・初期ステータスを設定できます' },
  { icon: <IconRuler size={18} />,      title: '読書進捗',         desc: 'ページ数を設定した本はスライダーや数値クリックで現在ページを記録できます' },
  { icon: <IconTags size={18} />,       title: 'ステータス管理',   desc: '読みたい・読書中・読了の3段階で本の状態を管理できます' },
  { icon: <IconArrowsSort size={18} />, title: '並び替え',         desc: '登録日・タイトル・セッション数・進捗で昇順/降順に並び替えられます' },
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
