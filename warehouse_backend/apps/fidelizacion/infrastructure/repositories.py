# apps/fidelizacion/infrastructure/repositories.py
from typing import List, Optional

from django.db import transaction

from ..domain.entities import (
    CanjesFidelizacionDomain,
    ReglaFidelizacionDomain,
)
from ..domain.ports import (
    CanjeRepositoryPort,
    ReglaFidelizacionRepositoryPort,
)
from .models import CanjesFidelizacionORM, ReglaFidelizacionORM


# ──────────────────────────────────────────────────────────────────────
# Orden total de niveles para resolver "rango aplicable"
# ──────────────────────────────────────────────────────────────────────

NIVELES_ORDEN = {
    "Bronce": 1,
    "Plata": 2,
    "Oro": 3,
    "Platino": 4,
}


def _orden_de(nivel: str, *, default: int = 0) -> int:
    return NIVELES_ORDEN.get(nivel, default)


# ──────────────────────────────────────────────────────────────────────
# Mappers ORM ↔ Domain
# ──────────────────────────────────────────────────────────────────────

def _regla_orm_a_domain(orm: ReglaFidelizacionORM) -> ReglaFidelizacionDomain:
    return ReglaFidelizacionDomain(
        id=orm.id,
        nombre=orm.nombre,
        puntos_por_unidad=orm.puntos_por_unidad,
        nivel_minimo=orm.nivel_minimo,
        nivel_maximo=orm.nivel_maximo,
        recompensa=orm.recompensa,
        activo=orm.activo,
    )


def _canje_orm_a_domain(orm: CanjesFidelizacionORM) -> CanjesFidelizacionDomain:
    return CanjesFidelizacionDomain(
        id=orm.id,
        cliente_id=orm.cliente_id,
        puntos_canjeados=orm.puntos_canjeados,
        recompensa=orm.recompensa,
        usuario_id=orm.usuario_id,
        fecha=orm.fecha,
    )


# ──────────────────────────────────────────────────────────────────────
# Repositorios
# ──────────────────────────────────────────────────────────────────────

class DjangoReglaFidelizacionRepository(ReglaFidelizacionRepositoryPort):
    def crear(self, regla: ReglaFidelizacionDomain) -> ReglaFidelizacionDomain:
        orm = ReglaFidelizacionORM.objects.create(
            nombre=regla.nombre,
            puntos_por_unidad=regla.puntos_por_unidad,
            nivel_minimo=regla.nivel_minimo,
            nivel_maximo=regla.nivel_maximo,
            recompensa=regla.recompensa,
            activo=regla.activo,
        )
        return _regla_orm_a_domain(orm)

    def obtener_por_id(self, id: int) -> Optional[ReglaFidelizacionDomain]:
        try:
            return _regla_orm_a_domain(ReglaFidelizacionORM.objects.get(pk=id))
        except ReglaFidelizacionORM.DoesNotExist:
            return None

    def listar(self, solo_activos: bool = True) -> List[ReglaFidelizacionDomain]:
        qs = ReglaFidelizacionORM.objects.all().order_by('-id')
        if solo_activos:
            qs = qs.filter(activo=True)
        return [_regla_orm_a_domain(r) for r in qs]

    def obtener_activa_para_nivel(self, nivel: str) -> Optional[ReglaFidelizacionDomain]:
        """
        Busca la regla activa más reciente cuyo rango
        [nivel_minimo, nivel_maximo] cubre al nivel dado.

        El filtro de rango se aplica en Python (no en SQL) porque la
        relación de orden entre niveles ("Bronce" < "Plata" < ...) no es
        lexicográfica y no tiene representación natural en la BD.
        """
        orden_cliente = _orden_de(nivel)
        if orden_cliente == 0:
            return None
        for orm in ReglaFidelizacionORM.objects.filter(activo=True).order_by('-id'):
            min_o = _orden_de(orm.nivel_minimo, default=0)
            max_o = _orden_de(orm.nivel_maximo, default=99)
            if min_o <= orden_cliente <= max_o:
                return _regla_orm_a_domain(orm)
        return None

    def actualizar(self, regla: ReglaFidelizacionDomain) -> ReglaFidelizacionDomain:
        ReglaFidelizacionORM.objects.filter(pk=regla.id).update(
            nombre=regla.nombre,
            puntos_por_unidad=regla.puntos_por_unidad,
            nivel_minimo=regla.nivel_minimo,
            nivel_maximo=regla.nivel_maximo,
            recompensa=regla.recompensa,
            activo=regla.activo,
        )
        return self.obtener_por_id(regla.id)

    def desactivar(self, id: int) -> None:
        ReglaFidelizacionORM.objects.filter(pk=id).update(activo=False)


class DjangoCanjeRepository(CanjeRepositoryPort):
    @transaction.atomic
    def crear(self, canje: CanjesFidelizacionDomain) -> CanjesFidelizacionDomain:
        orm = CanjesFidelizacionORM.objects.create(
            cliente_id=canje.cliente_id,
            puntos_canjeados=canje.puntos_canjeados,
            recompensa=canje.recompensa,
            usuario_id=canje.usuario_id,
        )
        return _canje_orm_a_domain(orm)

    def listar_por_cliente(self, cliente_id: int) -> List[CanjesFidelizacionDomain]:
        qs = CanjesFidelizacionORM.objects.filter(cliente_id=cliente_id).order_by('-fecha')
        return [_canje_orm_a_domain(c) for c in qs]

    def listar(self) -> List[CanjesFidelizacionDomain]:
        qs = CanjesFidelizacionORM.objects.select_related(
            'cliente', 'usuario',
        ).order_by('-fecha')
        return [_canje_orm_a_domain(c) for c in qs]
