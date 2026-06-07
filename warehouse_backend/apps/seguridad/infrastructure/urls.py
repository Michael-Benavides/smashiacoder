# apps/seguridad/infrastructure/urls.py
from django.urls import path
from .views import (
    CambiarPasswordView,
    LoginView, MeView, LogoutView,
    RecuperarPasswordView, RestablecerPasswordView,
    RolListCreateView, UsuarioDetailView, UsuarioListCreateView,
)

urlpatterns = [
    path('login', LoginView.as_view(), name='auth-login'),
    path('me', MeView.as_view(), name='auth-me'),
    path('logout', LogoutView.as_view(), name='auth-logout'),
    path('recuperar', RecuperarPasswordView.as_view(), name='auth-recuperar'),
    path('restablecer', RestablecerPasswordView.as_view(), name='auth-restablecer'),
    path('roles', RolListCreateView.as_view(), name='roles-list'),
    path('usuarios', UsuarioListCreateView.as_view(), name='usuarios-list'),
    path('usuarios/<int:id>', UsuarioDetailView.as_view(), name='usuarios-detail'),
    path('usuarios/<int:id>/cambiar-password', CambiarPasswordView.as_view(), name='usuarios-cambiar-password'),
]
