'use client'

import { useState } from 'react'
import { PMRole } from '@/lib/types'
import { cn } from '@/lib/utils'

interface Props {
  roles: PMRole[]
  onUpdate: (roles: PMRole[]) => void
}

export default function PMRolesPanel({ roles, onUpdate }: Props) {
  const [editing, setEditing] = useState<number | null>(null)
  const [editField, setEditField] = useState<'label' | 'text' | null>(null)

  function updateRole(idx: number, field: 'label' | 'text', value: string) {
    const next = roles.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    onUpdate(next)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-vibe text-sm">🎭</span>
        <span className="font-mono text-xs text-white/60 uppercase tracking-wider">PM Roles (Sanskar)</span>
      </div>
      <div className="flex flex-col gap-3">
        {roles.map((role, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-vibe/20 bg-vibe/5 p-3 flex flex-col gap-2"
          >
            {editing === idx && editField === 'label' ? (
              <input
                autoFocus
                value={role.label}
                onChange={e => updateRole(idx, 'label', e.target.value)}
                onBlur={() => { setEditing(null); setEditField(null) }}
                className="bg-transparent border-b border-vibe/40 text-vibe text-xs font-mono font-semibold outline-none w-full"
              />
            ) : (
              <div
                className="text-vibe text-xs font-mono font-semibold cursor-pointer hover:text-vibe/80"
                onDoubleClick={() => { setEditing(idx); setEditField('label') }}
                title="Double-click to edit"
              >
                {role.label}
              </div>
            )}
            {editing === idx && editField === 'text' ? (
              <textarea
                autoFocus
                value={role.text}
                onChange={e => updateRole(idx, 'text', e.target.value)}
                onBlur={() => { setEditing(null); setEditField(null) }}
                className={cn(
                  'bg-transparent border border-white/10 rounded p-2 text-white/80 text-xs leading-relaxed outline-none w-full resize-none',
                  'focus:border-vibe/40'
                )}
                rows={4}
              />
            ) : (
              <p
                className="text-white/70 text-xs leading-relaxed cursor-pointer hover:text-white/90"
                onDoubleClick={() => { setEditing(idx); setEditField('text') }}
                title="Double-click to edit"
              >
                {role.text}
              </p>
            )}
          </div>
        ))}
      </div>
      <p className="text-white/20 text-xs text-center">Double-click any field to edit</p>
    </div>
  )
}
