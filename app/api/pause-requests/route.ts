import { NextRequest, NextResponse } from 'next/server'
import { getState, setState } from '@/lib/kv'
import { pusherServer, PUSHER_CHANNEL } from '@/lib/pusher-server'
import { PauseRequest } from '@/lib/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const state = await getState()
  const pauseReq: PauseRequest = {
    id: `pr-${Date.now()}`,
    contestant: body.contestant,
    reason: body.reason,
    createdAt: Date.now(),
    status: 'pending',
  }
  state.pauseRequests = [pauseReq, ...state.pauseRequests]
  await setState(state)
  await pusherServer.trigger(PUSHER_CHANNEL, 'pause-request', pauseReq)
  return NextResponse.json(pauseReq)
}
