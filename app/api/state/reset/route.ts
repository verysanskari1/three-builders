import { NextResponse } from 'next/server'
import { resetState } from '@/lib/kv'
import { isHostAuthenticated } from '@/lib/auth'
import { safeTrigger } from '@/lib/pusher-server'

export async function POST() {
  if (!isHostAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const state = await resetState()
    await safeTrigger('state-reset', {})
    await safeTrigger('state-update', {})
    return NextResponse.json(state)
  } catch (e) {
    console.error('[state/reset] failed:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
