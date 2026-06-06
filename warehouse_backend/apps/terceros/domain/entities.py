# apps/terceros/domain/entities.py
from dataclasses import dataclass
from typing import Optional


@dataclass
class ProveedorDomain:
    nombre: str
    ruc_nit: str = ""
    telefono: str = ""
    email: str = ""
    direccion: str = ""
    activo: bool = True
    id: Optional[int] = None


@dataclass
class ClienteDomain:
    nombre: str
    identificacion: str = ""
    email: str = ""
    telefono: str = ""
    direccion: str = ""
    puntos_fidelizacion: int = 0
    nivel_fidelidad: str = "Bronce"
    activo: bool = True
    id: Optional[int] = None

    def puede_canjear(self, puntos: int) -> bool:
        return self.puntos_fidelizacion >= puntos >= 1
