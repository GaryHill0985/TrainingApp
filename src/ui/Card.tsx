import type { HTMLAttributes, ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  tone?: 'default' | 'raised' | 'accent' | 'warn' | 'danger'
}

const tones = {
  default: 'bg-surface border border-line',
  raised: 'bg-surface2 border border-line',
  accent: 'bg-surface border-2 border-accent',
  warn: 'bg-surface border-2 border-warn',
  danger: 'bg-surface border-2 border-danger',
}

export function Card({ children, tone = 'default', className = '', ...rest }: Props) {
  return (
    <div className={`rounded-card p-4 ${tones[tone]} ${className}`} {...rest}>
      {children}
    </div>
  )
}
