import { cn } from '@/lib/utils'
import { forwardRef } from 'react'
import { useDarkMode } from '@/hooks/useDarkMode'

function InputInner({ label, error, hint, className, style, ...props }, ref) {
  const isDark = useDarkMode()
  const labelColor = isDark ? 'text-zinc-300' : 'text-zinc-700'
  const fieldBase = isDark
    ? 'border-zinc-700 bg-zinc-800 text-zinc-100'
    : 'border-zinc-300 bg-white text-zinc-900'

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className={cn('text-sm font-medium', labelColor)}>{label}</label>}
      <input
        ref={ref}
        className={cn(
          'h-9 w-full rounded-lg border px-3 text-sm',
          'placeholder:text-zinc-400 transition-all duration-200',
          'focus:border-[var(--accent-border)] focus:outline-none',
          'focus:[box-shadow:0_0_0_2px_var(--accent-glow)]',
          'disabled:cursor-not-allowed disabled:bg-zinc-50',
          fieldBase,
          error && 'border-red-400 focus:[box-shadow:0_0_0_2px_#DC262633] focus:border-red-400',
          className,
        )}
        style={style}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}

export const Input = forwardRef(InputInner)
Input.displayName = 'Input'
