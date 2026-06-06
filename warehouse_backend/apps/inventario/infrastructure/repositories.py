# apps/inventario/infrastructure/repositories.py
from typing import List, Optional
from decimal import Decimal

from django.db import transaction
from django.db.models import Q

from ..domain.entities import (
    CategoriaDomain,
    LoteDomain,
    ProductoDomain,
    UbicacionDomain,
)
from ..domain.ports import (
    CategoriaRepositoryPort,
    LoteRepositoryPort,
    ProductoRepositoryPort,
    UbicacionRepositoryPort,
)
from .models import (
    CategoriaORM,
    LoteORM,
    MovimientoORM,
    ProductoORM,
    UbicacionORM,
)


# ──────────────────────────────────────────────────────────────────────
# Mappers ORM ↔ Domain
# ──────────────────────────────────────────────────────────────────────

def _categoria_orm_a_domain(orm: CategoriaORM) -> CategoriaDomain:
    return CategoriaDomain(
        id=orm.id,
        nombre=orm.nombre,
        descripcion=orm.descripcion,
        activo=orm.activo,
    )


def _ubicacion_orm_a_domain(orm: UbicacionORM) -> UbicacionDomain:
    return UbicacionDomain(
        id=orm.id,
        nombre=orm.nombre,
        descripcion=orm.descripcion,
        zona=orm.zona,
        activo=orm.activo,
    )


def _producto_orm_a_domain(orm: ProductoORM) -> ProductoDomain:
    return ProductoDomain(
        id=orm.id,
        codigo=orm.codigo,
        nombre=orm.nombre,
        descripcion=orm.descripcion,
        categoria_id=orm.categoria_id,
        precio_compra=orm.precio_compra,
        precio_venta=orm.precio_venta,
        unidad_medida=orm.unidad_medida,
        stock_actual=orm.stock_actual,
        stock_minimo=orm.stock_minimo,
        ubicacion_id=orm.ubicacion_id,
        activo=orm.activo,
    )


def _lote_orm_a_domain(orm: LoteORM) -> LoteDomain:
    return LoteDomain(
        id=orm.id,
        producto_id=orm.producto_id,
        numero_lote=orm.numero_lote,
        fecha_ingreso=orm.fecha_ingreso,
        fecha_vencimiento=orm.fecha_vencimiento,
        cantidad=orm.cantidad,
        activo=orm.activo,
    )


# ──────────────────────────────────────────────────────────────────────
# Repositorios
# ──────────────────────────────────────────────────────────────────────

class DjangoCategoriaRepository(CategoriaRepositoryPort):
    def crear(self, cat: CategoriaDomain) -> CategoriaDomain:
        orm = CategoriaORM.objects.create(
            nombre=cat.nombre,
            descripcion=cat.descripcion,
            activo=cat.activo,
        )
        return _categoria_orm_a_domain(orm)

    def obtener_por_id(self, id: int) -> Optional[CategoriaDomain]:
        try:
            return _categoria_orm_a_domain(CategoriaORM.objects.get(pk=id))
        except CategoriaORM.DoesNotExist:
            return None

    def listar(self, solo_activos: bool = True) -> List[CategoriaDomain]:
        qs = CategoriaORM.objects.all().order_by('nombre')
        if solo_activos:
            qs = qs.filter(activo=True)
        return [_categoria_orm_a_domain(c) for c in qs]

    def actualizar(self, cat: CategoriaDomain) -> CategoriaDomain:
        CategoriaORM.objects.filter(pk=cat.id).update(
            nombre=cat.nombre,
            descripcion=cat.descripcion,
            activo=cat.activo,
        )
        return self.obtener_por_id(cat.id)

    def eliminar(self, id: int) -> None:
        CategoriaORM.objects.filter(pk=id).delete()


class DjangoUbicacionRepository(UbicacionRepositoryPort):
    def crear(self, ub: UbicacionDomain) -> UbicacionDomain:
        orm = UbicacionORM.objects.create(
            nombre=ub.nombre,
            descripcion=ub.descripcion,
            zona=ub.zona,
            activo=ub.activo,
        )
        return _ubicacion_orm_a_domain(orm)

    def obtener_por_id(self, id: int) -> Optional[UbicacionDomain]:
        try:
            return _ubicacion_orm_a_domain(UbicacionORM.objects.get(pk=id))
        except UbicacionORM.DoesNotExist:
            return None

    def listar(self, solo_activos: bool = True) -> List[UbicacionDomain]:
        qs = UbicacionORM.objects.all().order_by('nombre')
        if solo_activos:
            qs = qs.filter(activo=True)
        return [_ubicacion_orm_a_domain(u) for u in qs]

    def actualizar(self, ub: UbicacionDomain) -> UbicacionDomain:
        UbicacionORM.objects.filter(pk=ub.id).update(
            nombre=ub.nombre,
            descripcion=ub.descripcion,
            zona=ub.zona,
            activo=ub.activo,
        )
        return self.obtener_por_id(ub.id)

    def eliminar(self, id: int) -> None:
        UbicacionORM.objects.filter(pk=id).delete()


class DjangoProductoRepository(ProductoRepositoryPort):
    def crear(self, p: ProductoDomain) -> ProductoDomain:
        orm = ProductoORM.objects.create(
            codigo=p.codigo,
            nombre=p.nombre,
            descripcion=p.descripcion,
            categoria_id=p.categoria_id,
            precio_compra=p.precio_compra,
            precio_venta=p.precio_venta,
            unidad_medida=p.unidad_medida,
            stock_actual=p.stock_actual,
            stock_minimo=p.stock_minimo,
            ubicacion_id=p.ubicacion_id,
            activo=p.activo,
        )
        return _producto_orm_a_domain(orm)

    def obtener_por_id(self, id: int) -> Optional[ProductoDomain]:
        try:
            return _producto_orm_a_domain(ProductoORM.objects.get(pk=id))
        except ProductoORM.DoesNotExist:
            return None

    def obtener_por_codigo(self, codigo: str) -> Optional[ProductoDomain]:
        try:
            return _producto_orm_a_domain(ProductoORM.objects.get(codigo=codigo))
        except ProductoORM.DoesNotExist:
            return None

    def listar(self, solo_activos: bool = True) -> List[ProductoDomain]:
        qs = ProductoORM.objects.select_related('categoria', 'ubicacion').order_by('nombre')
        if solo_activos:
            qs = qs.filter(activo=True)
        return [_producto_orm_a_domain(p) for p in qs]

    def buscar(self, termino: str) -> List[ProductoDomain]:
        if not termino:
            return []
        qs = ProductoORM.objects.filter(
            Q(codigo__icontains=termino) | Q(nombre__icontains=termino),
            activo=True,
        ).order_by('nombre')
        return [_producto_orm_a_domain(p) for p in qs]

    def actualizar(self, p: ProductoDomain) -> ProductoDomain:
        ProductoORM.objects.filter(pk=p.id).update(
            codigo=p.codigo,
            nombre=p.nombre,
            descripcion=p.descripcion,
            categoria_id=p.categoria_id,
            precio_compra=p.precio_compra,
            precio_venta=p.precio_venta,
            unidad_medida=p.unidad_medida,
            stock_minimo=p.stock_minimo,
            ubicacion_id=p.ubicacion_id,
            activo=p.activo,
        )
        return self.obtener_por_id(p.id)

    def actualizar_stock(self, producto_id: int, nuevo_stock: int) -> None:
        ProductoORM.objects.filter(pk=producto_id).update(stock_actual=nuevo_stock)

    def tiene_movimientos(self, producto_id: int) -> bool:
        return MovimientoORM.objects.filter(producto_id=producto_id).exists()

    @transaction.atomic
    def eliminar_fisico(self, id: int) -> None:
        # LoteORM.producto tiene on_delete=CASCADE, así que al eliminar
        # el producto se eliminan automáticamente sus lotes asociados.
        ProductoORM.objects.filter(pk=id).delete()

    def desactivar(self, id: int) -> None:
        ProductoORM.objects.filter(pk=id).update(activo=False)


class DjangoLoteRepository(LoteRepositoryPort):
    def crear(self, lote: LoteDomain) -> LoteDomain:
        orm = LoteORM.objects.create(
            producto_id=lote.producto_id,
            numero_lote=lote.numero_lote,
            fecha_ingreso=lote.fecha_ingreso,
            fecha_vencimiento=lote.fecha_vencimiento,
            cantidad=lote.cantidad,
            activo=lote.activo,
        )
        return _lote_orm_a_domain(orm)

    def obtener_por_id(self, id: int) -> Optional[LoteDomain]:
        try:
            return _lote_orm_a_domain(LoteORM.objects.get(pk=id))
        except LoteORM.DoesNotExist:
            return None

    def obtener_por_producto_y_numero(self, producto_id: int, numero_lote: str) -> Optional[LoteDomain]:
        try:
            return _lote_orm_a_domain(
                LoteORM.objects.get(producto_id=producto_id, numero_lote=numero_lote)
            )
        except LoteORM.DoesNotExist:
            return None

    def listar_por_producto_fifo(self, producto_id: int) -> List[LoteDomain]:
        qs = LoteORM.objects.filter(
            producto_id=producto_id,
            activo=True,
            cantidad__gt=0,
        ).order_by('fecha_ingreso')
        return [_lote_orm_a_domain(l) for l in qs]

    def actualizar_cantidad(self, lote_id: int, nueva_cantidad: int) -> None:
        LoteORM.objects.filter(pk=lote_id).update(cantidad=nueva_cantidad)

    def desactivar(self, lote_id: int) -> None:
        LoteORM.objects.filter(pk=lote_id).update(activo=False)
