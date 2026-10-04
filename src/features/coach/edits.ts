import { db } from '../../db/db'
import { putRow } from '../../db/write'
import type { ExerciseRow, MetricDefinitionRow, MuscleRow, WorkoutItemRow } from '../../db/types'
import type { MuscleRole } from '../../plan/types'

/**
 * Coach edits to plan content. Every edit records which fields the coach changed
 * (coach_edited_fields / coach_edited) so a re-run of the seed import never clobbers them.
 */

function withEdited(existing: string[], keys: string[]) {
  return [...new Set([...existing, ...keys])]
}

export async function editExercise(id: string, patch: Partial<ExerciseRow>) {
  const row = await db.exercises.get(id)
  if (!row) return
  const keys = Object.keys(patch)
  await putRow('exercises', { ...row, ...patch, coach_edited_fields: withEdited(row.coach_edited_fields, keys) })
}

export async function setExerciseMuscles(exerciseId: string, role: MuscleRole, muscleIds: string[]) {
  const existing = await db.exercise_muscles.where({ exercise_id: exerciseId }).filter((r) => r.role === role).toArray()
  const now = new Date().toISOString()
  for (const r of existing) {
    if (!muscleIds.includes(r.muscle_id)) {
      await db.exercise_muscles.delete([r.exercise_id, r.muscle_id, r.role])
      await db.outbox.add({ table: 'exercise_muscles', row_id: `${r.exercise_id}|${r.muscle_id}|${r.role}`, payload: { ...r, __delete: true }, created_at: now, attempts: 0 })
    }
  }
  for (const m of muscleIds) {
    if (!existing.some((r) => r.muscle_id === m)) await putRow('exercise_muscles', { exercise_id: exerciseId, muscle_id: m, role, updated_at: now })
  }
  // Mark the involvement as coach-owned so the seed import leaves it alone.
  const ex = await db.exercises.get(exerciseId)
  if (ex && !ex.coach_edited_fields.includes('muscle_involvement')) {
    await putRow('exercises', { ...ex, coach_edited_fields: [...ex.coach_edited_fields, 'muscle_involvement'] })
  }
}

export async function editMuscle(id: string, patch: Partial<MuscleRow>) {
  const row = await db.muscles.get(id)
  if (!row) return
  await putRow('muscles', { ...row, ...patch, coach_edited_fields: withEdited(row.coach_edited_fields, Object.keys(patch)) })
}

export async function editWorkoutItem(id: string, patch: Partial<WorkoutItemRow>) {
  const row = await db.workout_items.get(id)
  if (!row) return
  await putRow('workout_items', { ...row, ...patch, coach_edited: true })
}

export async function editMetric(key: string, patch: Partial<MetricDefinitionRow>) {
  const row = await db.metric_definitions.get(key)
  if (!row) return
  await putRow('metric_definitions', { ...row, ...patch, coach_edited_fields: withEdited(row.coach_edited_fields, Object.keys(patch)) })
}

export async function addMetric(def: Omit<MetricDefinitionRow, 'coach_edited_fields' | 'updated_at' | 'sort_order'>) {
  const count = await db.metric_definitions.count()
  await putRow('metric_definitions', { ...def, sort_order: count, coach_edited_fields: Object.keys(def), updated_at: new Date().toISOString() })
}

/** Whole-document settings (events, goals, theme choice, week mapping, app options). */
export async function editSetting(key: string, value: unknown) {
  await putRow('plan_settings', { key, value, coach_edited: true, updated_at: new Date().toISOString() })
}
