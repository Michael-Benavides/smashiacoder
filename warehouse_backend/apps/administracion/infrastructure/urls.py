# apps/administracion/infrastructure/urls.py
from django.urls import path

from apps.inventario.infrastructure.movement_views import (
    AlertaAtenderView,
    AlertaListView,
)

from .chatbot_view import ChatbotMensajeView
from .report_views import (
    EnviarReporteView,
    ReporteClientesExcelView,
    ReporteClientesPDFView,
    ReporteGeneralExcelView,
    ReporteGeneralPDFView,
    ReporteInventarioExcelView,
    ReporteInventarioPDFView,
    ReporteMovimientosExcelView,
    ReporteMovimientosPDFView,
    ReporteProveedoresExcelView,
    ReporteProveedoresPDFView,
)
from .views import (
    AuditoriaListView,
    ConfiguracionDetailView,
    ConfiguracionListCreateView,
    DashboardGraficasView,
    DashboardResumenView,
)


urlpatterns = [
    # ── Dashboard ───────────────────────────────────────────────────
    path('dashboard', DashboardResumenView.as_view(),
         name='administracion-dashboard'),
    path('dashboard/graficas', DashboardGraficasView.as_view(),
         name='administracion-dashboard-graficas'),
    path('dashboard/alertas', AlertaListView.as_view(),
         name='administracion-dashboard-alertas'),
    path('dashboard/alertas/<int:id>/atender', AlertaAtenderView.as_view(),
         name='administracion-dashboard-alertas-atender'),

    # ── Reportes gerenciales ────────────────────────────────────────
    path('reportes/<str:tipo>/enviar', EnviarReporteView.as_view(),
         name='administracion-reportes-enviar'),
    path('reportes/general/pdf', ReporteGeneralPDFView.as_view(),
         name='administracion-reportes-general-pdf'),
    path('reportes/general/excel', ReporteGeneralExcelView.as_view(),
         name='administracion-reportes-general-excel'),
    path('reportes/inventario/pdf', ReporteInventarioPDFView.as_view(),
         name='administracion-reportes-inventario-pdf'),
    path('reportes/inventario/excel', ReporteInventarioExcelView.as_view(),
         name='administracion-reportes-inventario-excel'),
    path('reportes/movimientos/pdf', ReporteMovimientosPDFView.as_view(),
         name='administracion-reportes-movimientos-pdf'),
    path('reportes/movimientos/excel', ReporteMovimientosExcelView.as_view(),
         name='administracion-reportes-movimientos-excel'),
    path('reportes/clientes/pdf', ReporteClientesPDFView.as_view(),
         name='administracion-reportes-clientes-pdf'),
    path('reportes/clientes/excel', ReporteClientesExcelView.as_view(),
         name='administracion-reportes-clientes-excel'),
    path('reportes/proveedores/pdf', ReporteProveedoresPDFView.as_view(),
         name='administracion-reportes-proveedores-pdf'),
    path('reportes/proveedores/excel', ReporteProveedoresExcelView.as_view(),
         name='administracion-reportes-proveedores-excel'),

    # ── Auditoría ───────────────────────────────────────────────────
    path('auditoria', AuditoriaListView.as_view(),
         name='administracion-auditoria'),

    # ── Configuración del sistema ──────────────────────────────────
    path('configuracion', ConfiguracionListCreateView.as_view(),
         name='administracion-configuracion-list'),
    path('configuracion/<str:clave>', ConfiguracionDetailView.as_view(),
         name='administracion-configuracion-detail'),

    # ── Chatbot (Groq Llama 3.3) ───────────────────────────────────
    path('chatbot/mensaje', ChatbotMensajeView.as_view(),
         name='administracion-chatbot-mensaje'),
]
