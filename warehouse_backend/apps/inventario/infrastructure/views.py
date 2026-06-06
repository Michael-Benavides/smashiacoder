# apps/inventario/infrastructure/views.py
from rest_framework import status
from rest_framework.views import APIView

from shared.exceptions import (
    EntidadNoEncontradaException,
    ReglaNegocioException,
)
from shared.responses import error_response, success_response

from ..application.use_cases import (
    ActualizarCategoriaUseCase,
    CrearCategoriaUseCase,
    CrearProductoUseCase,
    EliminarProductoUseCase,
)
from ..domain.entities import UbicacionDomain
from .repositories import (
    DjangoCategoriaRepository,
    DjangoLoteRepository,
    DjangoProductoRepository,
    DjangoUbicacionRepository,
)
from .serializers import (
    ActualizarCategoriaSerializer,
    ActualizarProductoSerializer,
    ActualizarUbicacionSerializer,
    CrearCategoriaSerializer,
    CrearProductoSerializer,
    CrearUbicacionSerializer,
)


# ──────────────────────────────────────────────────────────────────────
# Mappers domain → dict (presentation)
# ──────────────────────────────────────────────────────────────────────

def _categoria_a_dict(c) -> dict:
    return {
        "id": c.id,
        "nombre": c.nombre,
        "descripcion": c.descripcion,
        "activo": c.activo,
    }


def _ubicacion_a_dict(u) -> dict:
    return {
        "id": u.id,
        "nombre": u.nombre,
        "descripcion": u.descripcion,
        "zona": u.zona,
        "activo": u.activo,
    }


def _producto_a_dict(p) -> dict:
    return {
        "id": p.id,
        "codigo": p.codigo,
        "nombre": p.nombre,
        "descripcion": p.descripcion,
        "categoria_id": p.categoria_id,
        "precio_compra": str(p.precio_compra),
        "precio_venta": str(p.precio_venta),
        "unidad_medida": p.unidad_medida,
        "stock_actual": p.stock_actual,
        "stock_minimo": p.stock_minimo,
        "ubicacion_id": p.ubicacion_id,
        "activo": p.activo,
        "stock_bajo": p.tiene_stock_bajo(),
    }


def _lote_a_dict(l) -> dict:
    return {
        "id": l.id,
        "producto_id": l.producto_id,
        "numero_lote": l.numero_lote,
        "fecha_ingreso": l.fecha_ingreso.isoformat() if l.fecha_ingreso else None,
        "fecha_vencimiento": l.fecha_vencimiento.isoformat() if l.fecha_vencimiento else None,
        "cantidad": l.cantidad,
        "activo": l.activo,
    }


# ──────────────────────────────────────────────────────────────────────
# Categorías
# ──────────────────────────────────────────────────────────────────────

class CategoriaListCreateView(APIView):
    def get(self, request):
        solo_activos = request.query_params.get('solo_activos', 'true').lower() != 'false'
        repo = DjangoCategoriaRepository()
        categorias = repo.listar(solo_activos=solo_activos)
        return success_response(data=[_categoria_a_dict(c) for c in categorias])

    def post(self, request):
        serializer = CrearCategoriaSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Datos de la categoría inválidos.", serializer.errors)
        try:
            repo = DjangoCategoriaRepository()
            use_case = CrearCategoriaUseCase(repo)
            cat = use_case.ejecutar(**serializer.validated_data)
            return success_response(
                data=_categoria_a_dict(cat),
                message="Categoría creada exitosamente.",
                status_code=status.HTTP_201_CREATED,
            )
        except ReglaNegocioException as e:
            return error_response("No se pudo crear la categoría.", e.detail)


class CategoriaDetailView(APIView):
    def get(self, request, id: int):
        repo = DjangoCategoriaRepository()
        cat = repo.obtener_por_id(id)
        if not cat:
            return error_response(
                "Categoría no encontrada.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        return success_response(data=_categoria_a_dict(cat))

    def put(self, request, id: int):
        serializer = ActualizarCategoriaSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response("Datos de la categoría inválidos.", serializer.errors)
        try:
            repo = DjangoCategoriaRepository()
            use_case = ActualizarCategoriaUseCase(repo)
            cat = use_case.ejecutar(id=id, **serializer.validated_data)
            return success_response(
                data=_categoria_a_dict(cat),
                message="Categoría actualizada.",
            )
        except EntidadNoEncontradaException as e:
            return error_response(
                "Categoría no encontrada.", e.detail,
                status_code=status.HTTP_404_NOT_FOUND,
            )
        except ReglaNegocioException as e:
            return error_response("No se pudo actualizar la categoría.", e.detail)

    def delete(self, request, id: int):
        repo = DjangoCategoriaRepository()
        if not repo.obtener_por_id(id):
            return error_response(
                "Categoría no encontrada.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        repo.eliminar(id)
        return success_response(message="Categoría eliminada.")


# ──────────────────────────────────────────────────────────────────────
# Ubicaciones
# ──────────────────────────────────────────────────────────────────────

class UbicacionListCreateView(APIView):
    def get(self, request):
        solo_activos = request.query_params.get('solo_activos', 'true').lower() != 'false'
        repo = DjangoUbicacionRepository()
        ubicaciones = repo.listar(solo_activos=solo_activos)
        return success_response(data=[_ubicacion_a_dict(u) for u in ubicaciones])

    def post(self, request):
        serializer = CrearUbicacionSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Datos de la ubicación inválidos.", serializer.errors)
        repo = DjangoUbicacionRepository()
        ubicacion = repo.crear(UbicacionDomain(**serializer.validated_data))
        return success_response(
            data=_ubicacion_a_dict(ubicacion),
            message="Ubicación creada exitosamente.",
            status_code=status.HTTP_201_CREATED,
        )


class UbicacionDetailView(APIView):
    def get(self, request, id: int):
        repo = DjangoUbicacionRepository()
        ub = repo.obtener_por_id(id)
        if not ub:
            return error_response(
                "Ubicación no encontrada.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        return success_response(data=_ubicacion_a_dict(ub))

    def put(self, request, id: int):
        serializer = ActualizarUbicacionSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response("Datos de la ubicación inválidos.", serializer.errors)
        repo = DjangoUbicacionRepository()
        ub = repo.obtener_por_id(id)
        if not ub:
            return error_response(
                "Ubicación no encontrada.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        for campo, valor in serializer.validated_data.items():
            setattr(ub, campo, valor)
        ub = repo.actualizar(ub)
        return success_response(
            data=_ubicacion_a_dict(ub),
            message="Ubicación actualizada.",
        )

    def delete(self, request, id: int):
        repo = DjangoUbicacionRepository()
        if not repo.obtener_por_id(id):
            return error_response(
                "Ubicación no encontrada.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        repo.eliminar(id)
        return success_response(message="Ubicación eliminada.")


# ──────────────────────────────────────────────────────────────────────
# Productos
# ──────────────────────────────────────────────────────────────────────

class ProductoListCreateView(APIView):
    def get(self, request):
        solo_activos = request.query_params.get('solo_activos', 'true').lower() != 'false'
        repo = DjangoProductoRepository()
        productos = repo.listar(solo_activos=solo_activos)
        return success_response(data=[_producto_a_dict(p) for p in productos])

    def post(self, request):
        serializer = CrearProductoSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Datos del producto inválidos.", serializer.errors)
        try:
            p_repo = DjangoProductoRepository()
            c_repo = DjangoCategoriaRepository()
            u_repo = DjangoUbicacionRepository()
            use_case = CrearProductoUseCase(p_repo, c_repo, u_repo)
            producto = use_case.ejecutar(**serializer.validated_data)
            return success_response(
                data=_producto_a_dict(producto),
                message="Producto creado exitosamente.",
                status_code=status.HTTP_201_CREATED,
            )
        except EntidadNoEncontradaException as e:
            return error_response(
                "Recurso relacionado no encontrado.", e.detail,
                status_code=status.HTTP_404_NOT_FOUND,
            )
        except ReglaNegocioException as e:
            return error_response("No se pudo crear el producto.", e.detail)


class ProductoBuscarView(APIView):
    """GET /productos/buscar?q=termino"""

    def get(self, request):
        termino = request.query_params.get('q', '').strip()
        if not termino:
            return error_response(
                "Debe proporcionar el parámetro de búsqueda 'q'.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        repo = DjangoProductoRepository()
        productos = repo.buscar(termino)
        return success_response(data=[_producto_a_dict(p) for p in productos])


class ProductoDetailView(APIView):
    def get(self, request, id: int):
        repo = DjangoProductoRepository()
        producto = repo.obtener_por_id(id)
        if not producto:
            return error_response(
                "Producto no encontrado.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        return success_response(data=_producto_a_dict(producto))

    def put(self, request, id: int):
        serializer = ActualizarProductoSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response("Datos del producto inválidos.", serializer.errors)
        repo = DjangoProductoRepository()
        producto = repo.obtener_por_id(id)
        if not producto:
            return error_response(
                "Producto no encontrado.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        validated = serializer.validated_data
        if 'codigo' in validated and validated['codigo'] != producto.codigo:
            existente = repo.obtener_por_codigo(validated['codigo'])
            if existente and existente.id != producto.id:
                return error_response(
                    "No se pudo actualizar el producto.",
                    {"codigo": f"El código '{validated['codigo']}' ya está registrado."},
                )

        if 'categoria_id' in validated:
            if not DjangoCategoriaRepository().obtener_por_id(validated['categoria_id']):
                return error_response(
                    "Categoría no encontrada.",
                    {"categoria_id": "Categoría no encontrada."},
                    status_code=status.HTTP_404_NOT_FOUND,
                )
        if 'ubicacion_id' in validated:
            if not DjangoUbicacionRepository().obtener_por_id(validated['ubicacion_id']):
                return error_response(
                    "Ubicación no encontrada.",
                    {"ubicacion_id": "Ubicación no encontrada."},
                    status_code=status.HTTP_404_NOT_FOUND,
                )

        for campo, valor in validated.items():
            setattr(producto, campo, valor)
        producto = repo.actualizar(producto)
        return success_response(
            data=_producto_a_dict(producto),
            message="Producto actualizado.",
        )

    def delete(self, request, id: int):
        try:
            repo = DjangoProductoRepository()
            use_case = EliminarProductoUseCase(repo)
            resultado = use_case.ejecutar(id)
            return success_response(
                data=resultado,
                message=resultado["mensaje"],
            )
        except EntidadNoEncontradaException as e:
            return error_response(
                "Producto no encontrado.", e.detail,
                status_code=status.HTTP_404_NOT_FOUND,
            )


class ProductoLotesView(APIView):
    """GET /productos/<id>/lotes — lotes activos del producto en orden FIFO."""

    def get(self, request, id: int):
        if not DjangoProductoRepository().obtener_por_id(id):
            return error_response(
                "Producto no encontrado.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        repo = DjangoLoteRepository()
        lotes = repo.listar_por_producto_fifo(id)
        return success_response(data=[_lote_a_dict(l) for l in lotes])


# ──────────────────────────────────────────────────────────────────────
# Lotes
# ──────────────────────────────────────────────────────────────────────

class LoteListView(APIView):
    """GET /lotes/producto/<producto_id> — lotes activos del producto en orden FIFO."""

    def get(self, request, producto_id: int):
        if not DjangoProductoRepository().obtener_por_id(producto_id):
            return error_response(
                "Producto no encontrado.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        repo = DjangoLoteRepository()
        lotes = repo.listar_por_producto_fifo(producto_id)
        return success_response(data=[_lote_a_dict(l) for l in lotes])
