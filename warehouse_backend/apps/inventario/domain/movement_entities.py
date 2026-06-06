# apps/inventario/domain/movement_entities.py
from dataclasses import dataclass
from typing import Optional
from datetime import datetime
from enum import Enum


class TipoMovimientoEnum(str, Enum):
    ENTRADA = "entrada"
    SALIDA = "salida"
    TRASLADO = "traslado"


@dataclass
class MovimientoDomain:
    producto_id: int
    tipo_movimiento_id: int
    cantidad: int
    stock_anterior: int
    stock_nuevo: int
    usuario_id: int
    lote_id: Optional[int] = None
    proveedor_id: Optional[int] = None
    cliente_id: Optional[int] = None
    observaciones: str = ""
    fecha: Optional[datetime] = None
    id: Optional[int] = None


@dataclass
class AlertaDomain:
    producto_id: int
    tipo: str
    mensaje: str
    atendida: bool = False
    id: Optional[int] = None
