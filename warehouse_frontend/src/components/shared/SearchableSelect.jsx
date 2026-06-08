import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SearchableSelect({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  error,
  disabled,
  renderOption,
  emptyMessage = 'Sin resultados',
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selected = options.find((o) => String(o.value) === String(value))

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, search])

  return (
    <div className="relative flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-zinc-700">{label}</label>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-lg border border-zinc-300 bg-white px-3 text-left text-sm',
          'focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:bg-zinc-50 disabled:cursor-not-allowed',
          error && 'border-red-400',
          !selected && 'text-zinc-400'
        )}
      >
        <span className="truncate">
          {selected ? (renderOption ? renderOption(selected) : selected.label) : placeholder}
        </span>
        <ChevronDown size={14} className="shrink-0 text-zinc-400" />
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}

      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-zinc-200 bg-white shadow-lg">
            <div className="border-b border-zinc-100 p-5">
              <input
                className="h-8 w-full rounded-md border border-zinc-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <ul className="max-h-48 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-5 py-4 text-sm text-zinc-500">{emptyMessage}</li>
              ) : (
                filtered.map((opt) => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      className={cn(
                        'w-full px-5 py-4 text-left text-sm hover:bg-zinc-50',
                        String(opt.value) === String(value) && 'bg-zinc-100 font-medium'
                      )}
                      onClick={() => {
                        onChange(opt.value)
                        setOpen(false)
                        setSearch('')
                      }}
                    >
                      {renderOption ? renderOption(opt) : opt.label}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
