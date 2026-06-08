import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDarkMode } from '@/hooks/useDarkMode'

export function SearchInput({ value, onChange, placeholder = 'Buscar...', className }) {
  const isDark = useDarkMode()
  const field = isDark
    ? 'border-zinc-700 bg-zinc-800 text-zinc-100'
    : 'border-zinc-300 bg-white text-zinc-900'

  return (
    <div className={cn('relative', className)}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'min-h-11 w-full rounded-lg border py-5 pl-9 pr-5 text-sm placeholder:text-zinc-400 transition-all duration-300',
          'focus:w-72 focus:border-[var(--accent-border)] focus:outline-none',
          'focus:[box-shadow:0_0_0_2px_var(--accent-glow)]',
          field,
        )}
      />
    </div>
  )
}
