import { isHostAuthenticated } from '@/lib/auth'
import { getState } from '@/lib/kv'
import HostLogin from '@/components/host/HostLogin'
import HostDashboard from '@/components/host/HostDashboard'

export const dynamic = 'force-dynamic'

export default async function HostPage() {
  const authed = isHostAuthenticated()
  if (!authed) {
    return <HostLogin />
  }
  const state = await getState()
  return <HostDashboard initialState={state} />
}
