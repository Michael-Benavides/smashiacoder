"""
Bridge module para que Django descubra los modelos ORM definidos en la
capa de infraestructura. Mantiene la separación hexagonal: el dominio
sigue sin importar Django.
"""

from .infrastructure.models import (  # noqa: F401
    CanjesFidelizacionORM,
    ReglaFidelizacionORM,
)

__all__ = ["ReglaFidelizacionORM", "CanjesFidelizacionORM"]
