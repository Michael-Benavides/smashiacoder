import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Clock } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import { SearchableSelect } from '@/components/shared/SearchableSelect'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { useT } from '@/hooks/useT'
import { getProductos, getTimeline } from '@/api/inventario'

function formatFecha(iso) {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), "dd MMM yyyy · HH:mm", { locale: es })
  } catch {
    return iso
  }
}

export default function TimelinePage() {
  const { t } = useT()
  const [productoId, setProductoId] = useState('')

  const tipoConfig = useMemo(() => ({
    entrada: { variant: 'success', label: t('Entrada'), Icon: ArrowDownLeft, color: 'border-green-200 bg-green-50' },
    salida: { variant: 'danger', label: t('Salida'), Icon: ArrowUpRight, color: 'border-red-200 bg-red-50' },
    traslado: { variant: 'info', label: t('Traslado'), Icon: ArrowLeftRight, color: 'border-blue-200 bg-blue-50' },
  }), [t])

  const { data: productos = [] } = useQuery({
    queryKey: ['productos', 'activos'],
    queryFn: async () => {
      const res = await getProductos({ solo_activos: true })
      return res.data.data ?? []
    },
  })

  const productoOptions = useMemo(
    () => productos.map((p) => ({
      value: String(p.id),
      label: `${p.codigo} — ${p.nombre}`,
    })),
    [productos]
  )

  const selectedProducto = productos.find((p) => String(p.id) === productoId)

  const { data: timeline = [], isLoading } = useQuery({
    queryKey: ['timeline', productoId],
    queryFn: async () => {
      const res = await getTimeline(Number(productoId))
      return res.data.data ?? []
    },
    enabled: !!productoId,
  })

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title={t('Timeline de producto')}
        description={t('Historial cronológico de movimientos por producto')}
      />

      <div className="mb-6 max-w-md">
        <SearchableSelect
          label={t('Producto')}
          options={productoOptions}
          value={productoId}
          onChange={setProductoId}
          placeholder={t('Seleccionar producto...')}
          searchPlaceholder={t('Código o nombre...')}
        />
      </div>

      {!productoId ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-zinc-500">
            {t('Selecciona un producto para ver su línea de tiempo.')}
          </CardContent>
        </Card>
      ) : isLoading ? (
        <LoadingSpinner className="min-h-[200px]" />
      ) : timeline.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-zinc-500">
            {selectedProducto?.nombre} {t('no tiene movimientos registrados.')}
          </CardContent>
        </Card>
      ) : (
        <div className="relative max-w-2xl">
          <div className="absolute left-5 top-2 bottom-2 w-px bg-zinc-200" />
          <ul className="space-y-4">
            {[...timeline].reverse().map((event) => {
              const cfg = tipoConfig[event.tipo] ?? {
                variant: 'default',
                label: event.tipo,
                Icon: Clock,
                color: 'border-zinc-200 bg-zinc-50',
              }
              const Icon = cfg.Icon
              return (
                <li key={event.id} className="relative flex gap-4 pl-12">
                  <div className={`absolute left-2 flex h-7 w-7 items-center justify-center rounded-full border ${cfg.color}`}>
                    <Icon size={14} />
                  </div>
                  <Card className="flex-1">
                    <CardContent className="py-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          <span className="text-sm font-semibold text-zinc-900">
                            {event.cantidad} {t('uds.')}
                          </span>
                        </div>
                        <time className="text-xs text-zinc-500">{formatFecha(event.fecha)}</time>
                      </div>
                      <p className="mt-2 text-sm text-zinc-600">
                        {t('Stock')}: {event.stock_anterior} → <span className="font-medium">{event.stock_nuevo}</span>
                      </p>
                      {event.lote_numero && (
                        <p className="mt-1 text-xs text-zinc-500">{t('Lote')}: {event.lote_numero}</p>
                      )}
                      {event.observaciones && (
                        <p className="mt-2 text-sm text-zinc-500">{event.observaciones}</p>
                      )}
                      <p className="mt-2 text-xs text-zinc-400">
                        {t('Usuario')} #{event.usuario_id ?? '—'}
                      </p>
                    </CardContent>
                  </Card>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
