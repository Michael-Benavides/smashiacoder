from rest_framework.permissions import BasePermission


class EsAdministrador(BasePermission):
    """Solo permite acceso a usuarios con rol Administrador."""

    def has_permission(self, request, view):
        return (
            request.user
            and getattr(request.user, 'is_authenticated', False)
            and hasattr(request.user, 'rol')
            and request.user.rol.nombre == 'Administrador'
        )


class EsUsuarioActivo(BasePermission):
    """Permite acceso a cualquier usuario activo."""

    def has_permission(self, request, view):
        return (
            request.user
            and getattr(request.user, 'is_authenticated', False)
            and hasattr(request.user, 'activo')
            and request.user.activo
        )
