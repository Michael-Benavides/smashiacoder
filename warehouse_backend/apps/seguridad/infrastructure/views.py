# apps/seguridad/infrastructure/views.py
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from shared.responses import success_response, error_response
from shared.exceptions import ReglaNegocioException, EntidadNoEncontradaException
from ..application.use_cases import (
    LoginUseCase, CrearUsuarioUseCase, CrearRolUseCase,
    RecuperarPasswordUseCase, RestablecerPasswordUseCase
)
from .repositories import DjangoUsuarioRepository, DjangoRolRepository
from .serializers import (
    LoginSerializer, CrearUsuarioSerializer, CrearRolSerializer,
    RecuperarPasswordSerializer, RestablecerPasswordSerializer
)
from .models import UsuarioORM, RolORM
from rest_framework import status


def _usuario_a_dict(usuario) -> dict:
    return {
        "id": usuario.id, "nombre": usuario.nombre, "email": usuario.email,
        "rol_id": usuario.rol_id, "activo": usuario.activo, "avatar": usuario.avatar
    }


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
            orm_user = UsuarioORM.objects.get(pk=usuario.id)
            refresh = RefreshToken.for_user(orm_user)
            return success_response(
                data={"access_token": str(refresh.access_token), "refresh_token": str(refresh), "usuario": _usuario_a_dict(usuario)},
                message="Autenticación exitosa."
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
