import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Layout from '@/components/layout/Layout'
import LoginPage from '@/pages/auth/LoginPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import ProductosPage from '@/pages/inventario/ProductosPage'
import CategoriasPage from '@/pages/inventario/CategoriasPage'
import UbicacionesPage from '@/pages/inventario/UbicacionesPage'
import MovimientosPage from '@/pages/movimientos/MovimientosPage'
import EntradaPage from '@/pages/movimientos/EntradaPage'
import SalidaPage from '@/pages/movimientos/SalidaPage'
import TrasladoPage from '@/pages/movimientos/TrasladoPage'
import ProveedoresPage from '@/pages/terceros/ProveedoresPage'
import ClientesPage from '@/pages/terceros/ClientesPage'
import ReglasPage from '@/pages/fidelizacion/ReglasPage'
import CanjesPage from '@/pages/fidelizacion/CanjesPage'
import ReportesPage from '@/pages/reportes/ReportesPage'
import LayoutAlmacenPage from '@/pages/almacen/LayoutAlmacenPage'
import CodigosPage from '@/pages/almacen/CodigosPage'
import AuditoriaPage from '@/pages/administracion/AuditoriaPage'
import ConfiguracionPage from '@/pages/administracion/ConfiguracionPage'
import ChatbotPage from '@/pages/chatbot/ChatbotPage'

function ProtectedRoute() {
  const { user } = useAuthStore()
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [{
      element: <Layout />,
      children: [
        { path: '/', element: <Navigate to="/dashboard" replace /> },
        { path: '/dashboard', element: <DashboardPage /> },
        { path: '/inventario/productos', element: <ProductosPage /> },
        { path: '/inventario/categorias', element: <CategoriasPage /> },
        { path: '/inventario/ubicaciones', element: <UbicacionesPage /> },
        { path: '/movimientos', element: <MovimientosPage /> },
        { path: '/movimientos/entrada', element: <EntradaPage /> },
        { path: '/movimientos/salida', element: <SalidaPage /> },
        { path: '/movimientos/traslado', element: <TrasladoPage /> },
        { path: '/terceros/proveedores', element: <ProveedoresPage /> },
        { path: '/terceros/clientes', element: <ClientesPage /> },
        { path: '/fidelizacion/reglas', element: <ReglasPage /> },
        { path: '/fidelizacion/canjes', element: <CanjesPage /> },
        { path: '/reportes', element: <ReportesPage /> },
        { path: '/almacen/layout', element: <LayoutAlmacenPage /> },
        { path: '/almacen/codigos', element: <CodigosPage /> },
        { path: '/administracion/auditoria', element: <AuditoriaPage /> },
        { path: '/administracion/configuracion', element: <ConfiguracionPage /> },
        { path: '/chatbot', element: <ChatbotPage /> },
      ],
    }],
  },
])
