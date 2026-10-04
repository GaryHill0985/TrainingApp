import { seed } from '../plan/seed'
import type { PositionTag } from '../plan/types'

const colourVar: Record<PositionTag, string> = {
  Lengthened: 'var(--color-pos-lengthened)',
  'Mid-range': 'var(--color-pos-mid)',
  Shortened: 'var(--color-pos-shortened)',
  Trunk: 'var(--color-pos-trunk)',
  'Full-range': 'var(--color-pos-full)',
  Easy: 'var(--color-pos-easy)',
}

interface Props {
  position: PositionTag
  /** Lucas sees the plain word (Stretched / Middle / Squeezed…); the coach can see the technical tag. */
  technical?: boolean
  size?: 'sm' | 'md'
}

export function PositionChip({ position, technical = false, size = 'md' }: Props) {
  const info = seed.positions[position]
  const label = technical ? `${position} · ${info.plain}` : info.plain
  const colour = colourVar[position]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap ${size === 'sm' ? 'px-2.5 py-0.5 text-sm' : 'px-3 py-1 text-base'}`}
      style={{ borderColor: colour, color: colour }}
      title={info.meaning}
    >
      <span className="size-2.5 rounded-full" style={{ background: colour }} aria-hidden="true" />
      {label}
    </span>
  )
}
