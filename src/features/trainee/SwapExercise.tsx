import { useState } from 'react'
import type { SessionRow } from '../../db/types'
import type { Exercise, WorkoutItem } from '../../plan/types'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { PositionChip } from '../../ui/PositionChip'
import { usePlan } from '../../plan/usePlan'
import { saveExerciseLog } from './data'

interface Props {
  session: SessionRow
  /** The exercise the plan asked for. */
  planned: WorkoutItem
  /** The exercise currently being done (the planned one, or the swap). */
  current: Exercise
  /** False once a set has been logged on the current exercise: the choice is then fixed for this session. */
  canChange: boolean
}

/**
 * Machine busy? Lucas picks one of the exercise's listed replacements. The choice is saved on the
 * planned exercise's log for this session, and sets are logged under the replacement.
 */
export function SwapExercise({ session, planned, current, canChange }: Props) {
  const plan = usePlan()
  const [open, setOpen] = useState(false)
  const plannedEx = plan.exercises[planned.exercise_id]
  const swapped = current.id !== planned.exercise_id
  const options = (plannedEx?.alternatives ?? []).map((id) => plan.exercises[id]).filter((e): e is Exercise => Boolean(e))

  async function choose(id: string | null) {
    await saveExerciseLog(session.id, planned.exercise_id, { swapped_to: id })
    setOpen(false)
  }

  if (swapped) {
    return (
      <Card tone="raised" className="mt-4">
        <p className="font-semibold">Swapped in for {plannedEx?.name ?? planned.exercise_id}.</p>
        <p className="text-muted">Same muscles, same sets and reps. Your sets are saved under this exercise.</p>
        {canChange && <Button variant="quiet" className="mt-2" onClick={() => void choose(null)}>Go back to {plannedEx?.name ?? 'the planned exercise'}</Button>}
      </Card>
    )
  }
  if (!canChange || options.length === 0) return null

  return (
    <div className="mt-4">
      {!open ? (
        <Button variant="secondary" full onClick={() => setOpen(true)}>Machine busy? Choose another exercise</Button>
      ) : (
        <Card tone="raised">
          <p className="font-semibold">Pick one. They all work the same muscles.</p>
          <ul className="mt-3 space-y-2">
            {options.map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => void choose(e.id)} className="flex min-h-16 w-full items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3 text-left">
                  <span className="min-w-0">
                    <span className="block text-lg font-bold">{e.name}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted"><PositionChip position={e.position} size="sm" /><span>{e.trains}</span></span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <Button variant="quiet" className="mt-3" onClick={() => setOpen(false)}>Keep {current.name}</Button>
        </Card>
      )}
    </div>
  )
}
