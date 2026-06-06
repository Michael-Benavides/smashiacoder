# apps/administracion/domain/entities.py
from dataclasses import dataclass
from typing import Optional, Any
from datetime import datetime


@dataclass
class ConfiguracionDomain:
    clave: str
    valor: str
    descripcion: str = ""
    id: Optional[int] = None


@dataclass
class AuditoriaDomain:
    usuario_id: int
    accion: str
    entidad: str
    entidad_id: int
    datos_anteriores: Any = None
    datos_nuevos: Any = None
    ip: str = ""
    fecha: Optional[datetime] = None
    id: Optional[int] = None
