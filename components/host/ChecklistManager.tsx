'use client'

import { useState } from 'react'
import { ContestantTask, PhaseId, PHASE_LABELS } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  items: ContestantTask[]
  onAdd: (text: string, phase?: PhaseId) => void
  onRemove: (baseId: string) => void
}

const PHASE_PILL: Record<PhaseId, string> = {
  plan:   'bg-vibe/10 text-vibe',
  build1: 'bg-junior/10 text-junior',
  build2: 'bg-senior/10 text-senior',
}

export default function ChecklistManager({ items, onAdd, onRemove }: Props) {
  const [newText, setNewText] = useState('')
  const [newPhase, setNewPhase] = useState<PhaseId | 'any'>('any')
  const [adding, setAdding] = useState(false)

  async function handleAdd() {
    const text = newText.trim()
    if (!text) return
    setAdding(true)
    await onAdd(text, newPhase === 'any' ? undefined : newPhase)
    setNewText('')
    setAdding(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">Recording Checklist</h3>
        <span className="text-[10px] text-muted">Applies to all contestants</span>
      </div>

      <div className="flex flex-col gap-0.5 mb-3 max-h-[260px] overflow-y-auto">
        {items.map(item => {
          const baseId = item.id.replace(/^(vibe|junior|senior)-/, '')
          return (
            <div key={item.id} className="flex items-start gap-2 px-1 py-1 rounded group hover:bg-page">
              <span className="flex-1 text-xs text-primary leading-snug pt-0.5">{item.text}</span>
              {item.phase && (
                <span className={cn('text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded mt-0.5', PHASE_PILL[item.phase])}>
                  {item.phase === 'plan' ? 'Plan' : item.phase === 'build1' ? 'Build 1' : 'Build 2'}
                </span>
              )}
              <button
                onClick={() => onRemove(baseId)}
                className="text-muted hover:text-danger text-sm leading-none mt-0.5"
                title="Remove from all"
              >
                ×
              </button>
            </div>
          )
        })}
        {items.length === 0 && (
          <p className="text-xs text-muted text-center py-2">No items yet. Add one below.</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <input
          type="text"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Add a checklist item…"
          className="h-8 text-xs rounded-lg border border-border bg-page px-3 text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60"
        />
        <div className="flex gap-1.5">
          <select
            value={newPhase}
            onChange={e => setNewPhase(e.target.value as PhaseId | 'any')}
            className="flex-1 h-8 text-xs rounded-lg border border-border bg-page px-2 text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value="any">Show in every phase</option>
            <option value="plan">{PHASE_LABELS.plan} only</option>
            <option value="build1">{PHASE_LABELS.build1} only</option>
            <option value="build2">{PHASE_LABELS.build2} only</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={!newText.trim() || adding}
            className="h-8 px-3 rounded-lg text-xs bg-accent text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
