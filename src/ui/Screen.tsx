import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon } from './Icon'

interface Props {
  title?: string
  /** Where the back control goes. If omitted there is no back control. */
  backTo?: string
  backLabel?: string
  /** Something small on the right of the header (e.g. sync status). */
  right?: ReactNode
  children: ReactNode
  /** Sticky footer, usually the one primary action. */
  footer?: ReactNode
}

/**
 * Every screen uses this: fixed header, scrolling body, optional sticky footer.
 * The layout never changes between screens, so nothing is ever in a surprising place.
 */
export function Screen({ title, backTo, backLabel = 'Back', right, children, footer }: Props) {
  return (
    <div className="flex min-h-dvh flex-col">
      {(title || backTo || right) && (
        <header className="safe-top sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-bg/95 px-3 pb-2 backdrop-blur">
          {backTo ? (
            <Link to={backTo} className="tap -ml-1 inline-flex items-center gap-1 rounded-control pr-3 font-semibold text-accent">
              <Icon name="back" className="size-6" />
              <span>{backLabel}</span>
            </Link>
          ) : (
            <span className="w-2" />
          )}
          <h1 className="min-w-0 flex-1 truncate text-xl font-extrabold tracking-tight">{title}</h1>
          {right}
        </header>
      )}
      <main className="flex-1 px-4 pb-6 pt-4">{children}</main>
      {footer && (
        <footer className="safe-bottom sticky bottom-0 z-10 border-t border-line bg-bg/95 px-4 pt-3 backdrop-blur">
          {footer}
        </footer>
      )}
    </div>
  )
}
