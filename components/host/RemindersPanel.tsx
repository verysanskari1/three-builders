'use client'

import { useState } from 'react'
import { X, Plus, Bell } from 'lucide-react'
import { Reminder } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

  const sorted = [...reminders].sort((a, b) => a.time.localeCompare(b.time))

  function handleAdd() {
    if (!text.trim() || !time) return
    onAdd({
      text: text.trim(),
      time,
      repeatMinutes: repeat ? repeatMin : undefined,
      repeatUntil: repeat ? repeatUntil || undefined : undefined,
      broadcastToContestants: broadcast,
    })
    setText('')
    setTime('')
    setRepeat(false)
    setBroadcast(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <Bell size={14} className="text-warning" />
        <span className="font-mono text-xs text-white/60 uppercase tracking-wider">Reminders</span>
      </div>

      <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
        {sorted.map(r => (
          <div
            key={r.id}
            className={cn(
              'flex items-start gap-2 px-3 py-2 rounded-lg bg-elevated border border-white/5 text-sm group',
              r.fired && 'opacity-50'
            )}
          >
            <span className="font-mono text-xs text-accent/80 flex-shrink-0 mt-0.5 w-10">
              {r.time}
            </span>
            <span className="flex-1 text-white/80 text-xs leading-relaxed">{r.text}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {r.repeatMinutes && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  ↺{r.repeatMinutes}m
                </Badge>
              )}
              {r.broadcastToContestants && (
                <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                  📢
                </Badge>
              )}
              {r.fired && (
                <Badge variant="success" className="text-[10px] px-1.5 py-0">
                  fired
                </Badge>
              )}
              <button
                onClick={() => onDelete(r.id)}
                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-danger transition-all"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="text-white/30 text-xs text-center py-4">No reminders</p>
        )}
      </div>

      {/* Add form */}
      <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Reminder text…"
          className="h-7 text-xs"
        />
        <div className="flex gap-2">
          <Input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="h-7 text-xs flex-1 font-mono"
          />
          <label className="flex items-center gap-1.5 text-xs text-white/50 cursor-pointer">
            <input
              type="checkbox"
              checked={broadcast}
              onChange={e => setBroadcast(e.target.checked)}
              className="accent-warning"
            />
            📢
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer">
          <input
            type="checkbox"
            checked={repeat}
            onChange={e => setRepeat(e.target.checked)}
            className="accent-accent"
          />
          Repeat every
          <Input
            type="number"
            value={repeatMin}
            onChange={e => setRepeatMin(Number(e.target.value))}
            disabled={!repeat}
            className="h-6 w-14 text-xs text-center"
            min={1}
          />
          min until
          <Input
            type="time"
            value={repeatUntil}
            onChange={e => setRepeatUntil(e.target.value)}
            disabled={!repeat}
            className="h-6 text-xs font-mono"
          />
        </label>
        <Button size="sm" onClick={handleAdd} disabled={!text.trim() || !time} className="h-7 text-xs">
          <Plus size={12} className="mr-1" />
          Add reminder
        </Button>
      </div>
    </div>
  )
}
