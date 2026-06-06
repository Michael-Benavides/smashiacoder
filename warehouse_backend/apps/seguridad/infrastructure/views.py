# apps/seguridad/infrastructure/views.py
from django.conf import settings as django_settings
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.settings import api_settings as jwt_settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.utils import datetime_from_epoch

from shared.exceptions import EntidadNoEncontradaException, ReglaNegocioException
from shared.responses import error_response, success_response

from ..application.use_cases import (
    CrearRolUseCase,
    CrearUsuarioUseCase,
    LoginUseCase,
    RecuperarPasswordUseCase,
    RestablecerPasswordUseCase,
)
from .models import RolORM, UsuarioORM
from .repositories import DjangoRolRepository, DjangoUsuarioRepository
from .serializers import (
    CrearRolSerializer,
    CrearUsuarioSerializer,
    LoginSerializer,
    RecuperarPasswordSerializer,
    RestablecerPasswordSerializer,
)


def _usuario_a_dict(usuario) -> dict:
    return {
        "id": usuario.id, "nombre": usuario.nombre, "email": usuario.email,
        "rol_id": usuario.rol_id, "activo": usuario.activo, "avatar": usuario.avatar
    }


def _emitir_tokens_para_usuario(usuario_id: int) -> RefreshToken:
    """
    Construye un ``RefreshToken`` para un ``UsuarioORM`` sin pasar por
    ``RefreshToken.for_user``.

    Razón: ``BlacklistMixin.for_user`` crea un ``OutstandingToken`` cuyo
    campo ``user`` es FK a ``AUTH_USER_MODEL`` (Django auth). Nuestro
    ``UsuarioORM`` NO es ``AUTH_USER_MODEL``, por lo que esa asignación
    explota con ``ValueError``.

    Solución: crear el token con el claim ``user_id`` manualmente y
    registrar el ``OutstandingToken`` con ``user=None`` (el campo es
    ``null=True``), lo que mantiene la trazabilidad para
    ``LogoutView.blacklist()`` sin romper la integridad referencial.
    """
    refresh = RefreshToken()
    refresh[jwt_settings.USER_ID_CLAIM] = str(usuario_id)

    if "rest_framework_simplejwt.token_blacklist" in django_settings.INSTALLED_APPS:
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
        OutstandingToken.objects.create(
            user=None,
            jti=refresh[jwt_settings.JTI_CLAIM],
            token=str(refresh),
            created_at=refresh.current_time,
            expires_at=datetime_from_epoch(refresh["exp"]),
        )

    return refresh


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Datos de autenticación inválidos.", serializer.errors)
        try:
            repo = DjangoUsuarioRepository()
            use_case = LoginUseCase(repo)
            usuario = use_case.ejecutar(**serializer.validated_data)
            refresh = _emitir_tokens_para_usuario(usuario.id)
            return success_response(
                data={
                    "access_token": str(refresh.access_token),
                    "refresh_token": str(refresh),
                    "usuario": _usuario_a_dict(usuario),
                },
                message="Autenticación exitosa.",
            )
        except ReglaNegocioException as e:
            return error_response("Credenciales incorrectas.", e.detail, status.HTTP_401_UNAUTHORIZED)


class MeView(APIView):
    def get(self, request):
        try:
            repo = DjangoUsuarioRepository()
            usuario = repo.obtener_por_id(request.user.id)
            return success_response(data=_usuario_a_dict(usuario))
        except Exception:
            return error_response("No se pudo recuperar el perfil.", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LogoutView(APIView):
    def post(self, request):
        try:
            token = RefreshToken(request.data.get("refresh_token"))
            token.blacklist()
            return success_response(message="Sesión cerrada exitosamente.")
        except Exception:
            return error_response("No se pudo cerrar la sesión.")


class RecuperarPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RecuperarPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Datos inválidos.", serializer.errors)
        repo = DjangoUsuarioRepository()
        use_case = RecuperarPasswordUseCase(repo)
        mensaje = use_case.ejecutar(serializer.validated_data['email'])
        return success_response(message=mensaje)


class RestablecerPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RestablecerPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Datos inválidos.", serializer.errors)
        try:
            repo = DjangoUsuarioRepository()
            use_case = RestablecerPasswordUseCase(repo)
            use_case.ejecutar(**serializer.validated_data)
            return success_response(message="Contraseña restablecida exitosamente.")
        except ReglaNegocioException as e:
            return error_response("No se pudo restablecer la contraseña.", e.detail)


class RolListCreateView(APIView):
    def get(self, request):
        repo = DjangoRolRepository()
        roles = repo.listar()
        return success_response(data=[{"id": r.id, "nombre": r.nombre, "descripcion": r.descripcion} for r in roles])

    def post(self, request):
        serializer = CrearRolSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Datos del rol inválidos.", serializer.errors)
        try:
            repo = DjangoRolRepository()
            use_case = CrearRolUseCase(repo)
            rol = use_case.ejecutar(**serializer.validated_data)
            return success_response(
                data={"id": rol.id, "nombre": rol.nombre, "descripcion": rol.descripcion},
                message="Rol creado exitosamente.", status_code=status.HTTP_201_CREATED
            )
        except ReglaNegocioException as e:
            return error_response("No se pudo crear el rol.", e.detail)


class UsuarioListCreateView(APIView):
    def get(self, request):
        repo = DjangoUsuarioRepository()
        usuarios = repo.listar()
        return success_response(data=[_usuario_a_dict(u) for u in usuarios])

    def post(self, request):
        serializer = CrearUsuarioSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Datos del usuario inválidos.", serializer.errors)
        try:
            u_repo = DjangoUsuarioRepository()
            r_repo = DjangoRolRepository()
            use_case = CrearUsuarioUseCase(u_repo, r_repo)
            usuario = use_case.ejecutar(**serializer.validated_data)
            return success_response(data=_usuario_a_dict(usuario), message="Usuario creado.", status_code=status.HTTP_201_CREATED)
        except (ReglaNegocioException, EntidadNoEncontradaException) as e:
            return error_response("No se pudo crear el usuario.", e.detail)
