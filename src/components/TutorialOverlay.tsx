import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { IconSparkles, IconClock, IconBooks, IconChartBar, IconSettings } from '@tabler/icons-react'

const TUTORIAL_KEY = 'pr_tutorial_done'

interface Rect { top: number; left: number; width: number; height: number }

type TabName = 'timer' | 'bookshelf' | 'stats' | 'settings'

interface Step {
  icon: React.ReactNode
  title: string
  desc: string[]        // 箇条書き
  selector?: string
  tab?: TabName         // 遷移先タブ
}

const STEPS: Step[] = [
  {
    icon: <IconSparkles size={18} />,
    title: 'PomoRead へようこそ！',
    desc: [
      '読書に特化したポモドーロタイマーアプリです。',
      '本棚・タイマー・統計の3つの機能で、読書習慣をサポートします。',
      '主な機能を順番にご紹介します。',
    ],
  },
  {
    icon: <IconClock size={18} />,
    title: 'タイマー（ポモドーロ法）',
    desc: [
      'ポモドーロ法は「25分集中 → 5分休憩」を繰り返す時間管理術です。集中フェーズが終わると自動で休憩タイマーへ切り替わり、4セット終えたら長めの休憩を取りましょう。',
      '読む本をドロップダウンから選択してスタート。検索欄でタイトル・著者名を入力してすばやく絞り込めます。',
      '歯車アイコンから集中時間（1〜90分）と休憩時間（1〜30分）を自由に変更できます。',
      'タイマー動作中は本棚・統計タブへの移動がロックされます。セッション完了ごとに統計と本棚の実績へ自動反映されます。',
    ],
    selector: '.tab-nav > .tab-btn:nth-child(1)',
    tab: 'timer',
  },
  {
    icon: <IconBooks size={18} />,
    title: '本棚',
    desc: [
      'タイトル・著者・出版社・ジャンル・総ページ数を登録して本を管理します。',
      '検索バーでタイトル・著者・出版社を入力すると、本をすばやく絞り込めます。',
      'ステータスフィルターや並び替えと組み合わせて使用できます。',
      '現在のページ数を更新することで、読書進捗を記録できます。',
    ],
    selector: '.tab-nav > .tab-btn:nth-child(2)',
    tab: 'bookshelf',
  },
  {
    icon: <IconChartBar size={18} />,
    title: '統計',
    desc: [
      '日別・週別の集中時間とセッション数をグラフで確認できます。',
      '本ごとの読書時間や総セッション数も一覧で表示されます。',
      '連続読書日数（ストリーク）でモチベーションを維持しましょう。',
    ],
    selector: '.tab-nav > .tab-btn:nth-child(3)',
    tab: 'stats',
  },
  {
    icon: <IconSettings size={18} />,
    title: '設定・ログイン',
    desc: [
      'ライト・ダーク・システムテーマを切り替えられます。',
      'アカウントを作成してログインすると、データがクラウドに保存されます。',
      'ログイン中はスマホ・PC など複数デバイス間でデータが自動同期されます。',
    ],
    selector: '.tab-nav-right .tab-btn:last-child',
    tab: 'settings',
  },
]

export function shouldShowTutorial() {
  return !localStorage.getItem(TUTORIAL_KEY)
}

interface Props {
  onDone: () => void
  onTabChange: (tab: TabName) => void
}

export default function TutorialOverlay({ onDone, onTabChange }: Props) {
  const [step, setStep] = useState(0)
  const [spotRect, setSpotRect] = useState<Rect | null>(null)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const finish = useCallback(() => {
    localStorage.setItem(TUTORIAL_KEY, '1')
    onDone()
  }, [onDone])

  // ステップ変更時にタブ遷移 & スポットライト位置更新
  useEffect(() => {
    if (current.tab) onTabChange(current.tab)
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  // タブ遷移後に DOM が更新されるまで少し待ってから位置取得
  useEffect(() => {
    if (!current.selector) { setSpotRect(null); return }
    const timer = setTimeout(() => {
      const el = document.querySelector(current.selector!)
      if (!el) { setSpotRect(null); return }
      const r = el.getBoundingClientRect()
      const pad = 8
      setSpotRect({ top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 })
    }, 80)
    return () => clearTimeout(timer)
  }, [step, current.selector])

  // ツールチップ位置: スポットライトの下、なければ画面中央
  const tooltipStyle = (() => {
    if (!spotRect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } as React.CSSProperties
    }
    const gap = 14
    const tooltipW = 320
    const belowY = spotRect.top + spotRect.height + gap
    const aboveY = spotRect.top - gap
    const leftX = Math.max(12, Math.min(
      spotRect.left + spotRect.width / 2 - tooltipW / 2,
      window.innerWidth - tooltipW - 12
    ))
    if (belowY + 260 > window.innerHeight) {
      return { bottom: window.innerHeight - aboveY, left: leftX } as React.CSSProperties
    }
    return { top: belowY, left: leftX } as React.CSSProperties
  })()

  return createPortal(
    <>
      {/* 背景オーバーレイ（クリックでスキップ） */}
      <div className="tutorial-overlay" onClick={finish} />

      {/* スポットライト */}
      {spotRect && (
        <div
          className="tutorial-spotlight"
          style={{ top: spotRect.top, left: spotRect.left, width: spotRect.width, height: spotRect.height }}
        />
      )}

      {/* ツールチップ */}
      <div className="tutorial-tooltip" style={tooltipStyle} onClick={e => e.stopPropagation()}>
        {/* ステップドット */}
        <div className="tutorial-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={`tutorial-dot${i === step ? ' active' : ''}`} />
          ))}
        </div>

        <h3 className="tutorial-title">{current.icon}{current.title}</h3>
        <ul className="tutorial-desc-list">
          {current.desc.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>

        <div className="tutorial-actions">
          <button className="tutorial-skip-btn" onClick={finish}>スキップ</button>
          <div className="tutorial-nav">
            {step > 0 && (
              <button className="tutorial-prev-btn" onClick={() => setStep(s => s - 1)}>← 前へ</button>
            )}
            <button className="tutorial-next-btn" onClick={() => isLast ? finish() : setStep(s => s + 1)}>
              {isLast ? '完了' : '次へ →'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
