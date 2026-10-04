import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { seed } from './seed'
import type { Exercise, MetricDefinition, ActivityType, Muscle, PlanSeed, Workout, WorkoutItem, PlanEvent } from './types'
import type { ExerciseRow } from '../db/types'

export interface Plan {
  meta: PlanSeed['meta']
  goals: PlanSeed['goals']
  events: PlanEvent[]
  theme: PlanSeed['theme']
  positions: PlanSeed['positions']
  week: PlanSeed['meta']['week']
  workouts: Workout[]
  exercises: Record<string, Exercise>
  exerciseRows: Record<string, ExerciseRow>
  muscles: Record<string, Muscle>
  metrics: MetricDefinition[]
  activityTypes: ActivityType[]
  /** Settings the coach controls: depth toggle etc. */
  app: { muscleDepth: 'simple' | 'everything' }
}

function fromSeed(): Plan {
  const exerciseRows: Record<string, ExerciseRow> = {}
  for (const e of Object.values(seed.exercises)) exerciseRows[e.id] = { ...e, mm_reference: '', coach_edited_fields: [], updated_at: '' }
  return {
    meta: seed.meta, goals: seed.goals, events: seed.events, theme: seed.theme, positions: seed.positions,
    week: seed.meta.week, workouts: seed.workouts, exercises: seed.exercises, exerciseRows, muscles: seed.muscles,
    metrics: seed.metrics, activityTypes: seed.activity_types, app: { muscleDepth: 'simple' },
  }
}

/**
 * The live plan: local tables (which mirror the cloud, including coach edits), with the
 * bundled seed as the fallback while the local tables are still filling.
 */
export function usePlan(): Plan {
  const plan = useLiveQuery(async () => {
    const [exRows, wRows, itemRows, mRows, emRows, metricRows, atRows, settings] = await Promise.all([
      db.exercises.toArray(), db.workouts.orderBy('sort_order').toArray(), db.workout_items.toArray(),
      db.muscles.toArray(), db.exercise_muscles.toArray(), db.metric_definitions.orderBy('sort_order').toArray(),
      db.activity_types.orderBy('sort_order').toArray(), db.plan_settings.toArray(),
    ])
    if (exRows.length === 0 || wRows.length === 0) return null

    const s = Object.fromEntries(settings.map((r) => [r.key, r.value])) as Record<string, unknown>
    const exercises: Record<string, Exercise> = {}
    const exerciseRows: Record<string, ExerciseRow> = {}
    for (const r of exRows) {
      exerciseRows[r.id] = r
      exercises[r.id] = {
        ...r,
        muscle_involvement: {
          prime_movers: emRows.filter((m) => m.exercise_id === r.id && m.role === 'prime').map((m) => m.muscle_id),
          synergists: emRows.filter((m) => m.exercise_id === r.id && m.role === 'synergist').map((m) => m.muscle_id),
          stabilisers: emRows.filter((m) => m.exercise_id === r.id && m.role === 'stabiliser').map((m) => m.muscle_id),
        },
      }
    }
    const workouts: Workout[] = wRows.map((w) => ({
      id: w.id, name: w.name, subtitle: w.subtitle, demand: w.demand,
      items: itemRows
        .filter((i) => i.workout_id === w.id && !i.deleted)
        .sort((a, b) => a.order - b.order)
        .map<WorkoutItem>((i) => ({ order: i.order, exercise_id: i.exercise_id, sets: i.sets, rep_range: i.rep_range, rest: i.rest, effort_target: i.effort_target, warmup_sets: Number(i.warmup_sets), position: i.position })),
    }))
    const muscles: Record<string, Muscle> = Object.fromEntries(mRows.map((m) => [m.id, m]))
    const app = (s.app as Plan['app'] | undefined) ?? { muscleDepth: 'simple' }
    return {
      meta: (s.meta as PlanSeed['meta']) ?? seed.meta,
      goals: (s.goals as PlanSeed['goals']) ?? seed.goals,
      events: (s.events as PlanEvent[]) ?? seed.events,
      theme: (s.theme as PlanSeed['theme']) ?? seed.theme,
      positions: (s.positions as PlanSeed['positions']) ?? seed.positions,
      week: (s.week as PlanSeed['meta']['week']) ?? seed.meta.week,
      workouts, exercises, exerciseRows, muscles,
      metrics: metricRows.map((m) => ({ ...m, who_logs: m.who_logs as 'trainee' | 'coach' })),
      activityTypes: atRows,
      app,
    } satisfies Plan
  }, [])
  return plan ?? fromSeed()
}
