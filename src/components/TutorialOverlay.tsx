import { useState, useEffect, useCallback } from 'react'
import { IconSparkles, IconClock, IconBooks, IconChartBar, IconSettings } from '@tabler/icons-react'

const TUTORIAL_KEY = 'pr_tutorial_done'

interface Rect { top: number; left: number; width: number; height: number }

interface Step {
  icon: React.ReactNode
  title: string
  desc: string
  selector?: string  // ハイライト対象の CSS セレクター
}

const STEPS: Step[] = [
  {
    icon: <IconSparkles size={18} />,
    title: 'PomRead へようこそ！',
    desc: '読書に特化したポモドーロタイマーアプリです。\n主な機能を簡単にご紹介します。',
  },
  {
    icon: <IconClock size={18} />,
    title: 'タイマー',
    desc: '25 分の集中タイマーで読書を管理します。\n本を選んでスタートすると、セッションが自動で記録されます。',
    selector: '.tab-nav > .tab-btn:nth-child(1)',
  },
  {
    icon: <IconBooks size={18} />,
    title: '本棚',
    desc: '読んでいる本・読みたい本を登録・管理できます。\nページ数や読書ステータスも記録できます。',
    selector: '.tab-nav > .tab-btn:nth-child(2)',
  },
  {
    icon: <IconChartBar size={18} />,
    title: '統計',
    desc: '日別・週別のセッション数や集中時間を\nグラフで確認できます。',
    selector: '.tab-nav > .tab-btn:nth-child(3)',
  },
  {
    icon: <IconSettings size={18} />,
    title: '設定・ログイン',
    desc: 'アカウントを作成してログインすると、\n複数デバイス間でデータを自動同期できます。',
    selector: '.tab-nav-right .tab-btn:last-child',
  },
]

export function shouldShowTutorial() {
  return !localStorage.getItem(TUTORIAL_KEY)
}

export default function TutorialOverlay({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [spotRect, setSpotRect] = useState<Rect | null>(null)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const finish = useCallback(() => {
    localStorage.setItem(TUTORIAL_KEY, '1')
    onDone()
  }, [onDone])

  // ハイライト対象要素の位置を取得
  useEffect(() => {
    if (!current.selector) { setSpotRect(null); return }
    const el = document.querySelector(current.selector)
    if (!el) { setSpotRect(null); return }
    const r = el.getBoundingClientRect()
    const pad = 8
    setSpotRect({ top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 })
  }, [step, current.selector])

  // ツールチップ位置: スポットライトの下、なければ画面中央
  const tooltipStyle = (() => {
    if (!spotRect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } as React.CSSProperties
    }
    const gap = 14
    const tooltipW = 300
    const belowY = spotRect.top + spotRect.height + gap
    const aboveY = spotRect.top - gap
    const leftX = Math.max(12, Math.min(
      spotRect.left + spotRect.width / 2 - tooltipW / 2,
      window.innerWidth - tooltipW - 12
    ))
    // 下に収まるか判定
    if (belowY + 200 > window.innerHeight) {
      return { bottom: window.innerHeight - aboveY, left: leftX } as React.CSSProperties
    }
    return { top: belowY, left: leftX } as React.CSSProperties
  })()

  return (
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
        <p className="tutorial-desc">{current.desc}</p>

        <div className="tutorial-actions">
          <button className="tutorial-skip-btn" onClick={finish}>スキップ</button>
          <div className="tutorial-nav">
            {step > 0 && (
              <button className="tutorial-prev-btn" onClick={() => setStep(s => s - 1)}>← 前へ</button>
            )}
            <button className="tutorial-next-btn" onClick={() => isLast ? finish() : setStep(s => s + 1)}>
              {isLast ? '完了 ✓' : '次へ →'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
