'use client'

import { useEffect, useState, useCallback } from 'react'
import { formatDuration, getElapsed, getTimerStatus, getPhaseInfo } from '@/lib/utils'
import { TimerState, PauseRequest, ContestantId } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const LABELS: Record<ContestantId, string> = {
  vibe: 'Vibe Coder',
  junior: 'Junior Dev',
  senior: 'Senior Dev',
}
const ACCENT: Record<ContestantId, string> = {
  vibe: 'text-vibe',
  junior: 'text-junior',
  senior: 'text-senior',
}
const TOP_BORDER: Record<ContestantId, string> = {
  vibe: 'border-t-vibe',
  junior: 'border-t-junior',
  senior: 'border-t-senior',
}

interface Props {
  id: ContestantId
  timer: TimerState
  pendingRequest?: PauseRequest
  onToggle: () => void
  onReset: () => void
  onAck: (id: string, action: 'approved' | 'denied') => void
}

export default function TimerCard({ id, timer, pendingRequest, onToggle, onReset, onAck }: Props) {
  const [display, setDisplay] = useState(formatDuration(getElapsed(timer)))
  const [phase, setPhase] = useState(getPhaseInfo(getElapsed(timer)))
  const [resetOpen, setResetOpen] = useState(false)
  const [pauseOpen, setPauseOpen] = useState(false)
  const status = getTimerStatus(timer)

  useEffect(() => {
    const iv = setInterval(() => {
      const elapsed = getElapsed(timer)
      setDisplay(formatDuration(elapsed))
      setPhase(getPhaseInfo(elapsed))
    }, 100)
    return () => clearInterval(iv)
  }, [timer])

  const handleReset = useCallback(() => {
    setResetOpen(false)
    onReset()
  }, [onReset])

  return (
    <div className={cn('bg-surface rounded-xl border border-border border-t-2 shadow-card flex flex-col gap-3 p-4', TOP_BORDER[id])}>
      <div className="flex items-center justify-between">
        <span className={cn('text-sm font-semibold', ACCENT[id])}>{LABELS[id]}</span>
        <div className="flex items-center gap-2">
          {pendingRequest && (
            <button
              onClick={() => setPauseOpen(true)}
              className="text-xs text-danger bg-danger-bg border border-danger/20 px-2 py-0.5 rounded-full hover:bg-red-100 transition-colors"
            >
              Pause req
            </button>
          )}
          <Badge variant={status === 'running' ? 'success' : status === 'paused' ? 'warning' : 'secondary'}>
            {status}
          </Badge>
        </div>
      </div>

      <div className="font-display text-4xl text-primary tabular-nums">{display}</div>

      {phase.name !== 'Done' && (
        <div className="mt-1">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-secondary font-medium">{phase.name}</span>
            <span className="text-muted tabular-nums">{formatDuration(phase.remaining)} left</span>
          </div>
          <div className="h-1 bg-page rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', id === 'vibe' ? 'bg-vibe' : id === 'junior' ? 'bg-junior' : 'bg-senior')}
              style={{ width: `${Math.min(phase.progress * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
      {phase.name === 'Done' && (
        <div className="text-[11px] text-success font-medium">All phases complete</div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onToggle}
          className={cn(
            'flex-1 h-8 rounded-lg text-xs font-medium border transition-colors',
            status === 'running'
              ? 'border-warning/30 bg-warning-bg text-warning hover:bg-amber-100'
              : 'border-success/30 bg-success-bg text-success hover:bg-green-100'
          )}
        >
          {status === 'running' ? 'Pause' : status === 'paused' ? 'Resume' : 'Start'}
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
            <DialogTitle>Reset {LABELS[id]} timer?</DialogTitle>
            <DialogDescription>Wipes elapsed time to 00:00:00. Can't be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={() => setResetOpen(false)} className="h-8 px-4 rounded-lg text-sm border border-border text-secondary hover:bg-page transition-colors">Cancel</button>
            <button onClick={handleReset} className="h-8 px-4 rounded-lg text-sm bg-danger text-white hover:bg-red-700 transition-colors">Reset</button>
          </div>
        </DialogContent>
      </Dialog>

      {pendingRequest && (
        <Dialog open={pauseOpen} onOpenChange={setPauseOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pause requested — {LABELS[id]}</DialogTitle>
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
