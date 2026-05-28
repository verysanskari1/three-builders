'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AppState, ContestantId, ContestantTask, Notification } from '@/lib/types'
import { formatDuration, formatClockTime, getElapsed, getTimerStatus } from '@/lib/utils'
import { getPusherClient, PUSHER_CHANNEL } from '@/lib/pusher-client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

const CONFIG: Record<ContestantId, { label: string; color: string; borderColor: string; bgColor: string }> = {
  vibe: {
    label: 'VIBE CODER',
    color: 'text-vibe',
    borderColor: 'border-vibe/40',
    bgColor: 'bg-vibe/10',
  },
  junior: {
    label: 'JUNIOR DEV',
    color: 'text-junior',
    borderColor: 'border-junior/40',
    bgColor: 'bg-junior/10',
  },
  senior: {
    label: 'SENIOR DEV',
    color: 'text-senior',
    borderColor: 'border-senior/40',
    bgColor: 'bg-senior/10',
  },
}

interface ToastNotification extends Notification {
  dismissed?: boolean
}

interface Props {
  id: ContestantId
  initialState: AppState
}

export default function ContestantDashboard({ id, initialState }: Props) {
  const [state, setState] = useState<AppState>(initialState)
  const [clock, setClock] = useState('')
  const [timerDisplay, setTimerDisplay] = useState('00:00:00')
  const [toastNotifs, setToastNotifs] = useState<ToastNotification[]>([])
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false)
  const [pauseReason, setPauseReason] = useState('')
  const [pauseStatus, setPauseStatus] = useState<'idle' | 'pending' | 'approved' | 'denied'>('idle')
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [notes, setNotes] = useState(initialState.contestantNotes[id] || '')
  const noteSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const taskSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const col = CONFIG[id]

  // clock
  useEffect(() => {
    setClock(formatClockTime(new Date()))
    const iv = setInterval(() => setClock(formatClockTime(new Date())), 1000)
    return () => clearInterval(iv)
  }, [])

  // timer display
  useEffect(() => {
    const iv = setInterval(() => {
      setTimerDisplay(formatDuration(getElapsed(state.timers[id])))
    }, 100)
    return () => clearInterval(iv)
  }, [state.timers, id])

  // Pusher
  useEffect(() => {
    const client = getPusherClient()
    const channel = client.subscribe(PUSHER_CHANNEL)

    channel.bind('timer-update', (data: { id: ContestantId; timer: AppState['timers']['vibe'] }) => {
      if (data.id === id) {
        setState(prev => ({ ...prev, timers: { ...prev.timers, [id]: data.timer } }))
      }
    })

    channel.bind('notification', (notif: Notification) => {
      if (notif.target === 'all' || notif.target === id) {
        setToastNotifs(prev => [...prev, notif])
        setTimeout(() => {
          setToastNotifs(prev => prev.filter(n => n.id !== notif.id))
        }, notif.expiresAt - notif.createdAt)
      }
    })

    channel.bind('pause-ack', (data: { id: string; contestant: ContestantId; action: 'approved' | 'denied' }) => {
      if (data.contestant === id && data.id === pendingRequestId) {
        setPauseStatus(data.action)
        setPendingRequestId(null)
        if (data.action === 'approved') {
          setState(prev => ({
            ...prev,
            timers: { ...prev.timers, [id]: { ...prev.timers[id], running: false, startedAt: null } },
          }))
        }
        setTimeout(() => setPauseStatus('idle'), 8000)
      }
    })

    return () => {
      channel.unbind_all()
      client.unsubscribe(PUSHER_CHANNEL)
    }
  }, [id, pendingRequestId])

  // Polling fallback every 5s
  useEffect(() => {
    const iv = setInterval(async () => {
      const res = await fetch('/api/state')
      const data: AppState = await res.json()
      setState(data)
      setNotes(data.contestantNotes[id] || '')
    }, 5000)
    return () => clearInterval(iv)
  }, [id])

  async function handlePauseRequest() {
    const res = await fetch('/api/pause-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contestant: id, reason: pauseReason || undefined }),
    })
    const pr = await res.json()
    setPendingRequestId(pr.id)
    setPauseStatus('pending')
    setPauseDialogOpen(false)
    setPauseReason('')
  }

  const handleNoteSave = useCallback((value: string) => {
    if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current)
    noteSaveTimer.current = setTimeout(() => {
      fetch(`/api/contestants/${id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: value }),
      })
    }, 500)
  }, [id])

  function handleTaskToggle(taskId: string) {
    const tasks = state.contestantChecklists[id].map(t =>
      t.id === taskId ? { ...t, done: !t.done } : t
    )
    setState(prev => ({
      ...prev,
      contestantChecklists: { ...prev.contestantChecklists, [id]: tasks },
    }))
    if (taskSaveTimer.current) clearTimeout(taskSaveTimer.current)
    taskSaveTimer.current = setTimeout(() => {
      fetch(`/api/contestants/${id}/tasks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks }),
      })
    }, 500)
  }

  const timer = state.timers[id]
  const status = getTimerStatus(timer)
  const tasks = state.contestantChecklists[id] || []
  const tasksDone = tasks.filter(t => t.done).length

  const phaseEndingKeywords = ['ending in 5 minutes', 'phase 1 ending', 'phase 2 ending']
  const isPhaseWarning = (text: string) =>
    phaseEndingKeywords.some(k => text.toLowerCase().includes(k))

  return (
    <div className="min-h-screen">
      {/* Notification toasts */}
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col gap-2 p-4">
        {toastNotifs.map(n => (
          <div
            key={n.id}
            className={cn(
              'flex items-start gap-3 px-5 py-4 rounded-xl border text-white shadow-2xl',
              isPhaseWarning(n.text)
                ? 'bg-warning/20 border-warning/60'
                : 'bg-accent/20 border-accent/60'
            )}
          >
            <span className="text-xl flex-shrink-0">{isPhaseWarning(n.text) ? '⚠️' : '📢'}</span>
            <span className="flex-1 font-medium">{n.text}</span>
            <button
              onClick={() => setToastNotifs(prev => prev.filter(x => x.id !== n.id))}
              className="text-white/40 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <h1 className={cn('font-mono text-2xl font-semibold tracking-widest', col.color)}>
            {col.label}
          </h1>
          <div className="font-mono text-xl text-white/60 tabular-nums">{clock}</div>
        </div>

        {/* Big Timer */}
        <div className={cn('rounded-2xl border-2 p-8 flex flex-col items-center gap-4', col.borderColor, col.bgColor)}>
          <div className={cn('font-mono text-7xl md:text-8xl font-semibold tabular-nums', col.color)}>
            {timerDisplay}
          </div>

          <Badge
            variant={status === 'running' ? 'success' : status === 'paused' ? 'warning' : 'secondary'}
            className="font-mono text-sm px-4 py-1"
          >
            {status === 'running' ? '● RUNNING' : status === 'paused' ? '⏸ PAUSED' : '■ STOPPED'}
          </Badge>

          {pauseStatus === 'approved' && (
            <div className="px-4 py-2 rounded-lg bg-done/20 border border-done/40 text-done text-sm font-medium">
              ✓ Paused — host approved
            </div>
          )}
          {pauseStatus === 'denied' && (
            <div className="px-4 py-2 rounded-lg bg-danger/20 border border-danger/40 text-danger text-sm font-medium">
              ✗ Pause denied — keep going
            </div>
          )}

          <Button
            onClick={() => {
              if (pauseStatus === 'pending') return
              if (pauseStatus !== 'idle') { setPauseStatus('idle'); return }
              setPauseDialogOpen(true)
            }}
            disabled={pauseStatus === 'pending'}
            variant="outline"
            className={cn(
              'font-mono',
              pauseStatus === 'pending' && 'opacity-50 cursor-not-allowed',
              pauseStatus === 'idle' && `border-${id === 'vibe' ? 'vibe' : id === 'junior' ? 'junior' : 'senior'}/40 text-white/70`
            )}
          >
            {pauseStatus === 'pending' ? 'Pause requested…' : 'Request pause'}
          </Button>
        </div>

        {/* Recording checklist */}
        <div className="rounded-xl border border-white/8 bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-mono text-xs text-white/50 uppercase tracking-wider">
              Recording checklist
            </h2>
            <span className="font-mono text-xs text-white/40">
              {tasksDone}/{tasks.length}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {tasks.map(task => (
              <label
                key={task.id}
                className={cn(
                  'flex items-start gap-3 px-3 py-2 rounded cursor-pointer hover:bg-white/3 transition-colors',
                  task.done && 'opacity-60'
                )}
              >
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => handleTaskToggle(task.id)}
                  className="w-4 h-4 mt-0.5 accent-done flex-shrink-0"
                />
                <span className={cn('text-sm', task.done && 'line-through text-white/40')}>
                  {task.text}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-xl border border-white/8 bg-card p-5">
          <h2 className="font-mono text-xs text-white/50 uppercase tracking-wider mb-3">
            Notes — passwords, logins, anything
          </h2>
          <Textarea
            value={notes}
            onChange={e => {
              setNotes(e.target.value)
              handleNoteSave(e.target.value)
            }}
            onBlur={() => handleNoteSave(notes)}
            placeholder="Passwords, logins, API keys, anything you don't want to lose…"
            className="font-mono text-sm min-h-[160px] bg-elevated/50"
            spellCheck={false}
          />
        </div>

        {/* Rules card */}
        <div className="rounded-xl border border-white/8 bg-card overflow-hidden">
          <button
            onClick={() => setRulesOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors"
          >
            <h2 className="font-mono text-xs text-white/50 uppercase tracking-wider">
              Rules of the challenge
            </h2>
            <span className="text-white/30 text-sm">{rulesOpen ? '▲' : '▼'}</span>
          </button>
          {rulesOpen && (
            <div className="px-5 pb-5 text-white/70 text-sm leading-relaxed border-t border-white/5">
              <p className="text-white/40 italic mt-3">
                Rules will be revealed by the host at 10:30 AM. Stay tuned.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pause request dialog */}
      <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Request a pause</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-white/60">
            Send a pause request to the host. Optionally explain why.
          </p>
          <Textarea
            value={pauseReason}
            onChange={e => setPauseReason(e.target.value)}
            placeholder="Reason (optional)"
            className="min-h-[80px]"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setPauseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePauseRequest}>
              Send request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
