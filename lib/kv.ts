import { kv } from '@vercel/kv'
import { AppState } from './types'
import { getSeedState } from './seed'

const KEY = 'shoot:state'

// Backfill any fields missing on older stored state shapes so reads never crash.
function migrate(data: AppState): AppState {
  const seed = getSeedState()
  const migrated: AppState = {
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
  return migrated
}

export async function getState(): Promise<AppState> {
  const data = await kv.get<AppState>(KEY)
  if (!data) {
    const seed = getSeedState()
    await kv.set(KEY, seed)
    return seed
  }
  return migrate(data)
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
