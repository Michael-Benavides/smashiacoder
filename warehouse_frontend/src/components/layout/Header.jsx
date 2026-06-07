import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bell, Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { getAlertas } from '@/api/administracion'
import { useSidebarStore } from '@/store/sidebarStore'
import { useT } from '@/hooks/useT'

const TITLE_KEYS = {
  '/dashboard': 'Dashboard',
  '/inventario/productos': 'Productos',
  '/inventario/categorias': 'Categorías',
  '/inventario/ubicaciones': 'Ubicaciones',
  '/movimientos': 'Movimientos',
  '/movimientos/entrada': 'Entrada de Inventario',
  '/movimientos/salida': 'Salida de Inventario',
  '/movimientos/traslado': 'Traslado',
  '/terceros/proveedores': 'Proveedores',
  '/terceros/clientes': 'Clientes',
  '/fidelizacion/reglas': 'Reglas',
  '/fidelizacion/canjes': 'Canjes',
  '/reportes': 'Reportes',
  '/almacen/layout': 'Layout Almacén',
  '/almacen/codigos': 'Códigos QR',
  '/administracion/auditoria': 'Auditoría',
  '/administracion/configuracion': 'Configuración',
  '/chatbot': 'Asistente IA',
}

export default function Header() {
  const { pathname } = useLocation()
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen)
  const { t } = useT()

  const { data: alertas = [] } = useQuery({
    queryKey: ['alertas-header'],
    queryFn: async () => {
      const res = await getAlertas()
      return res.data.data ?? []
    },
    refetchInterval: 60000,
  })

  const alertCount = Array.isArray(alertas) ? alertas.length : 0
  const pageTitle = useMemo(() => {
    const key = TITLE_KEYS[pathname]
    return key ? t(key) : 'SmashIACodeR'
  }, [pathname, t])

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 lg:hidden"
          aria-label={t('Abrir menú')}
        >
          <Menu size={20} />
        </button>
        <h1 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {pageTitle}
        </h1>
      </div>
      <button
        type="button"
        className="relative shrink-0 rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-700 dark:hover:bg-zinc-800"
        title={alertCount > 0 ? `${alertCount} ${t('Alertas')}` : t('Sin alertas')}
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
