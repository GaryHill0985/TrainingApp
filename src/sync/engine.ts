import { db, getMeta, setMeta, SYNCED_TABLES, type SyncedTable } from '../db/db'
import { primaryKeyOf } from '../db/write'
import { cloudConfigured, supabase } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Sync engine: push the outbox, pull changes since the last pull, listen to realtime.
 * Calm by design: the UI only ever sees "Saved on this phone — will sync when you're online" or "Synced".
 */

export interface SyncStatus {
  online: boolean
  paired: boolean
  syncing: boolean
  pending: number
  lastSyncAt: string | null
  /** Set only when something needs a person to look (e.g. the phone needs pairing again). Never alarming copy. */
  notice: string | null
}

let status: SyncStatus = {
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  paired: false,
  syncing: false,
  pending: 0,
  lastSyncAt: null,
  notice: null,
}
const listeners = new Set<() => void>()
function emit() { for (const l of listeners) l() }
function patch(p: Partial<SyncStatus>) { status = { ...status, ...p }; emit() }

export function subscribeSync(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb) } }
export function getSyncStatus() { return status }

let timer: number | null = null
let running = false
let rerun = false
let channel: RealtimeChannel | null = null
let started = false

/** Debounced trigger used after every local write. */
export function syncSoon(delayMs = 800) {
  if (timer) window.clearTimeout(timer)
  timer = window.setTimeout(() => { timer = null; void syncNow() }, delayMs)
}

export async function refreshPending() {
  const pending = await db.outbox.count()
  patch({ pending })
}

export async function isPaired(): Promise<boolean> {
  if (!cloudConfigured) return false
  const { data } = await supabase().auth.getSession()
  return Boolean(data.session)
}

/** Call once at app start. Safe to call again. */
export async function startSync() {
  if (started) return
  started = true
  window.addEventListener('online', () => { patch({ online: true }); void syncNow() })
  window.addEventListener('offline', () => patch({ online: false }))
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void syncNow() })
  window.setInterval(() => { if (navigator.onLine) void syncNow() }, 60_000)
  await refreshPending()
  const paired = await isPaired()
  patch({ paired })
  if (paired) {
    void syncNow()
    startRealtime()
  }
}

export async function onPaired() {
  patch({ paired: true, notice: null })
  await syncNow()
  startRealtime()
}

export async function onUnpaired() {
  stopRealtime()
  patch({ paired: false })
}

export async function syncNow(): Promise<void> {
  if (!cloudConfigured) return
  if (running) { rerun = true; return }
  running = true
  patch({ syncing: true })
  try {
    const { data } = await supabase().auth.getSession()
    if (!data.session) { patch({ paired: false }); return }
    await pushOutbox()
    await pullAll()
    patch({ lastSyncAt: new Date().toISOString(), notice: null })
  } catch (e) {
    // Network problems are normal at the gym. Say nothing scary; try again later.
    if (import.meta.env.DEV) console.warn('[sync]', e)
  } finally {
    await refreshPending()
    running = false
    patch({ syncing: false })
    if (rerun) { rerun = false; void syncNow() }
  }
}

async function pushOutbox() {
  const items = await db.outbox.orderBy('seq').toArray()
  for (const item of items) {
    const table = item.table as SyncedTable
    const { __delete, ...payload } = item.payload as Record<string, unknown> & { __delete?: boolean }
    const { error } = __delete
      ? await supabase().from(table).delete().match(deleteMatch(table, payload))
      : await supabase().from(table).upsert(payload, { onConflict: conflictKey(table) })
    if (!error) {
      await db.outbox.delete(item.seq!)
      continue
    }
    if (isNetworkError(error.message)) throw new Error(error.message)
    // A row the server will never accept (e.g. a permission rule). Keep it for inspection but don't block the rest.
    await db.outbox.update(item.seq!, { attempts: item.attempts + 1, last_error: error.message })
    if (import.meta.env.DEV) console.warn('[sync] rejected', table, error.message)
  }
}

function deleteMatch(table: SyncedTable, row: Record<string, unknown>): Record<string, unknown> {
  if (table === 'exercise_muscles') return { exercise_id: row.exercise_id, muscle_id: row.muscle_id, role: row.role }
  if (table === 'metric_definitions' || table === 'activity_types' || table === 'plan_settings') return { key: row.key }
  return { id: row.id }
}

function conflictKey(table: SyncedTable): string {
  if (table === 'exercise_muscles') return 'exercise_id,muscle_id,role'
  if (table === 'metric_definitions' || table === 'activity_types' || table === 'plan_settings') return 'key'
  return 'id'
}

function isNetworkError(msg: string) {
  return /fetch|network|failed to|load failed|timeout|ECONN/i.test(msg)
}

async function pullAll() {
  const pendingKeys = new Set((await db.outbox.toArray()).map((o) => `${o.table}:${o.row_id}`))
  for (const table of SYNCED_TABLES) {
    await pullTable(table, pendingKeys)
  }
}

async function pullTable(table: SyncedTable, pendingKeys: Set<string>) {
  const metaKey = `since:${table}`
  let since = await getMeta<string>(metaKey, '1970-01-01T00:00:00Z')
  const pageSize = 500
  const hasUpdatedAt = table !== 'profiles'
  for (;;) {
    let q = supabase().from(table).select('*').limit(pageSize)
    if (hasUpdatedAt) q = q.gt('updated_at', since).order('updated_at', { ascending: true })
    const { data, error } = await q
    if (error) throw new Error(error.message)
    const rows = (data ?? []) as Record<string, unknown>[]
    if (rows.length === 0) break
    const keep = rows.filter((r) => !pendingKeys.has(`${table}:${primaryKeyOf(table, r)}`))
    if (keep.length) await db.table(table).bulkPut(keep)
    if (!hasUpdatedAt) break
    since = String(rows[rows.length - 1].updated_at)
    await setMeta(metaKey, since)
    if (rows.length < pageSize) break
  }
}

function startRealtime() {
  if (channel || !cloudConfigured) return
  channel = supabase()
    .channel('db-changes')
    .on('postgres_changes', { event: '*', schema: 'public' }, async (payload) => {
      const table = payload.table as SyncedTable
      if (!(SYNCED_TABLES as readonly string[]).includes(table)) return
      const row = (payload.eventType === 'DELETE' ? payload.old : payload.new) as Record<string, unknown>
      if (!row || Object.keys(row).length === 0) return
      const key = primaryKeyOf(table, row)
      const pending = await db.outbox.where({ table, row_id: key }).count()
      if (pending) return // our own newer local version is still queued
      if (payload.eventType === 'DELETE') {
        await db.table(table).delete(keyOf(table, row))
      } else {
        await db.table(table).put(row)
      }
    })
    .subscribe()
}

function keyOf(table: SyncedTable, row: Record<string, unknown>) {
  if (table === 'exercise_muscles') return [row.exercise_id, row.muscle_id, row.role] as [string, string, string]
  if (table === 'metric_definitions' || table === 'activity_types' || table === 'plan_settings') return row.key as string
  return row.id as string
}

function stopRealtime() {
  if (channel) { void supabase().removeChannel(channel); channel = null }
}

/** Forget everything synced from the cloud (used when switching user on a device). */
export async function resetLocalData() {
  stopRealtime()
  await db.transaction('rw', db.tables, async () => {
    for (const t of db.tables) await t.clear()
  })
}
