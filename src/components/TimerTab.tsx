import { useState, useEffect, useRef, useCallback } from 'react'
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerStop,
  IconSettings,
  IconBook,
  IconQuestionMark,
  IconClock,
  IconBookmark,
  IconRefresh,
  IconChartBar,
} from '@tabler/icons-react'
import type { Book, Session } from '../types'
import HelpModal from './HelpModal'

const TIMER_HELP = [
  { icon: <IconClock size={18} />,    title: 'ポモドーロタイマー', desc: '集中時間が終わると自動で休憩フェーズへ切り替わります' },
  { icon: <IconBook size={18} />,     title: '本を選んでスタート', desc: '読書中・読みたい本を選択してからタイマーを開始できます' },
  { icon: <IconRefresh size={18} />,  title: '自動ステータス変更', desc: '「読みたい」の本を選ぶと、スタート時に自動で「読書中」になります' },
  { icon: <IconSettings size={18} />, title: '時間のカスタマイズ', desc: '歯車アイコンから集中・休憩時間を自由に変更できます' },
  { icon: <IconChartBar size={18} />, title: '今日の実績',         desc: '今日のセッション数と合計集中時間をリアルタイムで確認できます' },
]

type Phase = 'focus' | 'break'

interface Props {
  books: Book[]
  onSessionComplete: (bookId: string, session: Session) => void
  onStatusChange: (bookId: string, status: Book['status']) => void
}

export default function TimerTab({ books, onSessionComplete, onStatusChange }: Props) {
  const [showHelp, setShowHelp] = useState(false)
  const [focusMin, setFocusMin] = useState(25)
  const [breakMin, setBreakMin] = useState(5)
  const [phase, setPhase] = useState<Phase>('focus')
  const [secondsLeft, setSecondsLeft] = useState(focusMin * 60)
  const [running, setRunning] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState<string>('')
  const [showSettings, setShowSettings] = useState(false)
  const [todaySessions, setTodaySessions] = useState(0)
  const [totalMinutes, setTotalMinutes] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const selectableBooks = books.filter(b => b.status !== 'done')

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
    setRunning(false)
    if (phase === 'focus') {
      if (selectedBookId) {
        const book = books.find(b => b.id === selectedBookId)
        const newSession: Session = {
          id: crypto.randomUUID(),
          bookId: selectedBookId,
          bookTitle: book?.title ?? '',
          date: new Date().toISOString().slice(0, 10),
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

  const applySettings = () => {
    setShowSettings(false)
    setRunning(false)
    setPhase('focus')
    setSecondsLeft(focusMin * 60)
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
          <button className="btn-ghost" onClick={() => setShowSettings(!showSettings)}>
            <IconSettings size={20} />
          </button>
        </div>

        {showSettings && (
          <div className="settings-panel">
            <div className="settings-row">
              <label>集中時間（分）</label>
              <input
                type="number" min={1} max={90} value={focusMin}
                onChange={e => setFocusMin(Number(e.target.value))}
              />
            </div>
            <div className="settings-row">
              <label>休憩時間（分）</label>
              <input
                type="number" min={1} max={30} value={breakMin}
                onChange={e => setBreakMin(Number(e.target.value))}
              />
            </div>
            <button className="btn-primary" onClick={applySettings}>適用</button>
          </div>
        )}

        <div className="book-select-wrap">
          <IconBook size={18} />
          <select
            value={selectedBookId}
            onChange={e => setSelectedBookId(e.target.value)}
            disabled={running}
          >
            <option value="">本を選択...</option>
            {selectableBooks.map(b => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </select>
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
