import { IconCloud, IconCloudCheck, IconCloudOff, IconUser } from '@tabler/icons-react'
import type { SyncState } from '../App'

interface Props {
  state: SyncState
  isLoggedIn: boolean
}

const LABELS: Record<SyncState, string> = {
  idle: '',
  syncing: '同期中',
  synced: '同期済み',
  offline: 'オフライン',
}

export default function SyncIndicator({ state, isLoggedIn }: Props) {
  if (!isLoggedIn) {
    return (
      <div className="sync-indicator offline" title="未ログイン（ローカル保存）">
        <IconUser size={14} />
        <span>未ログイン</span>
      </div>
    )
  }

  if (state === 'idle') return null

  return (
    <div className={`sync-indicator ${state}`} title={LABELS[state]}>
      {state === 'syncing' && <IconCloud size={14} className="spin" />}
      {state === 'synced' && <IconCloudCheck size={14} />}
      {state === 'offline' && <IconCloudOff size={14} />}
      <span>{LABELS[state]}</span>
    </div>
  )
}
