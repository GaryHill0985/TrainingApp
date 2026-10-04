import Dexie, { type EntityTable } from 'dexie'
import type {
  ActivityEntryRow, ActivityTypeRow, ExerciseLogRow, ExerciseMuscleRow, ExerciseRow, FoodEntryRow,
  MetaRow, MetricDefinitionRow, MetricLogRow, MilestoneProgressRow, MuscleRow, OutboxRow, PlanSettingRow,
  ProfileRow, SessionRow, SetLogRow, WorkoutItemRow, WorkoutRow,
} from './types'

/**
 * The local database. Every screen reads from here (via useLiveQuery), so the app is
 * identical online and offline. Writes go here first and into the outbox; the sync
 * engine pushes the outbox to Supabase when it can and pulls remote changes back.
 */
export class LocalDB extends Dexie {
  // plan
  exercises!: EntityTable<ExerciseRow, 'id'>
  workouts!: EntityTable<WorkoutRow, 'id'>
  workout_items!: EntityTable<WorkoutItemRow, 'id'>
  muscles!: EntityTable<MuscleRow, 'id'>
  exercise_muscles!: Dexie.Table<ExerciseMuscleRow, [string, string, string]>
  metric_definitions!: EntityTable<MetricDefinitionRow, 'key'>
  activity_types!: EntityTable<ActivityTypeRow, 'key'>
  plan_settings!: EntityTable<PlanSettingRow, 'key'>
  profiles!: EntityTable<ProfileRow, 'id'>
  // logs
  sessions!: EntityTable<SessionRow, 'id'>
  set_logs!: EntityTable<SetLogRow, 'id'>
  exercise_logs!: EntityTable<ExerciseLogRow, 'id'>
  metric_logs!: EntityTable<MetricLogRow, 'id'>
  activity_entries!: EntityTable<ActivityEntryRow, 'id'>
  food_entries!: EntityTable<FoodEntryRow, 'id'>
  milestone_progress!: EntityTable<MilestoneProgressRow, 'id'>
  // sync
  outbox!: EntityTable<OutboxRow, 'seq'>
  meta!: EntityTable<MetaRow, 'key'>

  constructor() {
    super('lucas-training')
    this.version(1).stores({
      exercises: 'id',
      workouts: 'id, sort_order',
      workout_items: 'id, workout_id, exercise_id',
      muscles: 'id',
      exercise_muscles: '[exercise_id+muscle_id+role], exercise_id, muscle_id',
      metric_definitions: 'key, sort_order',
      activity_types: 'key, sort_order',
      plan_settings: 'key',
      profiles: 'id',
      sessions: 'id, user_id, date, status, updated_at, [user_id+date]',
      set_logs: 'id, session_id, exercise_id, [user_id+exercise_id], logged_at',
      exercise_logs: 'id, session_id, [session_id+exercise_id]',
      metric_logs: 'id, date, metric_key, [user_id+date+metric_key]',
      activity_entries: 'id, date, user_id',
      food_entries: 'id, date, user_id',
      milestone_progress: 'id, milestone_key, [user_id+milestone_key]',
      outbox: '++seq, table, row_id',
      meta: 'key',
    })
  }
}

export const db = new LocalDB()

/** Tables that sync (both directions). Order matters for pushes: parents before children. */
export const SYNCED_TABLES = [
  'plan_settings', 'workouts', 'exercises', 'workout_items', 'muscles', 'exercise_muscles',
  'metric_definitions', 'activity_types', 'profiles',
  'sessions', 'set_logs', 'exercise_logs', 'metric_logs', 'activity_entries', 'food_entries', 'milestone_progress',
] as const
export type SyncedTable = (typeof SYNCED_TABLES)[number]

export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const row = await db.meta.get(key)
  return (row?.value as T) ?? fallback
}
export async function setMeta(key: string, value: unknown) {
  await db.meta.put({ key, value })
}
