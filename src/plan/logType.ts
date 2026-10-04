import type { WorkoutItem } from './types'

/**
 * How a workout item is logged. Derived from the seed's rep_range text so the plan
 * stays the single source of truth and nothing is hard-coded per exercise.
 *
 *  - reps:     weight (optional) x reps                         e.g. "8-12"
 *  - reps_side: weight (optional) x reps, done per side          e.g. "8-12 / side"
 *  - seconds_side: hold time in seconds per side, no weight      e.g. "20-30 sec / side"
 *  - metres_side: weight x metres per side                       e.g. "20-30 m / side"
 *  - minutes:  duration in minutes, no weight                    e.g. "8-12 min"
 */
export type LogType = 'reps' | 'reps_side' | 'seconds_side' | 'metres_side' | 'minutes'

export interface LogSpec {
  type: LogType
  /** Lower and upper target for the main number (reps / seconds / metres / minutes). */
  low: number
  high: number
  /** Label for the main number input on the logging panel. */
  unitLabel: string
  /** Whether a weight input is shown. */
  hasWeight: boolean
  /** Whether the set is done once per side (shown as "each side"). */
  perSide: boolean
  /** True when the plain "8-12" style applies, so the progression helper can run. */
  numericReps: boolean
}

export function parseRange(text: string): { low: number; high: number } {
  const m = text.match(/(\d+)\s*-\s*(\d+)/)
  if (m) return { low: Number(m[1]), high: Number(m[2]) }
  const single = text.match(/(\d+)/)
  const n = single ? Number(single[1]) : 0
  return { low: n, high: n }
}

export function logSpecFor(item: Pick<WorkoutItem, 'rep_range'>): LogSpec {
  const r = item.rep_range.toLowerCase()
  const { low, high } = parseRange(r)
  const perSide = /\/\s*side/.test(r)
  if (/\bmin\b/.test(r)) {
    return { type: 'minutes', low, high, unitLabel: 'Minutes', hasWeight: false, perSide: false, numericReps: false }
  }
  if (/\bsec\b/.test(r)) {
    return { type: 'seconds_side', low, high, unitLabel: 'Seconds', hasWeight: false, perSide, numericReps: false }
  }
  if (/\bm\b/.test(r)) {
    return { type: 'metres_side', low, high, unitLabel: 'Metres', hasWeight: true, perSide, numericReps: false }
  }
  if (perSide) {
    return { type: 'reps_side', low, high, unitLabel: 'Reps', hasWeight: true, perSide: true, numericReps: true }
  }
  return { type: 'reps', low, high, unitLabel: 'Reps', hasWeight: true, perSide: false, numericReps: true }
}

/** "2.5" warm-up sets in the seed means "2 or 3". Returns the rows to show and the label. */
export function warmupInfo(warmupSets: number): { rows: number; label: string } {
  if (warmupSets <= 0) return { rows: 0, label: '' }
  if (Number.isInteger(warmupSets)) {
    return { rows: warmupSets, label: `${warmupSets} warm-up ${warmupSets === 1 ? 'set' : 'sets'}` }
  }
  const lo = Math.floor(warmupSets)
  const hi = Math.ceil(warmupSets)
  return { rows: hi, label: `${lo}–${hi} warm-up sets` }
}

/** Parse "120 sec" / "90-120 sec" / "—" into seconds for the rest timer (uses the upper value). */
export function restSeconds(rest: string): number | null {
  const m = rest.match(/(\d+)(?:\s*-\s*(\d+))?\s*sec/)
  if (!m) return null
  return Number(m[2] ?? m[1])
}

/** "Leave 2-3" → true. Only these items get the gentle progression hint. */
export function hasRirTarget(effort: string): boolean {
  return /^leave\s+\d/i.test(effort.trim())
}
