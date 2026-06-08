import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const variantStyles = {
  primary: {
    className: 'btn-primary-vars font-medium shadow-sm active:scale-95 transition-all duration-150',
    style: {},
  },
  secondary: {
    className: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:scale-95 transition-all duration-150',
    style: {},
  },
  outline: {
    className: 'border text-zinc-700 hover:bg-zinc-50 active:scale-95 transition-all duration-150',
    style: { borderColor: 'var(--accent-border)' },
  },
  ghost: {
    className: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:scale-95 transition-all duration-150',
    style: {},
  },
  danger: {
    className: 'bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all duration-150',
    style: {},
  },
  gold: {
    className: 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm active:scale-95 transition-all duration-150 text-shimmer-btn',
    style: {},
  },
  success: {
    className: 'bg-green-600 text-white hover:bg-green-700 active:scale-95 transition-all duration-150',
    style: {},
  },
}

const sizes = {
  sm: 'h-8 px-5 text-xs gap-1.5',
  md: 'h-9 px-5 text-sm gap-2',
  lg: 'h-10 px-5 text-sm gap-2',
  icon: 'p-5',
}

export function Button({ variant = 'primary', size = 'md', loading, disabled, children, className, style, ...props }) {
  const v = variantStyles[variant] ?? variantStyles.primary
  const usesAccentRing = variant === 'primary' || variant === 'outline'

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
        v.className,
        sizes[size],
        className,
      )}
      style={{
        ...(usesAccentRing ? { '--tw-ring-color': 'var(--accent-ring)' } : {}),
        ...v.style,
        ...style,
      }}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" size={14} />}
      {children}
    </button>
  )
}
