import { NextRequest, NextResponse } from 'next/server'
import { getState, setState } from '@/lib/kv'
import { isHostAuthenticated } from '@/lib/auth'
import { pusherServer, PUSHER_CHANNEL } from '@/lib/pusher-server'
import { Notification } from '@/lib/types'

export async function POST(req: NextRequest) {
  if (!isHostAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const state = await getState()
  const notification: Notification = {
    id: `n-${Date.now()}`,
    text: body.text,
    target: body.target ?? 'all',
    createdAt: Date.now(),
    expiresAt: Date.now() + (body.durationMs ?? 30000),
  }
  state.notifications = [notification, ...state.notifications].slice(0, 50)
  await setState(state)
  await pusherServer.trigger(PUSHER_CHANNEL, 'notification', notification)
  return NextResponse.json(notification)
}
