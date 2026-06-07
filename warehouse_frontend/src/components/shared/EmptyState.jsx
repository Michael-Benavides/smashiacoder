import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/lib/utils'

export function EmptyState({ icon: Icon, title, description, action }) {
  const isDark = useDarkMode()
  const iconWrap = isDark ? 'bg-zinc-800' : 'bg-zinc-100'
  const titleColor = isDark ? 'text-zinc-200' : 'text-zinc-700'
  const descColor = isDark ? 'text-zinc-400' : 'text-zinc-500'

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className={cn('mb-4 rounded-2xl p-4', iconWrap)}>
          <Icon size={28} className="text-zinc-400" />
        </div>
      )}
      <h3 className={cn('mb-1 text-sm font-semibold', titleColor)}>{title}</h3>
      {description && <p className={cn('mb-4 max-w-xs text-sm', descColor)}>{description}</p>}
      {action}
    </div>
  )
}
