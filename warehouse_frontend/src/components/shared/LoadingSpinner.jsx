import { cn } from '@/lib/utils'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useT } from '@/hooks/useT'

export function LoadingSpinner({ className }) {
  const isDark = useDarkMode()
  const { t } = useT()
  const ring = isDark ? 'border-zinc-700' : 'border-zinc-200'

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 p-12', className)}>
      <div className="relative h-10 w-10">
        <div className={cn('absolute inset-0 rounded-full border-2', ring)} />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-amber-500" />
        <div
          className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-t-amber-300"
          style={{ animationDuration: '0.6s' }}
        />
      </div>
      <p className="animate-pulse text-xs text-zinc-400">{t('Cargando...')}</p>
    </div>
  )
}
