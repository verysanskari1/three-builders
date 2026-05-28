import { cookies } from 'next/headers'

export function isHostAuthenticated(): boolean {
  const cookieStore = cookies()
  const val = cookieStore.get('host_auth')?.value
  return !!val && val === process.env.HOST_PASSWORD
}
