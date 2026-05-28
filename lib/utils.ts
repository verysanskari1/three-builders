import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  TimerState,
  ContestantTimers,
  PhaseId,
  PHASE_DURATIONS,
  PHASE_LABELS,
  PHASE_ORDER,
} from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(ms: number): string {
  if (!ms || isNaN(ms) || ms < 0) ms = 0
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function getElapsed(timer: TimerState | undefined): number {
  if (!timer || typeof timer.elapsed !== 'number') return 0
  if (timer.running && timer.startedAt) {
    return timer.elapsed + (Date.now() - timer.startedAt)
  }
  return timer.elapsed
}

export function formatClockTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
}

export function getTimerStatus(timer: TimerState | undefined): 'stopped' | 'running' | 'paused' {
  if (!timer || typeof timer.elapsed !== 'number') return 'stopped'
  if (timer.running) return 'running'
  if (timer.elapsed > 0) return 'paused'
  return 'stopped'
}

export type PhaseInfo = {
  id: PhaseId
  name: string
  elapsed: number
  duration: number
  remaining: number
  progress: number   // 0..1
  running: boolean
  status: 'stopped' | 'running' | 'paused' | 'done'
}

export function getPhaseTimerInfo(timers: ContestantTimers, phase: PhaseId): PhaseInfo {
  const timer = timers?.[phase]
  const elapsed = getElapsed(timer)
  const duration = PHASE_DURATIONS[phase]
  const remaining = Math.max(duration - elapsed, 0)
  const progress = Math.min(elapsed / duration, 1)
  let status: PhaseInfo['status'] = getTimerStatus(timer)
  if (elapsed >= duration) status = 'done'
  return {
    id: phase,
    name: PHASE_LABELS[phase],
    elapsed,
    duration,
    remaining,
    progress,
    running: !!timer?.running,
    status,
  }
}

// Active phase = the running one, else first incomplete one, else 'build2'.
export function getCurrentPhase(timers: ContestantTimers): PhaseId {
  if (!timers) return 'plan'
  for (const p of PHASE_ORDER) {
    if (timers[p]?.running) return p
  }
  for (const p of PHASE_ORDER) {
    if (getElapsed(timers[p]) < PHASE_DURATIONS[p]) return p
  }
  return 'build2'
}
