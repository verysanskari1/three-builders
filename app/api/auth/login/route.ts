import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!process.env.HOST_PASSWORD) {
    return NextResponse.json({ error: 'HOST_PASSWORD not set' }, { status: 500 })
  }
  if (body.password !== process.env.HOST_PASSWORD) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }
  const response = NextResponse.json({ ok: true })
  response.cookies.set('host_auth', body.password, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24,
    sameSite: 'lax',
  })
  return response
}
