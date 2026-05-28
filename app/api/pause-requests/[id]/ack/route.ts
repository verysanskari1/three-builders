import { NextRequest, NextResponse } from 'next/server'
import { getState, setState } from '@/lib/kv'
import { isHostAuthenticated } from '@/lib/auth'
import { safeTrigger } from '@/lib/pusher-server'
import { PHASE_ORDER } from '@/lib/types'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isHostAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const action: 'approved' | 'denied' = body.action
    const state = await getState()

    const pr = state.pauseRequests.find(r => r.id === params.id)
    if (!pr) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    state.pauseRequests = state.pauseRequests.map(r =>
      r.id === params.id ? { ...r, status: action } : r
    )

    if (action === 'approved') {
      const contestant = pr.contestant
      const now = Date.now()
      // Stop whichever phase is currently running for that contestant.
      for (const phase of PHASE_ORDER) {
        const t = state.timers[contestant]?.[phase]
        if (t?.running) {
          state.timers[contestant][phase] = {
            elapsed: t.elapsed + (now - (t.startedAt ?? now)),
            running: false,
            startedAt: null,
          }
          await safeTrigger('timer-update', {
            id: contestant,
            phase,
            timer: state.timers[contestant][phase],
            timers: state.timers[contestant],
          })
        }
      }
    }

    await setState(state)
    await safeTrigger('pause-ack', { id: params.id, contestant: pr.contestant, action })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[pause-requests/ack] failed:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
