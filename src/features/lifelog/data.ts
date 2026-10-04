import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import { putRow } from '../../db/write'
import { newId } from '../../lib/ids'
import { uid } from '../trainee/data'
import type { ActivityEntryRow, FoodEntryRow, MetricLogRow, MilestoneProgressRow } from '../../db/types'

export function useMetricLogs(): MetricLogRow[] {
  return useLiveQuery(() => db.metric_logs.filter((r) => !r.deleted).toArray(), []) ?? []
}
export function useActivityEntries(): ActivityEntryRow[] {
  return useLiveQuery(() => db.activity_entries.filter((r) => !r.deleted).toArray(), []) ?? []
}
export function useFoodEntries(): FoodEntryRow[] {
  return useLiveQuery(() => db.food_entries.filter((r) => !r.deleted).toArray(), []) ?? []
}
export function useMilestoneProgress(): MilestoneProgressRow[] {
  return useLiveQuery(() => db.milestone_progress.filter((r) => !r.deleted).toArray(), []) ?? []
}

/** One value per metric per day (upsert on user + date + metric). Empty value clears it. */
export async function setMetric(date: string, metric_key: string, value: number | null, note = '') {
  const user_id = uid()
  const existing = await db.metric_logs.where({ user_id, date, metric_key }).first()
  const now = new Date().toISOString()
  if (value == null) {
    if (existing) await putRow('metric_logs', { ...existing, deleted: true })
    return
  }
  const row: MetricLogRow = existing
    ? { ...existing, value_num: value, note, deleted: false, updated_at: now }
    : { id: newId(), user_id, date, metric_key, value_num: value, value_text: null, note, logged_at: now, deleted: false, updated_at: now }
  await putRow('metric_logs', row)
}

export async function addActivity(input: { date: string; activity_type: string; distance_value: number | null; distance_unit: string | null; duration_seconds: number | null; note: string }) {
  const now = new Date().toISOString()
  const row: ActivityEntryRow = { id: newId(), user_id: uid(), ...input, logged_at: now, deleted: false, updated_at: now }
  await putRow('activity_entries', row)
}

export async function removeActivity(id: string) {
  const r = await db.activity_entries.get(id)
  if (r) await putRow('activity_entries', { ...r, deleted: true })
}

export async function addFood(input: { date: string; meal: string | null; description: string; calories: number | null; time: string | null }) {
  const now = new Date().toISOString()
  const row: FoodEntryRow = { id: newId(), user_id: uid(), ...input, logged_at: now, deleted: false, updated_at: now }
  await putRow('food_entries', row)
}

export async function removeFood(id: string) {
  const r = await db.food_entries.get(id)
  if (r) await putRow('food_entries', { ...r, deleted: true })
}

/** Mark a milestone stage reached (or unmark). */
export async function setMilestoneStage(milestone_key: string, stage_index: number, reached: boolean, date: string) {
  const user_id = uid()
  const existing = await db.milestone_progress.where({ user_id, milestone_key }).filter((r) => r.stage_index === stage_index).first()
  const now = new Date().toISOString()
  if (!reached) { if (existing) await putRow('milestone_progress', { ...existing, deleted: true }); return }
  const row: MilestoneProgressRow = existing
    ? { ...existing, deleted: false, achieved_on: existing.achieved_on || date, updated_at: now }
    : { id: newId(), user_id, milestone_key, stage_index, achieved_on: date, note: '', deleted: false, updated_at: now }
  await putRow('milestone_progress', row)
}

export function formatDuration(seconds: number | null): string {
  if (seconds == null) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s ? `${m}:${String(s).padStart(2, '0')}` : `${m} min`
}
