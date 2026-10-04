import { Screen } from '../ui/Screen'
import { MANTRA } from '../plan/seed'

export function Placeholder({ title }: { title: string }) {
  return (
    <Screen title={title}>
      <p className="text-muted">This screen is being built.</p>
      <p className="mt-6 text-sm text-muted">{MANTRA}</p>
    </Screen>
  )
}
