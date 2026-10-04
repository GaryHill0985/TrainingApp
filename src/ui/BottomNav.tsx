import { NavLink } from 'react-router'
import { Icon, type IconName } from './Icon'

export interface NavItem {
  to: string
  label: string
  icon: IconName
}

/** Fixed bottom navigation. Same tabs, same order, every time. */
export function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="safe-bottom sticky bottom-0 z-20 grid border-t border-line bg-surface pt-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }} aria-label="Main">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          className={({ isActive }) =>
            `flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-control text-sm font-semibold ${isActive ? 'text-accent' : 'text-muted'}`
          }
        >
          {({ isActive }) => (
            <>
              <Icon name={it.icon} className={`size-7 ${isActive ? '' : 'opacity-80'}`} />
              <span>{it.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
