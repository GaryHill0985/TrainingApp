import { Screen } from '../../ui/Screen'
import { Card } from '../../ui/Card'
import { Icon } from '../../ui/Icon'
import { usePlan } from '../../plan/usePlan'
import { Countdown } from './Countdown'
import { useAllSets, useSessions } from '../trainee/data'
import { setMilestoneStage, useMetricLogs, useMilestoneProgress } from '../lifelog/data'
import { bestSetFor } from '../trainee/logic'
import { addDays, formatShort, todayKey, weekStartKey } from '../../lib/dates'
import { mediaUrl } from '../../sync/supabase'

const PR_LIFTS = ['chest_press', 'incline_press', 'shoulder_press', 'row', 'cable_row', 'pulldown', 'leg_press', 'hack_squat', 'hip_thrust']

/**
 * The "why", the countdown and the process goals. Everything here is something Lucas controls.
 * No weight targets, no body-fat, no comparisons. Wins are stated plainly.
 */
export function Goals({ role }: { role: 'trainee' | 'coach' }) {
  const plan = usePlan()
  const sessions = useSessions()
  const sets = useAllSets()
  const sleep = useMetricLogs().filter((m) => m.metric_key === 'sleep_hours')
  const progress = useMilestoneProgress()
  const v = plan.goals.vision
  const weekStart = weekStartKey()
  const thisWeek = sessions.filter((s) => s.status === 'complete' && s.date >= weekStart && s.date < addDays(weekStart, 7)).length
  const total = sessions.filter((s) => s.status === 'complete').length
  const recentSleep = sleep.filter((s) => s.date >= addDays(todayKey(), -7) && s.value_num != null)
  const avgSleep = recentSleep.length ? Math.round((recentSleep.reduce((a, s) => a + (s.value_num ?? 0), 0) / recentSleep.length) * 10) / 10 : null
  const prs = PR_LIFTS.map((id) => ({ id, best: bestSetFor(id, sets) })).filter((p) => p.best)

  return (
    <Screen title={role === 'coach' ? "Lucas's goals" : 'Goals'} backTo={role === 'coach' ? '/coach/settings' : undefined} backLabel="Settings">
      <Card tone="accent">
        <p className="text-sm font-bold uppercase tracking-wide text-muted">{v.title}</p>
        <p className="mt-1 text-xl font-extrabold leading-snug">{v.statement}</p>
        {v.images.length > 0 && (
          <div className="mt-3">
            <div className="grid grid-cols-3 gap-2">
              {v.images.map((p) => <img key={p} src={mediaUrl(p)} alt="" className="aspect-square w-full rounded-control object-cover" loading="lazy" />)}
            </div>
            <p className="mt-1 text-sm text-muted">{v.images_caption}</p>
          </div>
        )}
      </Card>

      <Countdown className="mt-4" />

      <h2 className="mt-8 text-lg font-bold">The work that gets you there</h2>
      <div className="mt-2 space-y-3">
        {plan.goals.process_milestones.map((m) => (
          <Card key={m.key}>
            <p className="text-lg font-extrabold">{m.label}</p>
            <p className="text-muted">{m.detail}</p>

            {m.key === 'consistency' && (
              <p className="mt-3 font-semibold">{thisWeek} of {plan.workouts.length} this week · {total} sessions done in total.</p>
            )}

            {m.key === 'pullup_ladder' && m.stages && (
              <ol className="mt-3 space-y-2">
                {m.stages.map((stage, i) => {
                  const done = progress.find((p) => p.milestone_key === m.key && p.stage_index === i)
                  return (
                    <li key={stage}>
                      <button type="button" aria-pressed={Boolean(done)} onClick={() => setMilestoneStage(m.key, i, !done, todayKey())} className={`flex min-h-12 w-full items-center gap-3 rounded-control border-2 px-3 text-left ${done ? 'border-ok' : 'border-line bg-surface2'}`}>
                        <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${done ? 'bg-ok text-on-accent' : 'bg-line text-muted'}`}>{done ? <Icon name="tick" className="size-5" /> : i + 1}</span>
                        <span className="flex-1 font-semibold">{stage}</span>
                        {done && <span className="text-sm text-muted">{formatShort(done.achieved_on)}</span>}
                      </button>
                    </li>
                  )
                })}
              </ol>
            )}

            {m.key === 'strength_prs' && (
              prs.length === 0 ? <p className="mt-3 text-muted">Your best sets will show here once you have logged some sessions.</p> : (
                <ul className="mt-3 space-y-1">
                  {prs.map((p) => <li key={p.id} className="flex justify-between gap-2"><span>{plan.exercises[p.id]?.name}</span><span className="font-bold tabular-nums">{p.best!.weight} kg × {p.best!.reps}</span></li>)}
                </ul>
              )
            )}

            {m.key === 'recovery' && (
              <p className="mt-3 font-semibold">{avgSleep != null ? `Average sleep over the last week: ${avgSleep} hours.` : 'Log your sleep in "Add to today" and it will show here.'}</p>
            )}
          </Card>
        ))}
      </div>
      <p className="mt-6 text-center text-muted">{plan.meta.mantra}</p>
    </Screen>
  )
}
