import { cloudConfigured, supabase } from '../sync/supabase'
import { db } from '../db/db'
import { onPaired, onUnpaired, resetLocalData } from '../sync/engine'
import type { Role } from './device'

const USER_KEY = 'lt.user_id'

export function currentUserId(): string | null {
  try { return localStorage.getItem(USER_KEY) } catch { return null }
}

/**
 * One-time pairing: Dad signs this phone in with the real account for the chosen role.
 * Returns an error message in plain words, or null on success.
 */
export async function pairDevice(role: Role, email: string, password: string): Promise<string | null> {
  if (!cloudConfigured) return 'This build has no cloud settings. Ask Dad to check the app setup.'
  const { data, error } = await supabase().auth.signInWithPassword({ email: email.trim(), password })
  if (error || !data.user) return 'That email or password was not right. Try again.'
  const { data: profile } = await supabase().from('profiles').select('id, display_name, role').eq('id', data.user.id).maybeSingle()
  if (!profile) { await supabase().auth.signOut(); return 'This account has no profile yet. Run the setup script first.' }
  if (profile.role !== role) {
    await supabase().auth.signOut()
    return role === 'trainee' ? "That account is Dad's. Use Lucas's account on this phone." : "That account is Lucas's. Use Dad's account here."
  }
  localStorage.setItem(USER_KEY, profile.id)
  await db.profiles.put(profile)
  await onPaired()
  return null
}

export async function unpairDevice() {
  try { if (cloudConfigured) await supabase().auth.signOut() } catch { /* offline is fine */ }
  localStorage.removeItem(USER_KEY)
  await onUnpaired()
  await resetLocalData()
}
