/**
 * Smoke test against the live project: sign-in for both roles, profile roles, RLS read/write rules, storage.
 * Writes one throw-away session as Lucas and removes it with the service role.
 *
 *   npm run db:verify
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
const url = process.env.VITE_SUPABASE_URL!, anon = process.env.VITE_SUPABASE_ANON_KEY!
const ok = (label: string, pass: boolean, detail = '') => console.log(`${pass ? 'PASS' : 'FAIL'}  ${label}${detail ? ' — ' + detail : ''}`)

const lucas = createClient(url, anon, { auth: { persistSession: false } })
const dad = createClient(url, anon, { auth: { persistSession: false } })

const l = await lucas.auth.signInWithPassword({ email: process.env.TRAINEE_EMAIL!, password: process.env.TRAINEE_PASSWORD! })
ok('Lucas can sign in', !l.error, l.error?.message)
const d = await dad.auth.signInWithPassword({ email: process.env.COACH_EMAIL!, password: process.env.COACH_PASSWORD! })
ok('Dad can sign in', !d.error, d.error?.message)
const lp = await lucas.from('profiles').select('role').eq('id', l.data.user!.id).single()
ok('Lucas profile role = trainee', lp.data?.role === 'trainee', lp.error?.message ?? lp.data?.role)
const dp = await dad.from('profiles').select('role').eq('id', d.data.user!.id).single()
ok('Dad profile role = coach', dp.data?.role === 'coach', dp.error?.message ?? dp.data?.role)

const ex = await lucas.from('exercises').select('id').limit(100)
ok('Lucas can read the plan', (ex.data?.length ?? 0) === 29, `${ex.data?.length} exercises`)

const id = crypto.randomUUID(), now = new Date().toISOString()
const ins = await lucas.from('sessions').insert({ id, user_id: l.data.user!.id, workout_id: 'Push A', date: now.slice(0, 10), status: 'in_progress', started_at: now, updated_at: now })
ok('Lucas can write his own session', !ins.error, ins.error?.message)
const read = await dad.from('sessions').select('id').eq('id', id).maybeSingle()
ok('Dad can read Lucas\'s session', read.data?.id === id, read.error?.message)
const bad = await dad.from('sessions').insert({ id: crypto.randomUUID(), user_id: l.data.user!.id, workout_id: 'Push A', date: now.slice(0, 10), status: 'in_progress', started_at: now, updated_at: now })
ok('Dad cannot write as Lucas (RLS)', Boolean(bad.error), bad.error?.message)
const planWrite = await lucas.from('exercises').update({ mm_reference: 'x' }).eq('id', 'leg_press').select('id')
ok('Lucas cannot edit plan content (RLS)', (planWrite.data?.length ?? 0) === 0, planWrite.error?.message ?? `${planWrite.data?.length} rows changed`)
const coachWrite = await dad.from('exercises').update({ mm_reference: '' }).eq('id', 'leg_press').select('id')
ok('Dad can edit plan content', (coachWrite.data?.length ?? 0) === 1, coachWrite.error?.message)
const bucket = await dad.storage.from('media').list('', { limit: 1 })
ok('Media bucket reachable', !bucket.error, bucket.error?.message)

const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
const del = await admin.from('sessions').delete().eq('id', id)
ok('Test session removed', !del.error, del.error?.message)
