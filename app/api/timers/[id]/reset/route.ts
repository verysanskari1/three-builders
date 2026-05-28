import { NextRequest, NextResponse } from 'next/server'
import { getState, setState } from '@/lib/kv'
import { isHostAuthenticated } from '@/lib/auth'
import { safeTrigger } from '@/lib/pusher-server'
import { ContestantId, PhaseId, PHASE_ORDER } from '@/lib/types'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isHostAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const id = params.id as ContestantId
    const body = await req.json().catch(() => ({}))
    const phase = body.phase as PhaseId
    if (!PHASE_ORDER.includes(phase)) {
      return NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
    }
    const state = await getState()
    if (!state.timers[id]?.[phase]) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const next = { elapsed: 0, running: false, startedAt: null }
    state.timers[id][phase] = next
    await setState(state)
    await safeTrigger('timer-update', { id, phase, timer: next, timers: state.timers[id] })
    return NextResponse.json({ phase, timer: next, timers: state.timers[id] })
  } catch (e) {
    console.error('[timers/reset] failed:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
