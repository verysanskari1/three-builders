import { NextRequest, NextResponse } from 'next/server'
import { getState, setState } from '@/lib/kv'
import { isHostAuthenticated } from '@/lib/auth'
import { getPusherServer, PUSHER_CHANNEL } from '@/lib/pusher-server'
import { ContestantId } from '@/lib/types'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isHostAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const id = params.id as ContestantId
  const state = await getState()
  const timer = state.timers[id]
  if (!timer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const now = Date.now()
  if (timer.running) {
    state.timers[id] = {
      elapsed: timer.elapsed + (now - (timer.startedAt ?? now)),
      running: false,
      startedAt: null,
    }
  } else {
    state.timers[id] = { ...timer, running: true, startedAt: now }
  }

  await setState(state)
  await getPusherServer()?.trigger(PUSHER_CHANNEL, 'timer-update', {
    id,
    timer: state.timers[id],
  })
  return NextResponse.json(state.timers[id])
}
