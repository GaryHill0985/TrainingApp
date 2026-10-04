import { Link } from 'react-router'
import { Screen } from '../../ui/Screen'
import { Icon } from '../../ui/Icon'
import { SyncBadge } from '../../sync/SyncBadge'
import { usePlan } from '../../plan/usePlan'
import { useSessions } from './data'
import { formatShort } from '../../lib/dates'

export function History() {
  const plan = usePlan()
  const sessions = useSessions().sort((a, b) => b.started_at.localeCompare(a.started_at))
  return (
    <Screen title="History" right={<SyncBadge />}>
      {sessions.length === 0 ? (
        <p className="text-muted">No sessions yet. Your first one will show here.</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => {
            const w = plan.workouts.find((x) => x.id === s.workout_id)
            return (
              <li key={s.id}>
                <Link to={`/lucas/session/${s.id}`} className="flex min-h-16 items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3">
                  <span>
                    <span className="block text-sm font-semibold text-muted">{formatShort(s.date)}{s.status === 'in_progress' ? ' · In progress' : ''}</span>
                    <span className="block text-xl font-extrabold">{w?.name ?? s.workout_id}</span>
                  </span>
                  <Icon name="chevron" className="size-6 text-muted" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Screen>
  )
}
