import type { Plan } from '../../plan/usePlan'
import type { SessionRow, SetLogRow, ExerciseLogRow } from '../../db/types'
import { hasRirTarget, logSpecFor } from '../../plan/logType'
import type { WorkoutItem } from '../../plan/types'

/**
 * Which workout to open on Today: the next one in plan order after the last completed session.
 * A missed day never skips a workout. With no history, Day 1.
 */
export function nextWorkoutId(plan: Plan, sessions: SessionRow[]): string {
  const order = plan.week.map((w) => w.workout)
  const done = sessions.filter((s) => s.status === 'complete' && !s.deleted).sort((a, b) => (a.completed_at ?? '').localeCompare(b.completed_at ?? ''))
  const last = done[done.length - 1]
  if (!last) return order[0]
  const idx = order.indexOf(last.workout_id)
  return order[(idx + 1) % order.length] ?? order[0]
}

export interface ExerciseProgress {
  workingDone: number
  workingTarget: number
  complete: boolean
  log: ExerciseLogRow | undefined
}

export function exerciseProgress(item: WorkoutItem, sets: SetLogRow[], logs: ExerciseLogRow[]): ExerciseProgress {
  const spec = logSpecFor(item)
  const mine = sets.filter((s) => s.exercise_id === item.exercise_id && !s.deleted && !s.is_warmup)
  // A per-side item counts a set once both sides are logged.
  const workingDone = spec.perSide
    ? Math.min(mine.filter((s) => s.side === 'left').length, mine.filter((s) => s.side === 'right').length)
    : mine.length
  const log = logs.find((l) => l.exercise_id === item.exercise_id && !l.deleted)
  return { workingDone, workingTarget: item.sets, complete: workingDone >= item.sets && Boolean(log?.technique_colour), log }
}

/** The weight he used for his most recent working set of this exercise (pre-fill). */
export function lastWeightFor(exerciseId: string, allSets: SetLogRow[], excludeSessionId?: string): number | null {
  const mine = allSets
    .filter((s) => s.exercise_id === exerciseId && !s.deleted && !s.is_warmup && s.session_id !== excludeSessionId && s.weight != null)
    .sort((a, b) => b.logged_at.localeCompare(a.logged_at))
  return mine[0]?.weight ?? null
}

export interface ProgressionHint {
  text: string
  kind: 'increase' | 'hold' | 'none'
}

/**
 * Gentle double-progression helper. Looks at the last completed session that included this exercise:
 * if every working set reached the top of the rep range and technique was green, suggest the smallest increase.
 * Otherwise suggest staying and adding a rep or two. Never changes the plan.
 */
export function progressionHint(item: WorkoutItem, allSets: SetLogRow[], allLogs: ExerciseLogRow[], sessions: SessionRow[], excludeSessionId?: string): ProgressionHint {
  const spec = logSpecFor(item)
  if (!spec.numericReps || !hasRirTarget(item.effort_target)) return { kind: 'none', text: '' }
  const completed = sessions.filter((s) => s.status === 'complete' && !s.deleted && s.id !== excludeSessionId)
    .sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))
  for (const s of completed) {
    const sets = allSets.filter((x) => x.session_id === s.id && x.exercise_id === item.exercise_id && !x.deleted && !x.is_warmup)
    if (sets.length === 0) continue
    const log = allLogs.find((l) => l.session_id === s.id && l.exercise_id === item.exercise_id && !l.deleted)
    const allTop = sets.length >= item.sets && sets.every((x) => (x.reps_done ?? 0) >= spec.high)
    if (allTop && log?.technique_colour === 'green') {
      return { kind: 'increase', text: 'Last time you hit the top of the rep range on every set with clean technique. You could try the smallest weight increase.' }
    }
    return { kind: 'hold', text: 'Stay at this weight and aim for one or two more reps.' }
  }
  return { kind: 'none', text: '' }
}

/** Personal records: best weight×reps per exercise from completed, non-warm-up sets. */
export interface PR { exercise_id: string; weight: number; reps: number; logged_at: string; session_id: string }

export function bestSetFor(exerciseId: string, allSets: SetLogRow[]): PR | null {
  const mine = allSets.filter((s) => s.exercise_id === exerciseId && !s.deleted && !s.is_warmup && s.weight != null && s.reps_done != null && s.value_kind === 'reps')
  let best: PR | null = null
  for (const s of mine) {
    const score = e1rm(s.weight!, s.reps_done!)
    if (!best || score > e1rm(best.weight, best.reps)) best = { exercise_id: exerciseId, weight: s.weight!, reps: s.reps_done!, logged_at: s.logged_at, session_id: s.session_id }
  }
  return best
}

/** Epley estimate; labelled "estimated" wherever shown, and only in the coach view. */
export function e1rm(weight: number, reps: number): number {
  return weight * (1 + reps / 30)
}

/** Did this set beat every earlier set of this exercise? (For calm, specific "new best" messages.) */
export function isNewBest(set: SetLogRow, allSets: SetLogRow[]): boolean {
  if (set.weight == null || set.reps_done == null || set.is_warmup || set.value_kind !== 'reps') return false
  const earlier = allSets.filter((s) => s.exercise_id === set.exercise_id && s.id !== set.id && !s.deleted && !s.is_warmup && s.weight != null && s.reps_done != null && s.logged_at < set.logged_at)
  if (earlier.length === 0) return false
  const mine = e1rm(set.weight, set.reps_done)
  return earlier.every((s) => e1rm(s.weight!, s.reps_done!) < mine)
}
