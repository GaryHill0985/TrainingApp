import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Screen } from '../../ui/Screen'
import { usePlan } from '../../plan/usePlan'
import { formatDuration, useActivityEntries, useMetricLogs } from '../lifelog/data'
import { formatShort } from '../../lib/dates'

/** Generic chart for any metric definition, plus activity history. New metrics appear here automatically. */
export function CoachMetrics() {
  const plan = usePlan()
  const logs = useMetricLogs()
  const activities = useActivityEntries().sort((a, b) => b.date.localeCompare(a.date))
  const defs = plan.metrics.filter((m) => m.active || logs.some((l) => l.metric_key === m.key))
  const [key, setKey] = useState(defs[0]?.key ?? '')
  const def = plan.metrics.find((m) => m.key === key)
  const data = useMemo(() => logs.filter((l) => l.metric_key === key && l.value_num != null).sort((a, b) => a.date.localeCompare(b.date)).map((l) => ({ label: formatShort(l.date), value: l.value_num })), [logs, key])

  return (
    <Screen title="Daily metrics" backTo="/coach/calendar" backLabel="Calendar">
      <label className="block">
        <span className="mb-1 block text-base font-semibold text-muted">Metric</span>
        <select value={key} onChange={(e) => setKey(e.target.value)} className="min-h-12 w-full rounded-control border border-line bg-surface2 px-4 text-lg">
          {defs.map((m) => <option key={m.key} value={m.key}>{m.label}{m.active ? '' : ' (off)'}</option>)}
        </select>
      </label>
      {data.length === 0 ? <p className="mt-6 text-muted">Nothing logged for this yet.</p> : (
        <div className="mt-5 h-56 w-full">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: -8 }}>
              <CartesianGrid stroke="var(--color-line)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'var(--color-muted)', fontSize: 12 }} axisLine={{ stroke: 'var(--color-line)' }} tickLine={false} minTickGap={24} />
              <YAxis tick={{ fill: 'var(--color-muted)', fontSize: 12 }} axisLine={false} tickLine={false} width={44} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: 12, color: 'var(--color-text)' }} formatter={(v) => [`${v}${def?.unit && !def.unit.includes('-') ? ` ${def.unit}` : ''}`, def?.label ?? '']} cursor={{ stroke: 'var(--color-muted)', strokeDasharray: '3 3' }} />
              <Line type="monotone" dataKey="value" stroke="var(--color-text)" strokeWidth={2} dot={{ r: 4, fill: 'var(--color-accent)', stroke: 'var(--color-surface)', strokeWidth: 2 }} activeDot={{ r: 7 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {def && <p className="mt-2 text-sm text-muted">{def.label}{def.unit ? ` in ${def.unit}` : ''}. A record of what was logged, not a target.</p>}

      <h2 className="mt-8 text-lg font-bold">Activity history</h2>
      {activities.length === 0 ? <p className="text-muted">No activities logged yet.</p> : (
        <ul className="mt-2 space-y-1">
          {activities.map((a) => {
            const t = plan.activityTypes.find((x) => x.key === a.activity_type)
            const pace = a.distance_value && a.duration_seconds && a.distance_unit === 'km' ? ` · ${formatDuration(Math.round(a.duration_seconds / a.distance_value))}/km` : ''
            return <li key={a.id} className="flex justify-between gap-2 border-b border-line py-2"><span>{formatShort(a.date)} · <span className="font-semibold">{t?.label ?? a.activity_type}</span></span><span className="text-muted">{a.distance_value != null ? `${a.distance_value} ${a.distance_unit}` : ''}{a.duration_seconds != null ? ` · ${formatDuration(a.duration_seconds)}` : ''}{pace}</span></li>
          })}
        </ul>
      )}
    </Screen>
  )
}
