import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { IconX, IconChevronLeft, IconChevronRight } from '@tabler/icons-react'

export interface HelpItem {
  icon: React.ReactNode
  title: string
  desc: string        // 短い説明（サイドバー用）
  detail: string      // 詳細説明文
  image: React.ReactNode  // SVGイラスト
}

interface Props {
  title: string
  items: HelpItem[]
  onClose: () => void
}

export default function HelpModal({ title, items, onClose }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)

  const goNext = useCallback(() => {
    setActiveIndex(i => Math.min(i + 1, items.length - 1))
  }, [items.length])

  const goPrev = useCallback(() => {
    setActiveIndex(i => Math.max(i - 1, 0))
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, goNext, goPrev])

  const active = items[activeIndex]

  return createPortal(
    <div className="help-overlay" onClick={onClose}>
      <div className="help-modal-v2" onClick={e => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className="help-modal-header">
          <h2>{title}</h2>
          <button className="help-close-btn" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>

        {/* ボディ：サイドバー＋詳細パネル */}
        <div className="help-modal-body">
          {/* 左サイドバー */}
          <ul className="help-sidebar">
            {items.map((item, i) => (
              <li
                key={i}
                className={`help-sidebar-item${i === activeIndex ? ' active' : ''}`}
                onClick={() => setActiveIndex(i)}
              >
                <span className="help-sidebar-icon">{item.icon}</span>
                <span>{item.title}</span>
              </li>
            ))}
          </ul>

          {/* 右詳細パネル */}
          <div className="help-detail-panel">
            {/* SVGイラスト */}
            <div className="help-illustration">
              {active.image}
            </div>

            {/* タイトル＋詳細テキスト */}
            <p className="help-detail-title">
              {active.icon}
              {active.title}
            </p>
            <p className="help-detail-text">{active.detail}</p>

            {/* 前へ/次へナビ */}
            <div className="help-detail-nav">
              <button
                className="help-nav-btn"
                onClick={goPrev}
                disabled={activeIndex === 0}
              >
                <IconChevronLeft size={14} />
                前へ
              </button>
              <span className="help-nav-count">{activeIndex + 1} / {items.length}</span>
              <button
                className="help-nav-btn"
                onClick={goNext}
                disabled={activeIndex === items.length - 1}
              >
                次へ
                <IconChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
