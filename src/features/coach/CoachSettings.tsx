import { useState } from 'react'
import { Link } from 'react-router'
import { Screen } from '../../ui/Screen'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Field } from '../../ui/Field'
import { Collapsible } from '../../ui/Collapsible'
import { usePlan } from '../../plan/usePlan'
import { getTheme, setTheme, type ThemeName } from '../../lib/theme'
import { addMetric, editMetric, editSetting } from './edits'
import { uploadMedia } from '../../sync/storage'
import { mediaUrl } from '../../sync/supabase'
import type { MetricInputType, PlanEvent } from '../../plan/types'

export function CoachSettings() {
  const plan = usePlan()
  const [theme, setThemeState] = useState<ThemeName>(getTheme)
  const [msg, setMsg] = useState<string | null>(null)

  function pickTheme(t: ThemeName) { setTheme(t); setThemeState(t) }

  return (
    <Screen title="Settings" backTo="/coach" backLabel="Home">
      {msg && <Card tone="accent" className="mb-4"><p className="font-semibold">{msg}</p></Card>}

      <section>
        <h2 className="text-lg font-bold">Look</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant={theme === 'athletic_dark' ? 'primary' : 'secondary'} onClick={() => pickTheme('athletic_dark')}>Dark</Button>
          <Button variant={theme === 'light_highcontrast' ? 'primary' : 'secondary'} onClick={() => pickTheme('light_highcontrast')}>Light</Button>
        </div>
        <p className="mt-1 text-sm text-muted">This phone only. Lucas's phone keeps its own setting.</p>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-bold">Muscle view depth (Lucas's phone)</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant={plan.app.muscleDepth === 'simple' ? 'primary' : 'secondary'} onClick={() => editSetting('app', { ...plan.app, muscleDepth: 'simple' })}>Keep it simple</Button>
          <Button variant={plan.app.muscleDepth === 'everything' ? 'primary' : 'secondary'} onClick={() => editSetting('app', { ...plan.app, muscleDepth: 'everything' })}>Show everything</Button>
        </div>
        <p className="mt-1 text-sm text-muted">Simple shows the main muscles. Everything adds assistors, stabilisers and two-joint notes.</p>
      </section>

      <div className="mt-6">
        <Collapsible title="Target event (countdown)">
          <EventEditor event={plan.events[0]} all={plan.events} onSaved={() => setMsg('Event saved.')} />
        </Collapsible>
        <Collapsible title="Inspiration images (Lucas's 'why')">
          <Inspiration onMsg={setMsg} />
        </Collapsible>
        <Collapsible title="Daily log metrics">
          <Metrics onMsg={setMsg} />
        </Collapsible>
        <Collapsible title="About and credits">
          <Credits />
        </Collapsible>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Link to="/coach/goals" className="block"><Button variant="secondary" full>See Lucas's goals board</Button></Link>
        <Link to="/switch-user" className="block"><Button variant="quiet" full>Switch user on this phone</Button></Link>
      </div>
    </Screen>
  )
}

function EventEditor({ event, all, onSaved }: { event: PlanEvent | undefined; all: PlanEvent[]; onSaved: () => void }) {
  const [d, setD] = useState<PlanEvent>(event ?? { key: 'event', name: '', venue: '', date: '', date_end: '', countdown: true, goal: '', note: '' })
  return (
    <div className="flex flex-col gap-3">
      <Field label="Name" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
      <Field label="Venue" value={d.venue} onChange={(e) => setD({ ...d, venue: e.target.value })} />
      <Field label="Start date" type="date" value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} />
      <Field label="End date" type="date" value={d.date_end} onChange={(e) => setD({ ...d, date_end: e.target.value })} />
      <Field label="Goal (one line Lucas sees)" value={d.goal} onChange={(e) => setD({ ...d, goal: e.target.value })} />
      <label className="flex min-h-12 items-center gap-3"><input type="checkbox" className="size-6 accent-accent" checked={d.countdown} onChange={(e) => setD({ ...d, countdown: e.target.checked })} /><span className="font-semibold">Show countdown</span></label>
      <Button variant="primary" onClick={async () => { const rest = all.filter((e) => e.key !== d.key); await editSetting('events', [d, ...rest]); onSaved() }}>Save event</Button>
    </div>
  )
}

function Inspiration({ onMsg }: { onMsg: (m: string) => void }) {
  const plan = usePlan()
  const [busy, setBusy] = useState(false)
  const images = plan.goals.vision.images
  const max = plan.goals.vision.max_images
  async function add(file: File | undefined) {
    if (!file) return
    setBusy(true)
    const r = await uploadMedia(file, 'inspiration')
    setBusy(false)
    if ('problem' in r) { onMsg(r.problem); return }
    await editSetting('goals', { ...plan.goals, vision: { ...plan.goals.vision, images: [...images, r.path] } })
    onMsg('Image added.')
  }
  async function remove(path: string) {
    await editSetting('goals', { ...plan.goals, vision: { ...plan.goals.vision, images: images.filter((p) => p !== path) } })
  }
  return (
    <div>
      <p className="text-muted">{plan.goals.vision.images_note}</p>
      <ul className="mt-3 grid grid-cols-3 gap-2">
        {images.map((p) => (
          <li key={p} className="relative">
            <img src={mediaUrl(p)} alt="" className="aspect-square w-full rounded-control object-cover" />
            <button type="button" onClick={() => remove(p)} className="tap absolute right-1 top-1 rounded-full bg-bg/80 px-2 text-sm font-bold">Remove</button>
          </li>
        ))}
      </ul>
      {images.length < max && (
        <label className="mt-3 inline-flex min-h-12 cursor-pointer items-center justify-center rounded-control border border-line bg-surface2 px-5 font-semibold">
          <input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={(e) => add(e.target.files?.[0])} />
          {busy ? 'Uploading…' : `Add an image (${images.length} of ${max})`}
        </label>
      )}
    </div>
  )
}

function Metrics({ onMsg }: { onMsg: (m: string) => void }) {
  const plan = usePlan()
  const [adding, setAdding] = useState(false)
  const [n, setN] = useState({ key: '', label: '', unit: '', input_type: 'number' as MetricInputType, min: '0', max: '100', step: '1' })
  return (
    <div>
      <p className="text-muted">Turn a metric on and it appears in Lucas's daily log and charts straight away. No app update needed.</p>
      <ul className="mt-3 space-y-2">
        {plan.metrics.map((m) => (
          <li key={m.key} className="flex min-h-12 items-center justify-between gap-3 rounded-control bg-surface2 px-4">
            <span><span className="font-semibold">{m.label}</span> <span className="text-sm text-muted">· {m.unit} · {m.input_type}</span></span>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="size-6 accent-accent" checked={m.active} onChange={(e) => editMetric(m.key, { active: e.target.checked })} />On</label>
          </li>
        ))}
      </ul>
      {!adding ? <Button variant="secondary" className="mt-3" onClick={() => setAdding(true)}>Add a new metric</Button> : (
        <div className="mt-3 flex flex-col gap-3 rounded-card border border-line p-3">
          <Field label="Key (letters, no spaces)" value={n.key} onChange={(e) => setN({ ...n, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} />
          <Field label="Label" value={n.label} onChange={(e) => setN({ ...n, label: e.target.value })} />
          <Field label="Unit" value={n.unit} onChange={(e) => setN({ ...n, unit: e.target.value })} />
          <label className="block"><span className="mb-1 block text-base font-semibold text-muted">Input type</span>
            <select value={n.input_type} onChange={(e) => setN({ ...n, input_type: e.target.value as MetricInputType })} className="min-h-12 w-full rounded-control border border-line bg-surface2 px-3 text-lg">
              <option value="number">Number</option><option value="hours">Hours</option><option value="scale_1_5">Scale 1–5</option><option value="scale_1_10">Scale 1–10</option>
            </select></label>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Min" type="number" value={n.min} onChange={(e) => setN({ ...n, min: e.target.value })} />
            <Field label="Max" type="number" value={n.max} onChange={(e) => setN({ ...n, max: e.target.value })} />
            <Field label="Step" type="number" value={n.step} onChange={(e) => setN({ ...n, step: e.target.value })} />
          </div>
          <Button variant="primary" disabled={!n.key || !n.label || plan.metrics.some((m) => m.key === n.key)} onClick={async () => {
            await addMetric({ key: n.key, label: n.label, category: 'custom', input_type: n.input_type, unit: n.unit, min: Number(n.min), max: Number(n.max), step: Number(n.step) || 1, active: true, icon: 'dot', who_logs: 'trainee', note: '' })
            setAdding(false); onMsg(`${n.label} added and turned on.`)
          }}>Add metric</Button>
        </div>
      )}
    </div>
  )
}

function Credits() {
  const plan = usePlan()
  return (
    <div className="space-y-3 text-muted">
      <p>{plan.meta.plan_name} v{plan.meta.version}. An original app, not affiliated with or endorsed by any brand.</p>
      <p>{plan.meta.anatomy_data_note}</p>
      <p>No muscle diagrams, models or animations from commercial apps are used. Muscle &amp; Motion is a separate companion app under the coach's own subscription.</p>
      <p className="font-semibold text-text">Open anatomy sources (for any future in-app visuals)</p>
      <ul className="list-disc space-y-1 pl-5">
        {plan.meta.anatomy_sources.map((s) => <li key={s.name}><span className="font-semibold text-text">{s.name}</span> · {s.licence}{s.url ? ` · ${s.url}` : ''}</li>)}
      </ul>
      <p>Typeface: Inter (SIL Open Font License). Icons: original.</p>
    </div>
  )
}
