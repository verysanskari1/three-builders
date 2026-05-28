'use client'

import { useState, useCallback, useRef } from 'react'
import { Phase, Task, Owner } from '@/lib/types'
import { cn } from '@/lib/utils'

const OWNER_CYCLE: Owner[] = ['', 'Kanishkar', 'Sanskar', 'Shared']
const OWNER_SHORT: Record<string, string> = { Kanishkar: 'K', Sanskar: 'S', Shared: 'B' }
const OWNER_STYLE: Record<string, string> = {
  Kanishkar: 'bg-blue-50 text-blue-700 border-blue-200',
  Sanskar:   'bg-pink-50 text-pink-700 border-pink-200',
  Shared:    'bg-amber-50 text-amber-700 border-amber-200',
}

function OwnerPill({ owner, onClick }: { owner: Owner; onClick: () => void }) {
  if (!owner) return <button onClick={onClick} className="w-5 h-5 rounded border border-dashed border-border hover:border-border-strong transition-colors" />
  return (
    <button
      onClick={onClick}
      className={cn('font-mono text-[10px] px-1.5 py-0.5 rounded border font-medium', OWNER_STYLE[owner])}
    >
      {OWNER_SHORT[owner]}
    </button>
  )
}

function TaskRow({
  task,
  onToggle,
  onOwnerCycle,
  onNoteChange,
  onDelete,
}: {
  task: Task
  onToggle: () => void
  onOwnerCycle: () => void
  onNoteChange: (note: string) => void
  onDelete: () => void
}) {
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote] = useState(task.note)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleNote(v: string) {
    setNote(v)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => onNoteChange(v), 500)
  }

  return (
    <div className={cn('group px-3 py-1.5', task.done && 'opacity-50')}>
      <div className="flex items-center gap-2.5">
        <input type="checkbox" checked={task.done} onChange={onToggle} />
        <span className={cn('flex-1 text-sm text-primary leading-snug', task.done && 'line-through text-muted')}>
          {task.text}
        </span>
        <OwnerPill owner={task.owner} onClick={onOwnerCycle} />
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger text-xs transition-all ml-1 leading-none"
        >
          ×
        </button>
      </div>

      {/* Note: expandable textarea */}
      {noteOpen ? (
        <div className="ml-6 mt-1.5">
          <textarea
            autoFocus
            value={note}
            onChange={e => handleNote(e.target.value)}
            onBlur={() => { if (!note.trim()) setNoteOpen(false) }}
            rows={3}
            className="w-full text-xs font-mono text-secondary bg-page border border-border rounded-md px-2.5 py-1.5 resize-y focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60 min-h-[56px]"
            placeholder="Notes, links, logins, screenshot paths…"
          />
        </div>
      ) : (
        <button
          onClick={() => setNoteOpen(true)}
          className={cn(
            'ml-6 mt-0.5 text-left text-xs transition-colors block w-full',
            note ? 'text-secondary hover:text-primary whitespace-pre-wrap' : 'text-muted hover:text-secondary'
          )}
        >
          {note || '+ add note'}
        </button>
      )}
    </div>
  )
}

function PhaseBlock({
  phase,
  expanded,
  onToggleExpand,
  onUpdateTask,
  onAddTask,
  onDeleteTask,
}: {
  phase: Phase
  expanded: boolean
  onToggleExpand: () => void
  onUpdateTask: (id: string, u: Partial<Task>) => void
  onAddTask: (text: string) => void
  onDeleteTask: (id: string) => void
}) {
  const [newText, setNewText] = useState('')
  const done = phase.tasks.filter(t => t.done).length
  const total = phase.tasks.length
  const allDone = total > 0 && done === total

  function cycleOwner(cur: Owner): Owner {
    return OWNER_CYCLE[(OWNER_CYCLE.indexOf(cur) + 1) % OWNER_CYCLE.length]
  }

  return (
    <div className={cn('rounded-lg border transition-colors overflow-hidden', allDone ? 'border-success/30 bg-success-bg/50' : 'border-border bg-surface')}>
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-page transition-colors"
      >
        <span className="text-muted text-xs w-3 flex-shrink-0">{expanded ? '▼' : '▶'}</span>
        <span className={cn('flex-1 text-sm font-medium truncate', allDone ? 'text-success' : 'text-primary')}>
          {phase.title}
        </span>
        {phase.time && <span className="text-xs text-muted flex-shrink-0 font-mono">{phase.time}</span>}
        <span className={cn('text-xs font-mono flex-shrink-0 ml-1', allDone ? 'text-success' : done > 0 ? 'text-warning' : 'text-muted')}>
          {done}/{total}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border">
          <div className="py-1">
            {phase.tasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => onUpdateTask(task.id, { done: !task.done })}
                onOwnerCycle={() => onUpdateTask(task.id, { owner: cycleOwner(task.owner) })}
                onNoteChange={note => onUpdateTask(task.id, { note })}
                onDelete={() => onDeleteTask(task.id)}
              />
            ))}
          </div>
          <div className="px-3 py-2 border-t border-border/50">
            <input
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newText.trim()) {
                  onAddTask(newText.trim())
                  setNewText('')
                }
              }}
              className="w-full h-7 text-xs bg-page border border-border rounded px-2.5 text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent/30"
              placeholder="Add task (Enter)"
            />
          </div>
        </div>
      )}
    </div>
  )
}

interface Props {
  phases: Phase[]
  onUpdatePhases: (phases: Phase[]) => void
}

export default function PhaseChecklist({ phases, onUpdatePhases }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const totalDone = phases.reduce((s, p) => s + p.tasks.filter(t => t.done).length, 0)
  const totalAll  = phases.reduce((s, p) => s + p.tasks.length, 0)
  const pct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0

  const updateTask = useCallback((phaseId: string, taskId: string, update: Partial<Task>) => {
    onUpdatePhases(phases.map(p =>
      p.id === phaseId ? { ...p, tasks: p.tasks.map(t => t.id === taskId ? { ...t, ...update } : t) } : p
    ))
  }, [phases, onUpdatePhases])

  const addTask = useCallback((phaseId: string, text: string) => {
    onUpdatePhases(phases.map(p =>
      p.id === phaseId ? { ...p, tasks: [...p.tasks, { id: `c-${Date.now()}`, text, owner: '' as Owner, done: false, note: '' }] } : p
    ))
  }, [phases, onUpdatePhases])

  const deleteTask = useCallback((phaseId: string, taskId: string) => {
    onUpdatePhases(phases.map(p =>
      p.id === phaseId ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) } : p
    ))
  }, [phases, onUpdatePhases])

  // Group phases
  const groups: { id: string; label: string; phases: Phase[] }[] = []
  const seen = new Set<string>()
  for (const p of phases) {
    if (!seen.has(p.group)) { seen.add(p.group); groups.push({ id: p.group, label: p.group, phases: [] }) }
    groups[groups.length - 1].phases.push(p)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-28 h-1.5 rounded-full bg-page border border-border overflow-hidden">
            <div className="h-full bg-success rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-secondary font-mono">{totalDone}/{totalAll} · {pct}%</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => { const e: Record<string,boolean> = {}; phases.forEach(p => e[p.id] = true); setExpanded(e) }} className="text-xs text-secondary hover:text-primary px-2 py-1 rounded hover:bg-page transition-colors">Expand all</button>
          <button onClick={() => setExpanded({})} className="text-xs text-secondary hover:text-primary px-2 py-1 rounded hover:bg-page transition-colors">Collapse all</button>
        </div>
      </div>

      {/* groups */}
      {groups.map(g => (
        <div key={g.id}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">{g.label}</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="flex flex-col gap-1.5">
            {g.phases.map(phase => (
              <PhaseBlock
                key={phase.id}
                phase={phase}
                expanded={!!expanded[phase.id]}
                onToggleExpand={() => setExpanded(prev => ({ ...prev, [phase.id]: !prev[phase.id] }))}
                onUpdateTask={(tid, u) => updateTask(phase.id, tid, u)}
                onAddTask={text => addTask(phase.id, text)}
                onDeleteTask={tid => deleteTask(phase.id, tid)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
