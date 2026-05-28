'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  AppState,
  ContestantId,
  ContestantTask,
  Notification,
  PhaseId,
  PHASE_ORDER,
} from '@/lib/types'
import {
  formatDuration,
  formatClockTime,
  getPhaseTimerInfo,
  getCurrentPhase,
  cn,
} from '@/lib/utils'
import { getPusherClient, PUSHER_CHANNEL } from '@/lib/pusher-client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const CONFIG: Record<ContestantId, { label: string; color: string; border: string; bar: string }> = {
  vibe:   { label: 'Vibe Coder',  color: 'text-vibe',   border: 'border-t-vibe',   bar: 'bg-vibe' },
  junior: { label: 'Junior Dev',  color: 'text-junior', border: 'border-t-junior', bar: 'bg-junior' },
  senior: { label: 'Senior Dev',  color: 'text-senior', border: 'border-t-senior', bar: 'bg-senior' },
}

interface Toast {
  id: string
  text: string
  isWarning: boolean
  expiresAt: number
}

interface Props {
  id: ContestantId
  initialState: AppState
}

export default function ContestantDashboard({ id, initialState }: Props) {
  const [state, setState] = useState<AppState>(initialState)
  const [clock, setClock] = useState('')
  const [, setTick] = useState(0)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [pauseOpen, setPauseOpen] = useState(false)
  const [pauseReason, setPauseReason] = useState('')
  const [pauseStatus, setPauseStatus] = useState<'idle' | 'pending' | 'approved' | 'denied'>('idle')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [notes, setNotes] = useState(initialState.contestantNotes[id] || '')
  const [showAllTasks, setShowAllTasks] = useState(false)
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const taskTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const col = CONFIG[id]

  useEffect(() => {
    setClock(formatClockTime(new Date()))
    const iv = setInterval(() => setClock(formatClockTime(new Date())), 1000)
    return () => clearInterval(iv)
  }, [])

  // Tick for live timer ms updates.
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 250)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const client = getPusherClient()
    if (!client) return
    const channel = client.subscribe(PUSHER_CHANNEL)

    channel.bind('timer-update', (data: { id: ContestantId; timers?: AppState['timers']['vibe'] }) => {
      if (data.id === id && data.timers) {
        setState(prev => ({ ...prev, timers: { ...prev.timers, [id]: data.timers! } }))
      }
    })

    channel.bind('notification', (notif: Notification) => {
      if (notif.target === 'all' || notif.target === id) {
        const isWarning = /ending|left|complete|wrap up|final push|time's up|5 minutes|10 mins|20 mins/i.test(notif.text)
        const toast: Toast = { id: notif.id, text: notif.text, isWarning, expiresAt: notif.expiresAt }
        setToasts(prev => [...prev, toast])
        const ms = notif.expiresAt - Date.now()
        if (ms > 0) setTimeout(() => setToasts(prev => prev.filter(t => t.id !== notif.id)), ms)
      }
    })

    channel.bind('pause-ack', (data: { id: string; contestant: ContestantId; action: 'approved' | 'denied' }) => {
      if (data.contestant === id && data.id === pendingId) {
        setPauseStatus(data.action)
        setPendingId(null)
        setTimeout(() => setPauseStatus('idle'), 8000)
      }
    })

    channel.bind('state-update', () => {
      fetch('/api/state').then(r => r.json()).then((data: AppState) => {
        setState(data)
        setNotes(data.contestantNotes[id] || '')
      }).catch(() => {})
    })

    return () => { channel.unbind_all(); client.unsubscribe(PUSHER_CHANNEL) }
  }, [id, pendingId])

  // 2-second polling — fast enough to feel near-instant, low enough not to hammer.
  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const res = await fetch('/api/state')
        if (!res.ok) return
        const data: AppState = await res.json()
        // Preserve locally-typed notes — polling shouldn't overwrite what the
        // contestant is typing right now.
        setState(prev => ({
          ...data,
          contestantNotes: { ...data.contestantNotes, [id]: prev.contestantNotes[id] ?? data.contestantNotes[id] },
        }))
        // Check if our pending pause request was resolved by polling state.
        if (pendingId) {
          const pr = data.pauseRequests.find(r => r.id === pendingId)
          if (pr && pr.status !== 'pending') {
            setPauseStatus(pr.status as 'approved' | 'denied')
            setPendingId(null)
            setTimeout(() => setPauseStatus('idle'), 8000)
          }
        }
      } catch { /* ignore */ }
    }, 2000)
    return () => clearInterval(iv)
  }, [id, pendingId])

  async function handlePauseRequest() {
    try {
      const res = await fetch('/api/pause-requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contestant: id, reason: pauseReason || undefined }),
      })
      if (!res.ok) {
        const errToast: Toast = { id: `err-${Date.now()}`, text: 'Could not send pause request. Try again.', isWarning: true, expiresAt: Date.now() + 5000 }
        setToasts(prev => [...prev, errToast])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== errToast.id)), 5000)
        return
      }
      const pr = await res.json()
      setPendingId(pr.id)
      setPauseStatus('pending')
      setPauseOpen(false)
      setPauseReason('')
    } catch {
      const errToast: Toast = { id: `err-${Date.now()}`, text: 'Network error sending pause request.', isWarning: true, expiresAt: Date.now() + 5000 }
      setToasts(prev => [...prev, errToast])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== errToast.id)), 5000)
    }
  }

  const saveNote = useCallback((value: string) => {
    if (noteTimer.current) clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(() => {
      fetch(`/api/contestants/${id}/notes`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: value }),
      }).catch(() => {})
    }, 500)
  }, [id])

  function toggleTask(taskId: string) {
    const tasks = state.contestantChecklists[id].map(t => t.id === taskId ? { ...t, done: !t.done } : t)
    setState(prev => ({ ...prev, contestantChecklists: { ...prev.contestantChecklists, [id]: tasks } }))
    if (taskTimer.current) clearTimeout(taskTimer.current)
    taskTimer.current = setTimeout(() => {
      fetch(`/api/contestants/${id}/tasks`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks }),
      }).catch(() => {})
    }, 500)
  }

  const timers = state.timers[id]
  const currentPhase: PhaseId = getCurrentPhase(timers)
  const currentInfo = getPhaseTimerInfo(timers, currentPhase)
  const allTasks: ContestantTask[] = state.contestantChecklists[id] || []
  const visibleTasks = showAllTasks
    ? allTasks
    : allTasks.filter(t => !t.phase || t.phase === currentPhase)
  const done = visibleTasks.filter(t => t.done).length

  return (
    <div className="min-h-screen bg-page">
      <div className="fixed top-0 left-0 right-0 z-50 flex flex-col gap-1.5 p-3 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-card-hover text-sm font-medium pointer-events-auto',
              toast.isWarning
                ? 'bg-warning-bg border-warning/30 text-warning'
                : 'bg-accent-bg border-accent/20 text-accent'
            )}
          >
            <span className="flex-1">{toast.text}</span>
            <button onClick={() => setToasts(p => p.filter(t => t.id !== toast.id))} className="opacity-60 hover:opacity-100 text-base leading-none">×</button>
          </div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className={cn('font-display text-2xl font-semibold', col.color)}>{col.label}</h1>
          <div className="font-display text-xl text-secondary tabular-nums">{clock}</div>
        </div>

        <div className={cn('bg-surface rounded-2xl border border-t-4 border-border shadow-card p-8 text-center mb-4', col.border)}>
          <div className="text-xs uppercase tracking-wider font-semibold text-secondary mb-2">{currentInfo.name}</div>
          <div className="font-display text-7xl md:text-8xl text-primary tabular-nums tracking-tight mb-1">
            {formatDuration(currentInfo.elapsed)}
          </div>
          <div className="text-sm text-muted tabular-nums mb-4">
            of {formatDuration(currentInfo.duration)}
          </div>

          <div className={cn(
            'inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full mb-4',
            currentInfo.status === 'running' ? 'bg-success-bg text-success' :
            currentInfo.status === 'paused' ? 'bg-warning-bg text-warning' :
            currentInfo.status === 'done' ? 'bg-success-bg text-success' :
            'bg-page text-muted border border-border'
          )}>
            <span className={cn(
              'w-1.5 h-1.5 rounded-full',
              currentInfo.status === 'running' ? 'bg-success' :
              currentInfo.status === 'paused' ? 'bg-warning' :
              currentInfo.status === 'done' ? 'bg-success' : 'bg-muted'
            )} />
            {currentInfo.status === 'running' ? 'Running' :
              currentInfo.status === 'paused' ? 'Paused' :
              currentInfo.status === 'done' ? 'Phase complete' : 'Not started'}
          </div>

          {currentInfo.status !== 'done' && (
            <div className="w-full max-w-xs mx-auto mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-secondary">{formatDuration(currentInfo.remaining)} left</span>
                <span className="text-muted tabular-nums">{Math.round(currentInfo.progress * 100)}%</span>
              </div>
              <div className="h-1.5 bg-page rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', col.bar)}
                  style={{ width: `${Math.min(currentInfo.progress * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {pauseStatus === 'approved' && (
            <div className="text-sm text-success bg-success-bg border border-success/20 rounded-lg px-4 py-2 mb-3 mx-auto max-w-xs">
              Paused. Host approved.
            </div>
          )}
          {pauseStatus === 'denied' && (
            <div className="text-sm text-danger bg-danger-bg border border-danger/20 rounded-lg px-4 py-2 mb-3 mx-auto max-w-xs">
              Pause denied. Keep going.
            </div>
          )}

          <button
            onClick={() => { if (pauseStatus === 'idle') setPauseOpen(true) }}
            disabled={pauseStatus === 'pending'}
            className={cn(
              'h-9 px-5 rounded-lg text-sm border transition-colors',
              pauseStatus === 'pending'
                ? 'border-border text-muted cursor-not-allowed opacity-50'
                : 'border-border text-secondary hover:text-primary hover:border-border-strong bg-surface'
            )}
          >
            {pauseStatus === 'pending' ? 'Pause requested…' : 'Request pause'}
          </button>
        </div>

        {/* Phase strip — quick view of all 3 phases */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {PHASE_ORDER.map(p => {
            const info = getPhaseTimerInfo(timers, p)
            const isCurrent = p === currentPhase
            return (
              <div
                key={p}
                className={cn(
                  'rounded-lg border p-2 text-center',
                  isCurrent ? 'border-border-strong bg-surface' : 'border-border bg-surface/50'
                )}
              >
                <div className="text-[10px] uppercase tracking-wider text-muted mb-0.5">{info.name}</div>
                <div className="font-display text-base text-primary tabular-nums">{formatDuration(info.elapsed)}</div>
                <div className="text-[10px] text-muted">
                  {info.status === 'running' ? '● Running' :
                    info.status === 'done' ? '✓ Done' :
                    info.status === 'paused' ? 'Paused' : 'Not started'}
                </div>
              </div>
            )
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-surface rounded-xl border border-border shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-secondary uppercase tracking-wider">
                {showAllTasks ? 'All recording items' : `${currentInfo.name} checklist`}
              </h2>
              <span className="text-xs text-muted font-mono">{done}/{visibleTasks.length}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {visibleTasks.map(task => (
                <label key={task.id} className={cn('flex items-start gap-2.5 px-1 py-1.5 rounded cursor-pointer hover:bg-page transition-colors', task.done && 'opacity-50')}>
                  <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} className="mt-0.5" />
                  <span className={cn('text-sm text-primary leading-snug', task.done && 'line-through text-muted')}>{task.text}</span>
                </label>
              ))}
              {visibleTasks.length === 0 && (
                <p className="text-xs text-muted text-center py-2">No items for this phase.</p>
              )}
            </div>
            <button
              onClick={() => setShowAllTasks(s => !s)}
              className="mt-3 text-xs text-muted hover:text-primary transition-colors"
            >
              {showAllTasks ? '▼ Show current phase only' : '▶ Show all phases'}
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {state.sharedInfo && (
              <div className="bg-surface rounded-xl border border-border shadow-card p-4">
                <h2 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">From host</h2>
                <pre className="text-xs font-mono text-primary whitespace-pre-wrap leading-relaxed">{state.sharedInfo}</pre>
              </div>
            )}

            <div className="bg-surface rounded-xl border border-border shadow-card p-4">
              <h2 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Your notes</h2>
              <textarea
                value={notes}
                onChange={e => { setNotes(e.target.value); saveNote(e.target.value) }}
                onBlur={() => saveNote(notes)}
                placeholder="Passwords, logins, API keys, links."
                className="w-full min-h-[140px] text-xs font-mono text-primary bg-page border border-border rounded-lg px-3 py-2.5 resize-y focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60 placeholder:text-muted"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      </div>

      <Dialog open={pauseOpen} onOpenChange={setPauseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a pause</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-secondary mb-3">Host will see your request and can approve or deny it.</p>
          <textarea
            value={pauseReason}
            onChange={e => setPauseReason(e.target.value)}
            placeholder="Reason (optional)"
            className="w-full min-h-[80px] text-sm bg-page border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 mb-4"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setPauseOpen(false)} className="h-9 px-4 rounded-lg text-sm border border-border text-secondary hover:bg-page transition-colors">Cancel</button>
            <button onClick={handlePauseRequest} className="h-9 px-4 rounded-lg text-sm bg-accent text-white hover:bg-blue-700 transition-colors">Send request</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
