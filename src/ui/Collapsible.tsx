import { useState, type ReactNode } from 'react'
import { Icon } from './Icon'

interface Props {
  title: string
  defaultOpen?: boolean
  children: ReactNode
  /** Keep open and hide the toggle (used for safety content that must never be hidden). */
  alwaysOpen?: boolean
}

/** One section at a time: a plain heading that opens and closes. Never animates. */
export function Collapsible({ title, defaultOpen = false, alwaysOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen || alwaysOpen)
  return (
    <section className="border-t border-line">
      {alwaysOpen ? (
        <h3 className="py-3 text-lg font-bold">{title}</h3>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-3 py-3 text-left text-lg font-bold min-h-12"
        >
          <span>{title}</span>
          <Icon name="chevron" className={`size-6 shrink-0 text-muted ${open ? 'rotate-90' : ''}`} />
        </button>
      )}
      {open && <div className="pb-4">{children}</div>}
    </section>
  )
}
