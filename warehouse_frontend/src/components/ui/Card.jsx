import { cn } from '@/lib/utils'

export function Card({ className, highlighted, hoverable, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm',
        'transition-all duration-200',
        (hoverable || highlighted) && 'cursor-pointer hover:-translate-y-1 hover:border-amber-200 hover:shadow-md dark:hover:border-amber-500/30',
        highlighted && 'border-amber-200',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }) {
  return (
    <div className={cn('border-b border-[var(--color-border)] px-6 py-4', className)}>
      {children}
    </div>
  )
}

export function CardContent({ className, children }) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>
}

export function CardTitle({ className, children }) {
  return (
    <h3 className={cn('text-sm font-semibold text-[var(--color-text-primary)]', className)}>
      {children}
    </h3>
  )
}
