import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.ts',
  ],
  theme: {
    extend: {
      colors: {
        page:    '#f8f9fb',
        surface: '#ffffff',
        border:  '#e2e5ea',
        'border-strong': '#c8cdd6',
        primary:   '#111827',
        secondary: '#6b7280',
        muted:     '#9ca3af',
        accent:      '#2563eb',
        'accent-bg': '#eff6ff',
        success:      '#16a34a',
        'success-bg': '#f0fdf4',
        warning:      '#d97706',
        'warning-bg': '#fffbeb',
        danger:      '#dc2626',
        'danger-bg': '#fef2f2',
        vibe:   '#7c3aed',
        junior: '#0284c7',
        senior: '#059669',
      },
      fontFamily: {
        sans:    ['Satoshi', 'system-ui', 'sans-serif'],
        display: ['Newsreader', 'Georgia', 'serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}

export default config
