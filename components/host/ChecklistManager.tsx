'use client'

import { useState } from 'react'
import { ContestantTask } from '@/lib/types'

interface Props {
  items: ContestantTask[]
  onAdd: (text: string) => void
  onRemove: (baseId: string) => void
}

export default function ChecklistManager({ items, onAdd, onRemove }: Props) {
  const [newText, setNewText] = useState('')
  const [adding, setAdding] = useState(false)

  async function handleAdd() {
    const text = newText.trim()
    if (!text) return
    setAdding(true)
    await onAdd(text)
    setNewText('')
    setAdding(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">Recording Checklist</h3>
        <span className="text-[10px] text-muted">Applies to all contestants</span>
      </div>

      <div className="flex flex-col gap-0.5 mb-3">
        {items.map(item => {
          const baseId = item.id.replace(/^(vibe|junior|senior)-/, '')
          return (
            <div key={item.id} className="flex items-start gap-2 px-1 py-1 rounded group hover:bg-page">
              <span className="flex-1 text-xs text-primary leading-snug pt-0.5">{item.text}</span>
              <button
                onClick={() => onRemove(baseId)}
                className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger text-sm leading-none transition-opacity mt-0.5"
                title="Remove from all"
              >
                ×
              </button>
            </div>
          )
        })}
        {items.length === 0 && (
          <p className="text-xs text-muted text-center py-2">No items — add one below</p>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Add a checklist item…"
          className="flex-1 h-8 text-xs rounded-lg border border-border bg-page px-3 text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60"
        />
        <button
          onClick={handleAdd}
          disabled={!newText.trim() || adding}
          className="h-8 px-3 rounded-lg text-xs bg-accent text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  )
}
