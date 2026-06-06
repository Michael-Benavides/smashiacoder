# apps/inventario/infrastructure/urls.py
from django.urls import path

from .movement_views import (
    AlertaAtenderView,
    AlertaListView,
    EntradaView,
    MovimientoListView,
    SalidaView,
    TimelineView,
    TrasladoView,
)
from .views import (
    CategoriaDetailView,
    CategoriaListCreateView,
    LoteListView,
    ProductoBuscarView,
    ProductoDetailView,
    ProductoListCreateView,
    ProductoLotesView,
    UbicacionDetailView,
    UbicacionListCreateView,
)

urlpatterns = [
    # ────────────────────────── Categorías ──────────────────────────
    path('categorias', CategoriaListCreateView.as_view(), name='categorias-list'),
    path('categorias/<int:id>', CategoriaDetailView.as_view(), name='categorias-detail'),

    # ────────────────────────── Ubicaciones ─────────────────────────
    path('ubicaciones', UbicacionListCreateView.as_view(), name='ubicaciones-list'),
    path('ubicaciones/<int:id>', UbicacionDetailView.as_view(), name='ubicaciones-detail'),

    # ────────────────────────── Productos ───────────────────────────
    path('productos', ProductoListCreateView.as_view(), name='productos-list'),
    path('productos/buscar', ProductoBuscarView.as_view(), name='productos-buscar'),
    path('productos/<int:id>', ProductoDetailView.as_view(), name='productos-detail'),
    path('productos/<int:id>/lotes', ProductoLotesView.as_view(), name='productos-lotes'),

    # ────────────────────────── Lotes ───────────────────────────────
    path('lotes/producto/<int:producto_id>', LoteListView.as_view(), name='lotes-por-producto'),

    # ────────────────────────── Movimientos ─────────────────────────
    path('movimientos/', MovimientoListView.as_view(), name='movimientos-list'),
    path('movimientos/entrada', EntradaView.as_view(), name='movimientos-entrada'),
    path('movimientos/salida', SalidaView.as_view(), name='movimientos-salida'),
    path('movimientos/traslado', TrasladoView.as_view(), name='movimientos-traslado'),
    path('movimientos/timeline/<int:producto_id>', TimelineView.as_view(), name='movimientos-timeline'),

    # ────────────────────────── Dashboard ───────────────────────────
    path('dashboard/alertas', AlertaListView.as_view(), name='dashboard-alertas'),
    path('dashboard/alertas/<int:id>/atender', AlertaAtenderView.as_view(), name='dashboard-alertas-atender'),
]
