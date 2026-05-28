'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
}

export default function SharedInfoPanel({ value, onChange }: Props) {
  const [local, setLocal] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setLocal(value) }, [value])

  function handleChange(v: string) {
    setLocal(v)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => onChange(v), 500)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">Shared Info</h3>
        <span className="text-[10px] text-muted">Visible to all contestants</span>
      </div>
      <textarea
        value={local}
        onChange={e => handleChange(e.target.value)}
        placeholder="WiFi password, shared logins, API keys, links. Anything all contestants need."
        className="w-full min-h-[100px] text-xs font-mono text-primary bg-page border border-border rounded-lg px-3 py-2.5 resize-y focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60 placeholder:text-muted"
        rows={5}
      />
    </div>
  )
}
