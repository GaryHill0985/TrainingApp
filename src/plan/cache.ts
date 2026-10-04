import { db } from '../db/db'
import { seed } from './seed'
import type { ExerciseRow, WorkoutItemRow } from '../db/types'

/**
 * Make sure the local plan tables have content even before the first cloud sync
 * (first launch with no signal). Writes the bundled seed only into empty tables,
 * so synced coach edits are never overwritten.
 */
export async function ensurePlanCache() {
  const now = new Date().toISOString()
  if ((await db.exercises.count()) === 0) {
    const rows: ExerciseRow[] = Object.values(seed.exercises).map((e) => ({
      ...e, mm_reference: e.mm_reference ?? '', coach_edited_fields: [], updated_at: now,
    }))
    await db.exercises.bulkPut(rows)
    await db.exercise_muscles.bulkPut(
      Object.values(seed.exercises).flatMap((e) => [
        ...e.muscle_involvement.prime_movers.map((m) => ({ exercise_id: e.id, muscle_id: m, role: 'prime' as const, updated_at: now })),
        ...e.muscle_involvement.synergists.map((m) => ({ exercise_id: e.id, muscle_id: m, role: 'synergist' as const, updated_at: now })),
        ...e.muscle_involvement.stabilisers.map((m) => ({ exercise_id: e.id, muscle_id: m, role: 'stabiliser' as const, updated_at: now })),
      ]),
    )
  }
  if ((await db.workouts.count()) === 0) {
    await db.workouts.bulkPut(seed.workouts.map((w, i) => ({ id: w.id, name: w.name, subtitle: w.subtitle, demand: w.demand, sort_order: i, coach_edited_fields: [], updated_at: now })))
    const items: WorkoutItemRow[] = seed.workouts.flatMap((w) => w.items.map((it) => ({
      id: `${w.id}:${it.order}`, workout_id: w.id, order: it.order, exercise_id: it.exercise_id, sets: it.sets,
      rep_range: it.rep_range, rest: it.rest, effort_target: it.effort_target, warmup_sets: it.warmup_sets,
      position: it.position, coach_edited: false, deleted: false, updated_at: now,
    })))
    await db.workout_items.bulkPut(items)
  }
  if ((await db.muscles.count()) === 0) {
    await db.muscles.bulkPut(Object.values(seed.muscles).map((m) => ({ ...m, coach_edited_fields: [], updated_at: now })))
  }
  if ((await db.metric_definitions.count()) === 0) {
    await db.metric_definitions.bulkPut(seed.metrics.map((m, i) => ({ ...m, note: m.note ?? '', sort_order: i, coach_edited_fields: [], updated_at: now })))
  }
  if ((await db.activity_types.count()) === 0) {
    await db.activity_types.bulkPut(seed.activity_types.map((a, i) => ({ ...a, note: a.note ?? '', sort_order: i, updated_at: now })))
  }
  if ((await db.plan_settings.count()) === 0) {
    await db.plan_settings.bulkPut([
      { key: 'meta', value: seed.meta, coach_edited: false, updated_at: now },
      { key: 'goals', value: seed.goals, coach_edited: false, updated_at: now },
      { key: 'events', value: seed.events, coach_edited: false, updated_at: now },
      { key: 'theme', value: seed.theme, coach_edited: false, updated_at: now },
      { key: 'positions', value: seed.positions, coach_edited: false, updated_at: now },
      { key: 'week', value: seed.meta.week, coach_edited: false, updated_at: now },
    ])
  }
}
