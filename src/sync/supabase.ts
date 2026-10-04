import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when the app has been built with Supabase details. Without them the app still works locally. */
export const cloudConfigured = Boolean(url && anon)

let client: SupabaseClient | null = null

export function supabase(): SupabaseClient {
  if (!client) {
    if (!url || !anon) throw new Error('Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).')
    client = createClient(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      realtime: { params: { eventsPerSecond: 5 } },
    })
  }
  return client
}

/** Public URL for a file in the media bucket. */
export function mediaUrl(path: string): string {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return `${url}/storage/v1/object/public/media/${path}`
}
