import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger'
type Size = 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: IconName
  iconRight?: IconName
  full?: boolean
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent font-bold hover:brightness-110 active:brightness-95',
  secondary: 'bg-surface2 text-text border border-line font-semibold active:brightness-110',
  quiet: 'bg-transparent text-text font-semibold active:bg-surface2',
  danger: 'bg-danger text-white font-bold active:brightness-95',
}
const sizes: Record<Size, string> = {
  md: 'min-h-12 px-5 text-base',
  lg: 'min-h-16 px-6 text-lg',
}

/** Literal-label button. Always has a text label; icons are decoration only. */
export function Button({ variant = 'secondary', size = 'md', icon, iconRight, full, className = '', children, ...rest }: Props) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-control select-none disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon && <Icon name={icon} className="size-6 shrink-0" />}
      <span>{children}</span>
      {iconRight && <Icon name={iconRight} className="size-6 shrink-0" />}
    </button>
  )
}
