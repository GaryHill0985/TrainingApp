import { Link, Navigate, useParams } from 'react-router'
import { Screen } from '../../ui/Screen'
import { Button } from '../../ui/Button'
import { Icon } from '../../ui/Icon'
import { PositionChip } from '../../ui/PositionChip'
import { SyncBadge } from '../../sync/SyncBadge'
import { usePlan } from '../../plan/usePlan'
import { useSession, useSessionLogs, useSessionSets } from './data'
import { exerciseProgress } from './logic'

export function SessionScreen() {
  const { sessionId } = useParams()
  const plan = usePlan()
  const session = useSession(sessionId)
  const sets = useSessionSets(sessionId)
  const logs = useSessionLogs(sessionId)

  if (session === undefined) return <Screen title="Session" backTo="/lucas"><p className="text-muted">Loading…</p></Screen>
  if (!session) return <Navigate to="/lucas" replace />
  const workout = plan.workouts.find((w) => w.id === session.workout_id)
  if (!workout) return <Navigate to="/lucas" replace />

  const progress = workout.items.map((it) => exerciseProgress(it, sets, logs))
  const doneCount = progress.filter((p) => p.complete).length
  const total = workout.items.length
  const allDone = doneCount === total
  const isComplete = session.status === 'complete'

  return (
    <Screen
      title={workout.name}
      backTo={isComplete ? '/lucas/history' : '/lucas'}
      backLabel={isComplete ? 'History' : 'Today'}
      right={<SyncBadge />}
      footer={
        isComplete ? undefined : (
          <Link to={`/lucas/session/${session.id}/finish`} className="block">
            <Button variant={allDone ? 'primary' : 'secondary'} size="lg" full icon="tick">{allDone ? "I'm done" : 'Finish early'}</Button>
          </Link>
        )
      }
    >
      <p className="text-muted">{workout.subtitle}</p>
      <p className="mt-1 font-semibold">{doneCount} of {total} exercises done</p>

      <ol className="mt-4 space-y-3">
        {workout.items.map((it, i) => {
          const ex = plan.exercises[it.exercise_id]
          const p = progress[i]
          const started = p.workingDone > 0 && !p.complete
          return (
            <li key={it.order}>
              <Link
                to={`/lucas/session/${session.id}/exercise/${it.order}`}
                className={`flex min-h-20 items-center gap-3 rounded-card border-2 bg-surface px-4 py-3 ${p.complete ? 'border-ok' : started ? 'border-accent' : 'border-line'}`}
              >
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-extrabold ${p.complete ? 'bg-ok text-on-accent' : 'bg-surface2 text-muted'}`} aria-hidden="true">
                  {p.complete ? <Icon name="tick" className="size-6" /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-muted">Exercise {i + 1} of {total}{p.complete ? ' · Done' : started ? ` · ${p.workingDone} of ${it.sets} sets` : ''}</span>
                  <span className="block text-xl font-extrabold leading-tight">{ex?.name ?? it.exercise_id}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-2">
                    <PositionChip position={it.position} size="sm" />
                    <span className="text-muted">{it.sets} × {it.rep_range}</span>
                  </span>
                </span>
                <Icon name="chevron" className="size-6 shrink-0 text-muted" />
              </Link>
            </li>
          )
        })}
      </ol>
    </Screen>
  )
}
