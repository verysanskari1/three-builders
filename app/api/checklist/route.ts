import { NextRequest, NextResponse } from 'next/server'
import { getState, patchState } from '@/lib/kv'
import { isHostAuthenticated } from '@/lib/auth'
import { getPusherServer } from '@/lib/pusher-server'
import { PUSHER_CHANNEL } from '@/lib/pusher-client'

const CONTESTANTS = ['vibe', 'junior', 'senior'] as const

// POST: add or remove a checklist item across all contestants
export async function POST(req: NextRequest) {
  if (!isHostAuthenticated()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const state = await getState()

  if (body.action === 'add') {
    const baseId = `custom-${Date.now()}`
    const checklists = { ...state.contestantChecklists }
    for (const id of CONTESTANTS) {
      checklists[id] = [...(checklists[id] || []), { id: `${id}-${baseId}`, text: body.text, done: false }]
    }
    const updated = await patchState({ contestantChecklists: checklists })
    await getPusherServer()?.trigger(PUSHER_CHANNEL, 'state-update', {})
    return NextResponse.json(updated)
  }

  if (body.action === 'remove') {
    // baseId is the part after the contestant prefix, e.g. "ct1" from "vibe-ct1"
    const baseId: string = body.baseId
    const checklists = { ...state.contestantChecklists }
    for (const id of CONTESTANTS) {
      checklists[id] = (checklists[id] || []).filter(t => t.id !== `${id}-${baseId}`)
    }
    const updated = await patchState({ contestantChecklists: checklists })
    await getPusherServer()?.trigger(PUSHER_CHANNEL, 'state-update', {})
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
