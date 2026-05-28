import { NextResponse } from 'next/server'
import { resetState } from '@/lib/kv'
import { isHostAuthenticated } from '@/lib/auth'
import { pusherServer, PUSHER_CHANNEL } from '@/lib/pusher-server'

export async function POST() {
  if (!isHostAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const state = await resetState()
  await pusherServer.trigger(PUSHER_CHANNEL, 'state-reset', {})
  return NextResponse.json(state)
}
