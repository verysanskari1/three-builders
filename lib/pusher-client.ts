import PusherJS from 'pusher-js'

let client: PusherJS | null = null

export function getPusherClient(): PusherJS | null {
  if (typeof window === 'undefined') return null
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER
  if (!key || !cluster) return null
  if (!client) {
    client = new PusherJS(key, { cluster })
  }
  return client
}

export const PUSHER_CHANNEL = 'shoot-day'
