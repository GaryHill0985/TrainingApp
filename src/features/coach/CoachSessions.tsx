import { Link } from 'react-router'
import { Screen } from '../../ui/Screen'
import { Icon } from '../../ui/Icon'
import { SyncBadge } from '../../sync/SyncBadge'
import { usePlan } from '../../plan/usePlan'
import { useAllLogs, useAllSets, useSessions } from '../trainee/data'
import { completionPercent } from './data'
import { formatShort } from '../../lib/dates'

export function CoachSessions() {
  const plan = usePlan()
  const sessions = useSessions().sort((a, b) => b.started_at.localeCompare(a.started_at))
  const sets = useAllSets()
  const logs = useAllLogs()
  return (
    <Screen title="Sessions" right={<SyncBadge />}>
      {sessions.length === 0 ? <p className="text-muted">No sessions yet.</p> : (
        <ul className="space-y-2">
          {sessions.map((s) => {
            const sLogs = logs.filter((l) => l.session_id === s.id)
            const pain = sLogs.some((l) => l.pain_flag)
            const red = sLogs.some((l) => l.technique_colour === 'red')
            const amber = sLogs.some((l) => l.technique_colour === 'amber')
            const pct = completionPercent(plan, s, sets.filter((x) => x.session_id === s.id), sLogs)
            return (
              <li key={s.id}>
                <Link to={`/coach/sessions/${s.id}`} className="flex min-h-16 items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-muted">{formatShort(s.date)} · {s.status === 'complete' ? `${pct}% complete` : 'In progress'}</span>
                    <span className="block text-xl font-extrabold">{plan.workouts.find((w) => w.id === s.workout_id)?.name ?? s.workout_id}</span>
                    <span className="mt-1 flex gap-2 text-sm font-semibold">
                      {pain && <span className="rounded-full bg-danger/20 px-2 py-0.5 text-danger">Pain</span>}
                      {red && <span className="rounded-full bg-danger/20 px-2 py-0.5 text-danger">Red</span>}
                      {amber && !red && <span className="rounded-full bg-warn/20 px-2 py-0.5 text-warn">Amber</span>}
                    </span>
                  </span>
                  <Icon name="chevron" className="size-6 shrink-0 text-muted" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Screen>
  )
}
