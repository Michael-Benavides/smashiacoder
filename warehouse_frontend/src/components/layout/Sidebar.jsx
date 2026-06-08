import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'
import {
  LayoutDashboard, Package, ArrowLeftRight, Users, Gift,
  ShieldCheck, Settings, MessageCircle, Boxes, MapPin,
  Map, QrCode, TrendingUp, ChevronRight, Warehouse, FileBarChart, Zap,
} from 'lucide-react'
import { BrandName } from '@/components/shared/BrandName'
import { usePermissions } from '@/hooks/usePermissions'
import { useSidebarStore } from '@/store/sidebarStore'
import UserMenu from './UserMenu'

const STORAGE_KEY = 'wi_sidebar_groups'

const GROUP_ICONS = {
  'Inventario': Boxes,
  'Operaciones': ArrowLeftRight,
  'Terceros': Users,
  'Fidelización': Gift,
  'Almacén': Warehouse,
  'Reportes': FileBarChart,
  'Administración': ShieldCheck,
}

const navGroups = [
  {
    labelKey: 'Inventario',
    items: [
      { to: '/inventario/productos', icon: Package, labelKey: 'Productos' },
      { to: '/inventario/categorias', icon: Boxes, labelKey: 'Categorías' },
      { to: '/inventario/ubicaciones', icon: MapPin, labelKey: 'Ubicaciones' },
    ],
  },
  {
    labelKey: 'Operaciones',
    items: [
      { to: '/movimientos', icon: ArrowLeftRight, labelKey: 'Movimientos' },
      { to: '/movimientos/entrada', icon: TrendingUp, labelKey: 'Entrada' },
      { to: '/movimientos/salida', icon: TrendingUp, labelKey: 'Salida', iconClass: 'rotate-180' },
      { to: '/movimientos/traslado', icon: Map, labelKey: 'Traslado' },
    ],
  },
  {
    labelKey: 'Terceros',
    items: [
      { to: '/terceros/proveedores', icon: Users, labelKey: 'Proveedores' },
      { to: '/terceros/clientes', icon: Users, labelKey: 'Clientes' },
    ],
  },
  {
    labelKey: 'Fidelización',
    items: [
      { to: '/fidelizacion/reglas', icon: Gift, labelKey: 'Reglas' },
      { to: '/fidelizacion/canjes', icon: Gift, labelKey: 'Canjes' },
    ],
  },
  {
    labelKey: 'Almacén',
    items: [
      { to: '/almacen/layout', icon: Map, labelKey: 'Layout' },
      { to: '/almacen/codigos', icon: QrCode, labelKey: 'Códigos / QR' },
    ],
  },
  {
    labelKey: 'Reportes',
    adminOnly: true,
    items: [
      { to: '/reportes', icon: FileBarChart, labelKey: 'Reportes' },
    ],
  },
  {
    labelKey: 'Administración',
    adminOnly: true,
    items: [
      { to: '/administracion/auditoria', icon: ShieldCheck, labelKey: 'Auditoría' },
      { to: '/administracion/configuracion', icon: Settings, labelKey: 'Configuración' },
    ],
  },
]

const activeNavStyle = {
  backgroundColor: 'var(--sidebar-active-bg)',
  color: 'var(--sidebar-active-color)',
  borderLeftColor: 'var(--accent-color)',
}

function loadGroupState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {}
}

function isRouteActive(pathname, to) {
  return pathname === to || pathname.startsWith(`${to}/`)
}

function TopNavItem({ to, icon: Icon, label, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) => cn(
        'mb-1 flex min-h-[40px] items-center gap-3 rounded-xl px-3 py-2.5',
        'text-sm transition-all duration-150 active:scale-95',
        isActive ? 'font-semibold shadow-inner' : 'font-medium text-zinc-300 hover:bg-zinc-800/80 hover:text-white',
      )}
      style={({ isActive }) => (isActive ? activeNavStyle : undefined)}
    >
      {({ isActive }) => (
        <>
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={isActive
              ? { backgroundColor: 'color-mix(in srgb, var(--accent-color) 20%, transparent)' }
              : undefined}
          >
            <Icon
              size={17}
              className={isActive ? 'text-[var(--accent-color)]' : 'text-zinc-400'}
            />
          </div>
          {label}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const { pathname } = useLocation()
  const { t } = useT()
  const { isAdmin } = usePermissions()
  const mobileOpen = useSidebarStore((s) => s.mobileOpen)
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen)
  const [expanded, setExpanded] = useState(loadGroupState)

  const closeMobile = () => setMobileOpen(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname, setMobileOpen])

  const gruposFiltrados = useMemo(
    () => navGroups.filter((g) => !g.adminOnly || isAdmin),
    [isAdmin],
  )

  const activeGroupLabel = useMemo(() => {
    for (const group of gruposFiltrados) {
      if (group.items.some((item) => isRouteActive(pathname, item.to))) {
        return group.labelKey
      }
    }
    return null
  }, [pathname, gruposFiltrados])

  useEffect(() => {
    if (activeGroupLabel) {
      setExpanded((prev) => {
        if (prev[activeGroupLabel]) return prev
        const next = { ...prev, [activeGroupLabel]: true }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
    }
  }, [activeGroupLabel])

  function toggleGroup(labelKey) {
    setExpanded((prev) => {
      const next = { ...prev, [labelKey]: !prev[labelKey] }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col',
          'border-r border-zinc-800 bg-[#0F0F11] transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:static lg:translate-x-0',
        )}
      >
      <div className="border-b border-[#1F1F23] px-5 py-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'var(--accent-color)', animation: 'pulse-glow 2s ease-in-out infinite' }}
          >
            <Zap size={15} className="text-white" />
          </div>
          <BrandName className="font-black tracking-tight text-white" />
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        <TopNavItem to="/dashboard" icon={LayoutDashboard} label={t('Dashboard')} onNavigate={closeMobile} />
        <TopNavItem to="/chatbot" icon={MessageCircle} label={t('Asistente IA')} onNavigate={closeMobile} />

        {gruposFiltrados.map((group) => {
          const GroupIcon = GROUP_ICONS[group.labelKey]
          const isOpen = expanded[group.labelKey] || group.labelKey === activeGroupLabel

          return (
            <div key={group.labelKey} className="mb-1">
              <button
                type="button"
                onClick={() => toggleGroup(group.labelKey)}
                className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-zinc-300 transition-all duration-200 hover:bg-zinc-800/80 hover:text-white"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 transition-colors duration-200 group-hover:bg-zinc-700">
                  <GroupIcon
                    size={16}
                    className="text-zinc-400 transition-colors duration-200 group-hover:text-[var(--accent-color)]"
                  />
                </div>
                <span className="flex-1 text-left text-sm font-semibold tracking-wide">
                  {t(group.labelKey)}
                </span>
                <ChevronRight
                  size={14}
                  className={cn(
                    'text-zinc-600 transition-transform duration-300',
                    isOpen && 'rotate-90 text-[var(--accent-color)]',
                  )}
                />
              </button>

              {isOpen && (
                <div className="submenu-open relative ml-4 border-l border-zinc-700/50 pl-4">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={closeMobile}
                      className={({ isActive }) => cn(
                        'relative mb-0.5 flex min-h-[40px] items-center gap-2.5 rounded-lg px-3 py-2',
                        'text-sm transition-all duration-150 active:scale-95',
                        isActive
                          ? 'border-l-2 pl-[9px] font-semibold sidebar-item-active'
                          : 'font-medium text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100',
                      )}
                      style={({ isActive }) => (isActive ? activeNavStyle : undefined)}
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cn(
                              'absolute left-[-4.5px] rounded-full',
                              isActive
                                ? 'h-1.5 w-1.5 shrink-0 animate-pulse'
                                : 'h-2 w-2 border-2 border-zinc-600 bg-zinc-900',
                            )}
                            style={isActive ? { backgroundColor: 'var(--accent-color)' } : undefined}
                          />
                          <item.icon
                            size={15}
                            className={cn(item.iconClass, isActive && 'text-[var(--accent-color)]')}
                          />
                          <span>{t(item.labelKey)}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <UserMenu />
    </aside>
    </>
  )
}
