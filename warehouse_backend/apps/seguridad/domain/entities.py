# apps/seguridad/domain/entities.py
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime


@dataclass
class RolDomain:
    nombre: str
    descripcion: str = ""
    id: Optional[int] = None


@dataclass
class UsuarioDomain:
    nombre: str
    email: str
    rol_id: int
    password_hash: str = ""
    activo: bool = True
    avatar: Optional[str] = None
    reset_token: Optional[str] = None
    reset_token_expiry: Optional[datetime] = None
    id: Optional[int] = None

    def esta_activo(self) -> bool:
        return self.activo

    def token_reset_valido(self, token: str) -> bool:
        if not self.reset_token or not self.reset_token_expiry:
            return False
        return self.reset_token == token and datetime.now() < self.reset_token_expiry
