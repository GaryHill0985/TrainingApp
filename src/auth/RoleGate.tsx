import { useState, type ReactNode } from 'react'
import { Navigate } from 'react-router'
import { getDevice, hashPin, isUnlocked, setDevice, setUnlocked, type Role } from './device'
import { Screen } from '../ui/Screen'
import { Button } from '../ui/Button'
import { MANTRA } from '../plan/seed'
import { Field } from '../ui/Field'
import { pairDevice } from './pairing'
import { cloudConfigured } from '../sync/supabase'

interface Props {
  /** When set, only this role may pass; otherwise the gate just routes to the right home. */
  require?: Role
  children?: ReactNode
}

/**
 * First launch: "Who's using the app?" → set a 4-digit PIN → remembered on this device.
 * Later launches: PIN lock, then straight into that person's view.
 * (Milestone 3 wires the Supabase pairing behind this; the surface stays this simple.)
 */
export function RoleGate({ require, children }: Props) {
  const [device, setDev] = useState(getDevice)
  const [unlocked, setUnl] = useState(isUnlocked)

  if (!device.role || !device.pinHash) {
    return <WhoPicker onDone={(d) => { setDevice(d); setDev(d); setUnlocked(true); setUnl(true) }} />
  }
  if (!unlocked) {
    return <PinLock role={device.role} pinHash={device.pinHash} onUnlock={() => { setUnlocked(true); setUnl(true) }} />
  }
  if (!require) return <Navigate to={device.role === 'coach' ? '/coach' : '/lucas'} replace />
  if (require !== device.role) return <Navigate to={device.role === 'coach' ? '/coach' : '/lucas'} replace />
  return <>{children}</>
}

function WhoPicker({ onDone }: { onDone: (d: { role: Role; pinHash: string }) => void }) {
  const [role, setRole] = useState<Role | null>(null)
  const [paired, setPaired] = useState(false)
  if (role && !paired) return <PairScreen role={role} onBack={() => setRole(null)} onDone={() => setPaired(true)} />
  if (role) return <PinSetup role={role} onBack={() => { setPaired(false); setRole(null) }} onDone={(pinHash) => onDone({ role, pinHash })} />
  return (
    <Screen>
      <div className="mx-auto flex max-w-md flex-col gap-6 pt-10">
        <h1 className="text-3xl font-extrabold tracking-tight">Who's using the app?</h1>
        <button type="button" onClick={() => setRole('trainee')} className="rounded-card border-2 border-line bg-surface p-8 text-left text-2xl font-extrabold active:border-accent">
          Lucas
        </button>
        <button type="button" onClick={() => setRole('coach')} className="rounded-card border-2 border-line bg-surface p-8 text-left text-2xl font-extrabold active:border-accent">
          Dad
        </button>
        <p className="mt-6 text-center text-sm text-muted">{MANTRA}</p>
      </div>
    </Screen>
  )
}

function PinPad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']
  return (
    <div className="mx-auto w-full max-w-xs">
      <div className="mb-6 flex justify-center gap-4" aria-label={`${value.length} of 4 digits entered`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`size-5 rounded-full border-2 ${i < value.length ? 'border-accent bg-accent' : 'border-muted'}`} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {keys.map((k, i) =>
          k === '' ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              type="button"
              aria-label={k === 'del' ? 'Delete last digit' : k}
              onClick={() => onChange(k === 'del' ? value.slice(0, -1) : (value + k).slice(0, 4))}
              className="min-h-16 rounded-control bg-surface2 text-2xl font-bold active:bg-line"
            >
              {k === 'del' ? '⌫' : k}
            </button>
          ),
        )}
      </div>
    </div>
  )
}

function PinSetup({ role, onBack, onDone }: { role: Role; onBack: () => void; onDone: (hash: string) => void }) {
  const [first, setFirst] = useState('')
  const [second, setSecond] = useState('')
  const [stage, setStage] = useState<'first' | 'second'>('first')
  const [mismatch, setMismatch] = useState(false)
  const name = role === 'coach' ? 'Dad' : 'Lucas'

  async function check() {
    if (first === second) onDone(await hashPin(first))
    else { setMismatch(true); setSecond(''); setFirst(''); setStage('first') }
  }

  return (
    <Screen>
      <div className="mx-auto max-w-md pt-6">
        <h1 className="text-2xl font-extrabold">{name}, choose a 4-digit PIN</h1>
        <p className="mt-2 text-muted">{stage === 'first' ? 'Type 4 numbers. You will use this to open the app.' : 'Type the same 4 numbers again.'}</p>
        {mismatch && <p className="mt-2 font-semibold text-warn">Those did not match. Start again.</p>}
        <div className="mt-8">
          {stage === 'first' ? <PinPad value={first} onChange={setFirst} /> : <PinPad value={second} onChange={setSecond} />}
        </div>
        <div className="mt-8 flex flex-col gap-3">
          {stage === 'first' ? (
            <Button variant="primary" size="lg" full disabled={first.length !== 4} onClick={() => setStage('second')}>Next</Button>
          ) : (
            <Button variant="primary" size="lg" full disabled={second.length !== 4} onClick={check}>Save PIN</Button>
          )}
          <Button variant="quiet" full onClick={onBack}>Go back</Button>
        </div>
      </div>
    </Screen>
  )
}

function PinLock({ role, pinHash, onUnlock }: { role: Role; pinHash: string; onUnlock: () => void }) {
  const [pin, setPin] = useState('')
  const [wrong, setWrong] = useState(false)
  const name = role === 'coach' ? 'Dad' : 'Lucas'

  async function tryPin(v: string) {
    setPin(v)
    setWrong(false)
    if (v.length === 4) {
      if ((await hashPin(v)) === pinHash) onUnlock()
      else { setWrong(true); setPin('') }
    }
  }

  return (
    <Screen>
      <div className="mx-auto max-w-md pt-10">
        <h1 className="text-2xl font-extrabold">Hi {name}. Enter your PIN.</h1>
        {wrong && <p className="mt-2 font-semibold text-warn">That was not right. Try again.</p>}
        <div className="mt-8"><PinPad value={pin} onChange={tryPin} /></div>
        <p className="mt-10 text-center text-sm text-muted">{MANTRA}</p>
      </div>
    </Screen>
  )
}

/**
 * Done once per phone by Dad: signs in with the real account behind the chosen role.
 * After this, only the PIN is ever asked for.
 */
function PairScreen({ role, onBack, onDone }: { role: Role; onBack: () => void; onDone: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const name = role === 'coach' ? 'Dad' : 'Lucas'

  async function submit() {
    setBusy(true)
    setProblem(null)
    const err = await pairDevice(role, email, password)
    setBusy(false)
    if (err) setProblem(err)
    else onDone()
  }

  return (
    <Screen>
      <div className="mx-auto max-w-md pt-6">
        <h1 className="text-2xl font-extrabold">Connect this phone to {name}'s account</h1>
        <p className="mt-2 text-muted">Dad does this once. After that the app only asks for a PIN.</p>
        {!cloudConfigured && <p className="mt-3 font-semibold text-warn">This build has no cloud settings, so it cannot connect yet.</p>}
        <form className="mt-6 flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); void submit() }}>
          <Field label="Email" type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {problem && <p className="font-semibold text-warn">{problem}</p>}
          <Button type="submit" variant="primary" size="lg" full disabled={busy || !email || !password}>{busy ? 'Connecting' : 'Connect'}</Button>
          <Button variant="quiet" full onClick={onBack} disabled={busy}>Go back</Button>
        </form>
      </div>
    </Screen>
  )
}
