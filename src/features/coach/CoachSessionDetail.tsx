import { Navigate, useParams } from 'react-router'
import { Screen } from '../../ui/Screen'
import { Card } from '../../ui/Card'
import { PositionChip } from '../../ui/PositionChip'
import { usePlan } from '../../plan/usePlan'
import { useSession, useSessionLogs, useSessionSets } from '../trainee/data'
import { formatLong, formatTime } from '../../lib/dates'
import { logSpecFor } from '../../plan/logType'
import type { TechniqueColour } from '../../plan/types'

const colourText: Record<TechniqueColour, string> = { green: 'text-ok', amber: 'text-warn', red: 'text-danger' }
const colourDot: Record<TechniqueColour, string> = { green: '🟢', amber: '🟡', red: '🔴' }

/** Exactly what Lucas recorded: every exercise, every set, warm-ups marked, colours, flags, notes. */
export function CoachSessionDetail() {
  const { sessionId } = useParams()
  const plan = usePlan()
  const session = useSession(sessionId)
  const sets = useSessionSets(sessionId)
  const logs = useSessionLogs(sessionId)
  if (session === undefined) return <Screen title="Session" backTo="/coach/sessions"><p className="text-muted">Loading…</p></Screen>
  if (!session) return <Navigate to="/coach/sessions" replace />
  const workout = plan.workouts.find((w) => w.id === session.workout_id)

  return (
    <Screen title={workout?.name ?? session.workout_id} backTo="/coach/sessions" backLabel="Sessions">
      <p className="text-muted">{formatLong(session.date)} · started {formatTime(session.started_at)}{session.completed_at ? `, finished ${formatTime(session.completed_at)}` : ' · in progress'}</p>
      {session.overall_note && <Card className="mt-3"><p className="text-sm font-bold uppercase tracking-wide text-muted">Lucas's note</p><p className="mt-1">{session.overall_note}</p></Card>}

      <ol className="mt-4 space-y-3">
        {(workout?.items ?? []).map((it, i) => {
          const ex = plan.exercises[it.exercise_id]
          const spec = logSpecFor(it)
          const mine = sets.filter((s) => s.exercise_id === it.exercise_id).sort((a, b) => Number(b.is_warmup) - Number(a.is_warmup) || a.set_number - b.set_number || (a.side ?? '').localeCompare(b.side ?? ''))
          const log = logs.find((l) => l.exercise_id === it.exercise_id)
          const flagged = log?.pain_flag || log?.technique_colour === 'red' || log?.back_extension_weight_flag
          return (
            <li key={it.order}>
              <Card tone={flagged ? 'danger' : 'default'}>
                <p className="text-sm font-semibold text-muted">Exercise {i + 1} of {workout?.items.length}</p>
                <p className="text-xl font-extrabold">{ex?.name ?? it.exercise_id}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-muted"><PositionChip position={it.position} technical size="sm" /><span>{it.sets} × {it.rep_range} · {it.effort_target}</span></div>
                {mine.length === 0 ? <p className="mt-2 text-muted">Not logged.</p> : (
                  <table className="mt-3 w-full text-left">
                    <tbody>
                      {mine.map((s) => (
                        <tr key={s.id} className={`border-t border-line ${s.is_warmup ? 'text-muted' : ''}`}>
                          <td className="py-1.5 pr-2">{s.is_warmup ? `Warm-up ${s.set_number}` : `Set ${s.set_number}`}{s.side ? ` (${s.side})` : ''}</td>
                          <td className="py-1.5 pr-2 font-semibold tabular-nums">{spec.hasWeight ? (s.weight == null ? 'bodyweight' : `${s.weight} kg`) : ''}</td>
                          <td className="py-1.5 font-semibold tabular-nums">{s.reps_done ?? '—'} {spec.unitLabel.toLowerCase()}</td>
                          <td className="py-1.5 text-right text-sm text-muted">{formatTime(s.logged_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {log && (
                  <div className="mt-3 space-y-1">
                    {log.technique_colour && <p className={`font-semibold ${colourText[log.technique_colour]}`}>{colourDot[log.technique_colour]} {plan.meta.technique_colours[log.technique_colour]}</p>}
                    {log.pain_flag && <p className="font-bold text-danger">Something hurt</p>}
                    {log.back_extension_weight_flag && <p className="font-bold text-warn">Weight was added on this exercise. Check with Lucas.</p>}
                    {log.note && <p>“{log.note}”</p>}
                  </div>
                )}
              </Card>
            </li>
          )
        })}
      </ol>
    </Screen>
  )
}
