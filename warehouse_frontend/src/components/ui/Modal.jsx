import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useDarkMode } from '@/hooks/useDarkMode'

export function Modal({ open, onClose, title, children, size = 'md' }) {
  const isDark = useDarkMode()

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  const closeBtn = isDark
    ? 'hover:bg-zinc-800 hover:text-zinc-200'
    : 'hover:bg-zinc-100 hover:text-zinc-700'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      <div className="animate-fade-in absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl',
          sizes[size],
        )}
        style={{ animation: 'fadeInUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] p-5">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h2>
          <button
            onClick={onClose}
            className={cn(
              'rounded-lg p-1.5 text-zinc-500 transition-colors',
              closeBtn,
            )}
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
