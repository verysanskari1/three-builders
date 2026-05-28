'use client'

import { useState } from 'react'
import { PauseRequest } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const LABELS: Record<string, { label: string; color: string }> = {
  vibe: { label: 'Vibe Coder', color: 'text-vibe' },
  junior: { label: 'Junior Dev', color: 'text-junior' },
  senior: { label: 'Senior Dev', color: 'text-senior' },
}

interface Props {
  requests: PauseRequest[]
  onAck: (id: string, action: 'approved' | 'denied') => void
}

export default function PauseRequestsPanel({ requests, onAck }: Props) {
  const [showHistory, setShowHistory] = useState(false)
  const pending = requests.filter(r => r.status === 'pending')
  const handled = requests.filter(r => r.status !== 'pending')

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-danger text-sm">⏸</span>
        <span className="font-mono text-xs text-white/60 uppercase tracking-wider">Pause Requests</span>
        {pending.length > 0 && (
          <span className="w-5 h-5 rounded-full bg-danger flex items-center justify-center text-white text-[10px] font-bold">
            {pending.length}
          </span>
        )}
      </div>

      {pending.length === 0 && (
        <p className="text-white/30 text-xs text-center py-2">No pending requests</p>
      )}

      <div className="flex flex-col gap-2">
        {pending.map(r => {
          const col = LABELS[r.contestant]
          return (
            <div key={r.id} className="rounded-lg bg-danger/10 border border-danger/30 p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className={cn('font-mono text-xs font-semibold', col.color)}>
                  {col.label}
                </span>
                <span className="text-white/30 text-xs font-mono">
                  {new Date(r.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </div>
              {r.reason && (
                <p className="text-white/70 text-xs italic">"{r.reason}"</p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-7 text-xs text-danger border-danger/30 hover:bg-danger/10"
                  onClick={() => onAck(r.id, 'denied')}
                >
                  Deny
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-7 text-xs text-done border-done/30 hover:bg-done/10"
                  onClick={() => onAck(r.id, 'approved')}
                >
                  Approve & Pause
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {handled.length > 0 && (
        <button
          onClick={() => setShowHistory(h => !h)}
          className="text-xs text-white/30 hover:text-white/50 text-left"
        >
          {showHistory ? '▼' : '▶'} History ({handled.length})
        </button>
      )}

      {showHistory && (
        <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
          {handled.map(r => {
            const col = LABELS[r.contestant]
            return (
              <div key={r.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-elevated border border-white/5 text-xs opacity-60">
                <span className={cn('font-mono', col.color)}>{col.label}</span>
                <span className={r.status === 'approved' ? 'text-done' : 'text-danger'}>
                  {r.status}
                </span>
                {r.reason && <span className="text-white/40 truncate flex-1">"{r.reason}"</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
