'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AppState, ContestantId, Phase, PMRole, Reminder } from '@/lib/types'
import { formatClockTime } from '@/lib/utils'
import { getPusherClient, PUSHER_CHANNEL } from '@/lib/pusher-client'
import TimerCard from './TimerCard'
import PhaseChecklist from './PhaseChecklist'
import RemindersPanel from './RemindersPanel'
import PMRolesPanel from './PMRolesPanel'
import NotificationsPanel from './NotificationsPanel'
import PauseRequestsPanel from './PauseRequestsPanel'
import { Button } from '@/components/ui/button'

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()
    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)
    osc1.frequency.value = 880
    osc2.frequency.value = 1320
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.25)
    osc2.start(ctx.currentTime + 0.25)
    osc2.stop(ctx.currentTime + 0.5)
  } catch {
    // audio not available
  }
}

interface Toast {
  id: string
  text: string
  type: 'reminder' | 'pause'
}

interface Props {
  initialState: AppState
}

export default function HostDashboard({ initialState }: Props) {
  const [state, setState] = useState<AppState>(initialState)
  const [clock, setClock] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [resetConfirm, setResetConfirm] = useState(0)
  const reminderLastFired = useRef<Map<string, number>>(new Map())

  // clock
  useEffect(() => {
    setClock(formatClockTime(new Date()))
    const iv = setInterval(() => setClock(formatClockTime(new Date())), 1000)
    return () => clearInterval(iv)
  }, [])

  // request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Pusher subscriptions
  useEffect(() => {
    const client = getPusherClient()
    const channel = client.subscribe(PUSHER_CHANNEL)

    channel.bind('timer-update', (data: { id: ContestantId; timer: AppState['timers']['vibe'] }) => {
      setState(prev => ({
        ...prev,
        timers: { ...prev.timers, [data.id]: data.timer },
      }))
    })

    channel.bind('pause-request', () => {
      // refresh state from server to get the latest pause request
      fetch('/api/state').then(r => r.json()).then(setState)
    })

    return () => {
      channel.unbind_all()
      client.unsubscribe(PUSHER_CHANNEL)
    }
  }, [])

  // Reminder firing logic (runs every 15s on host)
  useEffect(() => {
    function checkReminders() {
      const now = new Date()
      const nowHHMM = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }).substring(0, 5)

      setState(prev => {
        let changed = false
        const nextReminders = prev.reminders.map(r => {
          if (r.fired && !r.repeatMinutes) return r

          // Check if time matches (HH:MM)
          const matches = nowHHMM === r.time

          // For repeating reminders, check repeat window
          if (r.repeatMinutes && !r.fired) {
            // Only trigger once per minute window
            const lastFired = reminderLastFired.current.get(r.id) ?? 0
            const minutesSinceFired = (Date.now() - lastFired) / 60000
            if (matches && minutesSinceFired >= r.repeatMinutes - 0.5) {
              reminderLastFired.current.set(r.id, Date.now())
              triggerReminder(r.text, r.broadcastToContestants)
              changed = true
              // Don't mark as fired for repeating ones
              return r
            }
            return r
          }

          if (!r.fired && matches) {
            triggerReminder(r.text, r.broadcastToContestants)
            changed = true
            return { ...r, fired: true }
          }
          return r
        })

        if (changed) {
          // Persist fired state
          fetch('/api/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reminders: nextReminders }),
          })
          return { ...prev, reminders: nextReminders }
        }
        return prev
      })
    }

    function triggerReminder(text: string, broadcast?: boolean) {
      playBeep()
      setToasts(prev => [
        ...prev,
        { id: `toast-${Date.now()}`, text, type: 'reminder' },
      ])
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('3 Builders Reminder', { body: text })
      }
      if (broadcast) {
        fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, target: 'all', durationMs: 60000 }),
        })
      }
    }

    const iv = setInterval(checkReminders, 15000)
    return () => clearInterval(iv)
  }, [])

  function dismissToast(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  // Save phases with debounce
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveState = useCallback((patch: Partial<AppState>) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
    }, 500)
  }, [])

  function updatePhases(phases: Phase[]) {
    setState(prev => ({ ...prev, phases }))
    saveState({ phases })
  }

  function updatePMRoles(pmRoles: PMRole[]) {
    setState(prev => ({ ...prev, pmRoles }))
    saveState({ pmRoles })
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const res = await fetch('/api/state')
    setState(await res.json())
  }

  async function addReminder(r: Omit<Reminder, 'id' | 'fired'>) {
    const res = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(r),
    })
    const reminder = await res.json()
    setState(prev => ({ ...prev, reminders: [...prev.reminders, reminder] }))
  }

  async function deleteReminder(id: string) {
    await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
    setState(prev => ({ ...prev, reminders: prev.reminders.filter(r => r.id !== id) }))
  }

  async function sendNotification(target: 'all' | ContestantId, text: string, durationMs: number) {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, text, durationMs }),
    })
    const n = await res.json()
    setState(prev => ({ ...prev, notifications: [n, ...prev.notifications] }))
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

  const pendingRequests = state.pauseRequests.filter(r => r.status === 'pending')

  const CONTESTANTS: ContestantId[] = ['vibe', 'junior', 'senior']

  return (
    <div className="min-h-screen">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="flex items-start gap-3 px-4 py-3 rounded-lg bg-danger border border-danger/60 text-white shadow-xl"
          >
            <span className="text-lg">🔔</span>
            <span className="flex-1 text-sm">{toast.text}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-white/60 hover:text-white text-xs"
            >
              Got it
            </button>
          </div>
        ))}
      </div>

      <div className="max-w-[1600px] mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-white">
              3 Builders / shoot day
            </h1>
            <p className="font-mono text-sm text-accent/60 mt-1">Friday, 29 May 2026</p>
          </div>
          <div className="font-mono text-2xl md:text-3xl text-white/80 tabular-nums">
            {clock}
          </div>
        </div>

        {/* Timer cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {CONTESTANTS.map(id => (
            <TimerCard
              key={id}
              id={id}
              timer={state.timers[id]}
              pendingRequest={pendingRequests.find(r => r.contestant === id)}
              onToggle={() => toggleTimer(id)}
              onReset={() => resetTimer(id)}
              onAck={(reqId, action) => ackPauseRequest(reqId, action)}
            />
          ))}
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Phases checklist */}
          <div className="rounded-xl border border-white/8 bg-elevated p-5">
            <PhaseChecklist
              phases={state.phases}
              onUpdatePhases={updatePhases}
            />
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-4">
            {/* Reminders */}
            <div className="rounded-xl border border-white/8 bg-elevated p-4">
              <RemindersPanel
                reminders={state.reminders}
                onAdd={addReminder}
                onDelete={deleteReminder}
                onMarkFired={() => {}}
              />
            </div>

            {/* PM Roles */}
            <div className="rounded-xl border border-white/8 bg-elevated p-4">
              <PMRolesPanel
                roles={state.pmRoles}
                onUpdate={updatePMRoles}
              />
            </div>

            {/* Notifications out */}
            <div className="rounded-xl border border-white/8 bg-elevated p-4">
              <NotificationsPanel
                notifications={state.notifications}
                onSend={sendNotification}
              />
            </div>

            {/* Pause requests */}
            <div className="rounded-xl border border-white/8 bg-elevated p-4">
              <PauseRequestsPanel
                requests={state.pauseRequests}
                onAck={ackPauseRequest}
              />
            </div>

            {/* Legend + Danger Zone */}
            <div className="rounded-xl border border-white/8 bg-elevated p-4 flex flex-col gap-4">
              <div>
                <p className="font-mono text-xs text-white/40 uppercase tracking-wider mb-2">Owner legend</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="font-mono text-[11px] px-2 py-1 rounded bg-[#1d3a5c] text-[#93c5fd]">K = Kanishkar</span>
                  <span className="font-mono text-[11px] px-2 py-1 rounded bg-[#5c1d3a] text-[#fda4c4]">S = Sanskar</span>
                  <span className="font-mono text-[11px] px-2 py-1 rounded bg-[#4a3a10] text-[#fde047]">B = Shared</span>
                </div>
              </div>
              <div className="border-t border-white/5 pt-3">
                <p className="font-mono text-xs text-danger/60 uppercase tracking-wider mb-2">Danger zone</p>
                <button
                  onClick={handleReset}
                  className={
                    resetConfirm === 0
                      ? 'w-full h-8 text-xs font-mono rounded border border-danger/20 text-danger/50 hover:bg-danger/10 hover:text-danger hover:border-danger/40 transition-colors'
                      : 'w-full h-8 text-xs font-mono rounded border border-danger bg-danger/20 text-danger animate-pulse'
                  }
                >
                  {resetConfirm === 0 ? 'Reset everything' : 'Click again to confirm — WIPES ALL STATE'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
