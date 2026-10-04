import { useState } from 'react'
import type { Exercise, Muscle } from '../../plan/types'
import { usePlan } from '../../plan/usePlan'
import { Collapsible } from '../../ui/Collapsible'
import { Icon } from '../../ui/Icon'

/**
 * Addendum A: the muscle data cards. Collapsed by default; never blocks logging.
 * No bundled diagrams: a "See this in Muscle & Motion" signpost stands in for visuals.
 */
export function MuscleView({ exercise, technical = false }: { exercise: Exercise; technical?: boolean }) {
  const plan = usePlan()
  const depth = plan.app.muscleDepth
  const mi = exercise.muscle_involvement
  const hasAny = mi.prime_movers.length + mi.synergists.length + mi.stabilisers.length > 0
  if (!hasAny) return null
  const pos = plan.positions[exercise.position]

  const tieIn = tieInLine(exercise.position, pos.plain, exercise.position_why)
  const groups: { title: string; ids: string[] }[] = [
    { title: technical ? 'Prime movers' : 'Main muscles working', ids: mi.prime_movers },
    ...(depth === 'everything' ? [
      { title: technical ? 'Assistors (synergists)' : 'Muscles that help', ids: mi.synergists },
      { title: 'Stabilisers', ids: mi.stabilisers },
    ] : []),
  ]
  const mmQuery = exercise.mm_reference?.trim() || exercise.name

  return (
    <Collapsible title="How it works (muscles)">
      <p className="text-lg">{tieIn}</p>
      {groups.map((g) => g.ids.length > 0 && (
        <div key={g.title} className="mt-4">
          <h4 className="text-base font-bold text-muted">{g.title}</h4>
          <ul className="mt-2 space-y-2">
            {g.ids.map((id) => plan.muscles[id] && <MuscleCard key={id} muscle={plan.muscles[id]} showTwoJoint={depth === 'everything'} />)}
          </ul>
        </div>
      ))}
      <div className="mt-4 rounded-card border border-line bg-surface2 p-4">
        <p className="font-semibold">See this in Muscle &amp; Motion</p>
        <p className="mt-1 text-muted">Open the Muscle &amp; Motion app and search for <span className="font-semibold text-text">“{mmQuery}”</span> to watch the muscles move.</p>
      </div>
    </Collapsible>
  )
}

function tieInLine(position: string, plain: string, why: string): string {
  const explain: Record<string, string> = {
    Lengthened: 'hardest while the muscle is stretched, so it trains the long end of the range.',
    'Mid-range': 'hardest in the middle of the movement, so it trains the strongest part of the range.',
    Shortened: 'hardest at the squeeze, so it trains the short end of the range.',
    'Full-range': 'loaded from the deep stretch to the full squeeze.',
    Trunk: 'about holding steady, so the trunk muscles work to stop movement.',
    Easy: 'kept easy on purpose.',
  }
  return `This exercise is ${plain.toLowerCase()} (${position}): ${explain[position] ?? ''} ${why}`.replace(/\s+/g, ' ').trim()
}

function MuscleCard({ muscle, showTwoJoint }: { muscle: Muscle; showTwoJoint: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="rounded-card border border-line bg-surface">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left text-lg font-semibold">
        <span>{muscle.name}</span>
        <Icon name="chevron" className={`size-5 shrink-0 text-muted ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <dl className="space-y-3 border-t border-line px-4 py-3">
          <div><dt className="text-sm font-bold uppercase tracking-wide text-muted">Starts at (origin)</dt><dd>{muscle.origin}</dd></div>
          <div><dt className="text-sm font-bold uppercase tracking-wide text-muted">Ends at (insertion)</dt><dd>{muscle.insertion}</dd></div>
          <div><dt className="text-sm font-bold uppercase tracking-wide text-muted">What it does</dt><dd>{muscle.action}</dd></div>
          <div><dt className="text-sm font-bold uppercase tracking-wide text-muted">Line of pull</dt><dd>{muscle.line_of_pull}</dd></div>
          {showTwoJoint && muscle.two_joint && <div><dt className="text-sm font-bold uppercase tracking-wide text-muted">Crosses two joints</dt><dd>Its length depends on two joints, so the position of both matters. {muscle.note}</dd></div>}
          {showTwoJoint && !muscle.two_joint && muscle.note && <div><dt className="text-sm font-bold uppercase tracking-wide text-muted">Note</dt><dd>{muscle.note}</dd></div>}
        </dl>
      )}
    </li>
  )
}
