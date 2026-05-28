'use client'

import { useState } from 'react'
import { PauseRequest } from '@/lib/types'
import { cn } from '@/lib/utils'

const LABELS: Record<string, string> = {
  vibe: 'Vibe Coder', junior: 'Junior Dev', senior: 'Senior Dev',
}
const COLORS: Record<string, string> = {
  vibe: 'text-vibe', junior: 'text-junior', senior: 'text-senior',
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
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">
          Pause Requests
          {pending.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-danger text-white text-[10px]">
              {pending.length}
            </span>
          )}
        </h3>
      </div>

      {pending.length === 0 && (
        <p className="text-muted text-xs text-center py-2">No pending requests</p>
      )}

      <div className="flex flex-col gap-2">
        {pending.map(r => (
          <div key={r.id} className="rounded-lg border border-danger/20 bg-danger-bg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className={cn('text-xs font-semibold', COLORS[r.contestant])}>{LABELS[r.contestant]}</span>
              <span className="text-[10px] text-muted font-mono">
                {new Date(r.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
            </div>
            {r.reason && <p className="text-xs text-secondary italic mb-2">"{r.reason}"</p>}
            <div className="flex gap-2">
              <button onClick={() => onAck(r.id, 'denied')} className="flex-1 h-7 rounded text-xs border border-border bg-surface text-secondary hover:text-danger hover:border-danger/30 transition-colors">Deny</button>
              <button onClick={() => onAck(r.id, 'approved')} className="flex-1 h-7 rounded text-xs bg-success text-white hover:bg-green-700 transition-colors">Approve & Pause</button>
            </div>
          </div>
        ))}
      </div>

      {handled.length > 0 && (
        <button onClick={() => setShowHistory(h => !h)} className="mt-2 text-xs text-muted hover:text-secondary">
          {showHistory ? '▼' : '▶'} History ({handled.length})
        </button>
      )}

      {showHistory && (
        <div className="mt-2 flex flex-col gap-1">
          {handled.map(r => (
            <div key={r.id} className="flex items-center gap-2 text-xs py-1 opacity-60">
              <span className={cn('font-medium', COLORS[r.contestant])}>{LABELS[r.contestant]}</span>
              <span className={r.status === 'approved' ? 'text-success' : 'text-danger'}>{r.status}</span>
              {r.reason && <span className="text-muted truncate">"{r.reason}"</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
