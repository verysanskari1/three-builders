import * as React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'secondary'

const styles: Record<BadgeVariant, string> = {
  default:   'bg-accent-bg text-accent border border-accent/20',
  success:   'bg-success-bg text-success border border-success/20',
  warning:   'bg-warning-bg text-warning border border-warning/20',
  danger:    'bg-danger-bg text-danger border border-danger/20',
  outline:   'border border-border text-secondary bg-transparent',
  secondary: 'bg-page text-secondary border border-border',
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ className, variant = 'secondary', ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', styles[variant], className)}
      {...props}
    />
  )
}
