'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HostLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        window.location.href = '/host'
      } else {
        setError('Wrong password')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-page">
      <div className="w-full max-w-sm p-8">
        <h1 className="font-display text-4xl text-primary mb-1">Host</h1>
        <p className="text-secondary text-sm mb-8">3 Builders — Shoot Day</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            className="h-10 w-full rounded-lg border border-border bg-surface px-4 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/60"
          />
          {error && <p className="text-danger text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="h-10 rounded-lg bg-accent text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {loading ? 'Checking…' : 'Enter'}
          </button>
        </form>
      </div>
    </main>
  )
}
