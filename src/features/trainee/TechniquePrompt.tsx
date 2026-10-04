import { useState } from 'react'
import type { ExerciseLogRow } from '../../db/types'
import type { Exercise, TechniqueColour } from '../../plan/types'
import { usePlan } from '../../plan/usePlan'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { BulletList } from '../../ui/BulletList'

interface Props {
  exercise: Exercise
  log: ExerciseLogRow | undefined
  onChange: (patch: Partial<Pick<ExerciseLogRow, 'technique_colour' | 'pain_flag' | 'note'>>) => void
}

const colours: { key: TechniqueColour; emoji: string; className: string }[] = [
  { key: 'green', emoji: '🟢', className: 'border-ok' },
  { key: 'amber', emoji: '🟡', className: 'border-warn' },
  { key: 'red', emoji: '🔴', className: 'border-danger' },
]

/** Asked once after the last set: technique colour, "Something hurt", optional note. */
export function TechniquePrompt({ exercise, log, onChange }: Props) {
  const plan = usePlan()
  const [note, setNote] = useState(log?.note ?? '')
  const chosen = log?.technique_colour ?? null
  const pain = log?.pain_flag ?? false

  return (
    <Card tone={chosen ? 'default' : 'accent'} className="mt-4">
      <h3 className="text-lg font-bold">How was your technique?</h3>
      <div className="mt-3 grid gap-2">
        {colours.map((c) => (
          <button
            key={c.key}
            type="button"
            aria-pressed={chosen === c.key}
            onClick={() => onChange({ technique_colour: c.key })}
            className={`flex min-h-16 items-center gap-3 rounded-control border-2 bg-surface2 px-4 text-left text-lg font-semibold ${chosen === c.key ? c.className : 'border-line'}`}
          >
            <span className="text-2xl" aria-hidden="true">{c.emoji}</span>
            <span>{plan.meta.technique_colours[c.key]}</span>
          </button>
        ))}
      </div>

      <label className="mt-5 flex min-h-14 items-center justify-between gap-3 rounded-control bg-surface2 px-4">
        <span className="text-lg font-semibold">Something hurt</span>
        <input type="checkbox" className="size-7 accent-danger" checked={pain} onChange={(e) => onChange({ pain_flag: e.target.checked })} />
      </label>

      {pain && (
        <Card tone="danger" className="mt-3">
          <p className="text-lg font-bold">Stop this exercise for today and tell Dad.</p>
          <p className="mt-1 text-muted">{plan.meta.safety_rules[0]}</p>
          <p className="mt-3 font-bold">Stop the set when</p>
          <BulletList items={exercise.stop_set_when} className="mt-1" />
        </Card>
      )}

      <label className="mt-5 block">
        <span className="mb-1 block text-base font-semibold text-muted">Note (optional)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => { if (note !== (log?.note ?? '')) onChange({ note }) }}
          rows={2}
          placeholder="Anything you want Dad to know"
          className="w-full rounded-control border border-line bg-surface2 px-4 py-3 text-lg"
        />
      </label>
      {note !== (log?.note ?? '') && (
        <Button variant="secondary" className="mt-2" onClick={() => onChange({ note })}>Save note</Button>
      )}
    </Card>
  )
}
