import { useQuery } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { getAlertas } from '@/api/administracion'

const titles = {
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
  '/fidelizacion/reglas': 'Reglas de Fidelización',
  '/fidelizacion/canjes': 'Canjes',
  '/reportes': 'Reportes',
  '/almacen/layout': 'Layout del Almacén',
  '/almacen/codigos': 'Códigos y QR',
  '/administracion/auditoria': 'Auditoría',
  '/administracion/configuracion': 'Configuración',
  '/chatbot': 'Asistente IA',
}

export default function Header() {
  const { pathname } = useLocation()

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
    <header className="h-14 bg-white border-b border-zinc-200 px-6 flex items-center justify-between shrink-0">
      <h1 className="text-sm font-semibold text-zinc-900">{titles[pathname] ?? 'Warehouse IQ'}</h1>
      <button
        type="button"
        className="relative p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors"
        title={alertCount > 0 ? `${alertCount} alertas pendientes` : 'Sin alertas pendientes'}
      >
        <Bell size={16} />
        {alertCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {alertCount > 99 ? '99+' : alertCount}
          </span>
        )}
      </button>
    </header>
  )
}
