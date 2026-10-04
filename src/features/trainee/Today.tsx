import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Screen } from '../../ui/Screen'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { SyncBadge } from '../../sync/SyncBadge'
import { usePlan } from '../../plan/usePlan'
import { nextWorkoutId } from './logic'
import { startSession, useInProgressSession, useSessions } from './data'
import { formatLong, todayKey } from '../../lib/dates'
import { Countdown } from '../goals/Countdown'

export function Today() {
  const plan = usePlan()
  const sessions = useSessions()
  const inProgress = useInProgressSession()
  const navigate = useNavigate()
  const suggested = nextWorkoutId(plan, sessions)
  const [picked, setPicked] = useState<string | null>(null)
  const workoutId = inProgress?.workout_id ?? picked ?? suggested
  const workout = plan.workouts.find((w) => w.id === workoutId) ?? plan.workouts[0]
  const [starting, setStarting] = useState(false)

  async function start() {
    if (inProgress) { navigate(`/lucas/session/${inProgress.id}`); return }
    setStarting(true)
    const s = await startSession(workout.id)
    navigate(`/lucas/session/${s.id}`)
  }

  return (
    <Screen title="Today" right={<SyncBadge />}>
      <p className="text-muted">{formatLong(todayKey())}</p>

      <Card tone="accent" className="mt-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted">{inProgress ? 'In progress' : 'Next workout'}</p>
        <h2 className="mt-1 text-3xl font-extrabold tracking-tight">{workout.name}</h2>
        <p className="mt-1 text-lg text-muted">{workout.subtitle}</p>
        <p className="mt-1 text-muted">{workout.demand} · {workout.items.length} exercises</p>
        <Button variant="primary" size="lg" full className="mt-5" onClick={start} disabled={starting} icon={inProgress ? 'chevron' : 'play'}>
          {inProgress ? 'Continue session' : 'Start session'}
        </Button>
      </Card>

      {!inProgress && (
        <section className="mt-8">
          <h3 className="text-lg font-bold">Do a different workout</h3>
          <p className="mb-3 text-muted">Tap one to choose it.</p>
          <div className="grid grid-cols-1 gap-3">
            {plan.workouts.map((w, i) => {
              const active = w.id === workout.id
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setPicked(w.id)}
                  aria-pressed={active}
                  className={`flex min-h-16 items-center justify-between rounded-card border-2 px-4 py-3 text-left ${active ? 'border-accent bg-surface' : 'border-line bg-surface'}`}
                >
                  <span>
                    <span className="block text-sm font-semibold text-muted">{plan.week[i]?.day ?? `Day ${i + 1}`}</span>
                    <span className="block text-xl font-extrabold">{w.name}</span>
                    <span className="block text-muted">{w.subtitle}</span>
                  </span>
                  {active && <span className="font-bold text-accent">Chosen</span>}
                </button>
              )
            })}
          </div>
        </section>
      )}

      <Countdown compact className="mt-8" />

      <p className="mt-8 text-center text-muted">{plan.meta.mantra}</p>
      <p className="mt-8 text-center text-sm">
        <Link to="/switch-user" className="text-muted underline">Switch user</Link>
      </p>
    </Screen>
  )
}
