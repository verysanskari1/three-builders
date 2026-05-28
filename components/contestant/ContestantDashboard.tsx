'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AppState, ContestantId, ContestantTask, Notification } from '@/lib/types'
import { formatDuration, formatClockTime, getElapsed, getTimerStatus, getPhaseInfo } from '@/lib/utils'
import { getPusherClient, PUSHER_CHANNEL } from '@/lib/pusher-client'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const CONFIG: Record<ContestantId, { label: string; color: string; border: string }> = {
  vibe:   { label: 'Vibe Coder',  color: 'text-vibe',   border: 'border-t-vibe' },
  junior: { label: 'Junior Dev',   color: 'text-junior', border: 'border-t-junior' },
  senior: { label: 'Senior Dev',   color: 'text-senior', border: 'border-t-senior' },
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
  const [timerDisplay, setTimerDisplay] = useState('00:00:00')
  const [phase, setPhase] = useState(getPhaseInfo(getElapsed(initialState.timers[id])))
  const [toasts, setToasts] = useState<Toast[]>([])
  const [pauseOpen, setPauseOpen] = useState(false)
  const [pauseReason, setPauseReason] = useState('')
  const [pauseStatus, setPauseStatus] = useState<'idle' | 'pending' | 'approved' | 'denied'>('idle')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [notes, setNotes] = useState(initialState.contestantNotes[id] || '')
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const taskTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const col = CONFIG[id]

  useEffect(() => {
    setClock(formatClockTime(new Date()))
    const iv = setInterval(() => setClock(formatClockTime(new Date())), 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const iv = setInterval(() => {
      const elapsed = getElapsed(state.timers[id])
      setTimerDisplay(formatDuration(elapsed))
      setPhase(getPhaseInfo(elapsed))
    }, 100)
    return () => clearInterval(iv)
  }, [state.timers, id])

  useEffect(() => {
    const client = getPusherClient()
    if (!client) return
    const channel = client.subscribe(PUSHER_CHANNEL)

    channel.bind('timer-update', (data: { id: ContestantId; timer: AppState['timers']['vibe'] }) => {
      if (data.id === id) setState(prev => ({ ...prev, timers: { ...prev.timers, [id]: data.timer } }))
    })

    channel.bind('notification', (notif: Notification) => {
      if (notif.target === 'all' || notif.target === id) {
        const isWarning = /ending in|phase \d ending|20 mins|5 minutes/i.test(notif.text)
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
        if (data.action === 'approved') {
          setState(prev => ({ ...prev, timers: { ...prev.timers, [id]: { ...prev.timers[id], running: false, startedAt: null } } }))
        }
        setTimeout(() => setPauseStatus('idle'), 8000)
      }
    })

    channel.bind('state-update', () => {
      fetch('/api/state').then(r => r.json()).then((data: AppState) => {
        setState(data)
        setNotes(data.contestantNotes[id] || '')
      })
    })

    return () => { channel.unbind_all(); client.unsubscribe(PUSHER_CHANNEL) }
  }, [id, pendingId])

  // 5-second polling fallback
  useEffect(() => {
    const iv = setInterval(async () => {
      const data: AppState = await fetch('/api/state').then(r => r.json())
      setState(data)
      setNotes(data.contestantNotes[id] || '')
    }, 5000)
    return () => clearInterval(iv)
  }, [id])

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
      })
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
      })
    }, 500)
  }

  const timer = state.timers[id]
  const status = getTimerStatus(timer)
  const tasks: ContestantTask[] = state.contestantChecklists[id] || []
  const done = tasks.filter(t => t.done).length

  return (
    <div className="min-h-screen bg-page">
      {/* Notification banners */}
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className={cn('font-display text-2xl font-semibold', col.color)}>{col.label}</h1>
          <div className="font-display text-xl text-secondary tabular-nums">{clock}</div>
        </div>

        {/* Timer block */}
        <div className={cn('bg-surface rounded-2xl border border-t-4 border-border shadow-card p-8 text-center mb-6', col.border)}>
          <div className="font-display text-7xl md:text-8xl text-primary tabular-nums tracking-tight mb-3">
            {timerDisplay}
          </div>

          <div className={cn(
            'inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full mb-4',
            status === 'running' ? 'bg-success-bg text-success' : status === 'paused' ? 'bg-warning-bg text-warning' : 'bg-page text-muted border border-border'
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full', status === 'running' ? 'bg-success' : status === 'paused' ? 'bg-warning' : 'bg-muted')} />
            {status === 'running' ? 'Running' : status === 'paused' ? 'Paused' : 'Stopped'}
          </div>

          {phase.name !== 'Done' && (
            <div className="w-full max-w-xs mx-auto mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-secondary">{phase.name}</span>
                <span className="text-muted tabular-nums">{formatDuration(phase.remaining)} left</span>
              </div>
              <div className="h-1.5 bg-page rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', col.border.replace('border-t-', 'bg-'))}
                  style={{ width: `${Math.min(phase.progress * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
          {phase.name === 'Done' && (
            <div className="text-sm text-success font-medium mb-4">All phases complete!</div>
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
            onClick={() => { if (pauseStatus !== 'idle' && pauseStatus !== 'pending') { setPauseStatus('idle') } else if (pauseStatus === 'idle') setPauseOpen(true) }}
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

        {/* Two columns */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Recording checklist */}
          <div className="bg-surface rounded-xl border border-border shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-secondary uppercase tracking-wider">Recording checklist</h2>
              <span className="text-xs text-muted font-mono">{done}/{tasks.length}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {tasks.map(task => (
                <label key={task.id} className={cn('flex items-start gap-2.5 px-1 py-1.5 rounded cursor-pointer hover:bg-page transition-colors', task.done && 'opacity-50')}>
                  <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} className="mt-0.5" />
                  <span className={cn('text-sm text-primary leading-snug', task.done && 'line-through text-muted')}>{task.text}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {/* Shared info from host */}
            {state.sharedInfo && (
              <div className="bg-surface rounded-xl border border-border shadow-card p-4">
                <h2 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">From host</h2>
                <pre className="text-xs font-mono text-primary whitespace-pre-wrap leading-relaxed">{state.sharedInfo}</pre>
              </div>
            )}

            {/* Private notes */}
            <div className="bg-surface rounded-xl border border-border shadow-card p-4">
              <h2 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Your notes</h2>
              <textarea
                value={notes}
                onChange={e => { setNotes(e.target.value); saveNote(e.target.value) }}
                onBlur={() => saveNote(notes)}
                placeholder="Passwords, logins, API keys, links…"
                className="w-full min-h-[140px] text-xs font-mono text-primary bg-page border border-border rounded-lg px-3 py-2.5 resize-y focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60 placeholder:text-muted"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pause dialog */}
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
