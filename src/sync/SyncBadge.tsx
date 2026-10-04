import { Icon } from '../ui/Icon'
import { useSyncStatus } from './useSync'

/** Small, honest status. Never an error state; always calm. */
export function SyncBadge() {
  const s = useSyncStatus()
  let text: string
  let icon: 'cloud' | 'cloud-off' = 'cloud'
  if (!s.paired) { text = 'On this phone only'; icon = 'cloud-off' }
  else if (!s.online) { text = s.pending ? 'Saved on this phone' : 'Offline'; icon = 'cloud-off' }
  else if (s.syncing || s.pending) text = 'Syncing'
  else text = 'Synced'
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface2 px-2.5 py-1 text-sm font-semibold text-muted" title={!s.online && s.pending ? 'Will sync when you are online' : undefined}>
      <Icon name={icon} className="size-4" />
      {text}
    </span>
  )
}
