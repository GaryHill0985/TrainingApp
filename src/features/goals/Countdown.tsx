import { usePlan } from '../../plan/usePlan'
import { daysBetween, todayKey } from '../../lib/dates'
import { Card } from '../../ui/Card'

/** Days and training weeks to the target event (events[0] with countdown=true). Coach-editable in the plan. */
export function Countdown({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  const plan = usePlan()
  const ev = plan.events.find((e) => e.countdown)
  if (!ev) return null
  const days = daysBetween(todayKey(), ev.date)
  if (days < 0) return null
  const weeks = Math.floor(days / 7)
  const when = new Date(ev.date + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <Card className={className}>
      <p className="text-sm font-semibold uppercase tracking-wide text-muted">{ev.name}</p>
      <p className="mt-1 text-2xl font-extrabold">{days} {days === 1 ? 'day' : 'days'} to go</p>
      <p className="text-muted">{weeks} training {weeks === 1 ? 'week' : 'weeks'} left · {when}</p>
      {!compact && (
        <>
          <p className="mt-2 text-muted">{ev.venue}</p>
          <p className="mt-3 text-lg font-semibold">{ev.goal}</p>
        </>
      )}
    </Card>
  )
}
