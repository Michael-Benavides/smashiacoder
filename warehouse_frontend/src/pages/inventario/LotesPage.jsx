import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, isBefore, parseISO, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import PageHeader from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Pagination } from '@/components/shared/Pagination'
import { Badge } from '@/components/ui/Badge'
import { useT } from '@/hooks/useT'
import { getLotes } from '@/api/inventario'
import { toPaginationMeta } from '@/lib/pagination'

const PAGE_SIZE = 20

function formatFecha(iso) {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), 'dd MMM yyyy', { locale: es })
  } catch {
    return iso
  }
}

function loteEstado(lote) {
  const hoy = startOfDay(new Date())
  if (lote.fecha_vencimiento) {
    try {
      if (isBefore(parseISO(lote.fecha_vencimiento), hoy)) return 'vencido'
    } catch {
      /* ignore */
    }
  }
  if (!lote.activo) return 'vencido'
  if (Number(lote.cantidad) === 0) return 'agotado'
  return 'activo'
}

export default function LotesPage() {
  const { t } = useT()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['lotes', page],
    queryFn: async () => {
      const res = await getLotes({ page, page_size: PAGE_SIZE })
      return {
        items: res.data.data ?? [],
        meta: toPaginationMeta(res.data.pagination),
      }
    },
  })

  const lotes = data?.items ?? []
  const meta = data?.meta

  const estadoBadge = useMemo(() => ({
    activo: { label: t('Activo'), variant: 'success' },
    agotado: { label: t('Agotado'), variant: 'warning' },
    vencido: { label: t('Vencido'), variant: 'danger' },
  }), [t])

  const columns = useMemo(() => [
    {
      key: 'numero_lote',
      header: t('Nº Lote'),
      render: (val) => <span className="font-medium text-zinc-900">{val}</span>,
    },
    {
      key: 'producto_nombre',
      header: t('Producto'),
      render: (_, row) => (
        <div>
          <p className="font-medium text-zinc-900">{row.producto_nombre ?? '—'}</p>
          <p className="text-xs text-zinc-500">{row.producto_codigo}</p>
        </div>
      ),
    },
    {
      key: 'fecha_ingreso',
      header: t('Ingreso'),
      render: (val) => formatFecha(val),
    },
    {
      key: 'fecha_vencimiento',
      header: t('Vencimiento'),
      render: (val) => formatFecha(val),
    },
    {
      key: 'cantidad',
      header: t('Cantidad'),
      render: (val) => <span className="tabular-nums">{val}</span>,
    },
    {
      key: 'estado',
      header: t('Estado'),
      render: (_, row) => {
        const key = loteEstado(row)
        const cfg = estadoBadge[key] ?? { label: key, variant: 'default' }
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>
      },
    },
  ], [t, estadoBadge])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title={t('Lotes')}
        description={t('Control de lotes y fechas de vencimiento')}
      />

      <DataTable
        columns={columns}
        data={lotes}
        loading={isLoading}
        emptyTitle={t('Sin lotes registrados')}
        emptyDescription={t('No hay lotes para mostrar.')}
      />

      {meta?.pagination && (
        <Pagination meta={meta} onPageChange={setPage} />
      )}
    </div>
  )
}
