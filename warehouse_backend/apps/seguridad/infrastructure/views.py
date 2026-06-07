# apps/seguridad/infrastructure/views.py
from django.conf import settings as django_settings
from drf_spectacular.utils import OpenApiExample, OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny

from .permissions import EsAdministrador, EsUsuarioActivo
from rest_framework.views import APIView
from rest_framework_simplejwt.settings import api_settings as jwt_settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.utils import datetime_from_epoch

from shared.exceptions import EntidadNoEncontradaException, ReglaNegocioException
from shared.responses import error_response, success_response

from ..application.use_cases import (
    ActualizarUsuarioUseCase,
    CambiarPasswordUseCase,
    CrearRolUseCase,
    CrearUsuarioUseCase,
    LoginUseCase,
    RecuperarPasswordUseCase,
    RestablecerPasswordUseCase,
)
from .models import RolORM, UsuarioORM
from .repositories import DjangoRolRepository, DjangoUsuarioRepository
from .serializers import (
    ActualizarUsuarioSerializer,
    CambiarPasswordSerializer,
    CrearRolSerializer,
    CrearUsuarioSerializer,
    LoginSerializer,
    RecuperarPasswordSerializer,
    RestablecerPasswordSerializer,
)


def _usuario_a_dict(usuario) -> dict:
    rol_nombre = None
    try:
        orm = UsuarioORM.objects.select_related('rol').get(pk=usuario.id)
        rol_nombre = orm.rol.nombre if orm.rol_id else None
    except UsuarioORM.DoesNotExist:
        pass
    return {
        "id": usuario.id,
        "nombre": usuario.nombre,
        "email": usuario.email,
        "rol_id": usuario.rol_id,
        "rol_nombre": rol_nombre,
        "activo": usuario.activo,
        "avatar": usuario.avatar,
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

    @extend_schema(
        tags=['Autenticación'],
        summary='Iniciar sesión',
        description=(
            'Autentica con email y contraseña. Copia el `access_token` de la respuesta '
            'y úsalo en el botón **Authorize** de Swagger.'
        ),
        auth=[],
        request=LoginSerializer,
        responses={
            200: OpenApiResponse(
                description='Autenticación exitosa',
                examples=[
                    OpenApiExample(
                        'Login administrador',
                        value={
                            'success': True,
                            'message': 'Autenticación exitosa.',
                            'data': {
                                'access_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                                'refresh_token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                                'usuario': {
                                    'id': 1,
                                    'nombre': 'Administrador',
                                    'email': 'admin@smashiacoder.com',
                                    'rol_id': 1,
                                    'rol_nombre': 'Administrador',
                                    'activo': True,
                                    'avatar': None,
                                },
                            },
                        },
                    ),
                ],
            ),
            401: OpenApiResponse(description='Credenciales incorrectas'),
        },
    )
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
    permission_classes = [EsUsuarioActivo]

    @extend_schema(
        tags=['Autenticación'],
        summary='Perfil del usuario autenticado',
        description='Devuelve los datos del usuario en sesión. Requiere JWT válido.',
        responses={200: OpenApiResponse(description='Perfil del usuario')},
    )
    def get(self, request):
        try:
            repo = DjangoUsuarioRepository()
            usuario = repo.obtener_por_id(request.user.id)
            return success_response(data=_usuario_a_dict(usuario))
        except Exception:
            return error_response("No se pudo recuperar el perfil.", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LogoutView(APIView):
    permission_classes = [EsUsuarioActivo]

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
    permission_classes = [EsAdministrador]

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
    permission_classes = [EsAdministrador]

    @extend_schema(
        tags=['Usuarios'],
        summary='Listar usuarios',
        description='Lista todos los usuarios. Solo administradores.',
        responses={200: OpenApiResponse(description='Lista de usuarios')},
    )
    def get(self, request):
        repo = DjangoUsuarioRepository()
        usuarios = repo.listar()
        return success_response(data=[_usuario_a_dict(u) for u in usuarios])

    @extend_schema(
        tags=['Usuarios'],
        summary='Crear usuario',
        description='Registra un nuevo usuario con rol asignado. Solo administradores.',
        request=CrearUsuarioSerializer,
        responses={
            201: OpenApiResponse(description='Usuario creado'),
            400: OpenApiResponse(description='Datos inválidos'),
        },
    )
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


class UsuarioDetailView(APIView):
    """GET/PUT /seguridad/usuarios/<id> — perfil del usuario."""
    permission_classes = [EsUsuarioActivo]

    def get(self, request, id: int):
        if request.user.id != id:
            return error_response("No autorizado.", status_code=status.HTTP_403_FORBIDDEN)
        repo = DjangoUsuarioRepository()
        usuario = repo.obtener_por_id(id)
        if not usuario:
            return error_response("Usuario no encontrado.", status_code=status.HTTP_404_NOT_FOUND)
        return success_response(data=_usuario_a_dict(usuario))

    def put(self, request, id: int):
        if request.user.id != id:
            return error_response("No autorizado.", status_code=status.HTTP_403_FORBIDDEN)
        serializer = ActualizarUsuarioSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response("Datos inválidos.", serializer.errors)
        try:
            repo = DjangoUsuarioRepository()
            use_case = ActualizarUsuarioUseCase(repo)
            usuario = use_case.ejecutar(id, nombre=serializer.validated_data.get('nombre'))
            return success_response(
                data=_usuario_a_dict(usuario),
                message="Perfil actualizado.",
            )
        except EntidadNoEncontradaException as e:
            return error_response("Usuario no encontrado.", e.detail, status.HTTP_404_NOT_FOUND)


class CambiarPasswordView(APIView):
    """POST /seguridad/usuarios/<id>/cambiar-password"""
    permission_classes = [EsUsuarioActivo]

    def post(self, request, id: int):
        if request.user.id != id:
            return error_response("No autorizado.", status_code=status.HTTP_403_FORBIDDEN)
        serializer = CambiarPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Datos inválidos.", serializer.errors)
        try:
            repo = DjangoUsuarioRepository()
            use_case = CambiarPasswordUseCase(repo)
            use_case.ejecutar(
                id,
                serializer.validated_data['password_actual'],
                serializer.validated_data['nueva_password'],
            )
            return success_response(message="Contraseña actualizada exitosamente.")
        except ReglaNegocioException as e:
            return error_response("No se pudo cambiar la contraseña.", e.detail)
        except EntidadNoEncontradaException as e:
            return error_response("Usuario no encontrado.", e.detail, status.HTTP_404_NOT_FOUND)
