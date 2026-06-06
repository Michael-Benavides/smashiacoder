# apps/inventario/domain/entities.py
from dataclasses import dataclass, field
from typing import Optional
from datetime import date, datetime
from decimal import Decimal


@dataclass
class CategoriaDomain:
    nombre: str
    descripcion: str = ""
    activo: bool = True
    id: Optional[int] = None


@dataclass
class UbicacionDomain:
    nombre: str
    descripcion: str = ""
    zona: str = ""
    activo: bool = True
    id: Optional[int] = None


@dataclass
class ProductoDomain:
    codigo: str
    nombre: str
    categoria_id: int
    precio_compra: Decimal
    precio_venta: Decimal
    unidad_medida: str
    stock_minimo: int
    ubicacion_id: int
    descripcion: str = ""
    stock_actual: int = 0
    activo: bool = True
    id: Optional[int] = None

    def __post_init__(self):
        if self.precio_compra < 0:
            raise ValueError("El precio de compra no puede ser negativo.")
        if self.precio_venta < 0:
            raise ValueError("El precio de venta no puede ser negativo.")
        if self.stock_minimo < 0:
            raise ValueError("El stock mínimo no puede ser negativo.")

    def tiene_stock_bajo(self) -> bool:
        return self.stock_actual <= self.stock_minimo

    def tiene_movimientos(self) -> bool:
        return False


@dataclass
class LoteDomain:
    producto_id: int
    numero_lote: str
    fecha_ingreso: date
    cantidad: int
    fecha_vencimiento: Optional[date] = None
    activo: bool = True
    id: Optional[int] = None

    def __post_init__(self):
        if self.cantidad < 0:
            raise ValueError("La cantidad del lote no puede ser negativa.")
