import { Button } from '@/components/ui/Button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({ meta, onPageChange }) {
  if (!meta?.pagination) return null
  const { pagina_actual, total_paginas, total_registros } = meta.pagination
  if (total_paginas <= 1 && total_registros === 0) return null

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <p className="text-xs text-zinc-500">{total_registros} registros totales</p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={pagina_actual === 1}
          onClick={() => onPageChange(pagina_actual - 1)}
        >
          <ChevronLeft size={14} />
        </Button>
        <span className="text-xs text-zinc-600 px-2">{pagina_actual} / {total_paginas}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={pagina_actual === total_paginas}
          onClick={() => onPageChange(pagina_actual + 1)}
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  )
}
