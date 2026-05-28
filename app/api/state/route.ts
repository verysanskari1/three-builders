import { NextRequest, NextResponse } from 'next/server'
import { getState, patchState } from '@/lib/kv'
import { isHostAuthenticated } from '@/lib/auth'

export async function GET() {
  const state = await getState()
  return NextResponse.json(state)
}

export async function POST(req: NextRequest) {
  if (!isHostAuthenticated()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const next = await patchState(body)
  return NextResponse.json(next)
}
