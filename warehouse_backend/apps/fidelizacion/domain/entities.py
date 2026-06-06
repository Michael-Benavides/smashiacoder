# apps/fidelizacion/domain/entities.py
from dataclasses import dataclass
from typing import Optional
from datetime import datetime


@dataclass
class ReglaFidelizacionDomain:
    nombre: str
    puntos_por_unidad: int
    nivel_minimo: str
    nivel_maximo: str
    recompensa: str
    activo: bool = True
    id: Optional[int] = None

    def calcular_puntos(self, unidades: int) -> int:
        return unidades * self.puntos_por_unidad


@dataclass
class CanjesFidelizacionDomain:
    cliente_id: int
    puntos_canjeados: int
    recompensa: str
    usuario_id: int
    fecha: Optional[datetime] = None
    id: Optional[int] = None
