import { NextRequest, NextResponse } from 'next/server'
import { getState, setState } from '@/lib/kv'
import { isHostAuthenticated } from '@/lib/auth'
import { safeTrigger } from '@/lib/pusher-server'
import { ContestantId, PhaseId, PHASE_ORDER } from '@/lib/types'

// POST toggles the timer of a given phase. If the phase isn't the current one,
// switches to it and pauses any other running phase first.
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
    // Default to the contestant's current phase if not specified.
    const state = await getState()
    const t = state.timers[id]
    if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const phase = (body.phase as PhaseId) ?? t.currentPhase
    if (!PHASE_ORDER.includes(phase)) {
      return NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
    }

    const now = Date.now()
    // Pause any other running phase.
    for (const p of PHASE_ORDER) {
      if (p !== phase && t[p]?.running) {
        t[p] = {
          elapsed: t[p].elapsed + (now - (t[p].startedAt ?? now)),
          running: false,
          startedAt: null,
        }
      }
    }
    // Toggle the requested phase.
    const cur = t[phase]
    if (cur.running) {
      t[phase] = {
        elapsed: cur.elapsed + (now - (cur.startedAt ?? now)),
        running: false,
        startedAt: null,
      }
    } else {
      t[phase] = { ...cur, running: true, startedAt: now }
    }
    t.currentPhase = phase

    state.timers[id] = t
    await setState(state)
    await safeTrigger('timer-update', { id, timers: t })
    return NextResponse.json({ phase, timers: t })
  } catch (e) {
    console.error('[timers/toggle] failed:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
