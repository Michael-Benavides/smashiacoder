import { cn } from '@/lib/utils'
import { LoadingSpinner } from './LoadingSpinner'
import { EmptyState } from './EmptyState'
import { Package } from 'lucide-react'

export function DataTable({ columns, data, loading, emptyTitle = 'Sin resultados', emptyDescription = 'No hay datos para mostrar.', onRowClick }) {
  if (loading) return <LoadingSpinner />
  if (!data?.length) return <EmptyState icon={Package} title={emptyTitle} description={emptyDescription} />

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-50 border-b border-zinc-200">
            {columns.map((col) => (
              <th key={col.key} className={cn('px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {data.map((row, i) => (
            <tr
              key={row.id ?? i}
              className={cn('hover:bg-zinc-50 transition-colors', onRowClick && 'cursor-pointer')}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-3 text-zinc-700', col.cellClassName)}>
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
