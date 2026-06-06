import { cn } from '@/lib/utils'

export function LoadingSpinner({ className }) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="h-6 w-6 rounded-full border-2 border-zinc-200 border-t-zinc-900 animate-spin" />
    </div>
  )
}
