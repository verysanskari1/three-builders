import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '3 Builders — Shoot Day',
  description: 'Shoot day dashboard for the 3 Builders filming day',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
