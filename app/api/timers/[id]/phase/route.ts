import { NextRequest, NextResponse } from 'next/server'
import { getState, setState } from '@/lib/kv'
import { isHostAuthenticated } from '@/lib/auth'
import { safeTrigger } from '@/lib/pusher-server'
import { ContestantId, PhaseId, PHASE_ORDER } from '@/lib/types'

// POST switches the contestant's current phase. Auto-pauses any running phase.
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
    const t = state.timers[id]
    if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const now = Date.now()
    for (const p of PHASE_ORDER) {
      if (t[p]?.running) {
        t[p] = {
          elapsed: t[p].elapsed + (now - (t[p].startedAt ?? now)),
          running: false,
          startedAt: null,
        }
      }
    }
    t.currentPhase = phase
    state.timers[id] = t
    await setState(state)
    await safeTrigger('timer-update', { id, timers: t })
    await safeTrigger('state-update', {})
    return NextResponse.json({ timers: t })
  } catch (e) {
    console.error('[timers/phase] failed:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
