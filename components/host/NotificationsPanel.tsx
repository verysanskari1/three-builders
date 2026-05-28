'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { Notification, ContestantId } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const TARGETS: { value: 'all' | ContestantId; label: string }[] = [
  { value: 'all', label: 'All contestants' },
  { value: 'vibe', label: 'Vibe Coder' },
  { value: 'junior', label: 'Junior Dev' },
  { value: 'senior', label: 'Senior Dev' },
]

interface Props {
  notifications: Notification[]
  onSend: (target: 'all' | ContestantId, text: string, durationMs: number) => void
}

export default function NotificationsPanel({ notifications, onSend }: Props) {
  const [target, setTarget] = useState<'all' | ContestantId>('all')
  const [text, setText] = useState('')
  const [duration, setDuration] = useState(30)

  function handleSend() {
    if (!text.trim()) return
    onSend(target, text.trim(), duration * 1000)
    setText('')
  }

  const recent = notifications.slice(0, 10)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <Send size={14} className="text-junior" />
        <span className="font-mono text-xs text-white/60 uppercase tracking-wider">Broadcast to contestants</span>
      </div>

      <div className="flex flex-col gap-2">
        <select
          value={target}
          onChange={e => setTarget(e.target.value as typeof target)}
          className="h-8 rounded-md border border-white/10 bg-elevated px-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {TARGETS.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Message text…"
          className="h-8 text-xs"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">Duration:</span>
          <Input
            type="number"
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            className="h-7 w-16 text-xs text-center"
            min={5}
            max={300}
          />
          <span className="text-xs text-white/40">sec</span>
          <Button size="sm" onClick={handleSend} disabled={!text.trim()} className="ml-auto h-7 text-xs">
            <Send size={12} className="mr-1" />
            Send
          </Button>
        </div>
      </div>

      {recent.length > 0 && (
        <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
          <span className="text-xs text-white/30">Recent</span>
          {recent.map(n => (
            <div key={n.id} className="flex items-start gap-2 text-xs px-2 py-1.5 rounded bg-elevated border border-white/5">
              <span className="font-mono text-white/30 flex-shrink-0">
                {new Date(n.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
              <span className="text-white/50 flex-shrink-0">[{n.target}]</span>
              <span className="text-white/80 flex-1 truncate">{n.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
