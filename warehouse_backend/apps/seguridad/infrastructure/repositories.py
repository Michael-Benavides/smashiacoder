# apps/seguridad/infrastructure/repositories.py
from typing import Optional, List
from ..domain.entities import RolDomain, UsuarioDomain
from ..domain.ports import RolRepositoryPort, UsuarioRepositoryPort
from .models import RolORM, UsuarioORM


def _rol_orm_a_domain(orm: RolORM) -> RolDomain:
    return RolDomain(id=orm.id, nombre=orm.nombre, descripcion=orm.descripcion)


def _usuario_orm_a_domain(orm: UsuarioORM) -> UsuarioDomain:
    return UsuarioDomain(
        id=orm.id, nombre=orm.nombre, email=orm.email,
        password_hash=orm.password_hash, rol_id=orm.rol_id,
        activo=orm.activo, avatar=orm.avatar,
        reset_token=orm.reset_token, reset_token_expiry=orm.reset_token_expiry
    )


class DjangoRolRepository(RolRepositoryPort):
    def crear(self, rol: RolDomain) -> RolDomain:
        orm = RolORM.objects.create(nombre=rol.nombre, descripcion=rol.descripcion)
        return _rol_orm_a_domain(orm)

    def obtener_por_id(self, id: int) -> Optional[RolDomain]:
        try:
            return _rol_orm_a_domain(RolORM.objects.get(pk=id))
        except RolORM.DoesNotExist:
            return None

    def obtener_por_nombre(self, nombre: str) -> Optional[RolDomain]:
        try:
            return _rol_orm_a_domain(RolORM.objects.get(nombre=nombre))
        except RolORM.DoesNotExist:
            return None

    def listar(self) -> List[RolDomain]:
        return [_rol_orm_a_domain(r) for r in RolORM.objects.all()]

    def actualizar(self, rol: RolDomain) -> RolDomain:
        RolORM.objects.filter(pk=rol.id).update(nombre=rol.nombre, descripcion=rol.descripcion)
        return self.obtener_por_id(rol.id)

    def eliminar(self, id: int) -> None:
        RolORM.objects.filter(pk=id).delete()


class DjangoUsuarioRepository(UsuarioRepositoryPort):
    def crear(self, usuario: UsuarioDomain) -> UsuarioDomain:
        orm = UsuarioORM.objects.create(
            nombre=usuario.nombre, email=usuario.email,
            password_hash=usuario.password_hash, rol_id=usuario.rol_id,
            activo=usuario.activo, avatar=usuario.avatar
        )
        return _usuario_orm_a_domain(orm)

    def obtener_por_id(self, id: int) -> Optional[UsuarioDomain]:
        try:
            return _usuario_orm_a_domain(UsuarioORM.objects.get(pk=id))
        except UsuarioORM.DoesNotExist:
            return None

    def obtener_por_email(self, email: str) -> Optional[UsuarioDomain]:
        try:
            return _usuario_orm_a_domain(UsuarioORM.objects.get(email=email))
        except UsuarioORM.DoesNotExist:
            return None

    def listar(self) -> List[UsuarioDomain]:
        return [_usuario_orm_a_domain(u) for u in UsuarioORM.objects.select_related('rol').all()]

    def actualizar(self, usuario: UsuarioDomain) -> UsuarioDomain:
        UsuarioORM.objects.filter(pk=usuario.id).update(
            nombre=usuario.nombre, email=usuario.email,
            password_hash=usuario.password_hash, rol_id=usuario.rol_id,
            activo=usuario.activo, avatar=usuario.avatar
        )
        return self.obtener_por_id(usuario.id)

    def eliminar(self, id: int) -> None:
        UsuarioORM.objects.filter(pk=id).delete()

    def guardar_token_reset(self, usuario_id: int, token: str, expiry) -> None:
        UsuarioORM.objects.filter(pk=usuario_id).update(reset_token=token, reset_token_expiry=expiry)

    def limpiar_token_reset(self, usuario_id: int) -> None:
        UsuarioORM.objects.filter(pk=usuario_id).update(reset_token=None, reset_token_expiry=None)
