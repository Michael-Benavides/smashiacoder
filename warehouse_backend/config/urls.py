"""
URL configuration for Warehouse_iq project.

Hexagonal Architecture - API entrypoint.
"""

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    path('api/seguridad/', include('apps.seguridad.infrastructure.urls')),
    path('api/inventario/', include('apps.inventario.infrastructure.urls')),
    path('api/terceros/', include('apps.terceros.infrastructure.urls')),
    path('api/fidelizacion/', include('apps.fidelizacion.infrastructure.urls')),
    path('api/administracion/', include('apps.administracion.infrastructure.urls')),
]
