import { NextRequest, NextResponse } from 'next/server'
import { getState, setState } from '@/lib/kv'
import { isHostAuthenticated } from '@/lib/auth'
import { Reminder } from '@/lib/types'

export async function GET() {
  const state = await getState()
  return NextResponse.json(state.reminders)
}

export async function POST(req: NextRequest) {
  if (!isHostAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const state = await getState()
  const reminder: Reminder = {
    id: `r-${Date.now()}`,
    text: body.text,
    time: body.time,
    fired: false,
    repeatMinutes: body.repeatMinutes,
    repeatUntil: body.repeatUntil,
    broadcastToContestants: body.broadcastToContestants ?? false,
  }
  state.reminders = [...state.reminders, reminder]
  await setState(state)
  return NextResponse.json(reminder)
}
