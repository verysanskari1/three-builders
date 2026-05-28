import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center mb-16">
        <h1 className="font-serif text-6xl md:text-7xl text-white mb-3">
          3 Builders
        </h1>
        <p className="font-mono text-accent text-sm tracking-widest uppercase">
          Shoot Day — Friday, 29 May 2026
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-2xl">
        <Link
          href="/host"
          className="group flex flex-col items-center justify-center gap-3 p-8 rounded-xl border border-white/10 bg-elevated hover:border-accent/50 hover:bg-card transition-all duration-200"
        >
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-accent">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
            </svg>
          </div>
          <div className="text-center">
            <div className="font-semibold text-white text-lg">Host View</div>
            <div className="text-white/50 text-sm mt-1">Full control, all data</div>
          </div>
          <div className="font-mono text-xs text-white/30 mt-1">/host</div>
        </Link>

        <div className="flex flex-col gap-4 p-8 rounded-xl border border-white/10 bg-elevated">
          <div className="flex flex-col items-center gap-2 mb-2">
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-white/60">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div className="text-center">
              <div className="font-semibold text-white text-lg">Contestant View</div>
              <div className="text-white/50 text-sm">Choose your station</div>
            </div>
          </div>

          <div className="grid gap-2">
            <Link
              href="/contestant/vibe"
              className="flex items-center justify-between px-4 py-3 rounded-lg bg-vibe/10 border border-vibe/20 hover:bg-vibe/20 transition-colors"
            >
              <span className="font-mono text-sm text-vibe font-medium">VIBE CODER</span>
              <span className="font-mono text-xs text-vibe/60">/contestant/vibe →</span>
            </Link>
            <Link
              href="/contestant/junior"
              className="flex items-center justify-between px-4 py-3 rounded-lg bg-junior/10 border border-junior/20 hover:bg-junior/20 transition-colors"
            >
              <span className="font-mono text-sm text-junior font-medium">JUNIOR DEV</span>
              <span className="font-mono text-xs text-junior/60">/contestant/junior →</span>
            </Link>
            <Link
              href="/contestant/senior"
              className="flex items-center justify-between px-4 py-3 rounded-lg bg-senior/10 border border-senior/20 hover:bg-senior/20 transition-colors"
            >
              <span className="font-mono text-sm text-senior font-medium">SENIOR DEV</span>
              <span className="font-mono text-xs text-senior/60">/contestant/senior →</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
