import { useEffect, useRef, useState } from 'react'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'

/**
 * Opt-in rest timer. Appears after a set is saved, pre-set to the exercise's rest.
 * Tap to start, always dismissible, never forced. No sound, no flashing.
 */
export function RestTimer({ seconds, label, onDismiss }: { seconds: number; label: string; onDismiss: () => void }) {
  const [left, setLeft] = useState(seconds)
  const [running, setRunning] = useState(false)
  const endAt = useRef<number>(0)

  useEffect(() => {
    if (!running) return
    const tick = () => {
      const remaining = Math.max(0, Math.round((endAt.current - Date.now()) / 1000))
      setLeft(remaining)
      if (remaining === 0) setRunning(false)
    }
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [running])

  function start() {
    endAt.current = Date.now() + left * 1000
    setRunning(true)
  }

  const mm = Math.floor(left / 60)
  const ss = String(left % 60).padStart(2, '0')
  const finished = left === 0

  return (
    <Card tone="raised" className="mt-4" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">Rest timer · {label}</p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums">{finished ? 'Rest finished' : `${mm}:${ss}`}</p>
        </div>
        <div className="flex flex-col gap-2">
          {!running && !finished && <Button variant="primary" icon="timer" onClick={start}>Start</Button>}
          {running && <Button variant="secondary" onClick={() => setRunning(false)}>Pause</Button>}
          <Button variant="quiet" onClick={onDismiss}>{finished ? 'Close' : 'Skip'}</Button>
        </div>
      </div>
    </Card>
  )
}
