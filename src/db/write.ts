import { db, type SyncedTable } from './db'
import { syncSoon } from '../sync/engine'

type Row = object

/**
 * Write a row locally and queue it for the cloud. Shows instantly, never blocks on the network.
 * The row must carry its own id (uuid from newId()) and, for logged tables, user_id.
 */
export async function putRow<T extends Row>(table: SyncedTable, row: T): Promise<T> {
  const stamped = { ...row, updated_at: new Date().toISOString() } as T & { updated_at: string }
  const rowId = primaryKeyOf(table, stamped as Record<string, unknown>)
  await db.transaction('rw', db.table(table), db.outbox, async () => {
    await db.table(table).put(stamped)
    // Collapse earlier queued writes for the same row so only the latest version is sent.
    await db.outbox.where({ table, row_id: rowId }).delete()
    await db.outbox.add({ table, row_id: rowId, payload: stamped as Record<string, unknown>, created_at: stamped.updated_at, attempts: 0 })
  })
  syncSoon()
  return stamped
}

/** Soft delete: the row stays locally and remotely with deleted=true so every device agrees. */
export async function deleteRow(table: SyncedTable, id: string) {
  const existing = (await db.table(table).get(id)) as Record<string, unknown> | undefined
  if (!existing) return
  await putRow(table, { ...existing, deleted: true })
}

export function primaryKeyOf(table: SyncedTable, row: Record<string, unknown>): string {
  if (table === 'exercise_muscles') return `${row.exercise_id}|${row.muscle_id}|${row.role}`
  if (table === 'metric_definitions' || table === 'activity_types' || table === 'plan_settings') return String(row.key)
  return String(row.id)
}
