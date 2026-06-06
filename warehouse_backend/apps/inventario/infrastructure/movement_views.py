# apps/inventario/infrastructure/movement_views.py
from django.db import transaction
from rest_framework import status
from rest_framework.views import APIView

from shared.exceptions import (
    EntidadNoEncontradaException,
    ReglaNegocioException,
)
from shared.pagination import ZarpronixPagination
from shared.responses import error_response, success_response

from ..application.movement_use_cases import (
    EntradaInventarioUseCase,
    SalidaInventarioUseCase,
    TrasladoInventarioUseCase,
)
from .models import AlertaORM, MovimientoORM, TipoMovimientoORM
from .movement_repositories import (
    DjangoAlertaRepository,
    DjangoMovimientoRepository,
)
from .movement_serializers import (
    EntradaSerializer,
    SalidaSerializer,
    TrasladoSerializer,
)
from .repositories import (
    DjangoLoteRepository,
    DjangoProductoRepository,
)


# ──────────────────────────────────────────────────────────────────────
# Helpers: bootstrap de TipoMovimiento e injerto de datos enriquecidos
# ──────────────────────────────────────────────────────────────────────

_TIPO_MOVIMIENTO_DEFAULTS = {
    'entrada': 'Entrada',
    'salida': 'Salida',
    'traslado': 'Traslado',
}


def _get_or_create_tipo_movimiento(tipo: str) -> TipoMovimientoORM:
    """Crea perezosamente las filas estándar de TipoMovimientoORM."""
    nombre_default = _TIPO_MOVIMIENTO_DEFAULTS[tipo]
    obj, _ = TipoMovimientoORM.objects.get_or_create(
        tipo=tipo,
        defaults={'nombre': nombre_default},
    )
    return obj


def _movimiento_orm_a_dict(orm: MovimientoORM) -> dict:
    return {
        "id": orm.id,
        "producto_id": orm.producto_id,
        "producto_codigo": orm.producto.codigo if orm.producto_id else None,
        "producto_nombre": orm.producto.nombre if orm.producto_id else None,
        "lote_id": orm.lote_id,
        "lote_numero": orm.lote.numero_lote if orm.lote_id else None,
        "tipo_movimiento_id": orm.tipo_movimiento_id,
        "tipo": orm.tipo_movimiento.tipo if orm.tipo_movimiento_id else None,
        "cantidad": orm.cantidad,
        "stock_anterior": orm.stock_anterior,
        "stock_nuevo": orm.stock_nuevo,
        "proveedor_id": orm.proveedor_id,
        "cliente_id": orm.cliente_id,
        "usuario_id": orm.usuario_id,
        "observaciones": orm.observaciones,
        "fecha": orm.fecha.isoformat() if orm.fecha else None,
    }


def _alerta_orm_a_dict(orm: AlertaORM) -> dict:
    return {
        "id": orm.id,
        "producto_id": orm.producto_id,
        "producto_codigo": orm.producto.codigo if orm.producto_id else None,
        "producto_nombre": orm.producto.nombre if orm.producto_id else None,
        "tipo": orm.tipo,
        "mensaje": orm.mensaje,
        "atendida": orm.atendida,
        "created_at": orm.created_at.isoformat() if orm.created_at else None,
    }


# ──────────────────────────────────────────────────────────────────────
# Movimientos — escritura (atomic)
# ──────────────────────────────────────────────────────────────────────

class EntradaView(APIView):
    """POST /movimientos/entrada"""

    def post(self, request):
        serializer = EntradaSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Datos de entrada inválidos.", serializer.errors)

        usuario_id = request.user.id
        tipo_entrada = _get_or_create_tipo_movimiento('entrada')

        try:
            with transaction.atomic():
                use_case = EntradaInventarioUseCase(
                    producto_repo=DjangoProductoRepository(),
                    lote_repo=DjangoLoteRepository(),
                    movimiento_repo=DjangoMovimientoRepository(),
                    alerta_repo=DjangoAlertaRepository(),
                    tipo_movimiento_entrada_id=tipo_entrada.id,
                )
                movimiento = use_case.ejecutar(
                    usuario_id=usuario_id,
                    **serializer.validated_data,
                )
            mov_orm = MovimientoORM.objects.select_related(
                'producto', 'lote', 'tipo_movimiento',
            ).get(pk=movimiento.id)
            return success_response(
                data=_movimiento_orm_a_dict(mov_orm),
                message="Entrada registrada exitosamente.",
                status_code=status.HTTP_201_CREATED,
            )
        except EntidadNoEncontradaException as e:
            return error_response(
                "Recurso no encontrado.", e.detail,
                status_code=status.HTTP_404_NOT_FOUND,
            )
        except ReglaNegocioException as e:
            return error_response("No se pudo registrar la entrada.", e.detail)


class SalidaView(APIView):
    """POST /movimientos/salida"""

    def post(self, request):
        serializer = SalidaSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Datos de salida inválidos.", serializer.errors)

        usuario_id = request.user.id
        tipo_salida = _get_or_create_tipo_movimiento('salida')

        try:
            with transaction.atomic():
                use_case = SalidaInventarioUseCase(
                    producto_repo=DjangoProductoRepository(),
                    lote_repo=DjangoLoteRepository(),
                    movimiento_repo=DjangoMovimientoRepository(),
                    alerta_repo=DjangoAlertaRepository(),
                    tipo_movimiento_salida_id=tipo_salida.id,
                )
                movimientos = use_case.ejecutar(
                    usuario_id=usuario_id,
                    **serializer.validated_data,
                )
            ids = [m.id for m in movimientos]
            mov_orms = MovimientoORM.objects.select_related(
                'producto', 'lote', 'tipo_movimiento',
            ).filter(id__in=ids)
            return success_response(
                data=[_movimiento_orm_a_dict(m) for m in mov_orms],
                message="Salida registrada exitosamente (FIFO aplicado).",
                status_code=status.HTTP_201_CREATED,
            )
        except EntidadNoEncontradaException as e:
            return error_response(
                "Recurso no encontrado.", e.detail,
                status_code=status.HTTP_404_NOT_FOUND,
            )
        except ReglaNegocioException as e:
            return error_response("No se pudo registrar la salida.", e.detail)


class TrasladoView(APIView):
    """POST /movimientos/traslado"""

    def post(self, request):
        serializer = TrasladoSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Datos de traslado inválidos.", serializer.errors)

        usuario_id = request.user.id
        tipo_traslado = _get_or_create_tipo_movimiento('traslado')

        try:
            with transaction.atomic():
                use_case = TrasladoInventarioUseCase(
                    producto_repo=DjangoProductoRepository(),
                    movimiento_repo=DjangoMovimientoRepository(),
                    tipo_traslado_id=tipo_traslado.id,
                )
                movimiento = use_case.ejecutar(
                    usuario_id=usuario_id,
                    **serializer.validated_data,
                )
            mov_orm = MovimientoORM.objects.select_related(
                'producto', 'lote', 'tipo_movimiento',
            ).get(pk=movimiento.id)
            return success_response(
                data=_movimiento_orm_a_dict(mov_orm),
                message="Traslado registrado exitosamente.",
                status_code=status.HTTP_201_CREATED,
            )
        except EntidadNoEncontradaException as e:
            return error_response(
                "Recurso no encontrado.", e.detail,
                status_code=status.HTTP_404_NOT_FOUND,
            )
        except ReglaNegocioException as e:
            return error_response("No se pudo registrar el traslado.", e.detail)


# ──────────────────────────────────────────────────────────────────────
# Movimientos — lectura
# ──────────────────────────────────────────────────────────────────────

class MovimientoListView(APIView):
    """GET /movimientos — paginado con ZarpronixPagination."""

    def get(self, request):
        queryset = MovimientoORM.objects.select_related(
            'producto', 'lote', 'tipo_movimiento', 'usuario',
            'proveedor', 'cliente',
        ).order_by('-fecha')

        paginator = ZarpronixPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        data = [_movimiento_orm_a_dict(m) for m in page]
        return paginator.get_paginated_response(data)


class TimelineView(APIView):
    """GET /movimientos/timeline/<producto_id> — historial cronológico ASC."""

    def get(self, request, producto_id: int):
        if not DjangoProductoRepository().obtener_por_id(producto_id):
            return error_response(
                "Producto no encontrado.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        queryset = MovimientoORM.objects.select_related(
            'producto', 'lote', 'tipo_movimiento', 'usuario',
            'proveedor', 'cliente',
        ).filter(producto_id=producto_id).order_by('fecha')
        return success_response(
            data=[_movimiento_orm_a_dict(m) for m in queryset],
        )


# ──────────────────────────────────────────────────────────────────────
# Dashboard — Alertas
# ──────────────────────────────────────────────────────────────────────

class AlertaListView(APIView):
    """GET /dashboard/alertas — alertas activas (no atendidas)."""

    def get(self, request):
        queryset = AlertaORM.objects.select_related('producto').filter(
            atendida=False,
        ).order_by('-created_at')
        return success_response(
            data=[_alerta_orm_a_dict(a) for a in queryset],
        )


class AlertaAtenderView(APIView):
    """PUT /dashboard/alertas/<id>/atender — marca la alerta como atendida."""

    def put(self, request, id: int):
        repo = DjangoAlertaRepository()
        alerta = repo.marcar_atendida(id)
        if not alerta:
            return error_response(
                "Alerta no encontrada.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        try:
            orm = AlertaORM.objects.select_related('producto').get(pk=id)
            data = _alerta_orm_a_dict(orm)
        except AlertaORM.DoesNotExist:
            data = {"id": alerta.id, "atendida": True}
        return success_response(data=data, message="Alerta atendida.")
