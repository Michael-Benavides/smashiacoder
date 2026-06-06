# apps/terceros/infrastructure/repositories.py
from typing import List, Optional

from django.db.models import Q

from ..domain.entities import ClienteDomain, ProveedorDomain
from ..domain.ports import ClienteRepositoryPort, ProveedorRepositoryPort
from .models import ClienteORM, ProveedorORM


# ──────────────────────────────────────────────────────────────────────
# Mappers ORM ↔ Domain
# ──────────────────────────────────────────────────────────────────────

def _proveedor_orm_a_domain(orm: ProveedorORM) -> ProveedorDomain:
    return ProveedorDomain(
        id=orm.id,
        nombre=orm.nombre,
        ruc_nit=orm.ruc_nit,
        telefono=orm.telefono,
        email=orm.email,
        direccion=orm.direccion,
        activo=orm.activo,
    )


def _cliente_orm_a_domain(orm: ClienteORM) -> ClienteDomain:
    return ClienteDomain(
        id=orm.id,
        nombre=orm.nombre,
        identificacion=orm.identificacion,
        email=orm.email,
        telefono=orm.telefono,
        direccion=orm.direccion,
        puntos_fidelizacion=orm.puntos_fidelizacion,
        nivel_fidelidad=orm.nivel_fidelidad,
        activo=orm.activo,
    )


# ──────────────────────────────────────────────────────────────────────
# Repositorios
# ──────────────────────────────────────────────────────────────────────

class DjangoProveedorRepository(ProveedorRepositoryPort):
    def crear(self, p: ProveedorDomain) -> ProveedorDomain:
        orm = ProveedorORM.objects.create(
            nombre=p.nombre,
            ruc_nit=p.ruc_nit,
            telefono=p.telefono,
            email=p.email,
            direccion=p.direccion,
            activo=p.activo,
        )
        return _proveedor_orm_a_domain(orm)

    def obtener_por_id(self, id: int) -> Optional[ProveedorDomain]:
        try:
            return _proveedor_orm_a_domain(ProveedorORM.objects.get(pk=id))
        except ProveedorORM.DoesNotExist:
            return None

    def listar(self, solo_activos: bool = True) -> List[ProveedorDomain]:
        qs = ProveedorORM.objects.all().order_by('nombre')
        if solo_activos:
            qs = qs.filter(activo=True)
        return [_proveedor_orm_a_domain(p) for p in qs]

    def buscar(self, termino: str) -> List[ProveedorDomain]:
        if not termino:
            return []
        qs = ProveedorORM.objects.filter(
            Q(nombre__icontains=termino) | Q(ruc_nit__icontains=termino),
            activo=True,
        ).order_by('nombre')
        return [_proveedor_orm_a_domain(p) for p in qs]

    def actualizar(self, p: ProveedorDomain) -> ProveedorDomain:
        ProveedorORM.objects.filter(pk=p.id).update(
            nombre=p.nombre,
            ruc_nit=p.ruc_nit,
            telefono=p.telefono,
            email=p.email,
            direccion=p.direccion,
            activo=p.activo,
        )
        return self.obtener_por_id(p.id)

    def desactivar(self, id: int) -> None:
        ProveedorORM.objects.filter(pk=id).update(activo=False)


class DjangoClienteRepository(ClienteRepositoryPort):
    def crear(self, c: ClienteDomain) -> ClienteDomain:
        orm = ClienteORM.objects.create(
            nombre=c.nombre,
            identificacion=c.identificacion,
            email=c.email,
            telefono=c.telefono,
            direccion=c.direccion,
            puntos_fidelizacion=c.puntos_fidelizacion,
            nivel_fidelidad=c.nivel_fidelidad,
            activo=c.activo,
        )
        return _cliente_orm_a_domain(orm)

    def obtener_por_id(self, id: int) -> Optional[ClienteDomain]:
        try:
            return _cliente_orm_a_domain(ClienteORM.objects.get(pk=id))
        except ClienteORM.DoesNotExist:
            return None

    def listar(self, solo_activos: bool = True) -> List[ClienteDomain]:
        qs = ClienteORM.objects.all().order_by('nombre')
        if solo_activos:
            qs = qs.filter(activo=True)
        return [_cliente_orm_a_domain(c) for c in qs]

    def buscar(self, termino: str) -> List[ClienteDomain]:
        if not termino:
            return []
        qs = ClienteORM.objects.filter(
            Q(nombre__icontains=termino) | Q(identificacion__icontains=termino),
            activo=True,
        ).order_by('nombre')
        return [_cliente_orm_a_domain(c) for c in qs]

    def actualizar(self, c: ClienteDomain) -> ClienteDomain:
        ClienteORM.objects.filter(pk=c.id).update(
            nombre=c.nombre,
            identificacion=c.identificacion,
            email=c.email,
            telefono=c.telefono,
            direccion=c.direccion,
            puntos_fidelizacion=c.puntos_fidelizacion,
            nivel_fidelidad=c.nivel_fidelidad,
            activo=c.activo,
        )
        return self.obtener_por_id(c.id)

    def desactivar(self, id: int) -> None:
        ClienteORM.objects.filter(pk=id).update(activo=False)
