import { Link, Navigate, useParams } from 'react-router'
import { Screen } from '../../ui/Screen'
import { Card } from '../../ui/Card'
import { Icon } from '../../ui/Icon'
import { PositionChip } from '../../ui/PositionChip'
import { Collapsible } from '../../ui/Collapsible'
import { BulletList } from '../../ui/BulletList'
import { SyncBadge } from '../../sync/SyncBadge'
import { usePlan } from '../../plan/usePlan'
import { useSessions } from './data'
import { nextWorkoutId } from './logic'
import { DemoVideo, MachinePhoto } from './Media'
import { MuscleView } from './MuscleView'

/**
 * Lucas's read-only view of the whole plan: every workout in week order with its exercises,
 * sets, reps, effort and rest. Tapping an exercise opens its instructions without starting a session.
 */
export function TraineePlan() {
  const plan = usePlan()
  const sessions = useSessions()
  const next = nextWorkoutId(plan, sessions)
  return (
    <Screen title="Plan" right={<SyncBadge />}>
      <p className="text-muted">{plan.meta.plan_name}</p>
      <p className="mt-1 font-semibold">{plan.meta.mantra}</p>

      {plan.workouts.map((w, i) => (
        <section key={w.id} className="mt-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">{plan.week[i]?.day ?? `Day ${i + 1}`}{w.id === next ? ' · Next' : ''}</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight">{w.name}</h2>
          <p className="text-muted">{w.subtitle}</p>
          <p className="text-muted">{w.demand} · {w.items.length} exercises</p>
          <ul className="mt-3 space-y-2">
            {w.items.map((it) => {
              const ex = plan.exercises[it.exercise_id]
              if (!ex) return null
              return (
                <li key={it.order}>
                  <Link to={`/lucas/plan/exercise/${ex.id}`} className="flex min-h-16 items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3">
                    <span className="min-w-0">
                      <span className="block text-lg font-bold">{it.order}. {ex.name}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                        <PositionChip position={it.position} size="sm" />
                        <span>{it.sets} × {it.rep_range}</span>
                        <span>· {it.effort_target}</span>
                        <span>· rest {it.rest}</span>
                      </span>
                    </span>
                    <Icon name="chevron" className="size-6 shrink-0 text-muted" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      <Card className="mt-8">
        <p className="font-semibold">How the week works</p>
        <p className="mt-1 text-muted">Today always offers the next workout in this order. If you miss a day, nothing is skipped: the next one waits for you.</p>
      </Card>
    </Screen>
  )
}

/** The same instructions Lucas sees inside a session, but to read any time. No logging here. */
export function TraineeExerciseInfo() {
  const { exerciseId } = useParams()
  const plan = usePlan()
  const exercise = exerciseId ? plan.exercises[exerciseId] : undefined
  if (!exercise) return <Navigate to="/lucas/plan" replace />
  const usedIn = plan.workouts.flatMap((w) => w.items.filter((it) => it.exercise_id === exercise.id).map((it) => ({ w, it })))

  return (
    <Screen title="Exercise" backTo="/lucas/plan" backLabel="Plan" right={<SyncBadge />}>
      <h2 className="text-2xl font-extrabold leading-tight tracking-tight">{exercise.name}</h2>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <PositionChip position={exercise.position} />
      </div>
      <p className="mt-2 text-muted">{exercise.position_why}</p>

      {usedIn.length > 0 && (
        <Card className="mt-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">In your plan</p>
          {usedIn.map(({ w, it }) => (
            <p key={w.id} className="mt-1"><span className="font-bold">{w.name}:</span> {it.sets} × {it.rep_range} · {it.effort_target} · rest {it.rest}</p>
          ))}
        </Card>
      )}

      <section className="mt-6">
        <h3 className="text-lg font-bold">What it trains</h3>
        <p className="mt-1">{exercise.trains}</p>
      </section>

      {exercise.alternatives.length > 0 && (
        <section className="mt-6">
          <h3 className="text-lg font-bold">If the machine is busy</h3>
          <p className="text-muted">In a session you can swap to one of these. They work the same muscles.</p>
          <ul className="mt-2 space-y-2">
            {exercise.alternatives.map((id) => plan.exercises[id]).filter(Boolean).map((alt) => (
              <li key={alt.id}>
                <Link to={`/lucas/plan/exercise/${alt.id}`} className="flex min-h-14 items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3">
                  <span className="min-w-0"><span className="block font-bold">{alt.name}</span><span className="mt-1 block"><PositionChip position={alt.position} size="sm" /></span></span>
                  <Icon name="chevron" className="size-6 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <DemoVideo exercise={exercise} />
      <MachinePhoto exercise={exercise} />

      <div className="mt-6">
        <Collapsible title="Find the machine" defaultOpen><p>{exercise.find_equipment}</p></Collapsible>
        <Collapsible title="Set the machine up"><BulletList items={exercise.setup} /></Collapsible>
        <Collapsible title="Starting position"><BulletList items={exercise.starting_position} /></Collapsible>
        <Collapsible title="Do the rep" defaultOpen><BulletList items={exercise.how_to_rep} /></Collapsible>
        <Collapsible title="You should feel">
          <p><span className="font-bold text-ok">Do: </span>{exercise.feel_do}</p>
          <p className="mt-2"><span className="font-bold text-danger">Don't: </span>{exercise.feel_dont}</p>
        </Collapsible>
        <Collapsible title="Common mistakes"><BulletList items={exercise.common_mistakes} /></Collapsible>
        <Collapsible title="Stop the set when" alwaysOpen><BulletList items={exercise.stop_set_when} /></Collapsible>
        <Collapsible title="Easier option (if the machine is busy)"><p>{exercise.easier_option}</p></Collapsible>
        <Collapsible title="Progress when"><p>{exercise.progress_when}</p></Collapsible>
        <MuscleView exercise={exercise} />
      </div>
    </Screen>
  )
}
