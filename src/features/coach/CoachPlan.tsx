import { useState } from 'react'
import { Link } from 'react-router'
import { Screen } from '../../ui/Screen'
import { Card } from '../../ui/Card'
import { Icon } from '../../ui/Icon'
import { PositionChip } from '../../ui/PositionChip'
import { usePlan } from '../../plan/usePlan'

/** Coach plan management: pick an exercise to set its video, photo and muscle data; advanced plan edits are separate. */
export function CoachPlan() {
  const plan = usePlan()
  const archived = plan.allWorkouts.filter((w) => w.archived)
  const [showArchived, setShowArchived] = useState(false)
  return (
    <Screen title="Plan">
      <p className="text-muted">{plan.meta.plan_name} · v{plan.meta.version}</p>
      {plan.meta.block_model && <Card className="mt-3"><p className="text-sm font-bold uppercase tracking-wide text-muted">How a block runs</p><p className="mt-1">{plan.meta.block_model}</p></Card>}
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

      {archived.length > 0 && (
        <section className="mt-10 border-t border-line pt-6">
          <h2 className="text-lg font-bold">Archived plans</h2>
          <p className="text-muted">Kept for the record. Lucas does not see these; his old sessions still show their names.</p>
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            aria-expanded={showArchived}
            className="tap mt-3 flex min-h-12 w-full items-center justify-between rounded-card border border-line bg-surface px-4 py-3 text-left"
          >
            <span className="font-bold">{archived[0].archive_note || 'Previous plan'} · {archived.length} workouts</span>
            <Icon name="chevron" className={`size-6 shrink-0 text-muted transition-transform ${showArchived ? 'rotate-90' : ''}`} />
          </button>
          {showArchived && archived.map((w) => (
            <div key={w.id} className="mt-5">
              <h3 className="font-bold">{w.name} <span className="font-normal text-muted">· {w.subtitle}</span></h3>
              <ul className="mt-2 space-y-1">
                {w.items.map((it) => {
                  const ex = plan.exercises[it.exercise_id]
                  return (
                    <li key={it.order} className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-surface2 px-3 py-2 text-muted">
                      <span className="font-semibold text-text">{ex?.name ?? it.exercise_id}</span>
                      <span>{it.sets} × {it.rep_range} · {it.effort_target} · rest {it.rest}</span>
                      <PositionChip position={it.position} technical size="sm" />
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </section>
      )}
    </Screen>
  )
}
