import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO, subDays, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Package,
  Users,
  AlertTriangle,
  Truck,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Lightbulb,
  ArrowRight,
  FileBarChart,
  MessageCircle,
} from 'lucide-react'
import { getDashboard, getDashboardGraficas } from '@/api/administracion'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useAuthStore } from '@/store/authStore'
import { useT } from '@/hooks/useT'
import { useDarkMode, resolveIconBg } from '@/hooks/useDarkMode'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/utils'

const LINE_ANIMATION = {
  isAnimationActive: true,
  animationDuration: 1500,
  animationEasing: 'ease-out',
}

function KpiCard({ card, index, isDark, heading }) {
  const count = useCountUp(card.value)
  const Icon = card.icon

  return (
    <div
      style={{
        opacity: 0,
        animation: 'fadeInUp 0.5s ease forwards',
        animationDelay: `${index * 100}ms`,
      }}
    >
      <Link
        to={card.href}
        className="card-gold-border hover-lift group relative block"
      >
        <div className="card-gold-inner p-5">
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: resolveIconBg(card.bgColor, isDark) }}
            >
              <Icon size={22} style={{ color: card.iconColor }} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                {card.label}
              </span>
              <span className={cn('text-2xl font-bold leading-tight tabular-nums', heading)}>
                {count}
              </span>
              <span className={cn('mt-0.5 text-xs font-medium', card.statusColor)}>
                {card.status}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

const RANGE_MAP = { '7D': 7, '15D': 15, '30D': 30 }

const QUICK_ACCESS = [
  { labelKey: 'Entrada', icon: TrendingUp, color: '#16A34A', bg: '#F0FDF4', href: '/movimientos/entrada' },
  { labelKey: 'Salida', icon: TrendingDown, color: '#DC2626', bg: '#FEF2F2', href: '/movimientos/salida' },
  { labelKey: 'Traslado', icon: ArrowLeftRight, color: '#2563EB', bg: '#EFF6FF', href: '/movimientos/traslado' },
  { labelKey: 'Reportes', icon: FileBarChart, color: '#7C3AED', bg: '#F5F3FF', href: '/reportes' },
  { labelKey: 'Asistente IA', icon: MessageCircle, color: '#D97706', bg: '#FEF3C7', href: '/chatbot' },
]

function greetingKey() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function DashboardPage() {
  const { t } = useT()
  const user = useAuthStore((s) => s.user)
  const isDark = useDarkMode()
  const [rango, setRango] = useState('30D')
  const rangeDays = RANGE_MAP[rango]

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

  const kpis = dashboard ?? {}

  const cards = useMemo(() => [
    {
      label: t('Productos'),
      value: kpis.total_productos_activos ?? 0,
      icon: Package,
      bgColor: '#FEF3C7',
      iconColor: '#D97706',
      status: 'En inventario',
      statusColor: 'text-amber-500',
      href: '/inventario/productos',
    },
    {
      label: t('Clientes'),
      value: kpis.total_clientes_activos ?? 0,
      icon: Users,
      bgColor: '#EFF6FF',
      iconColor: '#2563EB',
      status: 'Activos',
      statusColor: 'text-blue-500',
      href: '/terceros/clientes',
    },
    {
      label: t('Alertas'),
      value: kpis.alertas_no_atendidas ?? 0,
      icon: AlertTriangle,
      bgColor: (kpis.alertas_no_atendidas ?? 0) > 0 ? '#FEF2F2' : '#F0FDF4',
      iconColor: (kpis.alertas_no_atendidas ?? 0) > 0 ? '#DC2626' : '#16A34A',
      status: (kpis.alertas_no_atendidas ?? 0) > 0 ? '⚠ Requieren atención' : '✓ Todo en orden',
      statusColor: (kpis.alertas_no_atendidas ?? 0) > 0 ? 'text-red-500' : 'text-green-500',
      href: '/administracion/auditoria',
    },
    {
      label: t('Proveedores'),
      value: kpis.total_proveedores_activos ?? 0,
      icon: Truck,
      bgColor: '#F0FDF4',
      iconColor: '#16A34A',
      status: 'Registrados',
      statusColor: 'text-green-500',
      href: '/terceros/proveedores',
    },
  ], [kpis, t])

  const datosGrafica = useMemo(() => {
    const cutoff = subDays(new Date(), rangeDays)
    return (graficas?.movimientos_por_dia ?? [])
      .filter((d) => {
        try {
          return parseISO(d.fecha) >= cutoff
        } catch {
          return true
        }
      })
      .map((d) => ({
        fecha: format(parseISO(d.fecha), 'dd/MM', { locale: es }),
        entradas: d.entradas || d.entrada || 0,
        salidas: d.salidas || d.salida || 0,
        traslados: d.traslados || d.traslado || 0,
      }))
  }, [graficas, rangeDays])

  const valorInventario = Number(kpis.valor_total_inventario) || 0
  const lotesCount = kpis.lotes_por_vencer?.length ?? 0
  const movimientos = kpis.movimientos_recientes ?? []
  const nombre = user?.nombre?.split(' ')[0] ?? 'Usuario'

  const surface = isDark
    ? 'bg-zinc-900 border-zinc-800'
    : 'bg-white border-zinc-100'
  const heading = isDark ? 'text-zinc-100' : 'text-zinc-900'
  const subtext = isDark ? 'text-zinc-400' : 'text-zinc-500'
  const label = isDark ? 'text-zinc-300' : 'text-zinc-700'
  const pill = isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'
  const rangeWrap = isDark ? 'bg-zinc-800' : 'bg-zinc-100'
  const rangeActive = isDark ? 'bg-zinc-700 text-zinc-100' : 'bg-white text-zinc-900'
  const rangeIdle = isDark
    ? 'text-zinc-400 hover:text-zinc-300'
    : 'text-zinc-500 hover:text-zinc-700'
  const activityTitle = isDark ? 'text-zinc-200' : 'text-zinc-800'
  const divider = isDark ? 'divide-zinc-800' : 'divide-zinc-50'

  if (loadingDashboard || loadingGraficas) {
    return <LoadingSpinner className="min-h-[400px]" />
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      {/* BLOQUE 1 — Encabezado */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className={cn('text-3xl font-bold', heading)}>
            {t(greetingKey())}, {nombre} 👋
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {format(new Date(), "EEEE dd 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/movimientos/entrada"
            className={cn(
              'rounded-full border px-5 py-5 text-sm font-medium transition-all',
              isDark
                ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50',
            )}
          >
            {t('+ Entrada')}
          </Link>
          <Link
            to="/inventario/productos"
            className="rounded-full px-5 py-5 text-sm font-medium text-white transition-all active:scale-95 hover:opacity-90"
            style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
          >
            {t('Ver Inventario')}
          </Link>
        </div>
      </div>

      {/* BLOQUE 2 — KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {cards.map((card, index) => (
          <KpiCard
            key={card.href}
            card={card}
            index={index}
            isDark={isDark}
            heading={heading}
          />
        ))}
      </div>

      {/* BLOQUE 3 — Gráfica */}
      <div className={cn('rounded-2xl border p-6', surface)}>
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className={cn('text-base font-semibold', heading)}>
              {t('Movimientos del Inventario')}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              {t('Entradas y salidas registradas')}
            </p>
          </div>
          <div className={cn('flex gap-1 rounded-full p-5', rangeWrap)}>
            {['7D', '15D', '30D'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRango(r)}
                className={cn(
                  'rounded-full px-5 py-5 text-xs font-medium transition-all',
                  rango === r ? cn('shadow-sm', rangeActive) : rangeIdle,
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {datosGrafica.length === 0 ? (
          <p className="flex h-[280px] items-center justify-center text-sm text-zinc-400">{t('Sin datos')}</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart key={rango} data={datosGrafica}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" vertical={false} />
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 11, fill: '#A1A1AA' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#A1A1AA' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #E4E4E7',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                }}
              />
              <Line type="monotone" dataKey="entradas" stroke="#16A34A" strokeWidth={2.5} dot={false} {...LINE_ANIMATION} />
              <Line type="monotone" dataKey="salidas" stroke="#DC2626" strokeWidth={2.5} dot={false} {...LINE_ANIMATION} />
              <Line type="monotone" dataKey="traslados" stroke="#2563EB" strokeWidth={2} dot={false} strokeDasharray="4 4" {...LINE_ANIMATION} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* BLOQUE 4 — Insights */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className={cn('flex items-center gap-2 text-base font-semibold', heading)}>
            <Lightbulb size={16} className="text-amber-500" />
            {t('Requiere Atención')}
          </h2>
          <span className={cn('rounded-full px-5 py-5 text-xs font-medium', pill)}>
            {t('ACTUALIZADO AHORA')}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div
            className={cn('rounded-2xl border transition-all duration-300 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10', surface)}
            style={{ padding: '20px' }}
          >
            <span className="rounded-full bg-red-50 px-5 py-5 text-xs font-semibold text-red-600">
              {t('STOCK CRÍTICO')}
            </span>
            <h3 className={cn('mb-2 mt-3 font-semibold', heading)}>
              {kpis.productos_stock_bajo?.length ?? 0} {t('productos bajo mínimo')}
            </h3>
            <p className={cn('text-sm leading-relaxed', subtext)}>
              Algunos productos están por debajo del stock mínimo requerido.
            </p>
            <Link
              to="/inventario/productos"
              className="mt-4 flex items-center gap-1 text-sm font-medium text-amber-500 transition-all hover:gap-2"
            >
              {t('Ver productos')} <ArrowRight size={14} />
            </Link>
          </div>

          <div
            className={cn('rounded-2xl border transition-all duration-300 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10', surface)}
            style={{ padding: '20px' }}
          >
            <span className="rounded-full bg-amber-50 px-5 py-5 text-xs font-semibold text-amber-600">
              {t('INVENTARIO')}
            </span>
            <h3 className={cn('mb-2 mt-3 font-semibold', heading)}>
              {t('Valor total en stock')}
            </h3>
            <p className={cn('text-2xl font-bold', heading)}>
              ${valorInventario.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
            </p>
            <Link
              to="/reportes"
              className="mt-4 flex items-center gap-1 text-sm font-medium text-amber-500 transition-all hover:gap-2"
            >
              {t('Ver reporte')} <ArrowRight size={14} />
            </Link>
          </div>

          <div
            className={cn('rounded-2xl border transition-all duration-300 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/10', surface)}
            style={{ padding: '20px' }}
          >
            <span className="rounded-full bg-blue-50 px-5 py-5 text-xs font-semibold text-blue-600">
              {t('VENCIMIENTOS')}
            </span>
            <h3 className={cn('mb-2 mt-3 font-semibold', heading)}>
              {lotesCount} {t('Lotes próximos a vencer')}
            </h3>
            <p className={cn('text-sm leading-relaxed', subtext)}>
              Revisa los lotes con fecha de vencimiento en los próximos 30 días.
            </p>
            <Link
              to="/inventario/productos"
              className="mt-4 flex items-center gap-1 text-sm font-medium text-amber-500 transition-all hover:gap-2"
            >
              {t('Revisar lotes')} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* BLOQUE 5 — Accesos rápidos */}
      <div>
        <h2 className={cn('mb-4 text-base font-semibold', heading)}>
          {t('Accesos Rápidos')}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {QUICK_ACCESS.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-3 rounded-2xl border p-5 text-center',
                  'hover:-translate-y-2 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-500/10',
                  surface,
                )}
                style={{ transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: resolveIconBg(item.bg, isDark) }}
                >
                  <Icon size={22} style={{ color: item.color }} />
                </div>
                <span className={cn('text-xs font-semibold', label)}>
                  {t(item.labelKey)}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* BLOQUE 6 — Actividad reciente */}
      <div className={cn('rounded-2xl border p-6', surface)}>
        <h2 className={cn('mb-5 text-base font-semibold', heading)}>
          {t('Actividad Reciente')}
        </h2>
        {!movimientos.length ? (
          <p className="text-sm text-zinc-400">{t('Sin movimientos registrados')}</p>
        ) : (
          <div className={cn('divide-y', divider)}>
            {movimientos.slice(0, 6).map((m, i) => (
              <div
                key={m.id}
                className="flex items-center gap-4 py-5"
                style={{
                  opacity: 0,
                  animation: 'fadeInUp 0.4s ease forwards',
                  animationDelay: `${0.8 + i * 0.1}s`,
                }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: resolveIconBg(
                      m.tipo === 'entrada' ? '#F0FDF4' : '#FEF2F2',
                      isDark,
                    ),
                  }}
                >
                  <TrendingUp
                    size={16}
                    style={{
                      color: m.tipo === 'entrada' ? '#16A34A' : '#DC2626',
                      transform: m.tipo === 'salida' ? 'rotate(180deg)' : 'none',
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn('truncate text-sm font-medium', activityTitle)}>
                    {m.producto?.nombre ?? 'Producto'}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {m.tipo} · {m.cantidad} unidades
                  </p>
                </div>
                <span className="shrink-0 text-xs text-zinc-400">
                  {m.fecha
                    ? formatDistanceToNow(parseISO(m.fecha), { locale: es, addSuffix: true })
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
