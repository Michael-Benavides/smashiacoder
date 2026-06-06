# apps/inventario/application/movement_use_cases.py
from typing import Optional, List
from ..domain.ports import ProductoRepositoryPort, LoteRepositoryPort
from ..domain.movement_ports import MovimientoRepositoryPort, AlertaRepositoryPort
from ..domain.movement_entities import MovimientoDomain, AlertaDomain
from ..domain.entities import LoteDomain
from shared.exceptions import ReglaNegocioException, EntidadNoEncontradaException
from datetime import date


class EntradaInventarioUseCase:
    def __init__(self, producto_repo: ProductoRepositoryPort, lote_repo: LoteRepositoryPort,
                 movimiento_repo: MovimientoRepositoryPort, alerta_repo: AlertaRepositoryPort,
                 tipo_movimiento_entrada_id: int):
        self._p_repo = producto_repo
        self._l_repo = lote_repo
        self._m_repo = movimiento_repo
        self._a_repo = alerta_repo
        self._tipo_entrada_id = tipo_movimiento_entrada_id

    def ejecutar(self, producto_id: int, cantidad: int, numero_lote: str,
                 usuario_id: int, proveedor_id: Optional[int] = None,
                 observaciones: str = "", fecha_vencimiento=None) -> MovimientoDomain:
        if cantidad < 1:
            raise ReglaNegocioException(detail={"cantidad": "La cantidad debe ser mayor o igual a 1."})
        producto = self._p_repo.obtener_por_id(producto_id)
        if not producto:
            raise EntidadNoEncontradaException(detail={"producto_id": "Producto no encontrado."})

        lote = self._l_repo.obtener_por_producto_y_numero(producto_id, numero_lote)
        if lote:
            nueva_cantidad_lote = lote.cantidad + cantidad
            self._l_repo.actualizar_cantidad(lote.id, nueva_cantidad_lote)
        else:
            lote = self._l_repo.crear(LoteDomain(
                producto_id=producto_id, numero_lote=numero_lote,
                fecha_ingreso=date.today(), cantidad=cantidad,
                fecha_vencimiento=fecha_vencimiento
            ))

        stock_anterior = producto.stock_actual
        stock_nuevo = stock_anterior + cantidad
        self._p_repo.actualizar_stock(producto_id, stock_nuevo)

        movimiento = self._m_repo.crear(MovimientoDomain(
            producto_id=producto_id, tipo_movimiento_id=self._tipo_entrada_id,
            cantidad=cantidad, stock_anterior=stock_anterior, stock_nuevo=stock_nuevo,
            usuario_id=usuario_id, lote_id=lote.id, proveedor_id=proveedor_id,
            observaciones=observaciones
        ))
        self._refrescar_alertas(producto_id, stock_nuevo, producto.stock_minimo)
        return movimiento

    def _refrescar_alertas(self, producto_id: int, stock_actual: int, stock_minimo: int):
        if stock_actual <= stock_minimo:
            self._a_repo.crear(AlertaDomain(
                producto_id=producto_id, tipo="stock_bajo",
                mensaje=f"Stock crítico: {stock_actual} unidades (mínimo: {stock_minimo})."
            ))
        else:
            self._a_repo.desactivar_para_producto(producto_id)


class SalidaInventarioUseCase:
    """
    Implementa FIFO estricto:
    Descuenta primero de los lotes con fecha_ingreso más antigua.
    """
    def __init__(self, producto_repo: ProductoRepositoryPort, lote_repo: LoteRepositoryPort,
                 movimiento_repo: MovimientoRepositoryPort, alerta_repo: AlertaRepositoryPort,
                 tipo_movimiento_salida_id: int):
        self._p_repo = producto_repo
        self._l_repo = lote_repo
        self._m_repo = movimiento_repo
        self._a_repo = alerta_repo
        self._tipo_salida_id = tipo_movimiento_salida_id

    def ejecutar(self, producto_id: int, cantidad: int, usuario_id: int,
                 cliente_id: Optional[int] = None, observaciones: str = "") -> List[MovimientoDomain]:
        if cantidad < 1:
            raise ReglaNegocioException(detail={"cantidad": "La cantidad debe ser mayor o igual a 1."})
        producto = self._p_repo.obtener_por_id(producto_id)
        if not producto:
            raise EntidadNoEncontradaException(detail={"producto_id": "Producto no encontrado."})
        if producto.stock_actual < cantidad:
            raise ReglaNegocioException(detail={
                "cantidad": f"Stock insuficiente. Disponible: {producto.stock_actual}, solicitado: {cantidad}."
            })

        lotes_fifo = self._l_repo.listar_por_producto_fifo(producto_id)
        cantidad_restante = cantidad
        movimientos_creados = []
        stock_anterior_global = producto.stock_actual

        for lote in lotes_fifo:
            if cantidad_restante <= 0:
                break
            descontar = min(lote.cantidad, cantidad_restante)
            nueva_cantidad_lote = lote.cantidad - descontar
            self._l_repo.actualizar_cantidad(lote.id, nueva_cantidad_lote)
            if nueva_cantidad_lote == 0:
                self._l_repo.desactivar(lote.id)
            cantidad_restante -= descontar

        stock_nuevo = stock_anterior_global - cantidad
        self._p_repo.actualizar_stock(producto_id, stock_nuevo)

        movimiento = self._m_repo.crear(MovimientoDomain(
            producto_id=producto_id, tipo_movimiento_id=self._tipo_salida_id,
            cantidad=cantidad, stock_anterior=stock_anterior_global, stock_nuevo=stock_nuevo,
            usuario_id=usuario_id, cliente_id=cliente_id, observaciones=observaciones
        ))
        movimientos_creados.append(movimiento)
        self._refrescar_alertas(producto_id, stock_nuevo, producto.stock_minimo)
        return movimientos_creados

    def _refrescar_alertas(self, producto_id: int, stock_actual: int, stock_minimo: int):
        if stock_actual <= stock_minimo:
            self._a_repo.crear(AlertaDomain(
                producto_id=producto_id, tipo="stock_bajo",
                mensaje=f"Stock crítico: {stock_actual} unidades (mínimo: {stock_minimo})."
            ))
        else:
            self._a_repo.desactivar_para_producto(producto_id)


class TrasladoInventarioUseCase:
    def __init__(self, producto_repo: ProductoRepositoryPort, movimiento_repo: MovimientoRepositoryPort,
                 tipo_traslado_id: int):
        self._p_repo = producto_repo
        self._m_repo = movimiento_repo
        self._tipo_traslado_id = tipo_traslado_id

    def ejecutar(self, producto_id: int, ubicacion_origen_id: int, ubicacion_destino_id: int,
                 cantidad: int, usuario_id: int, observaciones: str = "") -> MovimientoDomain:
        if ubicacion_origen_id == ubicacion_destino_id:
            raise ReglaNegocioException(detail={"ubicacion": "El origen y destino del traslado deben ser distintos."})
        if cantidad < 1:
            raise ReglaNegocioException(detail={"cantidad": "La cantidad debe ser mayor o igual a 1."})
        producto = self._p_repo.obtener_por_id(producto_id)
        if not producto:
            raise EntidadNoEncontradaException(detail={"producto_id": "Producto no encontrado."})
        return self._m_repo.crear(MovimientoDomain(
            producto_id=producto_id, tipo_movimiento_id=self._tipo_traslado_id,
            cantidad=cantidad, stock_anterior=producto.stock_actual,
            stock_nuevo=producto.stock_actual, usuario_id=usuario_id,
            observaciones=f"Traslado {ubicacion_origen_id}→{ubicacion_destino_id}. {observaciones}"
        ))
