/** Small, original inline icons. Always paired with a text label in the UI. */
type Props = { name: IconName; className?: string }
export type IconName =
  | 'home' | 'calendar' | 'history' | 'goal' | 'settings' | 'chart' | 'list' | 'plan'
  | 'tick' | 'back' | 'chevron' | 'play' | 'plus' | 'minus' | 'timer' | 'cloud' | 'cloud-off'
  | 'user' | 'warning' | 'edit' | 'close' | 'external' | 'muscle' | 'photo'

const paths: Record<IconName, string> = {
  home: 'M4 11 12 4l8 7v9h-5v-6H9v6H4z',
  calendar: 'M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  history: 'M12 8v5l3 2M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4',
  goal: 'M12 3v3M12 18v3M3 12h3M18 12h3M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4',
  chart: 'M4 20h16M7 16v-5M12 16V8M17 16v-3',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  plan: 'M6 4h12v16H6zM9 9h6M9 13h6M9 17h3',
  tick: 'M5 13l4 4L19 7',
  back: 'M15 5l-7 7 7 7',
  chevron: 'M9 5l7 7-7 7',
  play: 'M8 5v14l11-7z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  timer: 'M12 8v5l3 2M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM10 2h4',
  cloud: 'M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4 4 0 0 1-1 9z',
  'cloud-off': 'M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4 4 0 0 1-1 9zM4 4l16 16',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  warning: 'M12 4 3 20h18zM12 10v4M12 17h.01',
  edit: 'M4 20h4l10-10-4-4L4 16zM13 7l4 4',
  close: 'M6 6l12 12M18 6 6 18',
  external: 'M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5',
  muscle: 'M4 14c2-6 6-6 8-4s6 2 8-4M4 14c0 4 3 6 8 6s8-2 8-6',
  photo: 'M4 6h16v12H4zM8 14l3-3 3 3 2-2 3 3M9 9h.01',
}

export function Icon({ name, className = 'size-6' }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}
