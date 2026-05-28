import { NextRequest, NextResponse } from 'next/server'
import { getState, patchState } from '@/lib/kv'
import { isHostAuthenticated } from '@/lib/auth'
import { safeTrigger } from '@/lib/pusher-server'

export async function GET() {
  try {
    const state = await getState()
    return NextResponse.json(state)
  } catch (e) {
    console.error('[state GET] failed:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!isHostAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const next = await patchState(body)
    await safeTrigger('state-update', {})
    return NextResponse.json(next)
  } catch (e) {
    console.error('[state POST] failed:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
