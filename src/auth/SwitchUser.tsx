import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Screen } from '../ui/Screen'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { clearDevice } from './device'
import { unpairDevice } from './pairing'
import { useSyncStatus } from '../sync/useSync'

/** Out of the way on purpose. Clears the pairing and PIN on this phone; Dad pairs it again. */
export function SwitchUser() {
  const navigate = useNavigate()
  const s = useSyncStatus()
  const [busy, setBusy] = useState(false)
  async function go() {
    setBusy(true)
    await unpairDevice()
    clearDevice()
    navigate('/', { replace: true })
  }
  return (
    <Screen title="Switch user" backTo="/">
      <Card>
        <p className="text-lg font-semibold">This signs this phone out.</p>
        <p className="mt-2 text-muted">Dad will need to connect it again with the email and password. Logged workouts that have synced stay safe in the cloud.</p>
        {s.pending > 0 && <p className="mt-2 font-semibold text-warn">{s.pending} {s.pending === 1 ? 'item has' : 'items have'} not synced yet. Connect to Wi-Fi first so nothing is lost.</p>}
      </Card>
      <Button variant="danger" size="lg" full className="mt-6" onClick={go} disabled={busy}>Yes, switch user</Button>
      <Button variant="quiet" full className="mt-3" onClick={() => navigate(-1)}>No, go back</Button>
    </Screen>
  )
}
