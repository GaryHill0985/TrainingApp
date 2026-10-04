import 'dotenv/config'

export function need(name: string): string {
  const v = process.env[name]
  if (!v || v.trim() === '') {
    console.error(`\nMissing ${name}. Add it to .env (see .env.example).\n`)
    process.exit(1)
  }
  return v.trim()
}

export function projectRef(): string {
  const url = need('VITE_SUPABASE_URL')
  const m = url.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co/)
  if (!m) { console.error('VITE_SUPABASE_URL does not look like https://<ref>.supabase.co'); process.exit(1) }
  return m[1]
}
