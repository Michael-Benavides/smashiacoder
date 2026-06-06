import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Package, X } from 'lucide-react'
import PageHeader from '@/components/layout/PageHeader'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { getProductos, getUbicaciones } from '@/api/inventario'
import { cn } from '@/lib/utils'

const MAX_PRODUCTOS_CAP = 8

function getOcupacion(productosEnUbicacion) {
  const count = productosEnUbicacion.length
  const hasStockBajo = productosEnUbicacion.some(
    (p) => p.stock_bajo || p.stock_actual <= p.stock_minimo
  )
  const pct = Math.min(100, (count / MAX_PRODUCTOS_CAP) * 100)

  if (hasStockBajo) return { pct, level: 'danger', label: 'Stock bajo' }
  if (pct < 50) return { pct, level: 'low', label: 'Disponible' }
  if (pct < 80) return { pct, level: 'medium', label: 'Moderado' }
  return { pct, level: 'high', label: 'Alta ocupación' }
}

const CELL_STYLES = {
  low: 'bg-green-50 border-green-200 hover:bg-green-100',
  medium: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
  high: 'bg-red-50 border-red-200 hover:bg-red-100',
  danger: 'bg-red-100 border-red-300 hover:bg-red-200',
}

export default function LayoutAlmacenPage() {
  const [selectedUbicacion, setSelectedUbicacion] = useState(null)

  const { data: ubicaciones = [], isLoading: loadingUbicaciones } = useQuery({
    queryKey: ['ubicaciones', 'layout'],
    queryFn: async () => {
      const res = await getUbicaciones({ solo_activos: true })
      return res.data.data ?? []
    },
  })

  const { data: productos = [], isLoading: loadingProductos } = useQuery({
    queryKey: ['productos', 'layout'],
    queryFn: async () => {
      const res = await getProductos({ solo_activos: true })
      return res.data.data ?? []
    },
  })

  const productosPorUbicacion = useMemo(() => {
    const map = new Map()
    productos.forEach((p) => {
      const list = map.get(p.ubicacion_id) ?? []
      list.push(p)
      map.set(p.ubicacion_id, list)
    })
    return map
  }, [productos])

  const zonas = useMemo(() => {
    const groups = new Map()
    ubicaciones.forEach((u) => {
      const zona = u.zona?.trim() || 'Sin zona'
      const list = groups.get(zona) ?? []
      list.push(u)
      groups.set(zona, list)
    })
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [ubicaciones])

  const selectedProductos = selectedUbicacion
    ? productosPorUbicacion.get(selectedUbicacion.id) ?? []
    : []

  const isLoading = loadingUbicaciones || loadingProductos

  return (
    <div className="relative">
      <PageHeader
        title="Layout del almacén"
        description="Vista interactiva de ubicaciones agrupadas por zona"
      />

      {isLoading ? (
        <LoadingSpinner className="min-h-[300px]" />
      ) : ubicaciones.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-zinc-500">
            No hay ubicaciones registradas. Crea ubicaciones en Inventario → Ubicaciones.
          </CardContent>
        </Card>
      ) : (
        <div className={cn('flex gap-6', selectedUbicacion && 'lg:pr-80')}>
          <div className="flex-1 space-y-8">
            {zonas.map(([zona, items], zoneIndex) => (
              <section
                key={zona}
                className={cn(
                  zoneIndex > 0 && 'border-t-4 border-zinc-300 pt-8'
                )}
              >
                <div className="mb-4 flex items-center gap-2">
                  <MapPin size={16} className="text-zinc-500" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-700">
                    Zona: {zona}
                  </h2>
                  <Badge variant="info">{items.length} ubicaciones</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {items.map((u) => {
                    const prods = productosPorUbicacion.get(u.id) ?? []
                    const occ = getOcupacion(prods)
                    const isSelected = selectedUbicacion?.id === u.id

                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setSelectedUbicacion(u)}
                        className={cn(
                          'rounded-xl border-2 p-3 text-left transition-all',
                          CELL_STYLES[occ.level],
                          isSelected && 'ring-2 ring-zinc-900 ring-offset-2'
                        )}
                      >
                        <p className="truncate text-sm font-semibold text-zinc-900">{u.nombre}</p>
                        <p className="mt-0.5 truncate text-xs text-zinc-500">{u.zona || '—'}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="flex items-center gap-1 text-xs text-zinc-600">
                            <Package size={12} />
                            {prods.length}
                          </span>
                          <Badge
                            variant={occ.level === 'low' ? 'success' : occ.level === 'medium' ? 'warning' : 'danger'}
                          >
                            {occ.label}
                          </Badge>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/60">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              occ.level === 'low' && 'bg-green-500',
                              occ.level === 'medium' && 'bg-amber-500',
                              (occ.level === 'high' || occ.level === 'danger') && 'bg-red-500'
                            )}
                            style={{ width: `${occ.pct}%` }}
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}

            <div className="flex flex-wrap gap-4 rounded-lg border border-zinc-200 bg-white p-4 text-xs text-zinc-600">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-green-200" /> &lt; 50% ocupación
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-amber-200" /> 50–80%
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded bg-red-200" /> &gt; 80% o stock bajo
              </span>
            </div>
          </div>

          {selectedUbicacion && (
            <aside className="fixed right-0 top-0 z-30 flex h-full w-full max-w-sm flex-col border-l border-zinc-200 bg-white shadow-xl lg:top-auto lg:h-[calc(100vh-4rem)]">
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                <div>
                  <h3 className="font-semibold text-zinc-900">{selectedUbicacion.nombre}</h3>
                  <p className="text-xs text-zinc-500">{selectedUbicacion.zona}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUbicacion(null)}
                  className="rounded-lg p-1.5 hover:bg-zinc-100"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                {selectedProductos.length === 0 ? (
                  <p className="text-sm text-zinc-500">Sin productos asignados a esta ubicación.</p>
                ) : (
                  <ul className="space-y-3">
                    {selectedProductos.map((p) => {
                      const bajo = p.stock_bajo || p.stock_actual <= p.stock_minimo
                      return (
                        <li key={p.id} className="rounded-lg border border-zinc-100 p-3">
                          <p className="text-sm font-medium text-zinc-900">{p.nombre}</p>
                          <p className="text-xs text-zinc-500">{p.codigo}</p>
                          <div className="mt-2">
                            <Badge variant={bajo ? 'danger' : 'success'}>
                              Stock: {p.stock_actual} {p.unidad_medida}
                            </Badge>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  )
}
