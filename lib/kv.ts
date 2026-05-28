import { kv } from '@vercel/kv'
import { AppState } from './types'
import { getSeedState } from './seed'

const KEY = 'shoot:state'

// In-memory fallback used when Vercel KV isn't configured or throws.
// Lives on globalThis so it survives Next.js HMR / module re-evals within
// the same process. On Vercel this means each warm function instance shares
// state across requests — good enough for a single-event single-host shoot day.
const g = globalThis as unknown as { __shoot_state__?: AppState }

function hasKV(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

async function tryKVGet(): Promise<AppState | null> {
  if (!hasKV()) return null
  try {
    return await kv.get<AppState>(KEY)
  } catch (e) {
    console.error('[kv] get failed, falling back to memory:', e)
    return null
  }
}

async function tryKVSet(state: AppState): Promise<void> {
  if (!hasKV()) return
  try {
    await kv.set(KEY, state)
  } catch (e) {
    console.error('[kv] set failed, state only persisted in memory:', e)
  }
}

// Backfill any fields missing on older stored state shapes so reads never crash.
function migrate(data: AppState): AppState {
  const seed = getSeedState()
  return {
    phases: data.phases ?? seed.phases,
    reminders: data.reminders ?? seed.reminders,
    pmRoles: data.pmRoles ?? seed.pmRoles,
    timers: {
      vibe:   data.timers?.vibe   ?? seed.timers.vibe,
      junior: data.timers?.junior ?? seed.timers.junior,
      senior: data.timers?.senior ?? seed.timers.senior,
    },
    notifications: data.notifications ?? [],
    pauseRequests: data.pauseRequests ?? [],
    contestantNotes: {
      vibe:   data.contestantNotes?.vibe   ?? '',
      junior: data.contestantNotes?.junior ?? '',
      senior: data.contestantNotes?.senior ?? '',
    },
    contestantChecklists: {
      vibe:   data.contestantChecklists?.vibe   ?? seed.contestantChecklists.vibe,
      junior: data.contestantChecklists?.junior ?? seed.contestantChecklists.junior,
      senior: data.contestantChecklists?.senior ?? seed.contestantChecklists.senior,
    },
    sharedInfo: data.sharedInfo ?? '',
  }
}

export async function getState(): Promise<AppState> {
  // 1. Try KV
  const kvData = await tryKVGet()
  if (kvData) {
    const migrated = migrate(kvData)
    g.__shoot_state__ = migrated
    return migrated
  }
  // 2. Try memory
  if (g.__shoot_state__) {
    return g.__shoot_state__
  }
  // 3. Seed
  const seed = getSeedState()
  g.__shoot_state__ = seed
  await tryKVSet(seed)
  return seed
}

export async function setState(state: AppState): Promise<void> {
  g.__shoot_state__ = state
  await tryKVSet(state)
}

export async function patchState(patch: Partial<AppState>): Promise<AppState> {
  const current = await getState()
  const next = { ...current, ...patch }
  await setState(next)
  return next
}

export async function resetState(): Promise<AppState> {
  const seed = getSeedState()
  g.__shoot_state__ = seed
  await tryKVSet(seed)
  return seed
}
