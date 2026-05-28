'use client'

import { useState } from 'react'
import { Reminder } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Props {
  reminders: Reminder[]
  onAdd: (r: Omit<Reminder, 'id' | 'fired'>) => void
  onDelete: (id: string) => void
  onMarkFired: (id: string) => void
}

export default function RemindersPanel({ reminders, onAdd, onDelete }: Props) {
  const [text, setText] = useState('')
  const [time, setTime] = useState('')
  const [repeat, setRepeat] = useState(false)
  const [repeatMin, setRepeatMin] = useState(30)
  const [repeatUntil, setRepeatUntil] = useState('')
  const [broadcast, setBroadcast] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const sorted = [...reminders].sort((a, b) => a.time.localeCompare(b.time))

  function handleAdd() {
    if (!text.trim() || !time) return
    onAdd({
      text: text.trim(),
      time,
      repeatMinutes: repeat ? repeatMin : undefined,
      repeatUntil: repeat && repeatUntil ? repeatUntil : undefined,
      broadcastToContestants: broadcast,
    })
    setText(''); setTime(''); setRepeat(false); setBroadcast(false); setShowAdd(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">Reminders</h3>
        <button onClick={() => setShowAdd(s => !s)} className="text-xs text-accent hover:underline">
          {showAdd ? 'Cancel' : '+ Add'}
        </button>
      </div>

      <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
        {sorted.map(r => (
          <div key={r.id} className={cn('flex items-start gap-2 py-1.5 group', r.fired && 'opacity-40')}>
            <span className="font-mono text-xs text-muted w-10 flex-shrink-0 pt-px">{r.time}</span>
            <span className="flex-1 text-xs text-primary leading-relaxed">{r.text}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {r.repeatMinutes && <Badge variant="outline" className="text-[10px] px-1 py-0">↺{r.repeatMinutes}m</Badge>}
              {r.broadcastToContestants && <Badge variant="secondary" className="text-[10px] px-1 py-0">all</Badge>}
              {r.fired && <Badge variant="success" className="text-[10px] px-1 py-0">fired</Badge>}
              <button onClick={() => onDelete(r.id)} className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger text-sm leading-none transition-all">×</button>
            </div>
          </div>
        ))}
        {sorted.length === 0 && <p className="text-muted text-xs text-center py-3">No reminders</p>}
      </div>

      {showAdd && (
        <div className="mt-3 pt-3 border-t border-border flex flex-col gap-2">
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Reminder text…" className="h-8 w-full rounded-md border border-border bg-page px-3 text-xs text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent/30" />
          <div className="flex gap-2">
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="h-8 flex-1 rounded-md border border-border bg-page px-2 text-xs font-mono text-primary focus:outline-none focus:ring-1 focus:ring-accent/30" />
            <label className="flex items-center gap-1 text-xs text-secondary cursor-pointer">
              <input type="checkbox" checked={broadcast} onChange={e => setBroadcast(e.target.checked)} className="w-3.5 h-3.5" />
              Broadcast
            </label>
          </div>
          <label className="flex items-center gap-2 text-xs text-secondary cursor-pointer flex-wrap">
            <input type="checkbox" checked={repeat} onChange={e => setRepeat(e.target.checked)} className="w-3.5 h-3.5" />
            Repeat every
            <input type="number" value={repeatMin} onChange={e => setRepeatMin(Number(e.target.value))} disabled={!repeat} className="h-6 w-12 rounded border border-border bg-page text-center text-xs font-mono focus:outline-none" min={1} />
            min until
            <input type="time" value={repeatUntil} onChange={e => setRepeatUntil(e.target.value)} disabled={!repeat} className="h-6 rounded border border-border bg-page px-1 text-xs font-mono focus:outline-none" />
          </label>
          <button onClick={handleAdd} disabled={!text.trim() || !time} className="h-8 rounded-md bg-accent text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors">
            Add reminder
          </button>
        </div>
      )}
    </div>
  )
}
