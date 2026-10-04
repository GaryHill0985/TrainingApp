import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Screen } from '../../ui/Screen'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Field } from '../../ui/Field'
import { usePlan } from '../../plan/usePlan'
import { db } from '../../db/db'
import { editSetting, editWorkoutItem } from './edits'
import type { WorkoutItemRow } from '../../db/types'

/** Guarded editing of the plan itself: sets, rep ranges, rest, effort, warm-ups, and the day → workout mapping. */
export function CoachAdvanced() {
  const plan = usePlan()
  const items = useLiveQuery(() => db.workout_items.toArray(), []) ?? []
  const [unlocked, setUnlocked] = useState(false)

  if (!unlocked) {
    return (
      <Screen title="Advanced plan edits" backTo="/coach/plan" backLabel="Plan">
        <Card tone="warn">
          <p className="text-lg font-bold">These change what Lucas sees in his sessions.</p>
          <p className="mt-2 text-muted">Edits are saved straight away and kept even if the plan file is re-imported. The exercise instructions themselves come from the plan file and are not edited here.</p>
        </Card>
        <Button variant="secondary" size="lg" full className="mt-6" onClick={() => setUnlocked(true)}>I understand, open the editor</Button>
      </Screen>
    )
  }

  return (
    <Screen title="Advanced plan edits" backTo="/coach/plan" backLabel="Plan">
      <section>
        <h2 className="text-lg font-bold">Week</h2>
        <p className="text-muted">Which workout each training day points to.</p>
        <ul className="mt-2 space-y-2">
          {plan.week.map((d, i) => (
            <li key={d.day} className="flex items-center gap-3">
              <span className="w-16 font-semibold">{d.day}</span>
              <select
                value={d.workout}
                onChange={(e) => { const week = plan.week.map((x, j) => (j === i ? { ...x, workout: e.target.value } : x)); void editSetting('week', week) }}
                className="min-h-12 flex-1 rounded-control border border-line bg-surface2 px-3 text-lg"
              >
                {plan.workouts.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </li>
          ))}
        </ul>
      </section>

      {plan.workouts.map((w) => (
        <section key={w.id} className="mt-8">
          <h2 className="text-lg font-bold">{w.name}</h2>
          <ul className="mt-2 space-y-3">
            {items.filter((i) => i.workout_id === w.id && !i.deleted).sort((a, b) => a.order - b.order).map((it) => <ItemEditor key={it.id} item={it} name={plan.exercises[it.exercise_id]?.name ?? it.exercise_id} />)}
          </ul>
        </section>
      ))}
    </Screen>
  )
}

function ItemEditor({ item, name }: { item: WorkoutItemRow; name: string }) {
  const [draft, setDraft] = useState({ sets: String(item.sets), rep_range: item.rep_range, rest: item.rest, effort_target: item.effort_target, warmup_sets: String(item.warmup_sets) })
  const dirty = draft.sets !== String(item.sets) || draft.rep_range !== item.rep_range || draft.rest !== item.rest || draft.effort_target !== item.effort_target || draft.warmup_sets !== String(item.warmup_sets)
  async function save() {
    await editWorkoutItem(item.id, { sets: Math.max(1, Number(draft.sets) || 1), rep_range: draft.rep_range.trim(), rest: draft.rest.trim(), effort_target: draft.effort_target.trim(), warmup_sets: Number(draft.warmup_sets) || 0 })
  }
  return (
    <li>
      <Card>
        <p className="font-bold">{item.order}. {name}{item.coach_edited && <span className="ml-2 text-sm font-semibold text-accent">edited</span>}</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Sets" type="number" inputMode="numeric" value={draft.sets} onChange={(e) => setDraft({ ...draft, sets: e.target.value })} />
          <Field label="Rep range" value={draft.rep_range} onChange={(e) => setDraft({ ...draft, rep_range: e.target.value })} />
          <Field label="Rest" value={draft.rest} onChange={(e) => setDraft({ ...draft, rest: e.target.value })} />
          <Field label="Effort target" value={draft.effort_target} onChange={(e) => setDraft({ ...draft, effort_target: e.target.value })} />
          <Field label="Warm-up sets" type="number" inputMode="decimal" step={0.5} value={draft.warmup_sets} onChange={(e) => setDraft({ ...draft, warmup_sets: e.target.value })} />
        </div>
        {dirty && <Button variant="primary" className="mt-3" onClick={save}>Save changes</Button>}
      </Card>
    </li>
  )
}
