# apps/fidelizacion/infrastructure/urls.py
from django.urls import path

from .views import (
    CanjeListView,
    CanjearPuntosView,
    OtorgarPuntosVentaView,
    ReglaDetailView,
    ReglaListCreateView,
)

urlpatterns = [
    # Canjes y otorgamiento de puntos (rutas explícitas antes que <int:id>)
    path('canjes', CanjeListView.as_view(), name='fidelizacion-canjes-list'),
    path('canjear', CanjearPuntosView.as_view(), name='fidelizacion-canjear'),
    path('otorgar-puntos', OtorgarPuntosVentaView.as_view(), name='fidelizacion-otorgar-puntos'),

    # Reglas de fidelización
    path('', ReglaListCreateView.as_view(), name='fidelizacion-reglas-list'),
    path('<int:id>', ReglaDetailView.as_view(), name='fidelizacion-reglas-detail'),
]
