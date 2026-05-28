import { NextRequest, NextResponse } from 'next/server'
import { getState, setState } from '@/lib/kv'
import { isHostAuthenticated } from '@/lib/auth'
import { safeTrigger } from '@/lib/pusher-server'
import { Notification } from '@/lib/types'

export async function POST(req: NextRequest) {
  if (!isHostAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const state = await getState()
    const notification: Notification = {
      id: `n-${Date.now()}`,
      text: body.text,
      target: body.target ?? 'all',
      createdAt: Date.now(),
      expiresAt: Date.now() + (body.durationMs ?? 60000),
    }
    state.notifications = [notification, ...state.notifications].slice(0, 50)
    await setState(state)
    await safeTrigger('notification', notification)
    return NextResponse.json(notification)
  } catch (e) {
    console.error('[notifications] failed:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
