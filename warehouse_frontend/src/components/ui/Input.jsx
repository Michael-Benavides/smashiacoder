import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

export const Input = forwardRef(({ label, error, hint, className, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label className="text-sm font-medium text-zinc-700">{label}</label>}
    <input
      ref={ref}
      className={cn(
        'h-9 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900',
        'placeholder:text-zinc-400 transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-0 focus:border-transparent',
        'disabled:bg-zinc-50 disabled:cursor-not-allowed',
        error && 'border-red-400 focus:ring-red-500',
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-600">{error}</p>}
    {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
  </div>
))
Input.displayName = 'Input'
