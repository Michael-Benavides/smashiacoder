# apps/seguridad/application/use_cases.py
import bcrypt
import secrets
from datetime import datetime, timedelta
from typing import Optional
from ..domain.entities import UsuarioDomain, RolDomain
from ..domain.ports import UsuarioRepositoryPort, RolRepositoryPort
from shared.exceptions import ReglaNegocioException, EntidadNoEncontradaException


class LoginUseCase:
    def __init__(self, usuario_repo: UsuarioRepositoryPort):
        self._repo = usuario_repo

    def ejecutar(self, email: str, password: str) -> UsuarioDomain:
        usuario = self._repo.obtener_por_email(email)
        if not usuario:
            raise ReglaNegocioException(detail={"email": "Credenciales inválidas."})
        if not usuario.esta_activo():
            raise ReglaNegocioException(detail={"email": "La cuenta está desactivada."})
        if not bcrypt.checkpw(password.encode(), usuario.password_hash.encode()):
            raise ReglaNegocioException(detail={"password": "Credenciales inválidas."})
        return usuario


class CrearUsuarioUseCase:
    def __init__(self, usuario_repo: UsuarioRepositoryPort, rol_repo: RolRepositoryPort):
        self._usuario_repo = usuario_repo
        self._rol_repo = rol_repo

    def ejecutar(self, nombre: str, email: str, password: str, rol_id: int) -> UsuarioDomain:
        if len(password) < 8:
            raise ReglaNegocioException(detail={"password": "La contraseña debe tener mínimo 8 caracteres."})
        if self._usuario_repo.obtener_por_email(email):
            raise ReglaNegocioException(detail={"email": "Ya existe un usuario con este correo electrónico."})
        if not self._rol_repo.obtener_por_id(rol_id):
            raise EntidadNoEncontradaException(detail={"rol_id": "El rol especificado no existe."})
        password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        nuevo_usuario = UsuarioDomain(nombre=nombre, email=email, rol_id=rol_id, password_hash=password_hash)
        return self._usuario_repo.crear(nuevo_usuario)


class RecuperarPasswordUseCase:
    def __init__(self, usuario_repo: UsuarioRepositoryPort):
        self._repo = usuario_repo

    def ejecutar(self, email: str) -> str:
        usuario = self._repo.obtener_por_email(email)
        if not usuario:
            return "Si el correo existe, recibirás instrucciones de recuperación."
        token = secrets.token_urlsafe(32)
        expiry = datetime.now() + timedelta(hours=2)
        self._repo.guardar_token_reset(usuario.id, token, expiry)
        return token


class RestablecerPasswordUseCase:
    def __init__(self, usuario_repo: UsuarioRepositoryPort):
        self._repo = usuario_repo

    def ejecutar(self, email: str, token: str, nueva_password: str) -> None:
        if len(nueva_password) < 8:
            raise ReglaNegocioException(detail={"password": "La contraseña debe tener mínimo 8 caracteres."})
        usuario = self._repo.obtener_por_email(email)
        if not usuario or not usuario.token_reset_valido(token):
            raise ReglaNegocioException(detail={"token": "Token inválido o expirado."})
        nuevo_hash = bcrypt.hashpw(nueva_password.encode(), bcrypt.gensalt()).decode()
        usuario.password_hash = nuevo_hash
        self._repo.actualizar(usuario)
        self._repo.limpiar_token_reset(usuario.id)


class CrearRolUseCase:
    def __init__(self, rol_repo: RolRepositoryPort):
        self._repo = rol_repo

    def ejecutar(self, nombre: str, descripcion: str = "") -> RolDomain:
        if self._repo.obtener_por_nombre(nombre):
            raise ReglaNegocioException(detail={"nombre": f"Ya existe un rol con el nombre '{nombre}'."})
        return self._repo.crear(RolDomain(nombre=nombre, descripcion=descripcion))
