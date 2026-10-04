import { Link } from 'react-router'
import { Screen } from '../../ui/Screen'
import { Card } from '../../ui/Card'
import { Icon } from '../../ui/Icon'
import { PositionChip } from '../../ui/PositionChip'
import { usePlan } from '../../plan/usePlan'

/** Coach plan management: pick an exercise to set its video, photo and muscle data; advanced plan edits are separate. */
export function CoachPlan() {
  const plan = usePlan()
  return (
    <Screen title="Plan">
      <p className="text-muted">{plan.meta.plan_name} · v{plan.meta.version}</p>
      <Link to="/coach/plan/advanced" className="mt-3 block">
        <Card className="flex items-center justify-between gap-3">
          <span><span className="block font-bold">Advanced: edit sets, reps, rest and the week</span><span className="block text-muted">Guarded. Changes what Lucas sees.</span></span>
          <Icon name="chevron" className="size-6 shrink-0 text-muted" />
        </Card>
      </Link>

      {plan.workouts.map((w) => (
        <section key={w.id} className="mt-6">
          <h2 className="text-lg font-bold">{w.name} <span className="font-normal text-muted">· {w.subtitle}</span></h2>
          <ul className="mt-2 space-y-2">
            {w.items.map((it) => {
              const ex = plan.exercises[it.exercise_id]
              if (!ex) return null
              return (
                <li key={it.order}>
                  <Link to={`/coach/plan/exercise/${ex.id}`} className="flex min-h-16 items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3">
                    <span className="min-w-0">
                      <span className="block text-lg font-bold">{ex.name}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                        <PositionChip position={it.position} technical size="sm" />
                        <span>{ex.video_url ? 'Video set' : 'No video'}</span>
                        <span>· {ex.photo_url ? 'Photo set' : ex.needs_photo ? 'No photo' : 'No photo needed'}</span>
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
    </Screen>
  )
}
