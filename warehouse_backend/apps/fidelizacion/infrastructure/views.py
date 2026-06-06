# apps/fidelizacion/infrastructure/views.py
from django.db import transaction
from django.db.models import Q
from rest_framework import status
from rest_framework.views import APIView

from shared.exceptions import (
    EntidadNoEncontradaException,
    ReglaNegocioException,
)
from shared.pagination import ZarpronixPagination
from shared.responses import error_response, success_response

from apps.terceros.infrastructure.repositories import DjangoClienteRepository

from ..application.use_cases import (
    ActualizarReglaFidelizacionUseCase,
    CanjeaPuntosUseCase,
    CrearReglaFidelizacionUseCase,
    DesactivarReglaFidelizacionUseCase,
    OtorgarPuntosVentaUseCase,
)
from .models import ReglaFidelizacionORM
from .repositories import (
    DjangoCanjeRepository,
    DjangoReglaFidelizacionRepository,
)
from .serializers import (
    ActualizarReglaFidelizacionSerializer,
    CanjearPuntosSerializer,
    CrearReglaFidelizacionSerializer,
    OtorgarPuntosVentaSerializer,
)


# ──────────────────────────────────────────────────────────────────────
# Mappers
# ──────────────────────────────────────────────────────────────────────

def _regla_a_dict(r) -> dict:
    return {
        "id": r.id,
        "nombre": r.nombre,
        "puntos_por_unidad": r.puntos_por_unidad,
        "nivel_minimo": r.nivel_minimo,
        "nivel_maximo": r.nivel_maximo,
        "recompensa": r.recompensa,
        "activo": r.activo,
    }


def _regla_orm_a_dict(orm: ReglaFidelizacionORM) -> dict:
    return {
        "id": orm.id,
        "nombre": orm.nombre,
        "puntos_por_unidad": orm.puntos_por_unidad,
        "nivel_minimo": orm.nivel_minimo,
        "nivel_maximo": orm.nivel_maximo,
        "recompensa": orm.recompensa,
        "activo": orm.activo,
        "created_at": orm.created_at.isoformat() if orm.created_at else None,
        "updated_at": orm.updated_at.isoformat() if orm.updated_at else None,
    }


def _canje_a_dict(c) -> dict:
    return {
        "id": c.id,
        "cliente_id": c.cliente_id,
        "puntos_canjeados": c.puntos_canjeados,
        "recompensa": c.recompensa,
        "usuario_id": c.usuario_id,
        "fecha": c.fecha.isoformat() if c.fecha else None,
    }


def _cliente_a_dict(c) -> dict:
    return {
        "id": c.id,
        "nombre": c.nombre,
        "puntos_fidelizacion": c.puntos_fidelizacion,
        "nivel_fidelidad": c.nivel_fidelidad,
    }


# ──────────────────────────────────────────────────────────────────────
# Reglas — endpoints
# ──────────────────────────────────────────────────────────────────────

class ReglaListCreateView(APIView):
    """GET /fidelizacion (paginado, ?search=, ?solo_activos=)
       POST /fidelizacion"""

    def get(self, request):
        search = request.query_params.get('search', '').strip()
        solo_activos = request.query_params.get('solo_activos', 'true').lower() != 'false'

        qs = ReglaFidelizacionORM.objects.all().order_by('-id')
        if solo_activos:
            qs = qs.filter(activo=True)
        if search:
            qs = qs.filter(Q(nombre__icontains=search) | Q(recompensa__icontains=search))

        paginator = ZarpronixPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        return paginator.get_paginated_response(
            [_regla_orm_a_dict(r) for r in page]
        )

    def post(self, request):
        serializer = CrearReglaFidelizacionSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Datos de la regla inválidos.", serializer.errors)
        try:
            use_case = CrearReglaFidelizacionUseCase(DjangoReglaFidelizacionRepository())
            regla = use_case.ejecutar(**serializer.validated_data)
            return success_response(
                data=_regla_a_dict(regla),
                message="Regla de fidelización creada exitosamente.",
                status_code=status.HTTP_201_CREATED,
            )
        except ReglaNegocioException as e:
            return error_response("No se pudo crear la regla.", e.detail)


class ReglaDetailView(APIView):
    """GET / PUT / DELETE /fidelizacion/<id>"""

    def get(self, request, id: int):
        regla = DjangoReglaFidelizacionRepository().obtener_por_id(id)
        if not regla:
            return error_response(
                "Regla de fidelización no encontrada.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        return success_response(data=_regla_a_dict(regla))

    def put(self, request, id: int):
        serializer = ActualizarReglaFidelizacionSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response("Datos de la regla inválidos.", serializer.errors)
        try:
            use_case = ActualizarReglaFidelizacionUseCase(DjangoReglaFidelizacionRepository())
            regla = use_case.ejecutar(id=id, **serializer.validated_data)
            return success_response(
                data=_regla_a_dict(regla),
                message="Regla de fidelización actualizada.",
            )
        except EntidadNoEncontradaException as e:
            return error_response(
                "Regla de fidelización no encontrada.", e.detail,
                status_code=status.HTTP_404_NOT_FOUND,
            )
        except ReglaNegocioException as e:
            return error_response("No se pudo actualizar la regla.", e.detail)

    def delete(self, request, id: int):
        try:
            use_case = DesactivarReglaFidelizacionUseCase(DjangoReglaFidelizacionRepository())
            use_case.ejecutar(id)
            return success_response(message="Regla de fidelización desactivada.")
        except EntidadNoEncontradaException as e:
            return error_response(
                "Regla de fidelización no encontrada.", e.detail,
                status_code=status.HTTP_404_NOT_FOUND,
            )


# ──────────────────────────────────────────────────────────────────────
# Canjear puntos
# ──────────────────────────────────────────────────────────────────────

class CanjearPuntosView(APIView):
    """POST /fidelizacion/canjear

    Body:
        {
            "cliente_id": <int>,
            "puntos_a_canjear": <int>,
            "recompensa": <str>
        }

    El usuario que ejecuta el canje se toma de ``request.user`` (UsuarioORM).
    Toda la operación se ejecuta dentro de ``transaction.atomic()`` para
    garantizar atomicidad: si falla cualquier paso, no se persiste nada.
    """

    def post(self, request):
        serializer = CanjearPuntosSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Datos del canje inválidos.", serializer.errors)

        usuario = request.user
        if usuario is None or not getattr(usuario, "is_authenticated", False):
            return error_response(
                "Se requiere autenticación para registrar un canje.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )

        data = serializer.validated_data
        try:
            with transaction.atomic():
                use_case = CanjeaPuntosUseCase(
                    cliente_repo=DjangoClienteRepository(),
                    canje_repo=DjangoCanjeRepository(),
                )
                canje = use_case.ejecutar(
                    cliente_id=data["cliente_id"],
                    puntos_a_canjear=data["puntos_a_canjear"],
                    recompensa=data["recompensa"],
                    usuario_id=usuario.id,
                )

            cliente = DjangoClienteRepository().obtener_por_id(data["cliente_id"])
            return success_response(
                data={
                    "canje": _canje_a_dict(canje),
                    "cliente": _cliente_a_dict(cliente) if cliente else None,
                },
                message="Canje registrado exitosamente.",
                status_code=status.HTTP_201_CREATED,
            )
        except EntidadNoEncontradaException as e:
            return error_response(
                "No se encontró la entidad requerida.", e.detail,
                status_code=status.HTTP_404_NOT_FOUND,
            )
        except ReglaNegocioException as e:
            return error_response("No se pudo registrar el canje.", e.detail)


# ──────────────────────────────────────────────────────────────────────
# Otorgar puntos por venta (reusable desde otros módulos)
# ──────────────────────────────────────────────────────────────────────

class OtorgarPuntosVentaView(APIView):
    """POST /fidelizacion/otorgar-puntos

    Body:
        {
            "cliente_id": <int>,
            "unidades_vendidas": <int>
        }

    Calcula los puntos según la regla activa aplicable al nivel actual
    del cliente y los suma usando ``ActualizarPuntosClienteUseCase``.
    """

    def post(self, request):
        serializer = OtorgarPuntosVentaSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Datos inválidos.", serializer.errors)
        data = serializer.validated_data
        try:
            with transaction.atomic():
                use_case = OtorgarPuntosVentaUseCase(
                    cliente_repo=DjangoClienteRepository(),
                    regla_repo=DjangoReglaFidelizacionRepository(),
                )
                cliente = use_case.ejecutar(
                    cliente_id=data["cliente_id"],
                    unidades_vendidas=data["unidades_vendidas"],
                )
            return success_response(
                data=_cliente_a_dict(cliente),
                message=(
                    "Puntos otorgados exitosamente. "
                    f"Nivel actual: {cliente.nivel_fidelidad}."
                ),
            )
        except EntidadNoEncontradaException as e:
            return error_response(
                "No se encontró la entidad requerida.", e.detail,
                status_code=status.HTTP_404_NOT_FOUND,
            )
        except ReglaNegocioException as e:
            return error_response("No se pudieron otorgar los puntos.", e.detail)
