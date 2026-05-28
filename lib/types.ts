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
}

export type ContestantId = 'vibe' | 'junior' | 'senior'

export type AppState = {
  phases: Phase[]
  reminders: Reminder[]
  pmRoles: PMRole[]
  timers: {
    vibe: TimerState
    junior: TimerState
    senior: TimerState
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
