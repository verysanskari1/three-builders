import { NextRequest, NextResponse } from 'next/server'
import { getState, setState } from '@/lib/kv'
import { safeTrigger } from '@/lib/pusher-server'
import { PauseRequest } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
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
    await safeTrigger('pause-request', pauseReq)
    return NextResponse.json(pauseReq)
  } catch (e) {
    console.error('[pause-requests] failed:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
