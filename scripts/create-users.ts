/**
 * Creates (or updates) the two real accounts behind the PIN screen, from .env:
 *   TRAINEE_EMAIL / TRAINEE_PASSWORD  → Lucas (role trainee)
 *   COACH_EMAIL   / COACH_PASSWORD    → Dad   (role coach)
 * Safe to re-run: existing users get their password and role refreshed.
 *
 *   npm run db:users
 */
import { createClient } from '@supabase/supabase-js'
import { need } from './lib/env.ts'

const sb = createClient(need('VITE_SUPABASE_URL'), need('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } })

const people = [
  { email: need('TRAINEE_EMAIL'), password: need('TRAINEE_PASSWORD'), role: 'trainee', display_name: 'Lucas' },
  { email: need('COACH_EMAIL'), password: need('COACH_PASSWORD'), role: 'coach', display_name: 'Dad' },
]

const { data: list, error: listErr } = await sb.auth.admin.listUsers({ perPage: 1000 })
if (listErr) { console.error(listErr.message); process.exit(1) }

for (const p of people) {
  const existing = list.users.find((u) => u.email?.toLowerCase() === p.email.toLowerCase())
  const meta = { role: p.role, display_name: p.display_name }
  let id: string
  if (existing) {
    const { error } = await sb.auth.admin.updateUserById(existing.id, { password: p.password, user_metadata: meta, email_confirm: true })
    if (error) { console.error(`${p.email}: ${error.message}`); process.exit(1) }
    id = existing.id
    console.log(`updated ${p.display_name} (${p.email})`)
  } else {
    const { data, error } = await sb.auth.admin.createUser({ email: p.email, password: p.password, email_confirm: true, user_metadata: meta })
    if (error) { console.error(`${p.email}: ${error.message}`); process.exit(1) }
    id = data.user.id
    console.log(`created ${p.display_name} (${p.email})`)
  }
  const { error: pe } = await sb.from('profiles').upsert({ id, display_name: p.display_name, role: p.role }, { onConflict: 'id' })
  if (pe) { console.error(`profile ${p.email}: ${pe.message}`); process.exit(1) }
}
console.log('\nAccounts ready. Pair each phone once with the matching email + password.')
