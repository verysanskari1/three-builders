import { isHostAuthenticated } from '@/lib/auth'
import { getState } from '@/lib/kv'
import HostLogin from '@/components/host/HostLogin'
import HostDashboard from '@/components/host/HostDashboard'
import { getSeedState } from '@/lib/seed'

export const dynamic = 'force-dynamic'

export default async function HostPage() {
  const authed = isHostAuthenticated()
  if (!authed) {
    return <HostLogin />
  }
  let state
  try {
    state = await getState()
  } catch {
    state = getSeedState()
  }
  return <HostDashboard initialState={state} />
}
