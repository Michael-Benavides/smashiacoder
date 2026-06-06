# apps/terceros/infrastructure/views.py
from django.db.models import Q
from rest_framework import status
from rest_framework.views import APIView

from shared.exceptions import (
    EntidadNoEncontradaException,
    ReglaNegocioException,
)
from shared.pagination import ZarpronixPagination
from shared.responses import error_response, success_response

from ..application.use_cases import (
    ActualizarClienteUseCase,
    ActualizarProveedorUseCase,
    ActualizarPuntosClienteUseCase,
    CrearClienteUseCase,
    CrearProveedorUseCase,
    DesactivarClienteUseCase,
    DesactivarProveedorUseCase,
)
from .models import ClienteORM, ProveedorORM
from .repositories import (
    DjangoClienteRepository,
    DjangoProveedorRepository,
)
from .serializers import (
    ActualizarClienteSerializer,
    ActualizarProveedorSerializer,
    ActualizarPuntosClienteSerializer,
    CrearClienteSerializer,
    CrearProveedorSerializer,
)


# ──────────────────────────────────────────────────────────────────────
# Mappers domain → dict
# ──────────────────────────────────────────────────────────────────────

def _proveedor_a_dict(p) -> dict:
    return {
        "id": p.id,
        "nombre": p.nombre,
        "ruc_nit": p.ruc_nit,
        "telefono": p.telefono,
        "email": p.email,
        "direccion": p.direccion,
        "activo": p.activo,
    }


def _proveedor_orm_a_dict(orm: ProveedorORM) -> dict:
    return {
        "id": orm.id,
        "nombre": orm.nombre,
        "ruc_nit": orm.ruc_nit,
        "telefono": orm.telefono,
        "email": orm.email,
        "direccion": orm.direccion,
        "activo": orm.activo,
        "created_at": orm.created_at.isoformat() if orm.created_at else None,
    }


def _cliente_a_dict(c) -> dict:
    return {
        "id": c.id,
        "nombre": c.nombre,
        "identificacion": c.identificacion,
        "email": c.email,
        "telefono": c.telefono,
        "direccion": c.direccion,
        "puntos_fidelizacion": c.puntos_fidelizacion,
        "nivel_fidelidad": c.nivel_fidelidad,
        "activo": c.activo,
    }


def _cliente_orm_a_dict(orm: ClienteORM) -> dict:
    return {
        "id": orm.id,
        "nombre": orm.nombre,
        "identificacion": orm.identificacion,
        "email": orm.email,
        "telefono": orm.telefono,
        "direccion": orm.direccion,
        "puntos_fidelizacion": orm.puntos_fidelizacion,
        "nivel_fidelidad": orm.nivel_fidelidad,
        "activo": orm.activo,
        "created_at": orm.created_at.isoformat() if orm.created_at else None,
        "updated_at": orm.updated_at.isoformat() if orm.updated_at else None,
    }


# ──────────────────────────────────────────────────────────────────────
# Proveedores
# ──────────────────────────────────────────────────────────────────────

class ProveedorListCreateView(APIView):
    """GET /proveedores  (paginado, ?search=, ?solo_activos=)
       POST /proveedores"""

    def get(self, request):
        search = request.query_params.get('search', '').strip()
        solo_activos = request.query_params.get('solo_activos', 'true').lower() != 'false'

        qs = ProveedorORM.objects.all().order_by('nombre')
        if solo_activos:
            qs = qs.filter(activo=True)
        if search:
            qs = qs.filter(Q(nombre__icontains=search) | Q(ruc_nit__icontains=search))

        paginator = ZarpronixPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        return paginator.get_paginated_response(
            [_proveedor_orm_a_dict(p) for p in page]
        )

    def post(self, request):
        serializer = CrearProveedorSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Datos del proveedor inválidos.", serializer.errors)
        try:
            use_case = CrearProveedorUseCase(DjangoProveedorRepository())
            proveedor = use_case.ejecutar(**serializer.validated_data)
            return success_response(
                data=_proveedor_a_dict(proveedor),
                message="Proveedor creado exitosamente.",
                status_code=status.HTTP_201_CREATED,
            )
        except ReglaNegocioException as e:
            return error_response("No se pudo crear el proveedor.", e.detail)


class ProveedorDetailView(APIView):
    """GET / PUT / DELETE /proveedores/<id>"""

    def get(self, request, id: int):
        proveedor = DjangoProveedorRepository().obtener_por_id(id)
        if not proveedor:
            return error_response(
                "Proveedor no encontrado.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        return success_response(data=_proveedor_a_dict(proveedor))

    def put(self, request, id: int):
        serializer = ActualizarProveedorSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response("Datos del proveedor inválidos.", serializer.errors)
        try:
            use_case = ActualizarProveedorUseCase(DjangoProveedorRepository())
            proveedor = use_case.ejecutar(id=id, **serializer.validated_data)
            return success_response(
                data=_proveedor_a_dict(proveedor),
                message="Proveedor actualizado.",
            )
        except EntidadNoEncontradaException as e:
            return error_response(
                "Proveedor no encontrado.", e.detail,
                status_code=status.HTTP_404_NOT_FOUND,
            )
        except ReglaNegocioException as e:
            return error_response("No se pudo actualizar el proveedor.", e.detail)

    def delete(self, request, id: int):
        try:
            use_case = DesactivarProveedorUseCase(DjangoProveedorRepository())
            use_case.ejecutar(id)
            return success_response(message="Proveedor desactivado.")
        except EntidadNoEncontradaException as e:
            return error_response(
                "Proveedor no encontrado.", e.detail,
                status_code=status.HTTP_404_NOT_FOUND,
            )


# ──────────────────────────────────────────────────────────────────────
# Clientes
# ──────────────────────────────────────────────────────────────────────

class ClienteListCreateView(APIView):
    """GET /clientes  (paginado, ?search=, ?solo_activos=)
       POST /clientes"""

    def get(self, request):
        search = request.query_params.get('search', '').strip()
        solo_activos = request.query_params.get('solo_activos', 'true').lower() != 'false'

        qs = ClienteORM.objects.all().order_by('nombre')
        if solo_activos:
            qs = qs.filter(activo=True)
        if search:
            qs = qs.filter(Q(nombre__icontains=search) | Q(identificacion__icontains=search))

        paginator = ZarpronixPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        return paginator.get_paginated_response(
            [_cliente_orm_a_dict(c) for c in page]
        )

    def post(self, request):
        serializer = CrearClienteSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Datos del cliente inválidos.", serializer.errors)
        try:
            use_case = CrearClienteUseCase(DjangoClienteRepository())
            cliente = use_case.ejecutar(**serializer.validated_data)
            return success_response(
                data=_cliente_a_dict(cliente),
                message="Cliente creado exitosamente.",
                status_code=status.HTTP_201_CREATED,
            )
        except ReglaNegocioException as e:
            return error_response("No se pudo crear el cliente.", e.detail)


class ClienteDetailView(APIView):
    """GET / PUT / DELETE /clientes/<id>"""

    def get(self, request, id: int):
        cliente = DjangoClienteRepository().obtener_por_id(id)
        if not cliente:
            return error_response(
                "Cliente no encontrado.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        return success_response(data=_cliente_a_dict(cliente))

    def put(self, request, id: int):
        serializer = ActualizarClienteSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response("Datos del cliente inválidos.", serializer.errors)
        try:
            use_case = ActualizarClienteUseCase(DjangoClienteRepository())
            cliente = use_case.ejecutar(id=id, **serializer.validated_data)
            return success_response(
                data=_cliente_a_dict(cliente),
                message="Cliente actualizado.",
            )
        except EntidadNoEncontradaException as e:
            return error_response(
                "Cliente no encontrado.", e.detail,
                status_code=status.HTTP_404_NOT_FOUND,
            )
        except ReglaNegocioException as e:
            return error_response("No se pudo actualizar el cliente.", e.detail)

    def delete(self, request, id: int):
        try:
            use_case = DesactivarClienteUseCase(DjangoClienteRepository())
            use_case.ejecutar(id)
            return success_response(message="Cliente desactivado.")
        except EntidadNoEncontradaException as e:
            return error_response(
                "Cliente no encontrado.", e.detail,
                status_code=status.HTTP_404_NOT_FOUND,
            )


class ClientePuntosView(APIView):
    """POST /clientes/<id>/puntos
    Body: {"puntos_a_sumar": <int>}  (positivo o negativo)
    Recalcula automáticamente nivel_fidelidad según la escala oficial.
    """

    def post(self, request, id: int):
        serializer = ActualizarPuntosClienteSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Datos inválidos.", serializer.errors)
        try:
            use_case = ActualizarPuntosClienteUseCase(DjangoClienteRepository())
            cliente = use_case.ejecutar(
                cliente_id=id,
                puntos_a_sumar=serializer.validated_data['puntos_a_sumar'],
            )
            return success_response(
                data=_cliente_a_dict(cliente),
                message=f"Puntos aplicados. Nivel actual: {cliente.nivel_fidelidad}.",
            )
        except EntidadNoEncontradaException as e:
            return error_response(
                "Cliente no encontrado.", e.detail,
                status_code=status.HTTP_404_NOT_FOUND,
            )
        except ReglaNegocioException as e:
            return error_response("No se pudieron aplicar los puntos.", e.detail)
