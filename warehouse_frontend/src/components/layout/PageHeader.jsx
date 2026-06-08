import { cn } from '@/lib/utils'
import { useDarkMode } from '@/hooks/useDarkMode'

function StatBadge({ label, value, variant = 'default' }) {
  const isDark = useDarkMode()
  const styles = {
    default: isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700',
    success: 'bg-emerald-50 text-emerald-700',
    muted: isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-50 text-zinc-500',
    warning: 'bg-amber-50 text-amber-700',
  }
  const labelColor = isDark ? 'text-zinc-400' : 'text-zinc-500'

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-4 py-1 text-xs font-medium', styles[variant])}>
      <span className={labelColor}>{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </span>
  )
}

export function PageHeader({ title, description, actions, children, stats, variant = 'default', className }) {
  const isDark = useDarkMode()
  const actionSlot = actions ?? children
  const heading = 'text-[var(--color-text-primary)]'
  const subtext = isDark ? 'text-zinc-400' : 'text-zinc-500'
  const border = 'border-[var(--color-border)]'

  if (variant === 'list') {
    return (
      <div
        className={cn('-mx-6 -mt-6 mb-6 border-b bg-[var(--color-surface)]', border, className)}
        style={{ animation: 'fadeInUp 0.4s ease forwards' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
          <h1 className={cn('text-lg font-bold tracking-tight', heading)}>{title}</h1>
          {actionSlot && (
            <div className="flex flex-wrap items-center gap-3">{actionSlot}</div>
          )}
        </div>
        {stats?.length > 0 && (
          <div className="flex flex-wrap gap-2 px-6 pb-4">
            {stats.map((s) => (
              <StatBadge key={s.label} {...s} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn('mb-6 flex items-start justify-between border-b pb-6', border, className)}
      style={{ animation: 'fadeInUp 0.4s ease forwards' }}
    >
      <div>
        <h1 className={cn('text-2xl font-bold tracking-tight', heading)}>{title}</h1>
        {description && (
          <p className={cn('mt-1 text-sm', subtext)}>{description}</p>
        )}
      </div>
      {actionSlot && (
        <div className="flex items-center gap-3">{actionSlot}</div>
      )}
    </div>
  )
}

export default PageHeader
