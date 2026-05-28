'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AppState, ContestantId, Phase, Reminder } from '@/lib/types'
import { formatClockTime } from '@/lib/utils'
import { getPusherClient, PUSHER_CHANNEL } from '@/lib/pusher-client'
import TimerCard from './TimerCard'
import PhaseChecklist from './PhaseChecklist'
import RemindersPanel from './RemindersPanel'
import PauseRequestsPanel from './PauseRequestsPanel'
import SharedInfoPanel from './SharedInfoPanel'

function playBeep() {
  try {
    const ctx = new AudioContext()
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    const o1 = ctx.createOscillator(); o1.frequency.value = 880; o1.connect(gain); o1.start(); o1.stop(ctx.currentTime + 0.3)
    const o2 = ctx.createOscillator(); o2.frequency.value = 1320; o2.connect(gain); o2.start(ctx.currentTime + 0.3); o2.stop(ctx.currentTime + 0.6)
  } catch { /* no audio */ }
}

interface Toast { id: string; text: string }

export default function HostDashboard({ initialState }: { initialState: AppState }) {
  const [state, setState] = useState<AppState>(initialState)
  const [clock, setClock] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [resetConfirm, setResetConfirm] = useState(0)
  const reminderLastFired = useRef<Map<string, number>>(new Map())
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setClock(formatClockTime(new Date()))
    const iv = setInterval(() => setClock(formatClockTime(new Date())), 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    const client = getPusherClient()
    if (!client) return
    const channel = client.subscribe(PUSHER_CHANNEL)
    channel.bind('timer-update', (data: { id: ContestantId; timer: AppState['timers']['vibe'] }) => {
      setState(prev => ({ ...prev, timers: { ...prev.timers, [data.id]: data.timer } }))
    })
    channel.bind('pause-request', () => {
      fetch('/api/state').then(r => r.json()).then(setState)
    })
    return () => { channel.unbind_all(); client.unsubscribe(PUSHER_CHANNEL) }
  }, [])

  // Reminder check every 15s
  useEffect(() => {
    function triggerReminder(text: string, broadcast?: boolean) {
      playBeep()
      const id = `t-${Date.now()}`
      setToasts(prev => [...prev, { id, text }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 30000)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('3 Builders', { body: text })
      }
      if (broadcast) {
        fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, target: 'all', durationMs: 60000 }),
        })
      }
    }

    function check() {
      const now = new Date()
      const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`

      setState(prev => {
        let changed = false
        const reminders = prev.reminders.map(r => {
          if (r.repeatMinutes) {
            const last = reminderLastFired.current.get(r.id) ?? 0
            const minsSince = (Date.now() - last) / 60000
            if (r.time === hhmm && minsSince >= r.repeatMinutes - 0.4) {
              if (r.repeatUntil && hhmm > r.repeatUntil) return r
              reminderLastFired.current.set(r.id, Date.now())
              triggerReminder(r.text, r.broadcastToContestants)
              changed = true
            }
            return r
          }
          if (!r.fired && r.time === hhmm) {
            triggerReminder(r.text, r.broadcastToContestants)
            changed = true
            return { ...r, fired: true }
          }
          return r
        })
        if (changed) {
          fetch('/api/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reminders }) })
          return { ...prev, reminders }
        }
        return prev
      })
    }

    const iv = setInterval(check, 15000)
    return () => clearInterval(iv)
  }, [])

  const saveState = useCallback((patch: Partial<AppState>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch('/api/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
    }, 500)
  }, [])

  function updatePhases(phases: Phase[]) {
    setState(prev => ({ ...prev, phases }))
    saveState({ phases })
  }

  function updateSharedInfo(sharedInfo: string) {
    setState(prev => ({ ...prev, sharedInfo }))
    saveState({ sharedInfo })
  }

  async function toggleTimer(id: ContestantId) {
    const res = await fetch(`/api/timers/${id}/toggle`, { method: 'POST' })
    const timer = await res.json()
    setState(prev => ({ ...prev, timers: { ...prev.timers, [id]: timer } }))
  }

  async function resetTimer(id: ContestantId) {
    const res = await fetch(`/api/timers/${id}/reset`, { method: 'POST' })
    const timer = await res.json()
    setState(prev => ({ ...prev, timers: { ...prev.timers, [id]: timer } }))
  }

  async function ackPauseRequest(requestId: string, action: 'approved' | 'denied') {
    await fetch(`/api/pause-requests/${requestId}/ack`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }),
    })
    const res = await fetch('/api/state')
    setState(await res.json())
  }

  async function addReminder(r: Omit<Reminder, 'id' | 'fired'>) {
    const res = await fetch('/api/reminders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r) })
    const reminder = await res.json()
    setState(prev => ({ ...prev, reminders: [...prev.reminders, reminder] }))
  }

  async function deleteReminder(id: string) {
    await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
    setState(prev => ({ ...prev, reminders: prev.reminders.filter(r => r.id !== id) }))
  }

  async function handleReset() {
    if (resetConfirm < 1) {
      setResetConfirm(1)
      setTimeout(() => setResetConfirm(0), 3000)
      return
    }
    setResetConfirm(0)
    const res = await fetch('/api/state/reset', { method: 'POST' })
    setState(await res.json())
  }

  const CONTESTANTS: ContestantId[] = ['vibe', 'junior', 'senior']
  const pendingRequests = state.pauseRequests.filter(r => r.status === 'pending')

  return (
    <div className="min-h-screen bg-page">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs">
        {toasts.map(toast => (
          <div key={toast.id} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white border border-border shadow-card-hover text-sm text-primary">
            <span className="flex-1">{toast.text}</span>
            <button onClick={() => setToasts(p => p.filter(t => t.id !== toast.id))} className="text-muted hover:text-primary text-base leading-none ml-1">×</button>
          </div>
        ))}
      </div>

      <div className="max-w-[1440px] mx-auto px-4 py-5 md:px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <h1 className="font-display text-3xl text-primary leading-tight">3 Builders</h1>
            <p className="text-sm text-secondary mt-0.5">Shoot Day — Friday, 29 May 2026</p>
          </div>
          <div className="font-display text-2xl text-primary tabular-nums">{clock}</div>
        </div>

        {/* Timers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {CONTESTANTS.map(id => (
            <TimerCard
              key={id}
              id={id}
              timer={state.timers[id]}
              pendingRequest={pendingRequests.find(r => r.contestant === id)}
              onToggle={() => toggleTimer(id)}
              onReset={() => resetTimer(id)}
              onAck={ackPauseRequest}
            />
          ))}
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          {/* Phases */}
          <div className="bg-surface rounded-xl border border-border shadow-card p-5">
            <PhaseChecklist phases={state.phases} onUpdatePhases={updatePhases} />
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-3">
            <div className="bg-surface rounded-xl border border-border shadow-card p-4">
              <RemindersPanel reminders={state.reminders} onAdd={addReminder} onDelete={deleteReminder} onMarkFired={() => {}} />
            </div>

            <div className="bg-surface rounded-xl border border-border shadow-card p-4">
              <PauseRequestsPanel requests={state.pauseRequests} onAck={ackPauseRequest} />
            </div>

            <div className="bg-surface rounded-xl border border-border shadow-card p-4">
              <SharedInfoPanel value={state.sharedInfo ?? ''} onChange={updateSharedInfo} />
            </div>

            <div className="bg-surface rounded-xl border border-border shadow-card p-4">
              <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3">Danger Zone</h3>
              <button
                onClick={handleReset}
                className={resetConfirm === 0
                  ? 'w-full h-8 text-xs rounded-lg border border-border text-muted hover:text-danger hover:border-danger/30 transition-colors'
                  : 'w-full h-8 text-xs rounded-lg border border-danger/50 bg-danger-bg text-danger font-medium'
                }
              >
                {resetConfirm === 0 ? 'Reset everything' : 'Click again — wipes all state'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
