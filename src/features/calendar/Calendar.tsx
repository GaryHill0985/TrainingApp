import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Screen } from '../../ui/Screen'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { SyncBadge } from '../../sync/SyncBadge'
import { usePlan } from '../../plan/usePlan'
import { useSessions } from '../trainee/data'
import { useActivityEntries, useFoodEntries, useMetricLogs } from '../lifelog/data'
import { addDays, parseKey, todayKey, weekStartKey } from '../../lib/dates'

const WORKOUT_COLOURS = ['var(--color-pos-lengthened)', 'var(--color-pos-shortened)', 'var(--color-pos-trunk)', 'var(--color-pos-full)', 'var(--color-accent)']

/** Month (default) or week view. Empty days are plain; nothing is red; nothing is a streak. */
export function Calendar({ role }: { role: 'trainee' | 'coach' }) {
  const plan = usePlan()
  const sessions = useSessions()
  const activities = useActivityEntries()
  const foods = useFoodEntries()
  const metrics = useMetricLogs()
  const [view, setView] = useState<'month' | 'week'>('month')
  const [cursor, setCursor] = useState(() => todayKey())
  const base = role === 'coach' ? '/coach' : '/lucas'

  const workoutColour = (id: string) => WORKOUT_COLOURS[Math.max(0, plan.workouts.findIndex((w) => w.id === id)) % WORKOUT_COLOURS.length]

  const byDay = useMemo(() => {
    const m = new Map<string, { sessions: typeof sessions; activity: boolean; food: boolean; sleep: boolean }>()
    const get = (d: string) => { let v = m.get(d); if (!v) { v = { sessions: [], activity: false, food: false, sleep: false }; m.set(d, v) } return v }
    for (const s of sessions) get(s.date).sessions.push(s)
    for (const a of activities) get(a.date).activity = true
    for (const f of foods) get(f.date).food = true
    for (const l of metrics) if (l.metric_key === 'sleep_hours') get(l.date).sleep = true
    return m
  }, [sessions, activities, foods, metrics])

  const c = parseKey(cursor)
  const days: string[] = []
  let title: string
  if (view === 'week') {
    const start = weekStartKey(c)
    for (let i = 0; i < 7; i++) days.push(addDays(start, i))
    title = `Week of ${parseKey(start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
  } else {
    const first = new Date(c.getFullYear(), c.getMonth(), 1)
    const start = weekStartKey(first)
    const last = new Date(c.getFullYear(), c.getMonth() + 1, 0)
    const total = Math.ceil((parseKey(start).getTime() - last.getTime()) / -86_400_000 + 1)
    const weeks = Math.ceil(total / 7)
    for (let i = 0; i < weeks * 7; i++) days.push(addDays(start, i))
    title = c.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  }
  const inMonth = (d: string) => view === 'week' || parseKey(d).getMonth() === c.getMonth()

  function move(n: number) {
    if (view === 'week') setCursor(addDays(cursor, 7 * n))
    else { const d = new Date(c.getFullYear(), c.getMonth() + n, 1); setCursor(todayKey(d)) }
  }

  // Summary strip
  const weekStart = weekStartKey()
  const trainedThisWeek = sessions.filter((s) => s.status === 'complete' && s.date >= weekStart && s.date < addDays(weekStart, 7)).length
  const monthCounts = plan.workouts.map((w) => ({ w, n: sessions.filter((s) => s.status === 'complete' && s.workout_id === w.id && parseKey(s.date).getMonth() === c.getMonth() && parseKey(s.date).getFullYear() === c.getFullYear()).length }))

  return (
    <Screen title="Calendar" right={<SyncBadge />}>
      <div className="flex items-center justify-between gap-2">
        <Button variant="quiet" icon="back" onClick={() => move(-1)} aria-label="Previous">Prev</Button>
        <h2 className="text-lg font-extrabold">{title}</h2>
        <Button variant="quiet" iconRight="chevron" onClick={() => move(1)} aria-label="Next">Next</Button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button variant={view === 'month' ? 'primary' : 'secondary'} onClick={() => setView('month')}>Month</Button>
        <Button variant={view === 'week' ? 'primary' : 'secondary'} onClick={() => setView('week')}>Week</Button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((d) => {
          const info = byDay.get(d)
          const isToday = d === todayKey()
          const s = info?.sessions.find((x) => x.status === 'complete') ?? info?.sessions[0]
          return (
            <Link key={d} to={`${base}/day/${d}`} className={`flex min-h-16 flex-col items-center justify-start gap-1 rounded-control border p-1 ${isToday ? 'border-accent' : 'border-line'} ${inMonth(d) ? 'bg-surface' : 'opacity-40'}`} aria-label={d}>
              <span className={`text-sm font-bold ${isToday ? 'text-accent' : ''}`}>{parseKey(d).getDate()}</span>
              {s && <span className="w-full truncate rounded px-0.5 text-[10px] font-bold leading-4 text-on-accent" style={{ background: workoutColour(s.workout_id), opacity: s.status === 'complete' ? 1 : 0.6 }}>{plan.workouts.find((w) => w.id === s.workout_id)?.name.replace(' Day', '') ?? ''}</span>}
              <span className="flex gap-0.5">
                {info?.activity && <span className="size-1.5 rounded-full bg-accent2" title="Activity" />}
                {info?.food && <span className="size-1.5 rounded-full bg-warn" title="Food" />}
                {info?.sleep && <span className="size-1.5 rounded-full bg-muted" title="Sleep" />}
              </span>
            </Link>
          )
        })}
      </div>
      <p className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-muted">
        <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-accent2" />Activity</span>
        <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-warn" />Food</span>
        <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-muted" />Sleep</span>
      </p>

      <Card className="mt-4">
        <p className="text-lg font-bold">Trained {trainedThisWeek} of {plan.workouts.length} this week</p>
        <p className="mt-1 text-muted">{title.includes('Week') ? '' : `This month: ${monthCounts.map((m) => `${m.w.name} ${m.n}`).join(' · ')}`}</p>
      </Card>

      {role === 'trainee' && <Link to="/lucas/log" className="mt-4 block"><Button variant="secondary" full icon="plus">Add to today</Button></Link>}
      {role === 'coach' && <Link to="/coach/metrics" className="mt-4 block"><Button variant="secondary" full icon="chart">Charts of sleep, bodyweight and other metrics</Button></Link>}
    </Screen>
  )
}
