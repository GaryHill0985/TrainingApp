import { Link, useParams } from 'react-router'
import { Screen } from '../../ui/Screen'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { usePlan } from '../../plan/usePlan'
import { useAllLogs, useAllSets, useSessions } from '../trainee/data'
import { formatDuration, useActivityEntries, useFoodEntries, useMetricLogs } from '../lifelog/data'
import { formatLong, todayKey } from '../../lib/dates'
import { completionPercent } from '../coach/data'

/** Everything from one day: the gym session (link to the full log), activity, food, sleep and other metrics. */
export function DayDetail({ role }: { role: 'trainee' | 'coach' }) {
  const { date = todayKey() } = useParams()
  const plan = usePlan()
  const sessions = useSessions().filter((s) => s.date === date)
  const sets = useAllSets()
  const logs = useAllLogs()
  const activities = useActivityEntries().filter((a) => a.date === date)
  const foods = useFoodEntries().filter((f) => f.date === date)
  const metrics = useMetricLogs().filter((m) => m.date === date)
  const base = role === 'coach' ? '/coach' : '/lucas'
  const sessionLink = (id: string) => (role === 'coach' ? `/coach/sessions/${id}` : `/lucas/session/${id}`)
  const empty = sessions.length + activities.length + foods.length + metrics.length === 0

  return (
    <Screen title={formatLong(date)} backTo={`${base}/calendar`} backLabel="Calendar">
      {empty && <p className="text-muted">Nothing logged on this day.</p>}

      {sessions.map((s) => (
        <Link key={s.id} to={sessionLink(s.id)} className="block">
          <Card tone="accent">
            <p className="text-sm font-bold uppercase tracking-wide text-muted">Gym session</p>
            <p className="text-xl font-extrabold">{plan.workouts.find((w) => w.id === s.workout_id)?.name}</p>
            <p className="text-muted">{s.status === 'complete' ? `${completionPercent(plan, s, sets.filter((x) => x.session_id === s.id), logs.filter((l) => l.session_id === s.id))}% complete` : 'In progress'} · tap to see every set</p>
          </Card>
        </Link>
      ))}

      {activities.length > 0 && (
        <Card className="mt-3">
          <p className="text-sm font-bold uppercase tracking-wide text-muted">Activity</p>
          <ul className="mt-1 space-y-1">
            {activities.map((a) => <li key={a.id} className="font-semibold">{plan.activityTypes.find((t) => t.key === a.activity_type)?.label ?? a.activity_type}{a.distance_value != null ? ` · ${a.distance_value} ${a.distance_unit}` : ''}{a.duration_seconds != null ? ` · ${formatDuration(a.duration_seconds)}` : ''}{a.note ? <span className="font-normal text-muted"> · {a.note}</span> : null}</li>)}
          </ul>
        </Card>
      )}

      {foods.length > 0 && (
        <Card className="mt-3">
          <p className="text-sm font-bold uppercase tracking-wide text-muted">Food</p>
          <ul className="mt-1 space-y-1">
            {foods.map((f) => <li key={f.id}>{f.meal ? <span className="font-semibold">{f.meal}: </span> : null}{f.description}{f.calories != null ? <span className="text-muted"> · {f.calories} kcal</span> : null}</li>)}
          </ul>
        </Card>
      )}

      {metrics.length > 0 && (
        <Card className="mt-3">
          <p className="text-sm font-bold uppercase tracking-wide text-muted">Daily log</p>
          <ul className="mt-1 space-y-1">
            {metrics.map((m) => { const def = plan.metrics.find((d) => d.key === m.metric_key); return <li key={m.id}><span className="font-semibold">{def?.label ?? m.metric_key}:</span> {m.value_num}{def?.unit && !def.unit.includes('-') ? ` ${def.unit}` : ''}</li> })}
          </ul>
        </Card>
      )}

      {role === 'trainee' && <Link to={`/lucas/log/${date}`} className="mt-6 block"><Button variant="secondary" full icon="plus">{date === todayKey() ? 'Add to today' : 'Add to this day'}</Button></Link>}
    </Screen>
  )
}
