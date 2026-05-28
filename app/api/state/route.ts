import { NextRequest, NextResponse } from 'next/server'
import { getState, patchState } from '@/lib/kv'
import { isHostAuthenticated } from '@/lib/auth'
import { getPusherServer, PUSHER_CHANNEL } from '@/lib/pusher-server'

export async function GET() {
  const state = await getState()
  return NextResponse.json(state)
}

export async function POST(req: NextRequest) {
  if (!isHostAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const next = await patchState(body)
  // Notify contestants of state changes (sharedInfo, etc.)
  await getPusherServer()?.trigger(PUSHER_CHANNEL, 'state-update', {})
  return NextResponse.json(next)
}
