# apps/terceros/infrastructure/urls.py
from django.urls import path

from .views import (
    ClienteDetailView,
    ClienteListCreateView,
    ClientePuntosView,
    ProveedorDetailView,
    ProveedorListCreateView,
)

urlpatterns = [
    # ────────────────────────── Proveedores ─────────────────────────
    path('proveedores', ProveedorListCreateView.as_view(), name='proveedores-list'),
    path('proveedores/<int:id>', ProveedorDetailView.as_view(), name='proveedores-detail'),

    # ────────────────────────── Clientes ────────────────────────────
    path('clientes', ClienteListCreateView.as_view(), name='clientes-list'),
    path('clientes/<int:id>', ClienteDetailView.as_view(), name='clientes-detail'),
    path('clientes/<int:id>/puntos', ClientePuntosView.as_view(), name='clientes-puntos'),
]
