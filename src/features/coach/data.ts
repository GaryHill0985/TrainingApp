import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { ExerciseLogRow, SessionRow, SetLogRow } from '../../db/types'
import type { Plan } from '../../plan/usePlan'
import { exerciseProgress } from '../trainee/logic'
import { addDays, weekStartKey } from '../../lib/dates'

export function useTrainee() {
  return useLiveQuery(() => db.profiles.filter((p) => p.role === 'trainee').first(), [])
}

export interface Flag {
  kind: 'red' | 'pain' | 'back_extension'
  session: SessionRow
  exercise_id: string
  note: string
}

/** Things that need the coach's attention from recent sessions (newest first). */
export function recentFlags(sessions: SessionRow[], logs: ExerciseLogRow[], days = 14): Flag[] {
  const cutoff = addDays(weekStartKey(), -days)
  const recent = sessions.filter((s) => !s.deleted && s.date >= cutoff)
  const byId = new Map(recent.map((s) => [s.id, s]))
  const flags: Flag[] = []
  for (const l of logs) {
    const s = byId.get(l.session_id)
    if (!s || l.deleted) continue
    if (l.pain_flag) flags.push({ kind: 'pain', session: s, exercise_id: l.exercise_id, note: l.note })
    if (l.technique_colour === 'red') flags.push({ kind: 'red', session: s, exercise_id: l.exercise_id, note: l.note })
    if (l.back_extension_weight_flag) flags.push({ kind: 'back_extension', session: s, exercise_id: l.exercise_id, note: l.note })
  }
  return flags.sort((a, b) => b.session.started_at.localeCompare(a.session.started_at))
}

export function thisWeek(sessions: SessionRow[]): { done: number; start: string } {
  const start = weekStartKey()
  const end = addDays(start, 7)
  const done = sessions.filter((s) => !s.deleted && s.status === 'complete' && s.date >= start && s.date < end).length
  return { done, start }
}

export function completionPercent(plan: Plan, session: SessionRow, sets: SetLogRow[], logs: ExerciseLogRow[]): number {
  const w = plan.workouts.find((x) => x.id === session.workout_id)
  if (!w || w.items.length === 0) return 0
  const done = w.items.filter((it) => exerciseProgress(it, sets, logs).complete).length
  return Math.round((done / w.items.length) * 100)
}
