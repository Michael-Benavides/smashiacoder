import { useQuery } from '@tanstack/react-query'
import { Bell, ChevronRight } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { getAlertas } from '@/api/administracion'
import { useAuthStore } from '@/store/authStore'
import { useI18n } from '@/lib/i18n'

const breadcrumbKeys = {
  '/dashboard': ['nav.dashboard'],
  '/inventario/productos': ['nav.inventory', 'nav.products'],
  '/inventario/categorias': ['nav.inventory', 'nav.categories'],
  '/inventario/ubicaciones': ['nav.inventory', 'nav.locations'],
  '/movimientos': ['nav.operations', 'nav.movements'],
  '/movimientos/entrada': ['nav.operations', 'nav.entry'],
  '/movimientos/salida': ['nav.operations', 'nav.exit'],
  '/movimientos/traslado': ['nav.operations', 'nav.transfer'],
  '/terceros/proveedores': ['nav.thirdParties', 'nav.suppliers'],
  '/terceros/clientes': ['nav.thirdParties', 'nav.clients'],
  '/fidelizacion/reglas': ['nav.loyalty', 'nav.rules'],
  '/fidelizacion/canjes': ['nav.loyalty', 'nav.redemptions'],
  '/reportes': ['nav.reports'],
  '/almacen/layout': ['nav.warehouse', 'nav.layout'],
  '/almacen/codigos': ['nav.warehouse', 'nav.codes'],
  '/administracion/auditoria': ['nav.admin', 'nav.audit'],
  '/administracion/configuracion': ['nav.admin', 'nav.settings'],
  '/chatbot': ['nav.assistant'],
}

export default function Header() {
  const { pathname } = useLocation()
  const { user } = useAuthStore()
  const t = useI18n((s) => s.t)
  const language = useI18n((s) => s.language)

  const crumbKeys = breadcrumbKeys[pathname] ?? ['nav.dashboard']
  const firstName = user?.nombre?.split(' ')[0] ?? 'Usuario'

  const hour = new Date().getHours()
  const greetingKey = hour < 12 ? 'greeting.morning' : hour < 19 ? 'greeting.afternoon' : 'greeting.evening'

  const { data: alertas = [] } = useQuery({
    queryKey: ['alertas-header'],
    queryFn: async () => {
      const res = await getAlertas()
      return res.data.data ?? []
    },
    refetchInterval: 60000,
  })

  const alertCount = Array.isArray(alertas) ? alertas.length : 0

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6 shadow-sm">
      <div>
        <p className="text-xs text-zinc-500">
          {t(greetingKey)}, <span className="font-medium text-zinc-700">{firstName}</span>
        </p>
        <nav className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-zinc-900">
          {crumbKeys.map((key, i) => (
            <span key={`${key}-${language}`} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={12} className="text-zinc-400" />}
              <span className={i === crumbKeys.length - 1 ? 'text-zinc-900' : 'text-zinc-500'}>
                {t(key)}
              </span>
            </span>
          ))}
        </nav>
      </div>
      <button
        type="button"
        className="relative rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
        title={alertCount > 0 ? `${alertCount} alertas` : 'Sin alertas'}
      >
        <Bell size={16} />
        {alertCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 animate-bounce items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
            {alertCount > 99 ? '99+' : alertCount}
          </span>
        )}
      </button>
    </header>
  )
}
