import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { Screen } from '../../ui/Screen'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { usePlan } from '../../plan/usePlan'
import { completeSession, useSession, useSessionLogs, useSessionSets } from './data'
import { exerciseProgress } from './logic'

export function FinishScreen() {
  const { sessionId } = useParams()
  const plan = usePlan()
  const session = useSession(sessionId)
  const sets = useSessionSets(sessionId)
  const logs = useSessionLogs(sessionId)
  const navigate = useNavigate()
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  if (session === undefined) return <Screen title="Finish"><p className="text-muted">Loading…</p></Screen>
  if (!session) return <Navigate to="/lucas" replace />
  const workout = plan.workouts.find((w) => w.id === session.workout_id)
  const done = workout ? workout.items.filter((it) => exerciseProgress(it, sets, logs).complete).length : 0
  const total = workout?.items.length ?? 0
  const workingSets = sets.filter((s) => !s.is_warmup).length

  if (session.status === 'complete') {
    return (
      <Screen title="Done" backTo="/lucas" backLabel="Today">
        <Card tone="accent">
          <h2 className="text-2xl font-extrabold">Session saved. Nice work today.</h2>
          <p className="mt-2 text-lg">{workout?.name}: {done} of {total} exercises, {workingSets} working sets.</p>
          {session.overall_note && <p className="mt-2 text-muted">Your note: {session.overall_note}</p>}
        </Card>
        <div className="mt-6 flex flex-col gap-3">
          <Link to="/lucas" className="block"><Button variant="primary" size="lg" full>Back to Today</Button></Link>
          <Link to={`/lucas/session/${session.id}`} className="block"><Button variant="secondary" full>Look at what I logged</Button></Link>
        </div>
      </Screen>
    )
  }

  async function finish() {
    setSaving(true)
    await completeSession(session!, note)
    navigate(`/lucas/session/${session!.id}/finish`, { replace: true })
  }

  return (
    <Screen title="Finish session" backTo={`/lucas/session/${session.id}`} backLabel="List">
      <h2 className="text-2xl font-extrabold">{done === total ? 'All exercises done.' : `${done} of ${total} exercises done.`}</h2>
      <p className="mt-2 text-muted">{done === total ? 'Tap the button to save the session.' : 'That is fine. Save what you did today.'}</p>
      <label className="mt-6 block">
        <span className="mb-1 block text-base font-semibold text-muted">Note for Dad (optional)</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full rounded-control border border-line bg-surface2 px-4 py-3 text-lg" placeholder="How did it go?" />
      </label>
      <Button variant="primary" size="lg" full className="mt-6" icon="tick" onClick={finish} disabled={saving}>I'm done</Button>
      <Link to={`/lucas/session/${session.id}`} className="mt-3 block"><Button variant="quiet" full>Not yet, go back</Button></Link>
    </Screen>
  )
}
