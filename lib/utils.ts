import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { TimerState } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function getElapsed(timer: TimerState): number {
  if (timer.running && timer.startedAt) {
    return timer.elapsed + (Date.now() - timer.startedAt)
  }
  return timer.elapsed
}

export function formatClockTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export function getTimerStatus(timer: TimerState): 'stopped' | 'running' | 'paused' {
  if (timer.running) return 'running'
  if (timer.elapsed > 0) return 'paused'
  return 'stopped'
}
