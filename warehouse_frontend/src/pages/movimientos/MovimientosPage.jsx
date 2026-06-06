import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import PageHeader from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Pagination } from '@/components/shared/Pagination'
import { toPaginationMeta } from '@/lib/pagination'
import { Badge } from '@/components/ui/Badge'
import { getMovimientos } from '@/api/inventario'

const TIPO_BADGE = {
  entrada: { variant: 'success', label: 'Entrada' },
  salida: { variant: 'danger', label: 'Salida' },
  traslado: { variant: 'info', label: 'Traslado' },
}

const PAGE_SIZE = 20

function formatFecha(iso) {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), "dd MMM yyyy, HH:mm", { locale: es })
  } catch {
    return iso
  }
}

function filterMovimientos(items, { tipo, fechaDesde, fechaHasta }) {
  return items.filter((m) => {
    if (tipo && m.tipo !== tipo) return false
    if (!m.fecha) return !fechaDesde && !fechaHasta
    try {
      const fecha = parseISO(m.fecha)
      if (fechaDesde && isBefore(fecha, startOfDay(parseISO(fechaDesde)))) return false
      if (fechaHasta && isAfter(fecha, endOfDay(parseISO(fechaHasta)))) return false
    } catch {
      return true
    }
    return true
  })
}

export default function MovimientosPage() {
  const [page, setPage] = useState(1)
  const [tipo, setTipo] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const hasFilters = !!(tipo || fechaDesde || fechaHasta)

  const { data, isLoading } = useQuery({
    queryKey: ['movimientos', page, tipo, fechaDesde, fechaHasta, hasFilters],
    queryFn: async () => {
      const res = await getMovimientos({
        page: hasFilters ? 1 : page,
        page_size: hasFilters ? 100 : PAGE_SIZE,
      })
      let items = res.data.data ?? []
      if (hasFilters) {
        items = filterMovimientos(items, { tipo, fechaDesde, fechaHasta })
        const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
        const safePage = Math.min(page, totalPages)
        const start = (safePage - 1) * PAGE_SIZE
        return {
          items: items.slice(start, start + PAGE_SIZE),
          meta: toPaginationMeta({
            current_page: safePage,
            total_pages: totalPages,
            count: items.length,
          }),
        }
      }
      return {
        items,
        meta: toPaginationMeta(
          res.data.meta?.pagination ?? res.data.pagination ?? { current_page: 1, total_pages: 1, count: items.length }
        ),
      }
    },
  })

  const movimientos = data?.items ?? []
  const meta = data?.meta

  const columns = useMemo(() => [
    {
      key: 'fecha',
      header: 'Fecha',
      render: (val) => formatFecha(val),
    },
    {
      key: 'producto_nombre',
      header: 'Producto',
      render: (_, row) => (
        <div>
          <p className="font-medium text-zinc-900">{row.producto_nombre ?? '—'}</p>
          <p className="text-xs text-zinc-500">{row.producto_codigo}</p>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      render: (val) => {
        const cfg = TIPO_BADGE[val] ?? { variant: 'default', label: val ?? '—' }
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>
      },
    },
    {
      key: 'cantidad',
      header: 'Cantidad',
      render: (val) => <span className="tabular-nums font-medium">{val}</span>,
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (_, row) => (
        <span className="tabular-nums text-zinc-600">
          {row.stock_anterior} → <span className="font-medium text-zinc-900">{row.stock_nuevo}</span>
        </span>
      ),
    },
    {
      key: 'usuario_id',
      header: 'Usuario',
      render: (val) => (val ? `#${val}` : '—'),
    },
  ], [])

  return (
    <div>
      <PageHeader title="Movimientos" description="Historial de entradas, salidas y traslados" />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Tipo</label>
          <select
            className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm"
            value={tipo}
            onChange={(e) => { setTipo(e.target.value); setPage(1) }}
          >
            <option value="">Todos</option>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
            <option value="traslado">Traslado</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Desde</label>
          <input
            type="date"
            className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm"
            value={fechaDesde}
            onChange={(e) => { setFechaDesde(e.target.value); setPage(1) }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Hasta</label>
          <input
            type="date"
            className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm"
            value={fechaHasta}
            onChange={(e) => { setFechaHasta(e.target.value); setPage(1) }}
          />
        </div>
        {hasFilters && (
          <button
            type="button"
            className="h-9 text-sm text-zinc-600 hover:text-zinc-900"
            onClick={() => { setTipo(''); setFechaDesde(''); setFechaHasta(''); setPage(1) }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={movimientos}
        loading={isLoading}
        emptyTitle="Sin movimientos"
        emptyDescription="Registra una entrada o salida para ver el historial."
      />

      <Pagination meta={meta} onPageChange={setPage} />
    </div>
  )
}
