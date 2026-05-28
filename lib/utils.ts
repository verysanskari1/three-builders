import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { TimerState } from './types'

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

export function getElapsed(timer: TimerState): number {
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

export function getTimerStatus(timer: TimerState): 'stopped' | 'running' | 'paused' {
  if (!timer || typeof timer.elapsed !== 'number') return 'stopped'
  if (timer.running) return 'running'
  if (timer.elapsed > 0) return 'paused'
  return 'stopped'
}

// Phase boundaries (ms)
const PLAN_END   = 30  * 60 * 1000   // 30 min
const BUILD1_END = 180 * 60 * 1000   // 3 hr  (30min plan + 2.5hr build)
const BUILD2_END = 300 * 60 * 1000   // 5 hr  (+ 2hr build)

export type PhaseInfo = {
  name: 'Plan Phase' | 'Build Phase 1' | 'Build Phase 2' | 'Done'
  remaining: number   // ms
  progress: number    // 0..1
  duration: number    // ms of this phase
}

export function getPhaseInfo(elapsedMs: number): PhaseInfo {
  if (elapsedMs < PLAN_END) {
    return {
      name: 'Plan Phase',
      remaining: PLAN_END - elapsedMs,
      progress: elapsedMs / PLAN_END,
      duration: PLAN_END,
    }
  }
  if (elapsedMs < BUILD1_END) {
    const d = BUILD1_END - PLAN_END
    return {
      name: 'Build Phase 1',
      remaining: BUILD1_END - elapsedMs,
      progress: (elapsedMs - PLAN_END) / d,
      duration: d,
    }
  }
  if (elapsedMs < BUILD2_END) {
    const d = BUILD2_END - BUILD1_END
    return {
      name: 'Build Phase 2',
      remaining: BUILD2_END - elapsedMs,
      progress: (elapsedMs - BUILD1_END) / d,
      duration: d,
    }
  }
  return { name: 'Done', remaining: 0, progress: 1, duration: 0 }
}
