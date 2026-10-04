import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Screen } from '../../ui/Screen'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Field } from '../../ui/Field'
import { usePlan } from '../../plan/usePlan'
import { formatLong, todayKey } from '../../lib/dates'
import type { MetricDefinition } from '../../plan/types'
import { addActivity, addFood, formatDuration, removeActivity, removeFood, setMetric, useActivityEntries, useFoodEntries, useMetricLogs } from './data'

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

/**
 * "Add to today": everything optional, a few taps each, clear saved state, nothing nags.
 * Inputs are rendered from the metric definitions, so a newly active metric just appears.
 */
export function AddToToday() {
  const { date: dateParam } = useParams()
  const date = dateParam ?? todayKey()
  const plan = usePlan()
  const navigate = useNavigate()
  const [open, setOpen] = useState<'activity' | 'food' | 'metrics' | null>(null)
  const metrics = plan.metrics.filter((m) => m.active && m.who_logs === 'trainee')
  const backTo = dateParam ? `/lucas/day/${date}` : '/lucas'

  return (
    <Screen title={dateParam && date !== todayKey() ? `Add to ${formatLong(date)}` : 'Add to today'} backTo={backTo} backLabel="Back">
      <p className="text-muted">All of this is optional. Add what you want.</p>
      <div className="mt-4 grid gap-3">
        <Button variant={open === 'activity' ? 'primary' : 'secondary'} size="lg" full onClick={() => setOpen(open === 'activity' ? null : 'activity')}>Other exercise or activity</Button>
        <Button variant={open === 'food' ? 'primary' : 'secondary'} size="lg" full onClick={() => setOpen(open === 'food' ? null : 'food')}>Food</Button>
        <Button variant={open === 'metrics' ? 'primary' : 'secondary'} size="lg" full onClick={() => setOpen(open === 'metrics' ? null : 'metrics')}>Sleep and how I feel</Button>
      </div>
      {open === 'activity' && <ActivityForm date={date} />}
      {open === 'food' && <FoodForm date={date} />}
      {open === 'metrics' && <MetricsForm date={date} metrics={metrics} />}
      <Button variant="quiet" full className="mt-8" onClick={() => navigate(backTo)}>Done</Button>
    </Screen>
  )
}

function ActivityForm({ date }: { date: string }) {
  const plan = usePlan()
  const entries = useActivityEntries().filter((a) => a.date === date)
  const [type, setType] = useState(plan.activityTypes[0]?.key ?? 'other')
  const [distance, setDistance] = useState('')
  const [mins, setMins] = useState('')
  const [secs, setSecs] = useState('')
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const t = plan.activityTypes.find((a) => a.key === type)
  const canSave = Boolean(t) && (distance !== '' || mins !== '' || secs !== '' || note.trim() !== '')

  async function save() {
    const duration = mins === '' && secs === '' ? null : (Number(mins) || 0) * 60 + (Number(secs) || 0)
    await addActivity({ date, activity_type: type, distance_value: distance === '' ? null : Number(distance), distance_unit: t?.distance_unit ?? null, duration_seconds: duration, note: note.trim() })
    setDistance(''); setMins(''); setSecs(''); setNote(''); setSaved(true)
  }

  return (
    <Card className="mt-4">
      <h3 className="text-lg font-bold">Activity</h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {plan.activityTypes.map((a) => (
          <button key={a.key} type="button" aria-pressed={type === a.key} onClick={() => setType(a.key)} className={`min-h-12 rounded-control border-2 px-3 font-semibold ${type === a.key ? 'border-accent' : 'border-line bg-surface2'}`}>{a.label}</button>
        ))}
      </div>
      <div className="mt-4 grid gap-3">
        {t?.tracks.includes('distance') && t.distance_unit && <Field label={`Distance (${t.distance_unit})`} type="number" inputMode="decimal" step={t.distance_unit === 'km' ? 0.1 : 10} value={distance} onChange={(e) => setDistance(e.target.value)} />}
        {t?.tracks.includes('duration') && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Minutes" type="number" inputMode="numeric" value={mins} onChange={(e) => setMins(e.target.value)} />
            <Field label="Seconds" type="number" inputMode="numeric" value={secs} onChange={(e) => setSecs(e.target.value)} />
          </div>
        )}
        <Field label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <Button variant="primary" size="lg" full className="mt-4" icon="tick" disabled={!canSave} onClick={save}>Save activity</Button>
      {saved && <p className="mt-2 text-center font-semibold text-ok">Saved.</p>}
      {entries.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-line pt-3">
          {entries.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2">
              <span>{plan.activityTypes.find((x) => x.key === a.activity_type)?.label ?? a.activity_type}{a.distance_value != null ? ` · ${a.distance_value} ${a.distance_unit}` : ''}{a.duration_seconds != null ? ` · ${formatDuration(a.duration_seconds)}` : ''}{a.note ? ` · ${a.note}` : ''}</span>
              <button type="button" onClick={() => removeActivity(a.id)} className="tap px-2 text-sm font-semibold text-muted">Remove</button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function FoodForm({ date }: { date: string }) {
  const plan = usePlan()
  const entries = useFoodEntries().filter((f) => f.date === date)
  const logs = useMetricLogs()
  const caloriesMetric = plan.metrics.find((m) => m.key === 'calories' && m.active)
  const quick = logs.find((l) => l.date === date && l.metric_key === 'calories')
  const [meal, setMeal] = useState<string | null>(null)
  const [desc, setDesc] = useState('')
  const [cal, setCal] = useState('')
  const [quickCal, setQuickCal] = useState(quick?.value_num != null ? String(quick.value_num) : '')
  const [saved, setSaved] = useState(false)

  async function save() {
    await addFood({ date, meal, description: desc.trim(), calories: cal === '' ? null : Number(cal), time: null })
    setDesc(''); setCal(''); setSaved(true)
  }

  return (
    <Card className="mt-4">
      <h3 className="text-lg font-bold">Food</h3>
      <p className="text-muted">Just what you ate. Fuel for training.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {MEALS.map((m) => <button key={m} type="button" aria-pressed={meal === m} onClick={() => setMeal(meal === m ? null : m)} className={`min-h-12 rounded-control border-2 px-4 font-semibold ${meal === m ? 'border-accent' : 'border-line bg-surface2'}`}>{m}</button>)}
      </div>
      <div className="mt-3 grid gap-3">
        <Field label="What you ate" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. chicken, rice and veg" />
        <Field label="Calories (optional)" type="number" inputMode="numeric" step={10} value={cal} onChange={(e) => setCal(e.target.value)} />
      </div>
      <Button variant="primary" size="lg" full className="mt-4" icon="tick" disabled={!desc.trim()} onClick={save}>Save food</Button>
      {saved && <p className="mt-2 text-center font-semibold text-ok">Saved.</p>}
      {entries.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-line pt-3">
          {entries.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-2">
              <span>{f.meal ? `${f.meal}: ` : ''}{f.description}{f.calories != null ? ` · ${f.calories} kcal` : ''}</span>
              <button type="button" onClick={() => removeFood(f.id)} className="tap px-2 text-sm font-semibold text-muted">Remove</button>
            </li>
          ))}
        </ul>
      )}
      {caloriesMetric && (
        <div className="mt-4 border-t border-line pt-3">
          <Field label="Or just a number for the whole day (kcal, optional)" type="number" inputMode="numeric" step={10} value={quickCal} onChange={(e) => setQuickCal(e.target.value)} onBlur={() => void setMetric(date, 'calories', quickCal === '' ? null : Number(quickCal))} />
        </div>
      )}
    </Card>
  )
}

function MetricsForm({ date, metrics }: { date: string; metrics: MetricDefinition[] }) {
  const logs = useMetricLogs().filter((l) => l.date === date)
  const shown = metrics.filter((m) => m.key !== 'calories')
  return (
    <Card className="mt-4">
      <h3 className="text-lg font-bold">Sleep and how I feel</h3>
      <div className="mt-3 grid gap-5">
        {shown.map((m) => <MetricInput key={m.key} date={date} metric={m} value={logs.find((l) => l.metric_key === m.key)?.value_num ?? null} />)}
      </div>
    </Card>
  )
}

/** One control per metric, chosen from its input_type. Saves on change; shows "Saved". */
function MetricInput({ date, metric, value }: { date: string; metric: MetricDefinition; value: number | null }) {
  const [draft, setDraft] = useState(value == null ? '' : String(value))
  const [saved, setSaved] = useState(false)
  async function commit(v: number | null) { await setMetric(date, metric.key, v); setSaved(true) }

  if (metric.input_type === 'scale_1_5' || metric.input_type === 'scale_1_10') {
    const n = metric.input_type === 'scale_1_5' ? 5 : 10
    return (
      <div>
        <p className="mb-1 font-semibold text-muted">{metric.label}{metric.note ? <span className="font-normal"> · {metric.note}</span> : ''}</p>
        <div className={`grid gap-1 ${n === 5 ? 'grid-cols-5' : 'grid-cols-5'}`}>
          {Array.from({ length: n }, (_, i) => i + 1).map((i) => (
            <button key={i} type="button" aria-pressed={value === i} onClick={() => commit(value === i ? null : i)} className={`min-h-12 rounded-control border-2 text-lg font-bold ${value === i ? 'border-accent' : 'border-line bg-surface2'}`}>{i}</button>
          ))}
        </div>
        {saved && <p className="mt-1 text-sm font-semibold text-ok">Saved.</p>}
      </div>
    )
  }
  return (
    <Field
      label={`${metric.label}${metric.unit ? ` (${metric.unit})` : ''}`}
      hint={saved ? 'Saved.' : metric.note}
      type="number" inputMode="decimal" step={metric.step} min={metric.min} max={metric.max}
      value={draft}
      onChange={(e) => { setSaved(false); setDraft(e.target.value) }}
      onBlur={() => commit(draft === '' ? null : Number(draft))}
    />
  )
}
