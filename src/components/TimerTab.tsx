import { useState, useEffect, useRef, useCallback } from 'react'
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconSettings,
  IconBook,
  IconQuestionMark,
  IconClock,
  IconRefresh,
  IconChartBar,
  IconChevronDown,
  IconCheck,
  IconSearch,
  IconX,
} from '@tabler/icons-react'
import type { Book, Session } from '../types'
import HelpModal from './HelpModal'

const TIMER_HELP = [
  {
    icon: <IconClock size={18} />,
    title: 'ポモドーロタイマー',
    desc: '集中時間が終わると自動で休憩フェーズへ切り替わります',
    detail: 'ポモドーロ法は25分の集中＋5分の休憩を繰り返す時間管理術です。集中時間が終わると自動で休憩フェーズへ切り替わります。4回連続した場合は長めの休憩をとりましょう。',
    image: <img src="/help/timer-pomodoro.svg" width="280" height="160" alt="" />,
  },
  {
    icon: <IconBook size={18} />,
    title: '本を選んでスタート',
    desc: '読書中・読みたい本を選択してからタイマーを開始できます。ドロップダウン内で検索も可能です',
    detail: 'タイマー開始前に読む本を選択してください。本選択ドロップダウンを開くと検索欄が自動でフォーカスされ、タイトル・著者名で絞り込めます。「読みたい」ステータスの本を選ぶと、スタート時に自動で「読書中」に変更されます。本を選ばずにスタートすることはできません。',
    image: <img src="/help/timer-book-select.svg" width="280" height="160" alt="" />,
  },
  {
    icon: <IconRefresh size={18} />,
    title: '自動スタート / タブロック',
    desc: 'フェーズ終了後、次のタイマーが自動でスタートします。タイマー動作中は本棚・統計タブへの移動がロックされます',
    detail: '集中フェーズが終わると休憩タイマーが自動でスタートし、休憩が終わると再び集中タイマーが自動でスタートします。途中で一時停止・停止したい場合はボタンを押してください。なお、タイマー動作中は本棚・統計タブへの移動がロックされます（設定タブは引き続き使用できます）。一時停止・停止するとロックは解除されます。',
    image: <img src="/help/timer-auto-start.svg" width="280" height="160" alt="" />,
  },
  {
    icon: <IconSettings size={18} />,
    title: '時間のカスタマイズ',
    desc: '歯車アイコンから集中・休憩時間を自由に変更できます',
    detail: '歯車アイコンから集中時間（1〜90分）と休憩時間（1〜30分）を自由に変更できます。デフォルトは集中25分・休憩5分です。設定変更後は「適用」ボタンを押してください。',
    image: <img src="/help/timer-settings.svg" width="280" height="160" alt="" />,
  },
  {
    icon: <IconChartBar size={18} />,
    title: '今日の実績',
    desc: '今日のセッション数と合計集中時間をリアルタイムで確認できます',
    detail: '画面下部に今日のセッション数と合計集中時間をリアルタイムで表示します。セッションはタイマーが正常に終了した際にカウントされます。統計タブでは過去の記録も確認できます。',
    image: <img src="/help/timer-today-stats.svg" width="280" height="160" alt="" />,
  },
]

type Phase = 'focus' | 'break'

interface Props {
  books: Book[]
  sessions: Session[]
  onSessionComplete: (bookId: string, session: Session) => void
  onStatusChange: (bookId: string, status: Book['status']) => void
  onRunningChange?: (running: boolean) => void
}

export default function TimerTab({ books, sessions, onSessionComplete, onStatusChange, onRunningChange }: Props) {
  const [showHelp, setShowHelp] = useState(false)
  const [focusMin, setFocusMin] = useState(25)
  const [breakMin, setBreakMin] = useState(5)
  const [inputFocusMin, setInputFocusMin] = useState(25)
  const [inputBreakMin, setInputBreakMin] = useState(5)
  const [phase, setPhase] = useState<Phase>('focus')
  const [secondsLeft, setSecondsLeft] = useState(focusMin * 60)
  const [running, setRunning] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState<string>('')
  const [showBookDropdown, setShowBookDropdown] = useState(false)
  const [bookSearch, setBookSearch] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const bookDropdownRef = useRef<HTMLDivElement>(null)
  const bookSearchRef = useRef<HTMLInputElement>(null)
  const today = new Date().toISOString().slice(0, 10)
  const todayBase = sessions.filter(s => s.date === today)
  const [todaySessions, setTodaySessions] = useState(() => todayBase.length)
  const [totalMinutes, setTotalMinutes] = useState(() => todayBase.reduce((sum, s) => sum + s.duration, 0))
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const selectableBooks = books.filter(b => b.status !== 'done')
  const selectedBook = selectableBooks.find(b => b.id === selectedBookId) ?? null

  const bq = bookSearch.trim().toLowerCase()
  const filteredSelectableBooks = bq
    ? selectableBooks.filter(b =>
        b.title.toLowerCase().includes(bq) ||
        b.author.toLowerCase().includes(bq) ||
        (b.publisher ?? '').toLowerCase().includes(bq)
      )
    : selectableBooks

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bookDropdownRef.current && !bookDropdownRef.current.contains(e.target as Node)) {
        setShowBookDropdown(false)
        setBookSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ドロップダウンが開いたら検索欄をフォーカス
  useEffect(() => {
    if (showBookDropdown) {
      setTimeout(() => bookSearchRef.current?.focus(), 30)
    }
  }, [showBookDropdown])

  // sessions ロード後に今日の実績を同期
  useEffect(() => {
    const todaySess = sessions.filter(s => s.date === today)
    setTodaySessions(todaySess.length)
    setTotalMinutes(todaySess.reduce((sum, s) => sum + s.duration, 0))
  }, [sessions])

  // running 変化を親に通知
  useEffect(() => {
    onRunningChange?.(running)
  }, [running, onRunningChange])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          handlePhaseEnd()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [running, phase])

  const handlePhaseEnd = useCallback(() => {
    if (phase === 'focus') {
      if (selectedBookId) {
        const book = books.find(b => b.id === selectedBookId)
        const newSession: Session = {
          id: crypto.randomUUID(),
          bookId: selectedBookId,
          bookTitle: book?.title ?? '',
          date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })(),
          duration: focusMin,
        }
        onSessionComplete(selectedBookId, newSession)
        setTodaySessions(prev => prev + 1)
        setTotalMinutes(prev => prev + focusMin)
      }
      setPhase('break')
      setSecondsLeft(breakMin * 60)
    } else {
      setPhase('focus')
      setSecondsLeft(focusMin * 60)
    }
  }, [phase, selectedBookId, books, focusMin, breakMin, onSessionComplete])

  const handleStart = () => {
    if (phase === 'focus' && !selectedBookId && selectableBooks.length > 0) return
    if (phase === 'focus' && selectedBookId) {
      const book = books.find(b => b.id === selectedBookId)
      if (book?.status === 'want') onStatusChange(selectedBookId, 'reading')
    }
    setRunning(true)
  }

  const handlePause = () => setRunning(false)

  const handleStop = () => {
    setRunning(false)
    setPhase('focus')
    setSecondsLeft(focusMin * 60)
  }

  const openSettings = () => {
    setInputFocusMin(focusMin)
    setInputBreakMin(breakMin)
    setShowSettings(true)
  }

  const applySettings = () => {
    const newFocus = Math.max(1, Math.min(90, inputFocusMin))
    const newBreak = Math.max(1, Math.min(30, inputBreakMin))
    setFocusMin(newFocus)
    setBreakMin(newBreak)
    setShowSettings(false)
    setRunning(false)
    setPhase('focus')
    setSecondsLeft(newFocus * 60)
  }

  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, '0')
  const seconds = (secondsLeft % 60).toString().padStart(2, '0')
  const total = phase === 'focus' ? focusMin * 60 : breakMin * 60
  const progress = ((total - secondsLeft) / total) * 100

  return (
    <div className="timer-tab">
      {showHelp && <HelpModal title="タイマーの使い方" items={TIMER_HELP} onClose={() => setShowHelp(false)} />}
      <div className="tab-help-row">
        <button className="help-btn" onClick={() => setShowHelp(true)}>
          <IconQuestionMark size={15} />
          使い方
        </button>
      </div>
      <div className="timer-card">
        <div className={`phase-badge ${phase}`}>
          {phase === 'focus' ? '集中' : '休憩'}
        </div>

        <div className="timer-ring-wrap">
          <svg className="timer-ring" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="88" className="ring-bg" />
            <circle
              cx="100" cy="100" r="88"
              className={`ring-progress ${phase}`}
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
            />
          </svg>
          <div className="timer-display">{minutes}:{seconds}</div>
        </div>

        <div className="timer-controls">
          {!running ? (
            <button className="btn-primary" onClick={handleStart}>
              <IconPlayerPlay size={20} />
              スタート
            </button>
          ) : (
            <button className="btn-secondary" onClick={handlePause}>
              <IconPlayerPause size={20} />
              一時停止
            </button>
          )}
          <button className="btn-ghost" onClick={handleStop}>
            <IconPlayerStop size={20} />
          </button>
          <button className="btn-ghost" onClick={() => showSettings ? setShowSettings(false) : openSettings()}>
            <IconSettings size={20} />
          </button>
        </div>

        {showSettings && (
          <div className="settings-panel">
            <div className="settings-row">
              <label>集中時間（分）</label>
              <input
                type="number" min={1} max={90} value={inputFocusMin}
                onChange={e => setInputFocusMin(Number(e.target.value))}
              />
            </div>
            <div className="settings-row">
              <label>休憩時間（分）</label>
              <input
                type="number" min={1} max={30} value={inputBreakMin}
                onChange={e => setInputBreakMin(Number(e.target.value))}
              />
            </div>
            <button className="btn-primary" onClick={applySettings}>適用</button>
          </div>
        )}

        <div className="book-select-wrap" ref={bookDropdownRef}>
          <button
            className={`book-select-btn${showBookDropdown ? ' open' : ''}${running ? ' disabled' : ''}`}
            onClick={() => { if (!running) { setShowBookDropdown(v => !v); setBookSearch('') } }}
            disabled={running}
          >
            <IconBook size={16} className="book-select-icon" />
            <span className="book-select-label">
              {selectedBook ? selectedBook.title : '本を選択...'}
            </span>
            {selectedBook && (
              <span className="book-select-author">
                {selectedBook.author}{selectedBook.publisher ? `/${selectedBook.publisher}` : ''}
              </span>
            )}
            <IconChevronDown size={16} className={`book-select-chevron${showBookDropdown ? ' rotated' : ''}`} />
          </button>

          {showBookDropdown && (
            <div className="book-select-dropdown">
              {selectableBooks.length === 0 ? (
                <div className="book-select-empty">本棚に本を追加してください</div>
              ) : (
                <>
                  <div className="book-dropdown-search-wrap">
                    <IconSearch size={13} className="book-dropdown-search-icon" />
                    <input
                      ref={bookSearchRef}
                      className="book-dropdown-search-input"
                      value={bookSearch}
                      onChange={e => setBookSearch(e.target.value)}
                      placeholder="タイトル・著者で検索..."
                      autoComplete="off"
                    />
                    {bookSearch && (
                      <button className="book-dropdown-search-clear" onClick={() => setBookSearch('')}>
                        <IconX size={11} />
                      </button>
                    )}
                  </div>
                  <div className="book-dropdown-list">
                    {filteredSelectableBooks.length === 0 ? (
                      <div className="book-select-empty">「{bookSearch}」に一致する本がありません</div>
                    ) : (
                      filteredSelectableBooks.map(b => (
                        <button
                          key={b.id}
                          className={`book-select-option${b.id === selectedBookId ? ' selected' : ''}`}
                          onClick={() => { setSelectedBookId(b.id); setShowBookDropdown(false); setBookSearch('') }}
                        >
                          <span className={`book-status-dot status-${b.status}`} />
                          <span className="book-option-title">{b.title}</span>
                          <span className="book-option-meta">
                            {b.author}{b.publisher ? `/${b.publisher}` : ''}
                          </span>
                          {b.id === selectedBookId && <IconCheck size={14} className="book-option-check" />}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        {phase === 'focus' && !selectedBookId && selectableBooks.length > 0 && !running && (
          <p className="hint">本を選択してからスタートしてください</p>
        )}
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value">{todaySessions}</span>
          <span className="stat-label">今日のセッション</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totalMinutes}</span>
          <span className="stat-label">今日の集中（分）</span>
        </div>
      </div>
    </div>
  )
}
