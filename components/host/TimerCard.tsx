'use client'

import { useEffect, useState } from 'react'
import { formatDuration, getPhaseTimerInfo, getCurrentPhase, cn } from '@/lib/utils'
import {
  ContestantTimers,
  PauseRequest,
  ContestantId,
  PhaseId,
  PHASE_ORDER,
} from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

const LABELS: Record<ContestantId, string> = {
  vibe: 'Vibe Coder', junior: 'Junior Dev', senior: 'Senior Dev',
}
const ACCENT: Record<ContestantId, string> = {
  vibe: 'text-vibe', junior: 'text-junior', senior: 'text-senior',
}
const BAR: Record<ContestantId, string> = {
  vibe: 'bg-vibe', junior: 'bg-junior', senior: 'bg-senior',
}
const TOP_BORDER: Record<ContestantId, string> = {
  vibe: 'border-t-vibe', junior: 'border-t-junior', senior: 'border-t-senior',
}

interface Props {
  id: ContestantId
  timers: ContestantTimers
  pendingRequest?: PauseRequest
  onToggle: (phase: PhaseId) => void
  onReset: (phase: PhaseId) => void
  onAck: (id: string, action: 'approved' | 'denied') => void
}

export default function TimerCard({ id, timers, pendingRequest, onToggle, onReset, onAck }: Props) {
  const [tick, setTick] = useState(0)
  const [resetPhase, setResetPhase] = useState<PhaseId | null>(null)
  const [pauseOpen, setPauseOpen] = useState(false)

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 250)
    return () => clearInterval(iv)
  }, [])

  const currentPhase = getCurrentPhase(timers)

  return (
    <div className={cn('bg-surface rounded-xl border border-border border-t-2 shadow-card flex flex-col gap-3 p-4', TOP_BORDER[id])}>
      <div className="flex items-center justify-between">
        <span className={cn('text-sm font-semibold', ACCENT[id])}>{LABELS[id]}</span>
        {pendingRequest && (
          <button
            onClick={() => setPauseOpen(true)}
            className="text-xs text-danger bg-danger-bg border border-danger/20 px-2 py-0.5 rounded-full hover:bg-red-100 transition-colors"
          >
            Pause request
          </button>
        )}
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
      <div className="flex flex-col gap-2" data-tick={tick}>
        {PHASE_ORDER.map(phase => {
          const info = getPhaseTimerInfo(timers, phase)
          const isCurrent = phase === currentPhase
          const statusColor =
            info.status === 'running' ? 'text-success' :
            info.status === 'paused' ? 'text-warning' :
            info.status === 'done' ? 'text-muted' : 'text-muted'
          return (
            <div
              key={phase}
              className={cn(
                'rounded-lg border p-2.5 transition-colors',
                isCurrent ? 'border-border-strong bg-page' : 'border-border bg-surface'
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary">{info.name}</span>
                  {isCurrent && <span className="text-[9px] uppercase tracking-wider text-accent font-semibold">Current</span>}
                </div>
                <span className={cn('text-[10px] uppercase tracking-wider font-semibold', statusColor)}>
                  {info.status}
                </span>
              </div>

              <div className="flex items-baseline justify-between mb-1.5">
                <span className="font-display text-2xl text-primary tabular-nums">
                  {formatDuration(info.elapsed)}
                </span>
                <span className="text-[11px] text-muted tabular-nums">
                  / {formatDuration(info.duration)}
                </span>
              </div>

              <div className="h-1 bg-page rounded-full overflow-hidden mb-2">
                <div
                  className={cn('h-full rounded-full transition-all', BAR[id])}
                  style={{ width: `${Math.min(info.progress * 100, 100)}%` }}
                />
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={() => onToggle(phase)}
                  disabled={info.status === 'done'}
                  className={cn(
                    'flex-1 h-7 rounded-md text-[11px] font-medium border transition-colors',
                    info.status === 'done'
                      ? 'border-border text-muted opacity-50 cursor-not-allowed'
                      : info.running
                      ? 'border-warning/30 bg-warning-bg text-warning hover:bg-amber-100'
                      : 'border-success/30 bg-success-bg text-success hover:bg-green-100'
                  )}
                >
                  {info.running ? 'Pause' : info.status === 'paused' ? 'Resume' : info.status === 'done' ? 'Done' : 'Start'}
                </button>
                <button
                  onClick={() => setResetPhase(phase)}
                  className="h-7 px-2.5 rounded-md text-[11px] border border-border text-muted hover:text-danger hover:border-danger/30 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={!!resetPhase} onOpenChange={open => !open && setResetPhase(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Reset {resetPhase && getPhaseTimerInfo(timers, resetPhase).name} for {LABELS[id]}?
            </DialogTitle>
            <DialogDescription>
              Wipes this phase&apos;s elapsed time to 00:00:00. Other phases are not affected.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={() => setResetPhase(null)} className="h-8 px-4 rounded-lg text-sm border border-border text-secondary hover:bg-page transition-colors">Cancel</button>
            <button
              onClick={() => {
                if (resetPhase) onReset(resetPhase)
                setResetPhase(null)
              }}
              className="h-8 px-4 rounded-lg text-sm bg-danger text-white hover:bg-red-700 transition-colors"
            >
              Reset
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {pendingRequest && (
        <Dialog open={pauseOpen} onOpenChange={setPauseOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pause requested · {LABELS[id]}</DialogTitle>
              <DialogDescription>
                {pendingRequest.reason ? `"${pendingRequest.reason}"` : 'No reason given.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => { onAck(pendingRequest.id, 'denied'); setPauseOpen(false) }} className="h-8 px-4 rounded-lg text-sm border border-danger/30 text-danger hover:bg-danger-bg transition-colors">Deny</button>
              <button onClick={() => { onAck(pendingRequest.id, 'approved'); setPauseOpen(false) }} className="h-8 px-4 rounded-lg text-sm bg-success text-white hover:bg-green-700 transition-colors">Approve & Pause</button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
