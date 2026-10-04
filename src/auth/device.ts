/**
 * Per-device memory of who uses this phone and their PIN.
 * The PIN is a local lock only; the real cloud login is a Supabase session paired once by the coach (see pairing.ts).
 */
export type Role = 'trainee' | 'coach'

export interface DeviceState {
  role: Role | null
  pinHash: string | null
}

const KEY = 'lt.device'
const UNLOCK_KEY = 'lt.unlocked'

export function getDevice(): DeviceState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as DeviceState
  } catch { /* ignore */ }
  return { role: null, pinHash: null }
}

export function setDevice(state: DeviceState) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function clearDevice() {
  localStorage.removeItem(KEY)
  sessionStorage.removeItem(UNLOCK_KEY)
}

export function isUnlocked(): boolean {
  return sessionStorage.getItem(UNLOCK_KEY) === '1'
}

export function setUnlocked(v: boolean) {
  if (v) sessionStorage.setItem(UNLOCK_KEY, '1')
  else sessionStorage.removeItem(UNLOCK_KEY)
}

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`lucas-training:${pin}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}
