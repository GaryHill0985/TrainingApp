import { useMemo, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Screen } from '../../ui/Screen'
import { Card } from '../../ui/Card'
import { usePlan } from '../../plan/usePlan'
import { useAllLogs, useAllSets, useSessions } from '../trainee/data'
import { e1rm } from '../trainee/logic'
import { formatShort } from '../../lib/dates'
import type { TechniqueColour } from '../../plan/types'

interface Point {
  date: string
  label: string
  session_id: string
  topWeight: number | null
  repsAtTop: number | null
  est: number | null
  technique: TechniqueColour | null
  pain: boolean
}

const techniqueColour: Record<TechniqueColour, string> = { green: 'var(--color-ok)', amber: 'var(--color-warn)', red: 'var(--color-danger)' }
const techniqueLabel: Record<TechniqueColour, string> = { green: 'Green', amber: 'Amber', red: 'Red' }

/** Per-exercise charts: top-set weight, reps at that weight, estimated working strength, with technique colour on every point. */
export function CoachProgress() {
  const plan = usePlan()
  const sessions = useSessions()
  const sets = useAllSets()
  const logs = useAllLogs()
  const exerciseIds = useMemo(() => {
    const seen = new Set<string>()
    for (const w of plan.workouts) for (const it of w.items) seen.add(it.exercise_id)
    return [...seen]
  }, [plan])
  const [exerciseId, setExerciseId] = useState(exerciseIds[0] ?? '')
  const exercise = plan.exercises[exerciseId]

  const points = useMemo<Point[]>(() => {
    const done = sessions.filter((s) => s.status === 'complete').sort((a, b) => a.started_at.localeCompare(b.started_at))
    const out: Point[] = []
    for (const s of done) {
      const mine = sets.filter((x) => x.session_id === s.id && x.exercise_id === exerciseId && !x.is_warmup && x.reps_done != null)
      if (mine.length === 0) continue
      const log = logs.find((l) => l.session_id === s.id && l.exercise_id === exerciseId)
      const weighted = mine.filter((x) => x.weight != null)
      let topWeight: number | null = null, repsAtTop: number | null = null, est: number | null = null
      if (weighted.length) {
        topWeight = Math.max(...weighted.map((x) => x.weight!))
        repsAtTop = Math.max(...weighted.filter((x) => x.weight === topWeight).map((x) => x.reps_done!))
        est = Math.round(Math.max(...weighted.map((x) => e1rm(x.weight!, x.reps_done!))) * 10) / 10
      } else {
        repsAtTop = Math.max(...mine.map((x) => x.reps_done!))
      }
      out.push({ date: s.date, label: formatShort(s.date), session_id: s.id, topWeight, repsAtTop, est, technique: log?.technique_colour ?? null, pain: log?.pain_flag ?? false })
    }
    return out
  }, [sessions, sets, logs, exerciseId])

  const hasWeight = points.some((p) => p.topWeight != null)

  return (
    <Screen title="Progress">
      <label className="block">
        <span className="mb-1 block text-base font-semibold text-muted">Exercise</span>
        <select value={exerciseId} onChange={(e) => setExerciseId(e.target.value)} className="min-h-12 w-full rounded-control border border-line bg-surface2 px-4 text-lg">
          {exerciseIds.map((id) => <option key={id} value={id}>{plan.exercises[id]?.name ?? id}</option>)}
        </select>
      </label>

      {exercise && (
        <Card className="mt-4">
          <p className="text-sm font-bold uppercase tracking-wide text-muted">When to add load</p>
          <p className="mt-1">{exercise.progress_when}</p>
        </Card>
      )}

      {points.length === 0 ? (
        <p className="mt-6 text-muted">No completed sessions with this exercise yet.</p>
      ) : (
        <>
          <Legend />
          {hasWeight && <Chart title="Top-set weight (kg)" data={points} dataKey="topWeight" unit=" kg" />}
          <Chart title={hasWeight ? 'Reps at top-set weight' : 'Best reps'} data={points} dataKey="repsAtTop" unit="" />
          {hasWeight && <Chart title="Estimated working strength (kg, estimate)" data={points} dataKey="est" unit=" kg" />}

          <details className="mt-6">
            <summary className="min-h-12 cursor-pointer font-semibold">Show as a table</summary>
            <table className="mt-2 w-full text-left">
              <thead><tr className="text-sm text-muted"><th className="py-1">Date</th><th>Top set</th><th>Est.</th><th>Technique</th></tr></thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.session_id} className="border-t border-line">
                    <td className="py-1.5">{p.label}</td>
                    <td className="tabular-nums">{p.topWeight != null ? `${p.topWeight} kg × ${p.repsAtTop}` : `${p.repsAtTop} reps`}</td>
                    <td className="tabular-nums">{p.est ?? '—'}</td>
                    <td>{p.technique ? techniqueLabel[p.technique] : '—'}{p.pain ? ' · pain' : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </Screen>
  )
}

function Legend() {
  return (
    <ul className="mt-6 flex flex-wrap gap-4 text-sm font-semibold text-muted" aria-label="Technique colour key">
      {(['green', 'amber', 'red'] as TechniqueColour[]).map((c) => (
        <li key={c} className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-full" style={{ background: techniqueColour[c] }} aria-hidden="true" />{techniqueLabel[c]} technique</li>
      ))}
      <li className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-full border-2 border-danger" aria-hidden="true" />Pain flag</li>
    </ul>
  )
}

function Chart({ title, data, dataKey, unit }: { title: string; data: Point[]; dataKey: 'topWeight' | 'repsAtTop' | 'est'; unit: string }) {
  return (
    <section className="mt-5">
      <h3 className="text-base font-bold">{title}</h3>
      <div className="mt-2 h-56 w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: -8 }}>
            <CartesianGrid stroke="var(--color-line)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'var(--color-muted)', fontSize: 12 }} axisLine={{ stroke: 'var(--color-line)' }} tickLine={false} minTickGap={24} />
            <YAxis tick={{ fill: 'var(--color-muted)', fontSize: 12 }} axisLine={false} tickLine={false} width={44} domain={['auto', 'auto']} />
            <Tooltip content={<Tip unit={unit} dataKey={dataKey} />} cursor={{ stroke: 'var(--color-muted)', strokeDasharray: '3 3' }} />
            <Line type="monotone" dataKey={dataKey} stroke="var(--color-text)" strokeWidth={2} connectNulls dot={<TechniqueDot />} activeDot={{ r: 7, stroke: 'var(--color-surface)', strokeWidth: 2 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function TechniqueDot(props: { cx?: number; cy?: number; payload?: Point; value?: number | null }) {
  const { cx, cy, payload } = props
  if (cx == null || cy == null || !payload || props.value == null) return null
  const fill = payload.technique ? techniqueColour[payload.technique] : 'var(--color-muted)'
  return (
    <g>
      <circle cx={cx} cy={cy} r={payload.pain ? 7 : 5} fill={fill} stroke={payload.pain ? 'var(--color-danger)' : 'var(--color-surface)'} strokeWidth={2} />
      {payload.technique === 'amber' && <circle cx={cx} cy={cy} r={2} fill="var(--color-surface)" />}
      {payload.technique === 'red' && <rect x={cx - 2} y={cy - 2} width={4} height={4} fill="var(--color-surface)" />}
    </g>
  )
}

function Tip({ active, payload, unit, dataKey }: { active?: boolean; payload?: { payload: Point }[]; unit: string; dataKey: keyof Point }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  const v = p[dataKey] as number | null
  return (
    <div className="rounded-control border border-line bg-surface px-3 py-2 text-sm shadow">
      <p className="font-semibold">{p.label}</p>
      <p className="tabular-nums">{v == null ? '—' : `${v}${unit}`}</p>
      {p.topWeight != null && <p className="text-muted">Top set {p.topWeight} kg × {p.repsAtTop}</p>}
      <p className="text-muted">{p.technique ? `${techniqueLabel[p.technique]} technique` : 'No technique colour'}{p.pain ? ' · pain flag' : ''}</p>
    </div>
  )
}
