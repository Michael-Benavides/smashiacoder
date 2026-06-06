import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Package,
  Users,
  AlertTriangle,
  Truck,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
} from 'lucide-react'
import { getDashboard, getDashboardGraficas } from '@/api/administracion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

const KPI_CONFIG = [
  { key: 'total_productos_activos', label: 'Productos activos', icon: Package, color: 'text-zinc-700' },
  { key: 'total_clientes_activos', label: 'Clientes activos', icon: Users, color: 'text-blue-600' },
  { key: 'alertas_no_atendidas', label: 'Alertas pendientes', icon: AlertTriangle, color: 'text-red-600' },
  { key: 'total_proveedores_activos', label: 'Proveedores activos', icon: Truck, color: 'text-zinc-700' },
]

const TIPO_BADGE = {
  entrada: { variant: 'success', label: 'Entrada' },
  salida: { variant: 'danger', label: 'Salida' },
  traslado: { variant: 'info', label: 'Traslado' },
}

function KpiCard({ icon: Icon, label, value, iconColor }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
          <Icon size={20} className={iconColor} />
        </div>
        <div>
          <p className="text-2xl font-bold text-zinc-900 tabular-nums">{value ?? 0}</p>
          <p className="text-xs text-zinc-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function formatFecha(iso) {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), "dd MMM yyyy, HH:mm", { locale: es })
  } catch {
    return iso
  }
}

function formatChartFecha(iso) {
  if (!iso) return ''
  try {
    return format(parseISO(iso), 'dd MMM', { locale: es })
  } catch {
    return iso
  }
}

export default function DashboardPage() {
  const navigate = useNavigate()

  const { data: dashboard, isLoading: loadingDashboard } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await getDashboard()
      return res.data.data
    },
  })

  const { data: graficas, isLoading: loadingGraficas } = useQuery({
    queryKey: ['dashboard-graficas'],
    queryFn: async () => {
      const res = await getDashboardGraficas()
      return res.data.data
    },
  })

  if (loadingDashboard || loadingGraficas) {
    return <LoadingSpinner className="min-h-[400px]" />
  }

  const chartData = (graficas?.movimientos_por_dia ?? []).map((d) => ({
    ...d,
    fechaLabel: formatChartFecha(d.fecha),
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_CONFIG.map(({ key, label, icon, color }) => (
          <KpiCard
            key={key}
            icon={icon}
            label={label}
            value={dashboard?.[key]}
            iconColor={color}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimientos — últimos 30 días</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500">
              Sin movimientos registrados en el período.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
                <XAxis
                  dataKey="fechaLabel"
                  tick={{ fontSize: 11, fill: '#71717A' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E4E4E7' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#71717A' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E4E4E7' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E4E4E7',
                    fontSize: '13px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '13px' }} />
                <Line
                  type="monotone"
                  dataKey="entradas"
                  name="Entradas"
                  stroke="#16A34A"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="salidas"
                  name="Salidas"
                  stroke="#DC2626"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="traslados"
                  name="Traslados"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-500" />
              Stock bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!dashboard?.productos_stock_bajo?.length ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                Todos los productos tienen stock suficiente.
              </p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {dashboard.productos_stock_bajo.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900">{p.nombre}</p>
                      <p className="text-xs text-zinc-500">
                        {p.codigo} · {p.categoria ?? 'Sin categoría'}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="danger">
                          {p.stock_actual} / mín. {p.stock_minimo} {p.unidad_medida}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/movimientos/entrada')}
                    >
                      Atender
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight size={15} className="text-zinc-600" />
              Movimientos recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!dashboard?.movimientos_recientes?.length ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                No hay movimientos registrados aún.
              </p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {dashboard.movimientos_recientes.map((m) => {
                  const tipo = TIPO_BADGE[m.tipo] ?? { variant: 'default', label: m.tipo ?? '—' }
                  const TipoIcon =
                    m.tipo === 'entrada' ? ArrowDownLeft
                    : m.tipo === 'salida' ? ArrowUpRight
                    : ArrowLeftRight
                  return (
                    <li key={m.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                        <TipoIcon size={14} className="text-zinc-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={tipo.variant}>{tipo.label}</Badge>
                          <span className="text-xs text-zinc-500">{m.cantidad} uds.</span>
                        </div>
                        <p className="mt-1 truncate text-sm font-medium text-zinc-900">
                          {m.producto?.nombre ?? 'Producto'}
                        </p>
                        <p className="text-xs text-zinc-500">{formatFecha(m.fecha)}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
