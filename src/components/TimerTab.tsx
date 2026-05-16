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
  {
    icon: <IconClock size={18} />,
    title: 'ポモドーロタイマー',
    desc: '集中時間が終わると自動で休憩フェーズへ切り替わります',
    detail: 'ポモドーロ法は25分の集中＋5分の休憩を繰り返す時間管理術です。集中時間が終わると自動で休憩フェーズへ切り替わります。4回連続した場合は長めの休憩をとりましょう。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        {/* 背景 */}
        <rect width="280" height="160" fill="#F7F7FB" rx="8" />
        {/* リング背景 */}
        <circle cx="140" cy="82" r="58" fill="none" stroke="#E2E1F0" strokeWidth="10" />
        {/* リング進捗（約75%） */}
        <circle
          cx="140" cy="82" r="58"
          fill="none" stroke="#534AB7" strokeWidth="10"
          strokeDasharray={`${2 * Math.PI * 58 * 0.75} ${2 * Math.PI * 58 * 0.25}`}
          strokeDashoffset={`${2 * Math.PI * 58 * 0.25}`}
          strokeLinecap="round"
          transform="rotate(-90 140 82)"
        />
        {/* 時刻テキスト */}
        <text x="140" y="78" textAnchor="middle" fontSize="22" fontWeight="700" fill="#1A1A2E" fontFamily="sans-serif">25:00</text>
        {/* 集中バッジ */}
        <rect x="112" y="90" width="56" height="20" rx="10" fill="#EEEDfA" />
        <text x="140" y="104" textAnchor="middle" fontSize="11" fontWeight="600" fill="#534AB7" fontFamily="sans-serif">集中</text>
        {/* 上部ラベル */}
        <text x="140" y="18" textAnchor="middle" fontSize="11" fill="#6B6B8A" fontFamily="sans-serif">ポモドーロタイマー</text>
      </svg>
    ),
  },
  {
    icon: <IconBook size={18} />,
    title: '本を選んでスタート',
    desc: '読書中・読みたい本を選択してからタイマーを開始できます',
    detail: 'タイマー開始前に読む本を選択してください。「読みたい」ステータスの本を選ぶと、スタート時に自動で「読書中」に変更されます。本を選ばずにスタートすることはできません。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8" />
        {/* ドロップダウン枠 */}
        <rect x="50" y="30" width="180" height="36" rx="8" fill="#FFFFFF" stroke="#E2E1F0" strokeWidth="1.5" />
        {/* 本アイコン（シンプル） */}
        <rect x="64" y="42" width="14" height="12" rx="2" fill="#534AB7" />
        <line x1="71" y1="42" x2="71" y2="54" stroke="#FFFFFF" strokeWidth="1.5" />
        {/* ドロップダウンテキスト */}
        <text x="86" y="53" fontSize="12" fill="#1A1A2E" fontFamily="sans-serif">本を選択...</text>
        {/* 矢印 */}
        <text x="215" y="53" fontSize="10" fill="#6B6B8A" fontFamily="sans-serif">▾</text>
        {/* 選択肢リスト */}
        <rect x="50" y="72" width="180" height="26" rx="0" fill="#EEEDfA" />
        <text x="70" y="89" fontSize="11" fill="#534AB7" fontFamily="sans-serif">▶ 吾輩は猫である</text>
        <rect x="50" y="98" width="180" height="26" rx="0" fill="#FFFFFF" stroke="#E2E1F0" strokeWidth="0.5" />
        <text x="70" y="115" fontSize="11" fill="#6B6B8A" fontFamily="sans-serif">  走れメロス</text>
        <rect x="50" y="124" width="180" height="26" rx="8" fill="#FFFFFF" stroke="#E2E1F0" strokeWidth="0.5" style={{borderTopLeftRadius: 0, borderTopRightRadius: 0}} />
        <text x="70" y="141" fontSize="11" fill="#6B6B8A" fontFamily="sans-serif">  坊っちゃん</text>
      </svg>
    ),
  },
  {
    icon: <IconRefresh size={18} />,
    title: '集中・休憩の切り替え',
    desc: '「読みたい」の本を選ぶと、スタート時に自動で「読書中」になります',
    detail: '集中フェーズが終わると自動的に休憩フェーズへ移行します。休憩中はリラックスしてください。休憩が終わると再び集中フェーズに戻ります。途中でストップボタンを押すとリセットできます。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8" />
        {/* 集中バッジ */}
        <rect x="30" y="60" width="80" height="40" rx="10" fill="#534AB7" />
        <text x="70" y="82" textAnchor="middle" fontSize="13" fontWeight="700" fill="#FFFFFF" fontFamily="sans-serif">集中</text>
        <text x="70" y="96" textAnchor="middle" fontSize="10" fill="#C8C4F0" fontFamily="sans-serif">25:00</text>
        {/* 矢印 */}
        <path d="M118 80 L145 80" stroke="#534AB7" strokeWidth="2" strokeLinecap="round" />
        <polygon points="143,75 152,80 143,85" fill="#534AB7" />
        {/* 休憩バッジ */}
        <rect x="158" y="60" width="80" height="40" rx="10" fill="#EEEDfA" stroke="#534AB7" strokeWidth="1.5" />
        <text x="198" y="82" textAnchor="middle" fontSize="13" fontWeight="700" fill="#534AB7" fontFamily="sans-serif">休憩</text>
        <text x="198" y="96" textAnchor="middle" fontSize="10" fill="#7C75D4" fontFamily="sans-serif">05:00</text>
        {/* 循環矢印（下） */}
        <path d="M198 108 Q198 130 140 130 Q82 130 70 108" stroke="#C8C4F0" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeDasharray="4 3" />
        <polygon points="67,107 75,102 75,112" fill="#C8C4F0" />
        <text x="140" y="148" textAnchor="middle" fontSize="10" fill="#6B6B8A" fontFamily="sans-serif">自動切り替え</text>
      </svg>
    ),
  },
  {
    icon: <IconSettings size={18} />,
    title: '時間のカスタマイズ',
    desc: '歯車アイコンから集中・休憩時間を自由に変更できます',
    detail: '歯車アイコンから集中時間（1〜90分）と休憩時間（1〜30分）を自由に変更できます。デフォルトは集中25分・休憩5分です。設定変更後は「適用」ボタンを押してください。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8" />
        {/* 設定パネル */}
        <rect x="50" y="20" width="180" height="120" rx="10" fill="#FFFFFF" stroke="#E2E1F0" strokeWidth="1.5" />
        {/* 歯車アイコン（シンプル） */}
        <circle cx="140" cy="38" r="8" fill="#EEEDfA" stroke="#534AB7" strokeWidth="1.5" />
        <circle cx="140" cy="38" r="3" fill="#534AB7" />
        {/* 集中時間ラベル＋入力 */}
        <text x="68" y="72" fontSize="11" fill="#6B6B8A" fontFamily="sans-serif">集中時間（分）</text>
        <rect x="68" y="78" width="64" height="24" rx="6" fill="#F7F7FB" stroke="#E2E1F0" strokeWidth="1.5" />
        <text x="100" y="95" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1A1A2E" fontFamily="sans-serif">25</text>
        {/* 休憩時間ラベル＋入力 */}
        <text x="152" y="72" fontSize="11" fill="#6B6B8A" fontFamily="sans-serif">休憩時間（分）</text>
        <rect x="152" y="78" width="64" height="24" rx="6" fill="#F7F7FB" stroke="#E2E1F0" strokeWidth="1.5" />
        <text x="184" y="95" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1A1A2E" fontFamily="sans-serif">5</text>
        {/* 適用ボタン */}
        <rect x="90" y="114" width="100" height="18" rx="6" fill="#534AB7" />
        <text x="140" y="127" textAnchor="middle" fontSize="11" fontWeight="600" fill="#FFFFFF" fontFamily="sans-serif">適用</text>
      </svg>
    ),
  },
  {
    icon: <IconChartBar size={18} />,
    title: '今日の実績',
    desc: '今日のセッション数と合計集中時間をリアルタイムで確認できます',
    detail: '画面下部に今日のセッション数と合計集中時間をリアルタイムで表示します。セッションはタイマーが正常に終了した際にカウントされます。統計タブでは過去の記録も確認できます。',
    image: (
      <svg viewBox="0 0 280 160" xmlns="http://www.w3.org/2000/svg" width="280" height="160">
        <rect width="280" height="160" fill="#F7F7FB" rx="8" />
        {/* カード1：セッション数 */}
        <rect x="30" y="30" width="100" height="100" rx="12" fill="#FFFFFF" stroke="#E2E1F0" strokeWidth="1.5" />
        <text x="80" y="72" textAnchor="middle" fontSize="32" fontWeight="700" fill="#534AB7" fontFamily="sans-serif">3</text>
        <text x="80" y="100" textAnchor="middle" fontSize="11" fill="#6B6B8A" fontFamily="sans-serif">今日のセッション</text>
        {/* バーグラフ小 */}
        <rect x="54" y="108" width="12" height="14" rx="3" fill="#EEEDfA" />
        <rect x="72" y="102" width="12" height="20" rx="3" fill="#C8C4F0" />
        <rect x="90" y="96" width="12" height="26" rx="3" fill="#534AB7" />
        {/* カード2：集中時間 */}
        <rect x="150" y="30" width="100" height="100" rx="12" fill="#FFFFFF" stroke="#E2E1F0" strokeWidth="1.5" />
        <text x="200" y="72" textAnchor="middle" fontSize="32" fontWeight="700" fill="#534AB7" fontFamily="sans-serif">75</text>
        <text x="200" y="100" textAnchor="middle" fontSize="11" fill="#6B6B8A" fontFamily="sans-serif">今日の集中（分）</text>
        {/* 時計アイコン */}
        <circle cx="200" cy="116" r="10" fill="none" stroke="#EEEDfA" strokeWidth="2" />
        <line x1="200" y1="110" x2="200" y2="116" stroke="#534AB7" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="200" y1="116" x2="205" y2="119" stroke="#534AB7" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
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
