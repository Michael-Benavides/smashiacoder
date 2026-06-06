# apps/seguridad/infrastructure/authentication.py
"""
Autenticación JWT propia de Warehouse_iq.

Reemplaza la búsqueda por defecto contra ``django.contrib.auth.User`` por
una resolución directa contra ``UsuarioORM`` (apps.seguridad). El token
se firma en ``LoginView`` con ``RefreshToken.for_user(orm_user)``, lo que
incluye ``orm_user.id`` en el claim ``user_id``; aquí se decodifica ese
claim y se obtiene la instancia correspondiente.
"""

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import (
    AuthenticationFailed,
    InvalidToken,
)
from rest_framework_simplejwt.settings import api_settings as jwt_api_settings

from .models import UsuarioORM


class WarehouseJWTAuthentication(JWTAuthentication):
    """
    Autenticación JWT que resuelve ``request.user`` contra
    ``apps.seguridad.infrastructure.models.UsuarioORM``.
    """

    def get_user(self, validated_token):
        try:
            user_id = validated_token[jwt_api_settings.USER_ID_CLAIM]
        except KeyError:
            raise InvalidToken(
                "El token no contiene el identificador de usuario."
            )

        try:
            user = UsuarioORM.objects.get(pk=user_id)
        except UsuarioORM.DoesNotExist:
            raise AuthenticationFailed(
                "Usuario no encontrado.", code="user_not_found"
            )

        if not user.activo:
            raise AuthenticationFailed(
                "La cuenta de usuario está desactivada.", code="user_inactive"
            )

        return user
