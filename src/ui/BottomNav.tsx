import { Link, useLocation } from 'react-router'
import { Icon, type IconName } from './Icon'

export interface NavItem {
  to: string
  label: string
  icon: IconName
}

/** Fixed bottom navigation. Same tabs, same order, every time. */
export function BottomNav({ items }: { items: NavItem[] }) {
  const { pathname } = useLocation()
  // The most specific matching tab is active (so /lucas/session/… lights up "Today", /coach/progress lights up "Progress").
  const matches = items.filter((it) => pathname === it.to || pathname.startsWith(it.to + '/'))
  const active = matches.sort((a, b) => b.to.length - a.to.length)[0]
  return (
    <nav className="safe-bottom sticky bottom-0 z-20 grid border-t border-line bg-surface pt-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }} aria-label="Main">
      {items.map((it) => {
        const isActive = it === active
        return (
          <Link
            key={it.to}
            to={it.to}
            aria-current={isActive ? 'page' : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-control text-sm font-semibold ${isActive ? 'text-accent' : 'text-muted'}`}
          >
            <Icon name={it.icon} className={`size-7 ${isActive ? '' : 'opacity-80'}`} />
            <span>{it.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
