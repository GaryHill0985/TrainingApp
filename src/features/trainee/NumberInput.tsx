import { Icon } from '../../ui/Icon'

interface Props {
  label: string
  value: string
  onChange: (v: string) => void
  step: number
  unit?: string
  allowEmpty?: boolean
  emptyLabel?: string
  decimals?: boolean
}

/** Big number entry: a wide numeric field with large minus/plus buttons either side. */
export function NumberInput({ label, value, onChange, step, unit, allowEmpty, emptyLabel = 'none', decimals = true }: Props) {
  const num = value === '' ? null : Number(value)
  function bump(d: number) {
    const base = num ?? 0
    const next = Math.max(0, Math.round((base + d) * 100) / 100)
    onChange(String(next))
  }
  const id = `n-${label.replace(/\W+/g, '-').toLowerCase()}`
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-base font-semibold text-muted">{label}{unit ? ` (${unit})` : ''}</label>
      <div className="flex items-stretch gap-2">
        <button type="button" aria-label={`${label}: less`} onClick={() => bump(-step)} className="tap w-16 rounded-control bg-surface2 text-text active:bg-line">
          <Icon name="minus" className="mx-auto size-7" />
        </button>
        <input
          id={id}
          type="number"
          inputMode={decimals ? 'decimal' : 'numeric'}
          step={step}
          min={0}
          value={value}
          placeholder={allowEmpty ? emptyLabel : undefined}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          className="min-h-16 w-full min-w-0 flex-1 rounded-control border border-line bg-surface2 text-center text-3xl font-extrabold tabular-nums"
        />
        <button type="button" aria-label={`${label}: more`} onClick={() => bump(step)} className="tap w-16 rounded-control bg-surface2 text-text active:bg-line">
          <Icon name="plus" className="mx-auto size-7" />
        </button>
      </div>
    </div>
  )
}
