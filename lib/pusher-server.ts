import Pusher from 'pusher'

let _server: Pusher | null = null

export function getPusherServer(): Pusher | null {
  if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_SECRET) return null
  if (!_server) {
    _server = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    })
  }
  return _server
}

export const PUSHER_CHANNEL = 'shoot-day'
