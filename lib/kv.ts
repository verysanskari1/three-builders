import { createClient } from '@vercel/kv'
import { AppState, PhaseId } from './types'
import { getSeedState } from './seed'

const KEY = 'shoot:state'

// Build a KV client from whichever env vars are present.
//   - Vercel KV (legacy):   KV_REST_API_URL  / KV_REST_API_TOKEN
//   - Upstash Redis direct: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
function pickEnv(): { url: string; token: string } | null {
  const url   = process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  if (url && token) return { url, token }
  return null
}

const env = pickEnv()
const kv = env ? createClient({ url: env.url, token: env.token }) : null

// In-memory fallback for when no KV is configured or KV throws.
const g = globalThis as unknown as { __shoot_state__?: AppState }

async function tryKVGet(): Promise<AppState | null> {
  if (!kv) return null
  try {
    return await kv.get<AppState>(KEY)
  } catch (e) {
    console.error('[kv] get failed, falling back to memory:', e)
    return null
  }
}

async function tryKVSet(state: AppState): Promise<void> {
  if (!kv) return
  try {
    await kv.set(KEY, state)
  } catch (e) {
    console.error('[kv] set failed, state only in memory:', e)
  }
}

// Backfill missing fields so older stored state shapes never crash on read.
function migrate(data: AppState): AppState {
  const seed = getSeedState()
  function fixTimers(t: unknown): typeof seed.timers.vibe {
    if (t && typeof t === 'object' && 'plan' in (t as object)) {
      const tt = t as Partial<typeof seed.timers.vibe>
      return {
        currentPhase: (tt.currentPhase ?? 'plan') as PhaseId,
        plan:   tt.plan   ?? seed.timers.vibe.plan,
        build1: tt.build1 ?? seed.timers.vibe.build1,
        build2: tt.build2 ?? seed.timers.vibe.build2,
      }
    }
    return seed.timers.vibe
  }
  return {
    phases: data.phases ?? seed.phases,
    reminders: data.reminders ?? seed.reminders,
    pmRoles: data.pmRoles ?? seed.pmRoles,
    timers: {
      vibe:   fixTimers(data.timers?.vibe),
      junior: fixTimers(data.timers?.junior),
      senior: fixTimers(data.timers?.senior),
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
  const kvData = await tryKVGet()
  if (kvData) {
    const migrated = migrate(kvData)
    g.__shoot_state__ = migrated
    return migrated
  }
  if (g.__shoot_state__) return g.__shoot_state__
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
