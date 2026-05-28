'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  AppState,
  ContestantId,
  Phase,
  PhaseId,
  PHASE_ORDER,
  PHASE_DURATIONS,
  PHASE_LABELS,
  ContestantTimers,
} from '@/lib/types'
import { formatClockTime, getElapsed } from '@/lib/utils'
import { getPusherClient, PUSHER_CHANNEL } from '@/lib/pusher-client'
import TimerCard from './TimerCard'
import PhaseChecklist from './PhaseChecklist'
import PauseRequestsPanel from './PauseRequestsPanel'
import SharedInfoPanel from './SharedInfoPanel'
import ChecklistManager from './ChecklistManager'

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

// Per-phase milestones — each fires when that phase's own timer crosses the mark.
type Milestone = { atMs: number; text: (label: string) => string }
const PHASE_MILESTONES: Record<PhaseId, Milestone[]> = {
  plan: [
    { atMs: 15 * 60 * 1000, text: () => 'Plan Phase: halfway through. 15 minutes left.' },
    { atMs: 25 * 60 * 1000, text: () => 'Plan Phase: 5 minutes left. Wrap up your plan.' },
    { atMs: 30 * 60 * 1000, text: () => 'Plan Phase complete. Move on to Build Phase 1.' },
  ],
  build1: [
    { atMs: 60 * 60 * 1000,  text: () => 'Build Phase 1: 1 hour in. Keep going.' },
    { atMs: 75 * 60 * 1000,  text: () => 'Build Phase 1: halfway through.' },
    { atMs: 120 * 60 * 1000, text: () => 'Build Phase 1: 30 minutes left.' },
    { atMs: 145 * 60 * 1000, text: () => 'Build Phase 1: 5 minutes left.' },
    { atMs: 150 * 60 * 1000, text: () => 'Build Phase 1 complete. Time for lunch / Build Phase 2.' },
  ],
  build2: [
    { atMs: 30 * 60 * 1000,  text: () => 'Build Phase 2: 30 minutes in. Final stretch.' },
    { atMs: 60 * 60 * 1000,  text: () => 'Build Phase 2: halfway through. 1 hour left.' },
    { atMs: 90 * 60 * 1000,  text: () => 'Build Phase 2: 30 minutes left. Start wrapping up.' },
    { atMs: 115 * 60 * 1000, text: () => 'Build Phase 2: 5 minutes left. Final push.' },
    { atMs: 120 * 60 * 1000, text: () => "Build Phase 2 complete. Time's up." },
  ],
}

const CONTESTANT_LABELS: Record<ContestantId, string> = {
  vibe: 'Vibe', junior: 'Junior', senior: 'Senior',
}

interface Toast { id: string; text: string }

export default function HostDashboard({ initialState }: { initialState: AppState }) {
  const [state, setState] = useState<AppState>(initialState)
  const [clock, setClock] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [resetConfirm, setResetConfirm] = useState(0)
  const milestoneFired = useRef<Map<string, boolean>>(new Map())
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
    channel.bind('timer-update', (data: { id: ContestantId; timers: ContestantTimers }) => {
      if (data?.timers) {
        setState(prev => ({ ...prev, timers: { ...prev.timers, [data.id]: data.timers } }))
      }
    })
    channel.bind('pause-request', () => {
      fetch('/api/state').then(r => r.json()).then(setState).catch(() => {})
    })
    return () => { channel.unbind_all(); client.unsubscribe(PUSHER_CHANNEL) }
  }, [])

  // 2-second polling fallback for pause requests and timer state.
  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const res = await fetch('/api/state')
        if (!res.ok) return
        const data: AppState = await res.json()
        setState(prev => ({
          ...prev,
          timers: data.timers,
          pauseRequests: data.pauseRequests,
        }))
      } catch { /* ignore */ }
    }, 2000)
    return () => clearInterval(iv)
  }, [])

  // Per-phase milestone check every 5s.
  useEffect(() => {
    function addToast(text: string) {
      playBeep()
      const id = `t-${Date.now()}-${Math.random()}`
      setToasts(prev => [...prev, { id, text }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 30000)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('3 Builders', { body: text })
      }
    }

    function check() {
      setState(prev => {
        const contestants: ContestantId[] = ['vibe', 'junior', 'senior']
        for (const cid of contestants) {
          const timers = prev.timers[cid]
          if (!timers) continue
          for (const phase of PHASE_ORDER) {
            const elapsed = getElapsed(timers[phase])
            for (const m of PHASE_MILESTONES[phase] || []) {
              const key = `${cid}-${phase}-${m.atMs}`
              if (elapsed >= m.atMs && !milestoneFired.current.get(key)) {
                milestoneFired.current.set(key, true)
                const msg = m.text(PHASE_LABELS[phase])
                addToast(`${CONTESTANT_LABELS[cid]}: ${msg}`)
                fetch('/api/notifications', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ text: msg, target: cid, durationMs: 90000 }),
                }).catch(() => {})
              }
            }
          }
        }
        return prev
      })
    }

    const iv = setInterval(check, 5000)
    return () => clearInterval(iv)
  }, [])

  const saveState = useCallback((patch: Partial<AppState>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch('/api/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).catch(() => {})
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

  function pushError(text: string) {
    const id = `err-${Date.now()}`
    setToasts(prev => [...prev, { id, text }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000)
  }

  async function toggleTimer(id: ContestantId, phase: PhaseId) {
    try {
      const res = await fetch(`/api/timers/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        pushError(`Timer error: ${err.error || res.status}`)
        return
      }
      const data = await res.json()
      setState(prev => ({ ...prev, timers: { ...prev.timers, [id]: data.timers } }))
    } catch {
      pushError('Network error toggling timer.')
    }
  }

  async function resetTimer(id: ContestantId, phase: PhaseId) {
    try {
      const res = await fetch(`/api/timers/${id}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase }),
      })
      if (!res.ok) return
      const data = await res.json()
      setState(prev => ({ ...prev, timers: { ...prev.timers, [id]: data.timers } }))
      // Clear milestone flags for this contestant+phase only.
      for (const m of PHASE_MILESTONES[phase] || []) {
        milestoneFired.current.delete(`${id}-${phase}-${m.atMs}`)
      }
    } catch { /* ignore */ }
  }

  async function ackPauseRequest(requestId: string, action: 'approved' | 'denied') {
    const res = await fetch(`/api/pause-requests/${requestId}/ack`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }),
    })
    if (!res.ok) return
    const data: AppState = await fetch('/api/state').then(r => r.json())
    setState(data)
  }

  async function addChecklistItem(text: string, phase?: PhaseId) {
    const res = await fetch('/api/checklist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', text, phase }),
    })
    if (!res.ok) return
    const data: AppState = await res.json()
    setState(data)
  }

  async function removeChecklistItem(baseId: string) {
    const res = await fetch('/api/checklist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', baseId }),
    })
    if (!res.ok) return
    const data: AppState = await res.json()
    setState(data)
  }

  async function handleReset() {
    if (resetConfirm < 1) {
      setResetConfirm(1)
      setTimeout(() => setResetConfirm(0), 3000)
      return
    }
    setResetConfirm(0)
    milestoneFired.current.clear()
    const res = await fetch('/api/state/reset', { method: 'POST' })
    setState(await res.json())
  }

  const CONTESTANTS: ContestantId[] = ['vibe', 'junior', 'senior']
  const pendingRequests = state.pauseRequests.filter(r => r.status === 'pending')

  return (
    <div className="min-h-screen bg-page">
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs">
        {toasts.map(toast => (
          <div key={toast.id} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white border border-border shadow-card-hover text-sm text-primary">
            <span className="flex-1">{toast.text}</span>
            <button onClick={() => setToasts(p => p.filter(t => t.id !== toast.id))} className="text-muted hover:text-primary text-base leading-none ml-1">×</button>
          </div>
        ))}
      </div>

      <div className="max-w-[1440px] mx-auto px-4 py-5 md:px-6">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h1 className="font-display text-3xl text-primary leading-tight">3 Builders</h1>
            <p className="text-sm text-secondary mt-0.5">Friday, 29 May 2026</p>
          </div>
          <div className="font-display text-2xl text-primary tabular-nums">{clock}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          {CONTESTANTS.map(id => (
            <TimerCard
              key={id}
              id={id}
              timers={state.timers[id]}
              pendingRequest={pendingRequests.find(r => r.contestant === id)}
              onToggle={phase => toggleTimer(id, phase)}
              onReset={phase => resetTimer(id, phase)}
              onAck={ackPauseRequest}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          <div className="bg-surface rounded-xl border border-border shadow-card p-5">
            <PhaseChecklist phases={state.phases} onUpdatePhases={updatePhases} />
          </div>

          <div className="flex flex-col gap-3">
            <div className="bg-surface rounded-xl border border-border shadow-card p-4">
              <PauseRequestsPanel requests={state.pauseRequests} onAck={ackPauseRequest} />
            </div>

            <div className="bg-surface rounded-xl border border-border shadow-card p-4">
              <SharedInfoPanel value={state.sharedInfo ?? ''} onChange={updateSharedInfo} />
            </div>

            <div className="bg-surface rounded-xl border border-border shadow-card p-4">
              <ChecklistManager
                items={state.contestantChecklists.vibe || []}
                onAdd={addChecklistItem}
                onRemove={removeChecklistItem}
              />
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
                {resetConfirm === 0 ? 'Reset all state' : 'Click again to wipe everything'}
              </button>
              <p className="text-[10px] text-muted mt-2">Wipes every timer, checklist, shared info, pause history.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
