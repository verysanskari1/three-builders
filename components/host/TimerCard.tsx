'use client'

import { useEffect, useState } from 'react'
import { formatDuration, getPhaseTimerInfo, getCurrentPhase, cn } from '@/lib/utils'
import {
  ContestantTimers,
  PauseRequest,
  ContestantId,
  PhaseId,
  PHASE_ORDER,
  PHASE_LABELS,
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
const SHORT: Record<PhaseId, string> = {
  plan: 'Plan', build1: 'Build 1', build2: 'Build 2',
}

interface Props {
  id: ContestantId
  timers: ContestantTimers
  pendingRequest?: PauseRequest
  onToggle: () => void
  onReset: () => void
  onSwitchPhase: (phase: PhaseId) => void
  onAck: (id: string, action: 'approved' | 'denied') => void
}

export default function TimerCard({ id, timers, pendingRequest, onToggle, onReset, onSwitchPhase, onAck }: Props) {
  const [, setTick] = useState(0)
  const [resetOpen, setResetOpen] = useState(false)
  const [pauseOpen, setPauseOpen] = useState(false)

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 250)
    return () => clearInterval(iv)
  }, [])

  const currentPhase = getCurrentPhase(timers)
  const info = getPhaseTimerInfo(timers, currentPhase)

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

      {/* Phase tabs */}
      <div className="grid grid-cols-3 gap-1 p-0.5 bg-page rounded-lg">
        {PHASE_ORDER.map(p => {
          const active = p === currentPhase
          const pInfo = getPhaseTimerInfo(timers, p)
          return (
            <button
              key={p}
              onClick={() => onSwitchPhase(p)}
              className={cn(
                'rounded-md py-1.5 px-1 text-[11px] font-medium transition-all',
                active
                  ? 'bg-surface text-primary shadow-sm border border-border'
                  : 'text-muted hover:text-primary'
              )}
            >
              <div className="leading-tight">{SHORT[p]}</div>
              <div className={cn('text-[10px] tabular-nums', active ? 'text-secondary' : 'text-muted')}>
                {formatDuration(pInfo.elapsed).slice(3)}
              </div>
            </button>
          )
        })}
      </div>

      {/* Big timer */}
      <div className="text-center pt-1">
        <div className="font-display text-4xl text-primary tabular-nums leading-none mb-0.5">
          {formatDuration(info.elapsed)}
        </div>
        <div className="text-[11px] text-muted tabular-nums">
          of {formatDuration(info.duration)}
        </div>
      </div>

      <div className="h-1 bg-page rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', BAR[id])}
          style={{ width: `${Math.min(info.progress * 100, 100)}%` }}
        />
      </div>

      <div className="flex gap-1.5">
        <button
          onClick={onToggle}
          disabled={info.status === 'done'}
          className={cn(
            'flex-1 h-8 rounded-lg text-xs font-medium border transition-colors',
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
          onClick={() => setResetOpen(true)}
          className="h-8 px-3 rounded-lg text-xs border border-border text-muted hover:text-danger hover:border-danger/30 transition-colors"
        >
          Reset
        </button>
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset {PHASE_LABELS[currentPhase]} for {LABELS[id]}?</DialogTitle>
            <DialogDescription>
              Wipes this phase&apos;s elapsed time to 00:00:00. Other phases and other contestants are not affected.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={() => setResetOpen(false)} className="h-8 px-4 rounded-lg text-sm border border-border text-secondary hover:bg-page transition-colors">Cancel</button>
            <button onClick={() => { setResetOpen(false); onReset() }} className="h-8 px-4 rounded-lg text-sm bg-danger text-white hover:bg-red-700 transition-colors">Reset</button>
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
