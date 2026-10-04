import { useMemo, useState } from 'react'
import type { ExerciseLogRow, SessionRow, SetLogRow, ValueKind } from '../../db/types'
import type { Exercise, WorkoutItem } from '../../plan/types'
import { logSpecFor, restSeconds, warmupInfo, type LogSpec } from '../../plan/logType'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { Icon } from '../../ui/Icon'
import { NumberInput } from './NumberInput'
import { RestTimer } from './RestTimer'
import { removeSet, saveExerciseLog, saveSet } from './data'
import { isNewBest, lastWeightFor, progressionHint } from './logic'
import { usePlan } from '../../plan/usePlan'

interface Props {
  session: SessionRow
  item: WorkoutItem
  exercise: Exercise
  sets: SetLogRow[]
  allSets: SetLogRow[]
  allLogs: ExerciseLogRow[]
  sessions: SessionRow[]
  readOnly: boolean
}

type Side = 'left' | 'right' | null
interface Slot { setNumber: number; side: Side; isWarmup: boolean; logged?: SetLogRow }

const kindFor: Record<LogSpec['type'], ValueKind> = { reps: 'reps', reps_side: 'reps', seconds_side: 'seconds', metres_side: 'metres', minutes: 'minutes' }

export function LogPanel({ session, item, exercise, sets, allSets, allLogs, sessions, readOnly }: Props) {
  const plan = usePlan()
  const spec = logSpecFor(item)
  const warm = warmupInfo(item.warmup_sets)
  const mine = sets.filter((s) => s.exercise_id === exercise.id)

  const sides: Side[] = spec.perSide ? ['left', 'right'] : [null]
  const workingSlots: Slot[] = []
  for (let n = 1; n <= item.sets; n++) for (const side of sides) workingSlots.push({ setNumber: n, side, isWarmup: false, logged: mine.find((s) => !s.is_warmup && s.set_number === n && (s.side ?? null) === side) })
  const warmSlots: Slot[] = []
  for (let n = 1; n <= warm.rows; n++) warmSlots.push({ setNumber: n, side: null, isWarmup: true, logged: mine.find((s) => s.is_warmup && s.set_number === n) })

  const current = workingSlots.find((s) => !s.logged)
  const [editing, setEditing] = useState<string | null>(null) // slot key being edited
  const [showWarm, setShowWarm] = useState(false)
  const [rest, setRest] = useState<number | null>(null)
  const [gateNotice, setGateNotice] = useState(false)
  const [best, setBest] = useState<string | null>(null)
  const restSecs = restSeconds(item.rest)
  const hint = useMemo(() => progressionHint(item, allSets, allLogs, sessions, session.id), [item, allSets, allLogs, sessions, session.id])

  const lastInSession = [...mine].filter((s) => !s.is_warmup).sort((a, b) => b.logged_at.localeCompare(a.logged_at))[0]
  const prefillWeight = lastInSession?.weight ?? lastWeightFor(exercise.id, allSets, session.id)
  const lastReps = lastInSession?.reps_done ?? null

  async function save(slot: Slot, weight: string, value: string, existingId?: string) {
    const w = spec.hasWeight && weight !== '' ? Number(weight) : null
    const v = value === '' ? null : Number(value)
    const saved = await saveSet({
      id: existingId, session_id: session.id, exercise_id: exercise.id, set_number: slot.setNumber, is_warmup: slot.isWarmup,
      weight: w, reps_done: v, value_kind: kindFor[spec.type], side: slot.side,
      logged_at: existingId ? undefined : undefined,
    })
    setEditing(null)
    if (!slot.isWarmup) {
      if (restSecs) setRest(restSecs)
      if (exercise.ask_dad_before_loading && (w ?? 0) > 0) {
        setGateNotice(true)
        await saveExerciseLog(session.id, exercise.id, { back_extension_weight_flag: true })
      }
      if (isNewBest(saved, allSets)) setBest(`That's a new best on ${exercise.name.toLowerCase()}: ${fmtWeight(w)} × ${v}. Nice work.`)
    }
  }

  const keyOf = (s: Slot) => `${s.isWarmup ? 'w' : 's'}${s.setNumber}${s.side ?? ''}`

  return (
    <div className="mt-3">
      {hint.kind !== 'none' && !readOnly && (
        <p className="mb-3 text-muted"><span className="font-semibold text-text">Hint: </span>{hint.text}</p>
      )}

      {warm.rows > 0 && (
        <div className="mb-4">
          <button type="button" onClick={() => setShowWarm((v) => !v)} aria-expanded={showWarm} className="flex min-h-12 w-full items-center justify-between rounded-control bg-surface2 px-4 text-left font-semibold">
            <span>{warm.label} (optional){warmSlots.some((s) => s.logged) ? ` · ${warmSlots.filter((s) => s.logged).length} logged` : ''}</span>
            <Icon name="chevron" className={`size-5 text-muted ${showWarm ? 'rotate-90' : ''}`} />
          </button>
          {showWarm && (
            <ul className="mt-2 space-y-2">
              {warmSlots.map((slot) => (
                <SlotRow key={keyOf(slot)} slot={slot} spec={spec} label={`Warm-up ${slot.setNumber}`} editing={editing === keyOf(slot)} isCurrent={false}
                  onEdit={() => setEditing(keyOf(slot))} onCancel={() => setEditing(null)} onSave={(w, v) => save(slot, w, v, slot.logged?.id)}
                  onDelete={slot.logged ? () => removeSet(slot.logged!.id) : undefined}
                  prefillWeight={slot.logged?.weight ?? null} prefillValue={slot.logged?.reps_done ?? spec.low} readOnly={readOnly} />
              ))}
            </ul>
          )}
        </div>
      )}

      <ul className="space-y-2">
        {workingSlots.map((slot) => {
          const label = `Set ${slot.setNumber} of ${item.sets}${slot.side ? ` · ${slot.side === 'left' ? 'Left' : 'Right'} side` : ''}`
          const isCurrent = !readOnly && current === slot && editing === null
          return (
            <SlotRow key={keyOf(slot)} slot={slot} spec={spec} label={label} editing={editing === keyOf(slot)} isCurrent={isCurrent}
              onEdit={() => setEditing(keyOf(slot))} onCancel={() => setEditing(null)} onSave={(w, v) => save(slot, w, v, slot.logged?.id)}
              onDelete={slot.logged ? () => removeSet(slot.logged!.id) : undefined}
              prefillWeight={slot.logged?.weight ?? prefillWeight} prefillValue={slot.logged?.reps_done ?? lastReps ?? spec.low} readOnly={readOnly} />
          )
        })}
      </ul>

      {best && (
        <Card tone="accent" className="mt-4"><p className="text-lg font-bold">{best}</p></Card>
      )}

      {gateNotice && (
        <Card tone="warn" className="mt-4">
          <p className="text-lg font-bold">This one starts with bodyweight.</p>
          <p className="mt-1">Check with Dad before adding any weight. Dad has been told.</p>
          <p className="mt-2 text-muted">{plan.meta.safety_rules[2]}</p>
          <Button variant="quiet" className="mt-2" onClick={() => setGateNotice(false)}>OK</Button>
        </Card>
      )}

      {rest !== null && <RestTimer key={rest + ':' + mine.length} seconds={rest} label={item.rest} onDismiss={() => setRest(null)} />}
    </div>
  )
}

function fmtWeight(w: number | null) { return w == null ? 'bodyweight' : `${w} kg` }

interface SlotRowProps {
  slot: Slot
  spec: LogSpec
  label: string
  editing: boolean
  isCurrent: boolean
  prefillWeight: number | null
  prefillValue: number | null
  readOnly: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (weight: string, value: string) => void
  onDelete?: () => void
}

function SlotRow({ slot, spec, label, editing, isCurrent, prefillWeight, prefillValue, readOnly, onEdit, onCancel, onSave, onDelete }: SlotRowProps) {
  const open = editing || isCurrent
  if (!open) {
    if (slot.logged) {
      const s = slot.logged
      return (
        <li className="flex min-h-14 items-center justify-between gap-3 rounded-control border border-ok bg-surface px-4 py-2">
          <span className="flex items-center gap-2">
            <Icon name="tick" className="size-5 text-ok" />
            <span><span className="font-semibold text-muted">{label}: </span><span className="font-bold">{spec.hasWeight ? `${fmtWeight(s.weight)} × ` : ''}{s.reps_done ?? '—'} {spec.unitLabel.toLowerCase()}</span></span>
          </span>
          {!readOnly && <button type="button" onClick={onEdit} className="tap rounded-control px-3 font-semibold text-accent">Edit</button>}
        </li>
      )
    }
    return <li className="flex min-h-12 items-center rounded-control border border-dashed border-line px-4 text-muted">{label}</li>
  }
  return <SlotEditor label={label} spec={spec} prefillWeight={prefillWeight} prefillValue={prefillValue} onSave={onSave} onCancel={editing ? onCancel : undefined} onDelete={editing ? onDelete : undefined} />
}

function SlotEditor({ label, spec, prefillWeight, prefillValue, onSave, onCancel, onDelete }: { label: string; spec: LogSpec; prefillWeight: number | null; prefillValue: number | null; onSave: (w: string, v: string) => void; onCancel?: () => void; onDelete?: () => void }) {
  const [weight, setWeight] = useState(prefillWeight == null ? '' : String(prefillWeight))
  const [value, setValue] = useState(prefillValue == null ? '' : String(prefillValue))
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <li className="rounded-card border-2 border-accent bg-surface p-4">
      <p className="text-lg font-bold">{label}</p>
      <div className="mt-3 grid gap-4">
        {spec.hasWeight && <NumberInput label="Weight" unit="kg" value={weight} onChange={setWeight} step={2.5} allowEmpty emptyLabel="none" />}
        <NumberInput label={spec.unitLabel} value={value} onChange={setValue} step={spec.type === 'seconds_side' || spec.type === 'metres_side' ? 5 : 1} decimals={false} />
      </div>
      <Button variant="primary" size="lg" full className="mt-4" icon="tick" onClick={() => onSave(weight, value)} disabled={value === ''}>Save this set</Button>
      {(onCancel || onDelete) && (
        <div className="mt-2 flex gap-2">
          {onCancel && <Button variant="quiet" full onClick={onCancel}>Cancel</Button>}
          {onDelete && !confirmDelete && <Button variant="quiet" full onClick={() => setConfirmDelete(true)}>Remove this set</Button>}
          {onDelete && confirmDelete && <Button variant="danger" full onClick={() => { onDelete(); onCancel?.() }}>Yes, remove it</Button>}
        </div>
      )}
    </li>
  )
}
