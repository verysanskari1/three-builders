import { NextRequest, NextResponse } from 'next/server'
import { getState, setState } from '@/lib/kv'
import { ContestantId, ContestantTask } from '@/lib/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id as ContestantId
    if (!['vibe', 'junior', 'senior'].includes(id)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const body = await req.json()
    const state = await getState()
    state.contestantChecklists[id] = body.tasks as ContestantTask[]
    await setState(state)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[contestants/tasks] failed:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
