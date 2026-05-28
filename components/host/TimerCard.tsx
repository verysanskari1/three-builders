'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { formatDuration, getElapsed, getTimerStatus } from '@/lib/utils'
import { TimerState, PauseRequest, ContestantId } from '@/lib/types'
import { cn } from '@/lib/utils'

const COLORS: Record<ContestantId, { accent: string; bg: string; border: string; label: string }> = {
  vibe: {
    accent: 'text-vibe',
    bg: 'bg-vibe/10',
    border: 'border-vibe/30',
    label: 'VIBE CODER',
  },
  junior: {
    accent: 'text-junior',
    bg: 'bg-junior/10',
    border: 'border-junior/30',
    label: 'JUNIOR DEV',
  },
  senior: {
    accent: 'text-senior',
    bg: 'bg-senior/10',
    border: 'border-senior/30',
    label: 'SENIOR DEV',
  },
}

interface Props {
  id: ContestantId
  timer: TimerState
  pendingRequest?: PauseRequest
  onToggle: () => void
  onReset: () => void
  onAck: (requestId: string, action: 'approved' | 'denied') => void
}

export default function TimerCard({
  id,
  timer,
  pendingRequest,
  onToggle,
  onReset,
  onAck,
}: Props) {
  const [display, setDisplay] = useState(formatDuration(getElapsed(timer)))
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false)
  const col = COLORS[id]
  const status = getTimerStatus(timer)

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplay(formatDuration(getElapsed(timer)))
    }, 100)
    return () => clearInterval(interval)
  }, [timer])

  const handleReset = useCallback(() => {
    setResetDialogOpen(false)
    onReset()
  }, [onReset])

  return (
    <div
      className={cn(
        'rounded-xl border p-5 bg-card flex flex-col gap-3',
        col.border,
        pendingRequest ? 'ring-2 ring-danger/50' : ''
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn('font-mono text-xs font-semibold tracking-widest', col.accent)}>
          {col.label}
        </span>
        <div className="flex items-center gap-2">
          {pendingRequest && (
            <button
              onClick={() => setPauseDialogOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-danger/20 border border-danger/40 text-danger text-xs font-mono hover:bg-danger/30 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
              Pause req
            </button>
          )}
          <Badge
            variant={status === 'running' ? 'success' : status === 'paused' ? 'warning' : 'secondary'}
            className="font-mono text-xs"
          >
            {status}
          </Badge>
        </div>
      </div>

      <div className={cn('font-mono text-4xl font-semibold tabular-nums', col.accent)}>
        {display}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={onToggle}
          size="sm"
          className={cn(
            'flex-1 font-mono text-xs',
            status === 'running'
              ? 'bg-warning/20 text-warning border border-warning/30 hover:bg-warning/30'
              : 'bg-done/20 text-done border border-done/30 hover:bg-done/30'
          )}
          variant="outline"
        >
          {status === 'running' ? 'PAUSE' : status === 'paused' ? 'RESUME' : 'START'}
        </Button>
        <Button
          onClick={() => setResetDialogOpen(true)}
          size="sm"
          variant="outline"
          className="font-mono text-xs text-danger/70 border-danger/20 hover:bg-danger/10 hover:text-danger"
        >
          RESET
        </Button>
      </div>

      {/* Reset confirm dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset {col.label} timer?</DialogTitle>
            <DialogDescription>
              This will wipe the elapsed time back to 00:00:00. Can't be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="outline" size="sm" onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pause request dialog */}
      {pendingRequest && (
        <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Pause requested by {col.label}</DialogTitle>
              <DialogDescription>
                {pendingRequest.reason ? (
                  <>Reason: <span className="text-white">{pendingRequest.reason}</span></>
                ) : (
                  'No reason given.'
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end mt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-danger border-danger/30 hover:bg-danger/10"
                onClick={() => {
                  onAck(pendingRequest.id, 'denied')
                  setPauseDialogOpen(false)
                }}
              >
                Deny
              </Button>
              <Button
                size="sm"
                className="bg-done/20 text-done border border-done/30 hover:bg-done/30"
                variant="outline"
                onClick={() => {
                  onAck(pendingRequest.id, 'approved')
                  setPauseDialogOpen(false)
                }}
              >
                Approve & Pause
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
