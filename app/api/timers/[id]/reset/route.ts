import { NextRequest, NextResponse } from 'next/server'
import { getState, setState } from '@/lib/kv'
import { isHostAuthenticated } from '@/lib/auth'
import { safeTrigger } from '@/lib/pusher-server'
import { ContestantId } from '@/lib/types'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isHostAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const id = params.id as ContestantId
    const state = await getState()
    if (!state.timers[id]) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    state.timers[id] = { elapsed: 0, running: false, startedAt: null }
    await setState(state)
    await safeTrigger('timer-update', { id, timer: state.timers[id] })
    return NextResponse.json(state.timers[id])
  } catch (e) {
    console.error('[timers/reset] failed:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
