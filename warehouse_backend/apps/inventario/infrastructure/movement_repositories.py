# apps/inventario/infrastructure/movement_repositories.py
from typing import List, Optional

from django.db import transaction

from ..domain.movement_entities import AlertaDomain, MovimientoDomain
from ..domain.movement_ports import (
    AlertaRepositoryPort,
    MovimientoRepositoryPort,
)
from .models import AlertaORM, MovimientoORM


# ──────────────────────────────────────────────────────────────────────
# Mappers ORM ↔ Domain
# ──────────────────────────────────────────────────────────────────────

def _movimiento_orm_a_domain(orm: MovimientoORM) -> MovimientoDomain:
    return MovimientoDomain(
        id=orm.id,
        producto_id=orm.producto_id,
        tipo_movimiento_id=orm.tipo_movimiento_id,
        cantidad=orm.cantidad,
        stock_anterior=orm.stock_anterior,
        stock_nuevo=orm.stock_nuevo,
        usuario_id=orm.usuario_id,
        lote_id=orm.lote_id,
        proveedor_id=orm.proveedor_id,
        cliente_id=orm.cliente_id,
        observaciones=orm.observaciones,
        fecha=orm.fecha,
    )


def _alerta_orm_a_domain(orm: AlertaORM) -> AlertaDomain:
    return AlertaDomain(
        id=orm.id,
        producto_id=orm.producto_id,
        tipo=orm.tipo,
        mensaje=orm.mensaje,
        atendida=orm.atendida,
    )


# ──────────────────────────────────────────────────────────────────────
# Repositorios
# ──────────────────────────────────────────────────────────────────────

class DjangoMovimientoRepository(MovimientoRepositoryPort):
    @transaction.atomic
    def crear(self, mov: MovimientoDomain) -> MovimientoDomain:
        orm = MovimientoORM.objects.create(
            producto_id=mov.producto_id,
            lote_id=mov.lote_id,
            tipo_movimiento_id=mov.tipo_movimiento_id,
            cantidad=mov.cantidad,
            stock_anterior=mov.stock_anterior,
            stock_nuevo=mov.stock_nuevo,
            proveedor_id=mov.proveedor_id,
            cliente_id=mov.cliente_id,
            usuario_id=mov.usuario_id,
            observaciones=mov.observaciones,
        )
        return _movimiento_orm_a_domain(orm)

    def listar(self) -> List[MovimientoDomain]:
        qs = MovimientoORM.objects.select_related(
            'producto', 'lote', 'tipo_movimiento', 'usuario',
            'proveedor', 'cliente',
        ).order_by('-fecha')
        return [_movimiento_orm_a_domain(m) for m in qs]

    def listar_por_producto(self, producto_id: int) -> List[MovimientoDomain]:
        qs = MovimientoORM.objects.filter(producto_id=producto_id).order_by('-fecha')
        return [_movimiento_orm_a_domain(m) for m in qs]

    def timeline_producto(self, producto_id: int) -> List[MovimientoDomain]:
        qs = MovimientoORM.objects.filter(producto_id=producto_id).order_by('fecha')
        return [_movimiento_orm_a_domain(m) for m in qs]


class DjangoAlertaRepository(AlertaRepositoryPort):
    @transaction.atomic
    def crear(self, alerta: AlertaDomain) -> AlertaDomain:
        # Upsert idempotente: si ya existe una alerta activa para el mismo
        # (producto, tipo), se actualiza su mensaje en lugar de duplicarla.
        existente = AlertaORM.objects.filter(
            producto_id=alerta.producto_id,
            tipo=alerta.tipo,
            atendida=False,
        ).first()
        if existente:
            existente.mensaje = alerta.mensaje
            existente.save(update_fields=['mensaje'])
            return _alerta_orm_a_domain(existente)
        orm = AlertaORM.objects.create(
            producto_id=alerta.producto_id,
            tipo=alerta.tipo,
            mensaje=alerta.mensaje,
            atendida=alerta.atendida,
        )
        return _alerta_orm_a_domain(orm)

    @transaction.atomic
    def marcar_atendida(self, alerta_id: int) -> Optional[AlertaDomain]:
        try:
            orm = AlertaORM.objects.get(pk=alerta_id)
        except AlertaORM.DoesNotExist:
            return None
        orm.atendida = True
        orm.save(update_fields=['atendida'])
        return _alerta_orm_a_domain(orm)

    def listar_activas(self) -> List[AlertaDomain]:
        qs = AlertaORM.objects.filter(atendida=False).select_related('producto').order_by('-created_at')
        return [_alerta_orm_a_domain(a) for a in qs]

    def listar_por_producto(self, producto_id: int) -> List[AlertaDomain]:
        qs = AlertaORM.objects.filter(producto_id=producto_id).order_by('-created_at')
        return [_alerta_orm_a_domain(a) for a in qs]

    @transaction.atomic
    def desactivar_para_producto(self, producto_id: int) -> None:
        AlertaORM.objects.filter(
            producto_id=producto_id, atendida=False,
        ).update(atendida=True)
