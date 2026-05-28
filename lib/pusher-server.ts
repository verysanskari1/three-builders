import Pusher from 'pusher'

let _server: Pusher | null = null
let _initFailed = false

export const PUSHER_CHANNEL = 'shoot-day'

function readVars() {
  const appId = process.env.PUSHER_APP_ID
  const secret = process.env.PUSHER_SECRET
  // key/cluster fall back to NEXT_PUBLIC_* (they aren't secrets , same values
  // are used on the client).
  const key = process.env.PUSHER_KEY ?? process.env.NEXT_PUBLIC_PUSHER_KEY
  const cluster = process.env.PUSHER_CLUSTER ?? process.env.NEXT_PUBLIC_PUSHER_CLUSTER
  return { appId, secret, key, cluster }
}

export function getPusherServer(): Pusher | null {
  if (_initFailed) return null
  if (_server) return _server
  const { appId, secret, key, cluster } = readVars()
  if (!appId || !secret || !key || !cluster) {
    _initFailed = true
    return null
  }
  try {
    _server = new Pusher({ appId, key, secret, cluster, useTLS: true })
    return _server
  } catch (e) {
    console.error('[pusher-server] init failed:', e)
    _initFailed = true
    return null
  }
}

// Safe trigger: never throws. A Pusher misconfiguration or outage must not
// take down API routes that have already written to KV.
export async function safeTrigger(event: string, data: unknown): Promise<void> {
  const server = getPusherServer()
  if (!server) return
  try {
    await server.trigger(PUSHER_CHANNEL, event, data)
  } catch (e) {
    console.error(`[pusher-server] trigger '${event}' failed:`, e)
  }
}
