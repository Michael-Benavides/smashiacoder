# apps/inventario/application/use_cases.py
from decimal import Decimal
from typing import List, Optional
from ..domain.entities import CategoriaDomain, UbicacionDomain, ProductoDomain, LoteDomain
from ..domain.ports import CategoriaRepositoryPort, UbicacionRepositoryPort, ProductoRepositoryPort, LoteRepositoryPort
from shared.exceptions import ReglaNegocioException, EntidadNoEncontradaException


class CrearCategoriaUseCase:
    def __init__(self, repo: CategoriaRepositoryPort):
        self._repo = repo

    def ejecutar(self, nombre: str, descripcion: str = "") -> CategoriaDomain:
        return self._repo.crear(CategoriaDomain(nombre=nombre, descripcion=descripcion))


class ActualizarCategoriaUseCase:
    def __init__(self, repo: CategoriaRepositoryPort):
        self._repo = repo

    def ejecutar(self, id: int, nombre: str = None, descripcion: str = None, activo: bool = None) -> CategoriaDomain:
        cat = self._repo.obtener_por_id(id)
        if not cat:
            raise EntidadNoEncontradaException(detail={"id": "Categoría no encontrada."})
        if nombre is not None:
            cat.nombre = nombre
        if descripcion is not None:
            cat.descripcion = descripcion
        if activo is not None:
            cat.activo = activo
        return self._repo.actualizar(cat)


class CrearProductoUseCase:
    def __init__(self, producto_repo: ProductoRepositoryPort, categoria_repo: CategoriaRepositoryPort, ubicacion_repo: UbicacionRepositoryPort):
        self._p_repo = producto_repo
        self._c_repo = categoria_repo
        self._u_repo = ubicacion_repo

    def ejecutar(self, codigo: str, nombre: str, categoria_id: int, precio_compra: Decimal,
                 precio_venta: Decimal, unidad_medida: str, stock_minimo: int,
                 ubicacion_id: int, descripcion: str = "") -> ProductoDomain:
        if self._p_repo.obtener_por_codigo(codigo):
            raise ReglaNegocioException(detail={"codigo": f"El código '{codigo}' ya está registrado."})
        if not self._c_repo.obtener_por_id(categoria_id):
            raise EntidadNoEncontradaException(detail={"categoria_id": "Categoría no encontrada."})
        if not self._u_repo.obtener_por_id(ubicacion_id):
            raise EntidadNoEncontradaException(detail={"ubicacion_id": "Ubicación no encontrada."})
        try:
            producto = ProductoDomain(
                codigo=codigo, nombre=nombre, categoria_id=categoria_id,
                precio_compra=Decimal(str(precio_compra)), precio_venta=Decimal(str(precio_venta)),
                unidad_medida=unidad_medida, stock_minimo=stock_minimo,
                ubicacion_id=ubicacion_id, descripcion=descripcion
            )
        except ValueError as e:
            raise ReglaNegocioException(detail={"validacion": str(e)})
        return self._p_repo.crear(producto)


class EliminarProductoUseCase:
    """
    Regla de negocio crítica:
    - Si tiene movimientos: borrado lógico (desactivar).
    - Si no tiene historial: borrado físico (eliminar lotes y producto).
    """
    def __init__(self, producto_repo: ProductoRepositoryPort):
        self._repo = producto_repo

    def ejecutar(self, producto_id: int) -> dict:
        producto = self._repo.obtener_por_id(producto_id)
        if not producto:
            raise EntidadNoEncontradaException(detail={"id": "Producto no encontrado."})
        if self._repo.tiene_movimientos(producto_id):
            self._repo.desactivar(producto_id)
            return {"tipo": "logico", "mensaje": "Producto desactivado (tiene historial de movimientos)."}
        else:
            self._repo.eliminar_fisico(producto_id)
            return {"tipo": "fisico", "mensaje": "Producto eliminado permanentemente."}
