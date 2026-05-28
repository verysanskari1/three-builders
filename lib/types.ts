export type Owner = 'Kanishkar' | 'Sanskar' | 'Shared' | ''

export type Task = {
  id: string
  text: string
  owner: Owner
  done: boolean
  note: string
}

export type Phase = {
  id: string
  title: string
  time: string
  group: string
  tasks: Task[]
}

export type TimerState = {
  elapsed: number
  running: boolean
  startedAt: number | null
}

export type PhaseId = 'plan' | 'build1' | 'build2'

export type ContestantTimers = {
  plan: TimerState
  build1: TimerState
  build2: TimerState
}

export const PHASE_DURATIONS: Record<PhaseId, number> = {
  plan:   30  * 60 * 1000,  // 30 min
  build1: 150 * 60 * 1000,  // 2.5 hr
  build2: 120 * 60 * 1000,  // 2 hr
}

export const PHASE_LABELS: Record<PhaseId, string> = {
  plan:   'Plan Phase',
  build1: 'Build Phase 1',
  build2: 'Build Phase 2',
}

export const PHASE_ORDER: PhaseId[] = ['plan', 'build1', 'build2']

export type Reminder = {
  id: string
  text: string
  time: string
  fired: boolean
  repeatMinutes?: number
  repeatUntil?: string
  broadcastToContestants?: boolean
}

export type PMRole = {
  label: string
  text: string
}

export type Notification = {
  id: string
  text: string
  target: 'all' | 'vibe' | 'junior' | 'senior'
  createdAt: number
  expiresAt: number
}

export type PauseRequest = {
  id: string
  contestant: ContestantId
  reason?: string
  createdAt: number
  status: 'pending' | 'approved' | 'denied'
}

export type ContestantTask = {
  id: string
  text: string
  done: boolean
  phase?: PhaseId    // optional — undefined means show in every phase
}

export type ContestantId = 'vibe' | 'junior' | 'senior'

export type AppState = {
  phases: Phase[]
  reminders: Reminder[]
  pmRoles: PMRole[]
  timers: {
    vibe: ContestantTimers
    junior: ContestantTimers
    senior: ContestantTimers
  }
  notifications: Notification[]
  pauseRequests: PauseRequest[]
  contestantNotes: {
    vibe: string
    junior: string
    senior: string
  }
  contestantChecklists: {
    vibe: ContestantTask[]
    junior: ContestantTask[]
    senior: ContestantTask[]
  }
  sharedInfo: string
}
