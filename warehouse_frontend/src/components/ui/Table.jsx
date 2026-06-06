import { cn } from '@/lib/utils'

export function Table({ className, children }) {
  return (
    <div className="w-full overflow-auto rounded-lg border border-border">
      <table className={cn('w-full caption-bottom text-sm', className)}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ children }) {
  return (
    <thead className="border-b border-border bg-surface-hover/50">
      {children}
    </thead>
  )
}

export function TableBody({ children }) {
  return <tbody className="divide-y divide-border">{children}</tbody>
}

export function TableRow({ children, className }) {
  return (
    <tr className={cn('transition-colors hover:bg-surface-hover/50', className)}>
      {children}
    </tr>
  )
}

export function TableHead({ children, className }) {
  return (
    <th
      className={cn(
        'h-10 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide text-text-secondary',
        className
      )}
    >
      {children}
    </th>
  )
}

export function TableCell({ children, className }) {
  return (
    <td className={cn('px-4 py-3 align-middle text-text-primary', className)}>
      {children}
    </td>
  )
}
