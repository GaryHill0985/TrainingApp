import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { Screen } from '../../ui/Screen'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Field } from '../../ui/Field'
import { Collapsible } from '../../ui/Collapsible'
import { usePlan } from '../../plan/usePlan'
import { editExercise, setExerciseMuscles } from './edits'
import { uploadMedia } from '../../sync/storage'
import { DemoVideo, MachinePhoto } from '../trainee/Media'
import type { MuscleRole } from '../../plan/types'

export function CoachExerciseEdit() {
  const { exerciseId } = useParams()
  const plan = usePlan()
  const ex = exerciseId ? plan.exercises[exerciseId] : undefined
  const row = exerciseId ? plan.exerciseRows[exerciseId] : undefined
  const [video, setVideo] = useState<string | null>(null)
  const [mm, setMm] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  if (!ex || !row) return <Navigate to="/coach/plan" replace />

  async function saveVideoUrl() {
    await editExercise(ex!.id, { video_url: (video ?? ex!.video_url).trim() })
    setVideo(null); setMsg('Video link saved. Lucas will see it on this exercise.')
  }
  async function upload(kind: 'videos' | 'photos', file: File | undefined) {
    if (!file) return
    setBusy(kind); setMsg(null)
    const r = await uploadMedia(file, kind)
    setBusy(null)
    if ('problem' in r) { setMsg(r.problem); return }
    await editExercise(ex!.id, kind === 'videos' ? { video_url: r.path } : { photo_url: r.path })
    setMsg(kind === 'videos' ? 'Video uploaded and set.' : 'Photo uploaded and set.')
  }
  async function clear(field: 'video_url' | 'photo_url') {
    await editExercise(ex!.id, { [field]: '' })
    setMsg(field === 'video_url' ? 'Video removed. Lucas sees the search link again.' : 'Photo removed.')
  }

  return (
    <Screen title={ex.name} backTo="/coach/plan" backLabel="Plan">
      <p className="text-muted">{ex.trains}</p>
      {msg && <Card tone="accent" className="mt-3"><p className="font-semibold">{msg}</p></Card>}

      <section className="mt-5">
        <h2 className="text-lg font-bold">Demo video</h2>
        <p className="text-muted">Paste a YouTube link, or record one at the gym. Until then Lucas gets a search link.</p>
        <div className="mt-3 flex flex-col gap-3">
          <Field label="Video link" type="url" inputMode="url" placeholder="https://youtube.com/…" value={video ?? ex.video_url} onChange={(e) => setVideo(e.target.value)} />
          {video !== null && video !== ex.video_url && <Button variant="primary" onClick={saveVideoUrl}>Save video link</Button>}
          <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-control border border-line bg-surface2 px-5 font-semibold">
            <input type="file" accept="video/*" capture="environment" className="sr-only" onChange={(e) => upload('videos', e.target.files?.[0])} disabled={busy !== null} />
            {busy === 'videos' ? 'Uploading video…' : 'Record or upload a video'}
          </label>
          {ex.video_url && <Button variant="quiet" onClick={() => clear('video_url')}>Remove video</Button>}
        </div>
        <DemoVideo exercise={ex} />
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-bold">Machine photo</h2>
        <p className="text-muted">{ex.needs_photo ? 'A photo of the machine at our gym helps Lucas find it.' : 'This exercise does not need a photo, but you can add one.'}</p>
        <div className="mt-3 flex flex-col gap-3">
          <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-control border border-line bg-surface2 px-5 font-semibold">
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => upload('photos', e.target.files?.[0])} disabled={busy !== null} />
            {busy === 'photos' ? 'Uploading photo…' : 'Take or upload a photo'}
          </label>
          {ex.photo_url && <Button variant="quiet" onClick={() => clear('photo_url')}>Remove photo</Button>}
        </div>
        <MachinePhoto exercise={ex} />
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-bold">Muscle &amp; Motion reference</h2>
        <p className="text-muted">What to search for in Muscle &amp; Motion (or a link). Shown in Lucas's muscle view.</p>
        <div className="mt-3 flex flex-col gap-3">
          <Field label="Search name or link" value={mm ?? ex.mm_reference ?? ''} onChange={(e) => setMm(e.target.value)} placeholder={ex.name} />
          {mm !== null && mm !== (ex.mm_reference ?? '') && <Button variant="primary" onClick={async () => { await editExercise(ex.id, { mm_reference: mm.trim() }); setMm(null); setMsg('Reference saved.') }}>Save reference</Button>}
        </div>
      </section>

      <div className="mt-6">
        <Collapsible title="Muscle involvement (verify or correct)">
          <p className="text-muted">Tick the muscles for each role. Changes survive re-seeding.</p>
          {(['prime', 'synergist', 'stabiliser'] as MuscleRole[]).map((role) => (
            <RolePicker key={role} role={role} exerciseId={ex.id} selected={role === 'prime' ? ex.muscle_involvement.prime_movers : role === 'synergist' ? ex.muscle_involvement.synergists : ex.muscle_involvement.stabilisers} />
          ))}
        </Collapsible>
      </div>

      <p className="mt-6 text-muted">To correct a muscle's origin, insertion or action, open it from the <Link to="/coach/plan/muscles" className="font-semibold text-accent underline">muscle library</Link>.</p>
      <p className="mt-2 text-sm text-muted">{row.coach_edited_fields.length ? `Coach-edited fields: ${row.coach_edited_fields.join(', ')}` : 'No coach edits yet.'}</p>
    </Screen>
  )
}

const roleTitle: Record<MuscleRole, string> = { prime: 'Prime movers', synergist: 'Assistors (synergists)', stabiliser: 'Stabilisers' }

function RolePicker({ role, exerciseId, selected }: { role: MuscleRole; exerciseId: string; selected: string[] }) {
  const plan = usePlan()
  const [open, setOpen] = useState(false)
  const muscles = Object.values(plan.muscles).sort((a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name))
  return (
    <div className="mt-4">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-h-12 w-full items-center justify-between rounded-control bg-surface2 px-4 text-left font-semibold">
        <span>{roleTitle[role]} · {selected.length}</span><span className="text-muted">{open ? 'Close' : 'Edit'}</span>
      </button>
      {!open && selected.length > 0 && <p className="mt-1 px-1 text-muted">{selected.map((id) => plan.muscles[id]?.name ?? id).join(', ')}</p>}
      {open && (
        <ul className="mt-2 grid gap-1">
          {muscles.map((m) => {
            const on = selected.includes(m.id)
            return (
              <li key={m.id}>
                <label className="flex min-h-12 items-center gap-3 rounded-control px-2">
                  <input type="checkbox" className="size-6 accent-accent" checked={on} onChange={(e) => void setExerciseMuscles(exerciseId, role, e.target.checked ? [...selected, m.id] : selected.filter((x) => x !== m.id))} />
                  <span>{m.name} <span className="text-sm text-muted">· {m.region}</span></span>
                </label>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
