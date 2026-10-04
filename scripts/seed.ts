/**
 * Idempotent seed import: loads lucas_plan_seed.json into the database.
 * Re-running updates rows in place and never duplicates. Any column the coach has edited
 * (listed in that row's coach_edited_fields / coach_edited flag) is left alone.
 *
 *   npm run db:seed
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { need } from './lib/env.ts'

const url = need('VITE_SUPABASE_URL')
const serviceKey = need('SUPABASE_SERVICE_ROLE_KEY')
const sb = createClient(url, serviceKey, { auth: { persistSession: false } })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const seed: any = JSON.parse(readFileSync(new URL('../lucas_plan_seed.json', import.meta.url), 'utf8'))

type Row = Record<string, unknown>

function fail(where: string, err: { message: string } | null) {
  if (err) { console.error(`${where}: ${err.message}`); process.exit(1) }
}

/** Upsert rows, dropping any columns the existing row says the coach edited. */
async function upsertRespectingEdits(table: string, rows: Row[], idCol = 'id') {
  const ids = rows.map((r) => r[idCol] as string)
  const { data, error } = await sb.from(table).select(`${idCol}, coach_edited_fields`).in(idCol, ids)
  fail(`${table} read`, error)
  const existing = (data ?? []) as unknown as Row[]
  const edited = new Map<string, string[]>(existing.map((r: Row) => [r[idCol] as string, (r.coach_edited_fields as string[]) ?? []]))
  let kept = 0
  const payload = rows.map((r) => {
    const skip = edited.get(r[idCol] as string) ?? []
    if (skip.length) kept += skip.length
    const out: Row = {}
    for (const [k, v] of Object.entries(r)) if (!skip.includes(k)) out[k] = v
    return out
  })
  // Rows with different column sets must be sent separately (PostgREST needs uniform keys per batch).
  const groups = new Map<string, Row[]>()
  for (const p of payload) {
    const key = Object.keys(p).sort().join(',')
    groups.set(key, [...(groups.get(key) ?? []), p])
  }
  for (const batch of groups.values()) {
    const { error: e } = await sb.from(table).upsert(batch, { onConflict: idCol })
    fail(`${table} upsert`, e)
  }
  console.log(`${table.padEnd(20)} ${rows.length} rows${kept ? ` (${kept} coach-edited fields preserved)` : ''}`)
}

// ---- plan_settings (whole-document values) ----
{
  const docs: Row[] = [
    { key: 'meta', value: seed.meta },
    { key: 'goals', value: seed.goals },
    { key: 'events', value: seed.events },
    { key: 'theme', value: seed.theme },
    { key: 'positions', value: seed.positions },
    { key: 'week', value: seed.meta.week },
  ]
  const { data: existing, error } = await sb.from('plan_settings').select('key, coach_edited')
  fail('plan_settings read', error)
  const editedKeys = new Set((existing ?? []).filter((r: Row) => r.coach_edited).map((r: Row) => r.key as string))
  const toWrite = docs.filter((d) => !editedKeys.has(d.key as string))
  if (toWrite.length) {
    const { error: e } = await sb.from('plan_settings').upsert(toWrite, { onConflict: 'key' })
    fail('plan_settings upsert', e)
  }
  console.log(`${'plan_settings'.padEnd(20)} ${toWrite.length} written${editedKeys.size ? `, ${editedKeys.size} coach-edited kept` : ''}`)
}

// ---- muscles ----
await upsertRespectingEdits('muscles', (Object.values(seed.muscles) as Row[]).map((m: Row) => ({
  id: m.id, name: m.name, region: m.region, origin: m.origin, insertion: m.insertion,
  action: m.action, line_of_pull: m.line_of_pull, two_joint: m.two_joint, note: m.note,
})))

// ---- exercises ----
const exerciseRows: Row[] = (Object.values(seed.exercises) as Row[]).map((e: Row) => ({
  id: e.id, name: e.name, diagram_key: e.diagram_key, position: e.position, position_why: e.position_why,
  trains: e.trains, find_equipment: e.find_equipment, setup: e.setup, starting_position: e.starting_position,
  how_to_rep: e.how_to_rep, feel_do: e.feel_do, feel_dont: e.feel_dont, common_mistakes: e.common_mistakes,
  stop_set_when: e.stop_set_when, easier_option: e.easier_option, progress_when: e.progress_when,
  video_search_query: e.video_search_query, video_search_url: e.video_search_url,
  video_url: e.video_url, needs_photo: e.needs_photo, photo_url: e.photo_url,
  ask_dad_before_loading: e.ask_dad_before_loading,
}))
// video_url / photo_url are coach-owned once set: never clobber a non-empty value with the seed's empty one.
{
  const { data: existing } = await sb.from('exercises').select('id, video_url, photo_url, mm_reference')
  const byId = new Map((existing ?? []).map((r: Row) => [r.id as string, r]))
  for (const r of exerciseRows) {
    const ex = byId.get(r.id as string)
    if (ex) {
      if (ex.video_url && !r.video_url) delete r.video_url
      if (ex.photo_url && !r.photo_url) delete r.photo_url
    }
  }
}
await upsertRespectingEdits('exercises', exerciseRows)

// ---- exercise_muscles (rebuilt from muscle_involvement unless the coach edited that exercise's involvement) ----
{
  const { data: existing, error } = await sb.from('exercises').select('id, coach_edited_fields')
  fail('exercises read', error)
  const editedInvolvement = new Set((existing ?? []).filter((r: Row) => ((r.coach_edited_fields as string[]) ?? []).includes('muscle_involvement')).map((r: Row) => r.id as string))
  const rows: Row[] = []
  const rebuildIds: string[] = []
  for (const e of Object.values(seed.exercises) as Row[]) {
    if (editedInvolvement.has(e.id as string)) continue
    rebuildIds.push(e.id as string)
    const mi = e.muscle_involvement as { prime_movers: string[]; synergists: string[]; stabilisers: string[] }
    for (const m of mi.prime_movers) rows.push({ exercise_id: e.id, muscle_id: m, role: 'prime' })
    for (const m of mi.synergists) rows.push({ exercise_id: e.id, muscle_id: m, role: 'synergist' })
    for (const m of mi.stabilisers) rows.push({ exercise_id: e.id, muscle_id: m, role: 'stabiliser' })
  }
  if (rebuildIds.length) {
    const { error: d } = await sb.from('exercise_muscles').delete().in('exercise_id', rebuildIds)
    fail('exercise_muscles delete', d)
  }
  if (rows.length) {
    const { error: i } = await sb.from('exercise_muscles').insert(rows)
    fail('exercise_muscles insert', i)
  }
  console.log(`${'exercise_muscles'.padEnd(20)} ${rows.length} rows${editedInvolvement.size ? ` (${editedInvolvement.size} coach-edited exercises kept)` : ''}`)
}

// ---- workouts + items ----
await upsertRespectingEdits('workouts', seed.workouts.map((w: Row, i: number) => ({
  id: w.id, name: w.name, subtitle: w.subtitle, demand: w.demand, sort_order: i,
})))
{
  const items: Row[] = []
  for (const w of seed.workouts as Row[]) {
    for (const it of w.items as Row[]) {
      items.push({
        id: `${w.id}:${it.order}`, workout_id: w.id, order: it.order, exercise_id: it.exercise_id,
        sets: it.sets, rep_range: it.rep_range, rest: it.rest, effort_target: it.effort_target,
        warmup_sets: it.warmup_sets, position: it.position,
      })
    }
  }
  const { data: existing, error } = await sb.from('workout_items').select('id, coach_edited')
  fail('workout_items read', error)
  const edited = new Set((existing ?? []).filter((r: Row) => r.coach_edited).map((r: Row) => r.id as string))
  const toWrite = items.filter((i) => !edited.has(i.id as string))
  if (toWrite.length) {
    const { error: e } = await sb.from('workout_items').upsert(toWrite, { onConflict: 'id' })
    fail('workout_items upsert', e)
  }
  console.log(`${'workout_items'.padEnd(20)} ${toWrite.length} rows${edited.size ? ` (${edited.size} coach-edited kept)` : ''}`)
}

// ---- metrics + activity types ----
await upsertRespectingEdits('metric_definitions', seed.metrics.map((m: Row, i: number) => ({
  key: m.key, label: m.label, category: m.category, input_type: m.input_type, unit: m.unit,
  min: m.min, max: m.max, step: m.step, active: m.active, icon: m.icon, who_logs: m.who_logs,
  note: m.note ?? '', sort_order: i,
})), 'key')
{
  const rows = seed.activity_types.map((a: Row, i: number) => ({
    key: a.key, label: a.label, distance_unit: a.distance_unit, tracks: a.tracks, icon: a.icon, note: a.note ?? '', sort_order: i,
  }))
  const { error } = await sb.from('activity_types').upsert(rows, { onConflict: 'key' })
  fail('activity_types upsert', error)
  console.log(`${'activity_types'.padEnd(20)} ${rows.length} rows`)
}

console.log('\nSeed import complete.')
