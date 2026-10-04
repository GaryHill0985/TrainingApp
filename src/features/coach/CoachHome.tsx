import { Link } from 'react-router'
import { Screen } from '../../ui/Screen'
import { Card } from '../../ui/Card'
import { Icon } from '../../ui/Icon'
import { SyncBadge } from '../../sync/SyncBadge'
import { usePlan } from '../../plan/usePlan'
import { useAllLogs, useAllSets, useSessions } from '../trainee/data'
import { completionPercent, recentFlags, thisWeek } from './data'
import { formatShort } from '../../lib/dates'
import { useSyncStatus } from '../../sync/useSync'

const flagLabel = { red: 'Red technique', pain: 'Something hurt', back_extension: 'Weight added on back extension' } as const

export function CoachHome() {
  const plan = usePlan()
  const sessions = useSessions()
  const sets = useAllSets()
  const logs = useAllLogs()
  const sync = useSyncStatus()
  const flags = recentFlags(sessions, logs)
  const week = thisWeek(sessions)
  const last = [...sessions].filter((s) => s.status === 'complete').sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))[0]
  const live = sessions.find((s) => s.status === 'in_progress')

  return (
    <Screen title="Coach" right={<span className="flex items-center gap-2"><SyncBadge /><Link to="/coach/settings" className="tap inline-flex items-center justify-center rounded-control text-muted" aria-label="Settings"><Icon name="settings" className="size-6" /></Link></span>}>
      {!sync.paired && (
        <Card tone="warn" className="mb-4">
          <p className="font-semibold">This phone is not connected to the cloud, so nothing from Lucas can arrive yet.</p>
          <p className="mt-1 text-muted">Use Switch user to connect it with your coach account.</p>
        </Card>
      )}

      <section>
        <h2 className="text-lg font-bold">Needs attention</h2>
        {flags.length === 0 ? (
          <Card className="mt-2"><p className="text-lg font-semibold text-ok">All good.</p><p className="text-muted">No pain flags, red technique or loading changes in the last two weeks.</p></Card>
        ) : (
          <ul className="mt-2 space-y-2">
            {flags.map((f, i) => (
              <li key={i}>
                <Link to={`/coach/sessions/${f.session.id}`} className={`block rounded-card border-2 bg-surface p-4 ${f.kind === 'back_extension' ? 'border-warn' : 'border-danger'}`}>
                  <p className={`text-sm font-bold uppercase tracking-wide ${f.kind === 'back_extension' ? 'text-warn' : 'text-danger'}`}>{flagLabel[f.kind]}</p>
                  <p className="mt-1 text-lg font-bold">{plan.exercises[f.exercise_id]?.name ?? f.exercise_id}</p>
                  <p className="text-muted">{formatShort(f.session.date)} · {plan.workouts.find((w) => w.id === f.session.workout_id)?.name}</p>
                  {f.note && <p className="mt-1">“{f.note}”</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {live && (
        <Card tone="accent" className="mt-6">
          <p className="text-sm font-bold uppercase tracking-wide text-accent">Training now</p>
          <p className="mt-1 text-xl font-extrabold">{plan.workouts.find((w) => w.id === live.workout_id)?.name}</p>
          <p className="text-muted">{completionPercent(plan, live, sets.filter((s) => s.session_id === live.id), logs.filter((l) => l.session_id === live.id))}% of exercises done so far</p>
          <Link to={`/coach/sessions/${live.id}`} className="mt-2 inline-block font-semibold text-accent">Watch this session</Link>
        </Card>
      )}

      <section className="mt-6">
        <h2 className="text-lg font-bold">This week</h2>
        <Card className="mt-2">
          <p className="text-3xl font-extrabold">{week.done} of {plan.workouts.length}</p>
          <p className="text-muted">sessions done since {formatShort(week.start)}</p>
          <p className="mt-2 text-muted">Last session: {last ? `${formatShort(last.date)} · ${plan.workouts.find((w) => w.id === last.workout_id)?.name}` : 'none yet'}</p>
        </Card>
      </section>

      {last && (
        <section className="mt-6">
          <h2 className="text-lg font-bold">Last session</h2>
          <Link to={`/coach/sessions/${last.id}`} className="mt-2 block">
            <Card className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-xl font-extrabold">{plan.workouts.find((w) => w.id === last.workout_id)?.name}</span>
                <span className="block text-muted">{formatShort(last.date)} · {completionPercent(plan, last, sets.filter((s) => s.session_id === last.id), logs.filter((l) => l.session_id === last.id))}% complete</span>
                {last.overall_note && <span className="mt-1 block">“{last.overall_note}”</span>}
              </span>
              <Icon name="chevron" className="size-6 shrink-0 text-muted" />
            </Card>
          </Link>
        </section>
      )}
    </Screen>
  )
}
