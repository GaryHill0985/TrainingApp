import type { InputHTMLAttributes, ReactNode } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  suffix?: ReactNode
  big?: boolean
}

/** Labelled input with a big tap target. */
export function Field({ label, hint, suffix, big, id, className = '', ...rest }: Props) {
  const inputId = id ?? `f-${label.replace(/\W+/g, '-').toLowerCase()}`
  return (
    <label htmlFor={inputId} className="block">
      <span className="mb-1 block text-base font-semibold text-muted">{label}</span>
      <span className="flex items-center gap-2">
        <input
          id={inputId}
          className={`w-full rounded-control border border-line bg-surface2 px-4 ${big ? 'min-h-16 text-3xl font-extrabold' : 'min-h-12 text-lg'} ${className}`}
          {...rest}
        />
        {suffix && <span className="shrink-0 text-lg text-muted">{suffix}</span>}
      </span>
      {hint && <span className="mt-1 block text-sm text-muted">{hint}</span>}
    </label>
  )
}
