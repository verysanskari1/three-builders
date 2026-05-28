import { kv } from '@vercel/kv'
import { AppState } from './types'
import { getSeedState } from './seed'

const KEY = 'shoot:state'

export async function getState(): Promise<AppState> {
  const data = await kv.get<AppState>(KEY)
  if (!data) {
    const seed = getSeedState()
    await kv.set(KEY, seed)
    return seed
  }
  return data
}

export async function setState(state: AppState): Promise<void> {
  await kv.set(KEY, state)
}

export async function patchState(patch: Partial<AppState>): Promise<AppState> {
  const current = await getState()
  const next = { ...current, ...patch }
  await setState(next)
  return next
}

export async function resetState(): Promise<AppState> {
  const seed = getSeedState()
  await kv.set(KEY, seed)
  return seed
}
