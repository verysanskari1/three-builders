'use client'

import { useState, useCallback, useRef } from 'react'
import { ChevronDown, ChevronRight, Plus, X } from 'lucide-react'
import { Phase, Task, Owner } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const OWNER_CYCLE: Owner[] = ['', 'Kanishkar', 'Sanskar', 'Shared']

function OwnerTag({ owner }: { owner: Owner }) {
  if (!owner) return <span className="w-6" />
  const styles: Record<string, string> = {
    Kanishkar: 'bg-[#1d3a5c] text-[#93c5fd]',
    Sanskar: 'bg-[#5c1d3a] text-[#fda4c4]',
    Shared: 'bg-[#4a3a10] text-[#fde047]',
  }
  const short: Record<string, string> = {
    Kanishkar: 'K',
    Sanskar: 'S',
    Shared: 'B',
  }
  return (
    <span className={cn('font-mono text-[10px] px-1.5 py-0.5 rounded', styles[owner])}>
      {short[owner]}
    </span>
  )
}

interface TaskRowProps {
  task: Task
  onToggle: () => void
  onOwnerCycle: () => void
  onNoteChange: (note: string) => void
  onDelete: () => void
}

function TaskRow({ task, onToggle, onOwnerCycle, onNoteChange, onDelete }: TaskRowProps) {
  const [editingNote, setEditingNote] = useState(false)
  const [note, setNote] = useState(task.note)
  const noteRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleNoteChange = (v: string) => {
    setNote(v)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onNoteChange(v), 500)
  }

  return (
    <div className={cn('group flex flex-col gap-1 px-3 py-2 rounded hover:bg-white/3 transition-colors', task.done && 'opacity-60')}>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={task.done}
          onChange={onToggle}
          className="w-4 h-4 rounded accent-done flex-shrink-0 cursor-pointer"
        />
        <span
          className={cn(
            'flex-1 text-sm text-white/90',
            task.done && 'line-through text-white/40'
          )}
        >
          {task.text}
        </span>
        <button onClick={onOwnerCycle} className="flex-shrink-0">
          <OwnerTag owner={task.owner} />
        </button>
        <button
          onClick={() => onDelete()}
          className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-danger transition-all ml-1"
        >
          <X size={12} />
        </button>
      </div>
      {editingNote ? (
        <Input
          ref={noteRef}
          value={note}
          onChange={e => handleNoteChange(e.target.value)}
          onBlur={() => setEditingNote(false)}
          className="ml-6 h-7 text-xs font-mono bg-elevated/50 text-white/70"
          placeholder="Note…"
          autoFocus
        />
      ) : (
        <button
          onClick={() => { setEditingNote(true); setTimeout(() => noteRef.current?.focus(), 50) }}
          className={cn(
            'ml-6 text-left text-xs font-mono transition-colors',
            note
              ? 'text-white/50 hover:text-white/80'
              : 'text-white/20 hover:text-white/40'
          )}
        >
          {note || '+ add note (logins, links, screenshots, anything)'}
        </button>
      )}
    </div>
  )
}

interface PhaseBlockProps {
  phase: Phase
  expanded: boolean
  onToggleExpand: () => void
  onUpdateTask: (taskId: string, update: Partial<Task>) => void
  onAddTask: (text: string) => void
  onDeleteTask: (taskId: string) => void
}

function PhaseBlock({ phase, expanded, onToggleExpand, onUpdateTask, onAddTask, onDeleteTask }: PhaseBlockProps) {
  const [newTaskText, setNewTaskText] = useState('')
  const done = phase.tasks.filter(t => t.done).length
  const total = phase.tasks.length
  const allDone = total > 0 && done === total

  function cycleOwner(current: Owner): Owner {
    const idx = OWNER_CYCLE.indexOf(current)
    return OWNER_CYCLE[(idx + 1) % OWNER_CYCLE.length]
  }

  return (
    <div className={cn('rounded-lg border transition-colors', allDone ? 'border-done/20 bg-done/5' : 'border-white/8 bg-card')}>
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 rounded-t-lg transition-colors"
      >
        {expanded ? (
          <ChevronDown size={14} className="text-white/40 flex-shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-white/40 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <span className={cn('text-sm font-medium', allDone ? 'text-done' : 'text-white/90')}>
            {phase.title}
          </span>
          {phase.time && (
            <span className="ml-2 font-mono text-xs text-white/30">{phase.time}</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn('font-mono text-xs', allDone ? 'text-done' : done > 0 ? 'text-warning' : 'text-white/30')}>
            {done}/{total}
          </span>
          {allDone && <span className="text-done text-xs">✓</span>}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/5">
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
          <div className="px-3 pb-3 flex gap-2">
            <Input
              value={newTaskText}
              onChange={e => setNewTaskText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newTaskText.trim()) {
                  onAddTask(newTaskText.trim())
                  setNewTaskText('')
                }
              }}
              className="h-7 text-xs bg-elevated/50"
              placeholder="+ add task (press Enter)"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (newTaskText.trim()) {
                  onAddTask(newTaskText.trim())
                  setNewTaskText('')
                }
              }}
              className="h-7 px-2"
            >
              <Plus size={14} />
            </Button>
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
  const totalAll = phases.reduce((s, p) => s + p.tasks.length, 0)
  const pct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0

  const toggleExpand = useCallback((id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const expandAll = () => {
    const next: Record<string, boolean> = {}
    phases.forEach(p => { next[p.id] = true })
    setExpanded(next)
  }

  const collapseAll = () => setExpanded({})

  const updateTask = useCallback(
    (phaseId: string, taskId: string, update: Partial<Task>) => {
      const next = phases.map(p =>
        p.id === phaseId
          ? { ...p, tasks: p.tasks.map(t => (t.id === taskId ? { ...t, ...update } : t)) }
          : p
      )
      onUpdatePhases(next)
    },
    [phases, onUpdatePhases]
  )

  const addTask = useCallback(
    (phaseId: string, text: string) => {
      const next = phases.map(p =>
        p.id === phaseId
          ? {
              ...p,
              tasks: [
                ...p.tasks,
                { id: `custom-${Date.now()}`, text, owner: '' as Owner, done: false, note: '' },
              ],
            }
          : p
      )
      onUpdatePhases(next)
    },
    [phases, onUpdatePhases]
  )

  const deleteTask = useCallback(
    (phaseId: string, taskId: string) => {
      const next = phases.map(p =>
        p.id === phaseId ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) } : p
      )
      onUpdatePhases(next)
    },
    [phases, onUpdatePhases]
  )

  // group phases
  const groups: { groupId: string; label: string; phases: Phase[] }[] = []
  const seen = new Set<string>()
  phases.forEach(p => {
    if (!seen.has(p.group)) {
      seen.add(p.group)
      groups.push({ groupId: p.group, label: p.group, phases: [] })
    }
    groups[groups.length - 1].phases.push(p)
  })

  return (
    <div className="flex flex-col gap-4">
      {/* toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-white/60">
            {totalDone}/{totalAll} done
          </span>
          <div className="w-32 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-done rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="font-mono text-xs text-done">{pct}%</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={expandAll} className="text-xs">
            Expand all
          </Button>
          <Button size="sm" variant="ghost" onClick={collapseAll} className="text-xs">
            Collapse all
          </Button>
        </div>
      </div>

      {/* groups */}
      {groups.map(group => (
        <div key={group.groupId} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-accent/60 uppercase tracking-wider">
              {group.label}
            </span>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          <div className="flex flex-col gap-2 pl-0">
            {group.phases.map(phase => (
              <PhaseBlock
                key={phase.id}
                phase={phase}
                expanded={!!expanded[phase.id]}
                onToggleExpand={() => toggleExpand(phase.id)}
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
