/**
 * Applies supabase/migrations/*.sql in order, once each (tracked in public.schema_migrations).
 * Connects with the database password from .env. Tries the direct host first, then the
 * IPv4 session pooler across regions (the free tier's direct host is IPv6-only).
 *
 *   npm run db:migrate
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import pg from 'pg'
import { need, projectRef } from './lib/env.ts'

const ref = projectRef()
const password = need('SUPABASE_DB_PASSWORD')

const regions = [
  'eu-west-2', 'eu-west-1', 'eu-west-3', 'eu-central-1', 'eu-central-2', 'eu-north-1',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'ca-central-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2', 'ap-south-1', 'sa-east-1',
]

async function connect(): Promise<pg.Client> {
  const candidates: { host: string; user: string; port: number }[] = [
    { host: `db.${ref}.supabase.co`, user: 'postgres', port: 5432 },
    ...regions.map((r) => ({ host: `aws-0-${r}.pooler.supabase.com`, user: `postgres.${ref}`, port: 5432 })),
    ...regions.map((r) => ({ host: `aws-1-${r}.pooler.supabase.com`, user: `postgres.${ref}`, port: 5432 })),
  ]
  for (const c of candidates) {
    const client = new pg.Client({ ...c, password, database: 'postgres', ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 6000 })
    try {
      await client.connect()
      console.log(`Connected via ${c.host}`)
      return client
    } catch (e) {
      const msg = (e as Error).message
      if (/password|authentication/i.test(msg)) { console.error(`Wrong database password (${c.host}).`); process.exit(1) }
      // Tenant not found / timeout → try the next host
      try { await client.end() } catch { /* ignore */ }
    }
  }
  console.error('Could not connect to the database. Check SUPABASE_DB_PASSWORD and that the project is awake.')
  process.exit(1)
}

const client = await connect()
await client.query('create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now())')
const applied = new Set((await client.query('select name from public.schema_migrations')).rows.map((r: { name: string }) => r.name))

const dir = join(process.cwd(), 'supabase', 'migrations')
const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
for (const f of files) {
  if (applied.has(f)) { console.log(`skip   ${f} (already applied)`); continue }
  const sql = readFileSync(join(dir, f), 'utf8')
  console.log(`apply  ${f}`)
  await client.query('begin')
  try {
    await client.query(sql)
    await client.query('insert into public.schema_migrations (name) values ($1)', [f])
    await client.query('commit')
  } catch (e) {
    await client.query('rollback')
    console.error(`FAILED ${f}:`, (e as Error).message)
    await client.end()
    process.exit(1)
  }
}
await client.end()
console.log('Migrations up to date.')
