import { NextRequest, NextResponse } from 'next/server'
import { getState, setState } from '@/lib/kv'
import { isHostAuthenticated } from '@/lib/auth'
import { safeTrigger } from '@/lib/pusher-server'

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
      const timer = state.timers[contestant]
      const now = Date.now()
      state.timers[contestant] = {
        elapsed: timer.running
          ? timer.elapsed + (now - (timer.startedAt ?? now))
          : timer.elapsed,
        running: false,
        startedAt: null,
      }
      await safeTrigger('timer-update', { id: contestant, timer: state.timers[contestant] })
    }

    await setState(state)
    await safeTrigger('pause-ack', { id: params.id, contestant: pr.contestant, action })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[pause-requests/ack] failed:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
