import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { putRow } from '../../db/write'
import { newId } from '../../lib/ids'
import { todayKey } from '../../lib/dates'
import { currentUserId } from '../../auth/pairing'
import type { ExerciseLogRow, SessionRow, SetLogRow } from '../../db/types'

/** Lucas's user id. Falls back to a stable local id if the phone was never paired (data still saved locally). */
export function uid(): string {
  const id = currentUserId()
  if (id) return id
  let local = localStorage.getItem('lt.local_uid')
  if (!local) { local = newId(); localStorage.setItem('lt.local_uid', local) }
  return local
}

export function useSessions(): SessionRow[] {
  return useLiveQuery(() => db.sessions.filter((s) => !s.deleted).toArray(), []) ?? []
}

export function useSession(id: string | undefined): SessionRow | undefined {
  return useLiveQuery(() => (id ? db.sessions.get(id) : undefined), [id])
}

export function useSessionSets(sessionId: string | undefined): SetLogRow[] {
  return useLiveQuery(() => (sessionId ? db.set_logs.where({ session_id: sessionId }).filter((s) => !s.deleted).toArray() : []), [sessionId]) ?? []
}

export function useSessionLogs(sessionId: string | undefined): ExerciseLogRow[] {
  return useLiveQuery(() => (sessionId ? db.exercise_logs.where({ session_id: sessionId }).filter((l) => !l.deleted).toArray() : []), [sessionId]) ?? []
}

export function useAllSets(): SetLogRow[] {
  return useLiveQuery(() => db.set_logs.filter((s) => !s.deleted).toArray(), []) ?? []
}

export function useAllLogs(): ExerciseLogRow[] {
  return useLiveQuery(() => db.exercise_logs.filter((l) => !l.deleted).toArray(), []) ?? []
}

export function useInProgressSession(): SessionRow | undefined {
  return useLiveQuery(async () => {
    const rows = await db.sessions.where({ status: 'in_progress' }).filter((s) => !s.deleted).toArray()
    rows.sort((a, b) => b.started_at.localeCompare(a.started_at))
    return rows[0]
  }, [])
}

export async function startSession(workoutId: string): Promise<SessionRow> {
  const now = new Date().toISOString()
  const row: SessionRow = {
    id: newId(), user_id: uid(), workout_id: workoutId, date: todayKey(), status: 'in_progress',
    started_at: now, completed_at: null, overall_note: '', deleted: false, updated_at: now,
  }
  return putRow('sessions', row)
}

export async function completeSession(session: SessionRow, note?: string) {
  await putRow('sessions', { ...session, status: 'complete', completed_at: new Date().toISOString(), overall_note: note ?? session.overall_note })
}

export async function saveSet(input: Omit<SetLogRow, 'id' | 'user_id' | 'updated_at' | 'deleted' | 'logged_at'> & { id?: string; logged_at?: string }): Promise<SetLogRow> {
  const now = new Date().toISOString()
  const row: SetLogRow = { deleted: false, ...input, id: input.id ?? newId(), user_id: uid(), logged_at: input.logged_at ?? now, updated_at: now }
  return putRow('set_logs', row)
}

export async function removeSet(id: string) {
  const row = await db.set_logs.get(id)
  if (row) await putRow('set_logs', { ...row, deleted: true })
}

export async function saveExerciseLog(sessionId: string, exerciseId: string, patch: Partial<Pick<ExerciseLogRow, 'technique_colour' | 'pain_flag' | 'note' | 'back_extension_weight_flag'>>): Promise<ExerciseLogRow> {
  const existing = await db.exercise_logs.where({ session_id: sessionId, exercise_id: exerciseId }).first()
  const now = new Date().toISOString()
  const row: ExerciseLogRow = existing
    ? { ...existing, ...patch, updated_at: now }
    : { id: newId(), user_id: uid(), session_id: sessionId, exercise_id: exerciseId, technique_colour: null, pain_flag: false, note: '', back_extension_weight_flag: false, deleted: false, updated_at: now, ...patch }
  return putRow('exercise_logs', row)
}
