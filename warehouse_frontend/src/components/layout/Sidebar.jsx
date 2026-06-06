import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import {
  LayoutDashboard, Package, ArrowLeftRight, Users, Gift,
  FileText, Map, QrCode, ShieldCheck, Settings, MessageCircle,
  LogOut, Boxes, MapPin, TrendingUp
} from 'lucide-react'

const navGroups = [
  {
    label: null,
    items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }]
  },
  {
    label: 'Inventario',
    items: [
      { to: '/inventario/productos', icon: Package, label: 'Productos' },
      { to: '/inventario/categorias', icon: Boxes, label: 'Categorías' },
      { to: '/inventario/ubicaciones', icon: MapPin, label: 'Ubicaciones' },
    ]
  },
  {
    label: 'Operaciones',
    items: [
      { to: '/movimientos', icon: ArrowLeftRight, label: 'Movimientos' },
      { to: '/movimientos/entrada', icon: TrendingUp, label: 'Entrada' },
      { to: '/movimientos/salida', icon: TrendingUp, label: 'Salida', iconClass: 'rotate-180' },
      { to: '/movimientos/traslado', icon: Map, label: 'Traslado' },
    ]
  },
  {
    label: 'Terceros',
    items: [
      { to: '/terceros/proveedores', icon: Users, label: 'Proveedores' },
      { to: '/terceros/clientes', icon: Users, label: 'Clientes' },
    ]
  },
  {
    label: 'Fidelización',
    items: [
      { to: '/fidelizacion/reglas', icon: Gift, label: 'Reglas' },
      { to: '/fidelizacion/canjes', icon: Gift, label: 'Canjes' },
    ]
  },
  {
    label: 'Almacén',
    items: [
      { to: '/almacen/layout', icon: Map, label: 'Layout' },
      { to: '/almacen/codigos', icon: QrCode, label: 'Códigos / QR' },
    ]
  },
  {
    label: 'Reportes',
    items: [
      { to: '/reportes', icon: FileText, label: 'Reportes' },
    ]
  },
  {
    label: 'Administración',
    items: [
      { to: '/administracion/auditoria', icon: ShieldCheck, label: 'Auditoría' },
      { to: '/administracion/configuracion', icon: Settings, label: 'Configuración' },
      { to: '/chatbot', icon: MessageCircle, label: 'Asistente IA' },
    ]
  },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className="w-60 h-screen bg-white border-r border-zinc-200 flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-zinc-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-zinc-900 rounded-lg flex items-center justify-center">
            <Package size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-zinc-900 tracking-tight">Warehouse IQ</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-2 mb-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => cn(
                    'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors duration-150',
                    isActive
                      ? 'bg-zinc-900 text-white font-medium'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  )}
                >
                  <item.icon size={15} className={item.iconClass} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-zinc-100">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-600">
            {user?.nombre?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-900 truncate">{user?.nombre ?? 'Usuario'}</p>
            <p className="text-[10px] text-zinc-500 truncate">{user?.email ?? ''}</p>
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-red-500 transition-colors">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}
