import { NextRequest, NextResponse } from 'next/server'
import { getState, setState } from '@/lib/kv'
import { isHostAuthenticated } from '@/lib/auth'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isHostAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const state = await getState()
  state.reminders = state.reminders.filter(r => r.id !== params.id)
  await setState(state)
  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isHostAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const state = await getState()
  state.reminders = state.reminders.map(r =>
    r.id === params.id ? { ...r, ...body } : r
  )
  await setState(state)
  return NextResponse.json({ ok: true })
}
