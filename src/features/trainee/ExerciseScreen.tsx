import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { Screen } from '../../ui/Screen'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { PositionChip } from '../../ui/PositionChip'
import { Collapsible } from '../../ui/Collapsible'
import { BulletList } from '../../ui/BulletList'
import { SyncBadge } from '../../sync/SyncBadge'
import { usePlan } from '../../plan/usePlan'
import { useAllLogs, useAllSets, useSession, useSessionLogs, useSessionSets, useSessions, saveExerciseLog } from './data'
import { exerciseProgress } from './logic'
import { DemoVideo, MachinePhoto } from './Media'
import { MuscleView } from './MuscleView'
import { LogPanel } from './LogPanel'
import { TechniquePrompt } from './TechniquePrompt'

const OPENED_KEY = 'lt.opened_exercises'
function wasOpened(id: string) { try { return (JSON.parse(localStorage.getItem(OPENED_KEY) ?? '[]') as string[]).includes(id) } catch { return false } }
function markOpened(id: string) { try { const a = JSON.parse(localStorage.getItem(OPENED_KEY) ?? '[]') as string[]; if (!a.includes(id)) localStorage.setItem(OPENED_KEY, JSON.stringify([...a, id])) } catch { /* ignore */ } }

export function ExerciseScreen() {
  const { sessionId, order } = useParams()
  const plan = usePlan()
  const session = useSession(sessionId)
  const sets = useSessionSets(sessionId)
  const logs = useSessionLogs(sessionId)
  const allSets = useAllSets()
  const allLogs = useAllLogs()
  const sessions = useSessions()

  const workout = session ? plan.workouts.find((w) => w.id === session.workout_id) : undefined
  const idx = workout ? workout.items.findIndex((i) => String(i.order) === order) : -1
  const item = workout && idx >= 0 ? workout.items[idx] : undefined
  const exercise = item ? plan.exercises[item.exercise_id] : undefined
  // Sections open on the first visit to an exercise, collapsed after that. Resolved once the exercise is known.
  const [firstTime, setFirstTime] = useState<boolean | null>(null)
  useEffect(() => {
    if (exercise && firstTime === null) { setFirstTime(!wasOpened(exercise.id)); markOpened(exercise.id) }
  }, [exercise, firstTime])

  const progress = useMemo(() => (item ? exerciseProgress(item, sets, logs) : null), [item, sets, logs])

  if (session === undefined) return <Screen title="Exercise" backTo="/lucas"><p className="text-muted">Loading…</p></Screen>
  if (!session || !workout || !item || !exercise || !progress) return <Navigate to={sessionId ? `/lucas/session/${sessionId}` : '/lucas'} replace />

  const total = workout.items.length
  const next = workout.items[idx + 1]
  const readOnly = session.status === 'complete'
  const allSetsLogged = progress.workingDone >= item.sets
  const log = progress.log

  return (
    <Screen
      title={`Exercise ${idx + 1} of ${total}`}
      backTo={`/lucas/session/${session.id}`}
      backLabel="List"
      right={<SyncBadge />}
      footer={
        !readOnly && progress.complete ? (
          <Link to={next ? `/lucas/session/${session.id}/exercise/${next.order}` : `/lucas/session/${session.id}`} className="block">
            <Button variant="primary" size="lg" full iconRight="chevron">{next ? `Next: ${plan.exercises[next.exercise_id]?.name ?? 'exercise'}` : 'Back to the list'}</Button>
          </Link>
        ) : undefined
      }
    >
      <h2 className="text-2xl font-extrabold leading-tight tracking-tight">{exercise.name}</h2>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <PositionChip position={exercise.position} />
        <span className="text-muted">{item.sets} × {item.rep_range} · rest {item.rest}</span>
      </div>
      <p className="mt-2 text-muted">{exercise.position_why}</p>
      <p className="mt-1 text-muted">Effort: {item.effort_target}</p>

      <section className="mt-5">
        <h3 className="text-lg font-bold">What it trains</h3>
        <p className="mt-1">{exercise.trains}</p>
      </section>

      <DemoVideo exercise={exercise} />
      <MachinePhoto exercise={exercise} />

      {firstTime !== null && <div className="mt-6">
        <Collapsible title="Find the machine" defaultOpen={firstTime}><p>{exercise.find_equipment}</p></Collapsible>
        <Collapsible title="Set the machine up" defaultOpen={firstTime}><BulletList items={exercise.setup} /></Collapsible>
        <Collapsible title="Starting position" defaultOpen={firstTime}><BulletList items={exercise.starting_position} /></Collapsible>
        <Collapsible title="Do the rep" defaultOpen={firstTime}><BulletList items={exercise.how_to_rep} /></Collapsible>
        <Collapsible title="You should feel" defaultOpen={firstTime}>
          <p><span className="font-bold text-ok">Do: </span>{exercise.feel_do}</p>
          <p className="mt-2"><span className="font-bold text-danger">Don't: </span>{exercise.feel_dont}</p>
        </Collapsible>
        <Collapsible title="Common mistakes" defaultOpen={firstTime}><BulletList items={exercise.common_mistakes} /></Collapsible>
        <Collapsible title="Stop the set when" alwaysOpen><BulletList items={exercise.stop_set_when} /></Collapsible>
        <Collapsible title="Easier option (if the machine is busy)" defaultOpen={firstTime}><p>{exercise.easier_option}</p></Collapsible>
        <Collapsible title="Progress when" defaultOpen={firstTime}><p>{exercise.progress_when}</p></Collapsible>
        <MuscleView exercise={exercise} />
      </div>}

      <section className="mt-8 border-t-2 border-line pt-5" id="log">
        <h3 className="text-xl font-extrabold">Log your sets</h3>
        <LogPanel session={session} item={item} exercise={exercise} sets={sets} allSets={allSets} allLogs={allLogs} sessions={sessions} readOnly={readOnly} />
        {(allSetsLogged || log?.technique_colour) && (
          readOnly ? (
            <Card className="mt-4">
              <p className="font-semibold">Technique: {log?.technique_colour ? plan.meta.technique_colours[log.technique_colour] : 'not recorded'}</p>
              {log?.pain_flag && <p className="mt-1 font-semibold text-danger">Something hurt</p>}
              {log?.note && <p className="mt-1 text-muted">Note: {log.note}</p>}
            </Card>
          ) : (
            <TechniquePrompt exercise={exercise} log={log} onChange={(patch) => void saveExerciseLog(session.id, exercise.id, patch)} />
          )
        )}
        {!readOnly && progress.complete && (
          <p className="mt-4 text-center text-lg font-bold text-ok">Exercise done. Saved.</p>
        )}
      </section>
    </Screen>
  )
}
