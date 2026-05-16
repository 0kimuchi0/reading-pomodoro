import { useEffect, useState } from 'react'
import { IconAlertTriangle } from '@tabler/icons-react'

interface Props {
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  requireReason?: boolean
  onConfirm: (reason: string) => void
  onCancel: () => void
}

export default function ConfirmDialog({
  message,
  confirmLabel = '確認',
  cancelLabel = 'キャンセル',
  danger = false,
  requireReason = false,
  onConfirm,
  onCancel,
}: Props) {
  const [reason, setReason] = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  const canConfirm = !requireReason || reason.trim().length > 0

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
        <div className="confirm-icon">
          <IconAlertTriangle size={24} />
        </div>
        <p className="confirm-message">{message}</p>
        {requireReason && (
          <div className="confirm-reason">
            <label className="confirm-reason-label">理由（必須）</label>
            <textarea
              className="confirm-reason-input"
              placeholder="変更理由を入力してください..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              autoFocus
            />
          </div>
        )}
        <div className="confirm-actions">
          <button className="confirm-cancel-btn" onClick={onCancel}>{cancelLabel}</button>
          <button
            className={`confirm-ok-btn${danger ? ' danger' : ''}`}
            onClick={() => onConfirm(reason.trim())}
            disabled={!canConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
