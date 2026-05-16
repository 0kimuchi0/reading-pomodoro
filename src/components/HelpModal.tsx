import { useEffect } from 'react'
import { IconX } from '@tabler/icons-react'

export interface HelpItem {
  icon: React.ReactNode
  title: string
  desc: string
}

interface Props {
  title: string
  items: HelpItem[]
  onClose: () => void
}

export default function HelpModal({ title, items, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-modal" onClick={e => e.stopPropagation()}>
        <div className="help-modal-header">
          <h2>{title}</h2>
          <button className="help-close-btn" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>
        <ul className="help-list">
          {items.map((item, i) => (
            <li key={i} className="help-item">
              <span className="help-icon">{item.icon}</span>
              <div className="help-text">
                <span className="help-item-title">{item.title}</span>
                <span className="help-item-desc">{item.desc}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
