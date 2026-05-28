import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-page">
      <div className="w-full max-w-lg">
        <div className="mb-10">
          <h1 className="font-display text-5xl text-primary mb-1">3 Builders</h1>
          <p className="text-secondary text-sm">Shoot Day · Friday, 29 May 2026</p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/host"
            className="flex items-center justify-between px-5 py-4 rounded-xl bg-surface border border-border shadow-card hover:shadow-card-hover hover:border-border-strong transition-all"
          >
            <div>
              <div className="font-semibold text-primary">Host view</div>
              <div className="text-sm text-secondary mt-0.5">Full control. Password required.</div>
            </div>
            <span className="text-muted">→</span>
          </Link>

          <div className="rounded-xl bg-surface border border-border shadow-card p-5">
            <div className="font-semibold text-primary mb-3">Contestant views</div>
            <div className="flex flex-col gap-2">
              {[
                { id: 'vibe',   label: 'Vibe Coder',  color: 'text-vibe' },
                { id: 'junior', label: 'Junior Dev',   color: 'text-junior' },
                { id: 'senior', label: 'Senior Dev',   color: 'text-senior' },
              ].map(c => (
                <Link
                  key={c.id}
                  href={`/contestant/${c.id}`}
                  className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-page border border-border hover:border-border-strong transition-colors"
                >
                  <span className={`font-medium text-sm ${c.color}`}>{c.label}</span>
                  <span className="text-muted text-xs font-mono">/contestant/{c.id}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
