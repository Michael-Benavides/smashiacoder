import { cn } from '@/lib/utils'
import { LoadingSpinner } from './LoadingSpinner'
import { EmptyState } from './EmptyState'
import { Package } from 'lucide-react'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useT } from '@/hooks/useT'

export function DataTable({ columns, data, loading, emptyTitle, emptyDescription, onRowClick }) {
  const isDark = useDarkMode()
  const { t } = useT()

  const resolvedEmptyTitle = emptyTitle ?? t('Sin resultados')
  const resolvedEmptyDescription = emptyDescription ?? t('No hay datos para mostrar.')

  if (loading) return <LoadingSpinner />
  if (!data?.length) {
    return (
      <EmptyState
        icon={Package}
        title={resolvedEmptyTitle}
        description={resolvedEmptyDescription}
      />
    )
  }

  const headRow = isDark ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-200 bg-zinc-900'
  const rowHover = isDark ? 'hover:bg-amber-500/5' : 'hover:bg-amber-50/30'
  const cellText = isDark ? 'text-zinc-300' : 'text-zinc-700'
  const rowDivider = isDark ? 'divide-zinc-800' : 'divide-zinc-100'

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full p-5 text-sm">
        <thead>
          <tr className={cn('border-b', headRow)}>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-5 py-5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-100',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={cn('divide-y bg-[var(--color-surface)]', rowDivider)}>
          {data.map((row, i) => (
            <tr
              key={row.id ?? i}
              style={{
                opacity: 0,
                animation: 'fadeInUp 0.35s ease forwards',
                animationDelay: `${i * 40}ms`,
              }}
              className={cn(
                'transition-colors duration-150',
                rowHover,
                onRowClick ? 'cursor-pointer' : 'cursor-default',
              )}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn('px-5 py-5 text-sm', cellText, col.className, col.cellClassName)}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
