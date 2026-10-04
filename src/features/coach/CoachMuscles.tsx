import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { Screen } from '../../ui/Screen'
import { Button } from '../../ui/Button'
import { Icon } from '../../ui/Icon'
import { usePlan } from '../../plan/usePlan'
import { editMuscle } from './edits'
import type { Muscle } from '../../plan/types'

export function CoachMuscles() {
  const plan = usePlan()
  const list = Object.values(plan.muscles).sort((a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name))
  return (
    <Screen title="Muscle library" backTo="/coach/plan" backLabel="Plan">
      <p className="text-muted">{plan.meta.anatomy_data_note}</p>
      <ul className="mt-4 space-y-2">
        {list.map((m) => (
          <li key={m.id}>
            <Link to={`/coach/plan/muscles/${m.id}`} className="flex min-h-14 items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-2">
              <span><span className="block font-bold">{m.name}</span><span className="block text-sm text-muted">{m.region}{m.two_joint ? ' · two-joint' : ''}</span></span>
              <Icon name="chevron" className="size-6 shrink-0 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </Screen>
  )
}

const fields: { key: keyof Muscle; label: string }[] = [
  { key: 'name', label: 'Name' }, { key: 'region', label: 'Region' }, { key: 'origin', label: 'Origin' },
  { key: 'insertion', label: 'Insertion' }, { key: 'action', label: 'Action' }, { key: 'line_of_pull', label: 'Line of pull' }, { key: 'note', label: 'Note' },
]

export function CoachMuscleEdit() {
  const { muscleId } = useParams()
  const plan = usePlan()
  const m = muscleId ? plan.muscles[muscleId] : undefined
  const [draft, setDraft] = useState<Partial<Muscle>>({})
  const [saved, setSaved] = useState(false)
  if (!m) return <Navigate to="/coach/plan/muscles" replace />
  const dirty = Object.keys(draft).length > 0
  return (
    <Screen title={m.name} backTo="/coach/plan/muscles" backLabel="Muscles">
      {saved && <p className="mb-3 font-semibold text-ok">Saved.</p>}
      <div className="flex flex-col gap-4">
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-base font-semibold text-muted">{f.label}</span>
            <textarea rows={f.key === 'name' || f.key === 'region' ? 1 : 2} value={(draft[f.key] as string | undefined) ?? (m[f.key] as string)} onChange={(e) => { setSaved(false); setDraft({ ...draft, [f.key]: e.target.value }) }} className="w-full rounded-control border border-line bg-surface2 px-4 py-3 text-lg" />
          </label>
        ))}
        <label className="flex min-h-12 items-center gap-3">
          <input type="checkbox" className="size-6 accent-accent" checked={(draft.two_joint as boolean | undefined) ?? m.two_joint} onChange={(e) => { setSaved(false); setDraft({ ...draft, two_joint: e.target.checked }) }} />
          <span className="font-semibold">Crosses two joints</span>
        </label>
      </div>
      {dirty && <Button variant="primary" size="lg" full className="mt-6" onClick={async () => { await editMuscle(m.id, draft); setDraft({}); setSaved(true) }}>Save corrections</Button>}
    </Screen>
  )
}
