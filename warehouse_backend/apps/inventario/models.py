"""
Bridge module para que Django descubra los modelos ORM definidos en la
capa de infraestructura. Mantiene la separación hexagonal: el código del
dominio sigue sin importar Django.
"""

from .infrastructure.models import (  # noqa: F401
    AlertaORM,
    CategoriaORM,
    LoteORM,
    MovimientoORM,
    ProductoORM,
    TipoMovimientoORM,
    UbicacionORM,
)

__all__ = [
    "CategoriaORM",
    "UbicacionORM",
    "ProductoORM",
    "LoteORM",
    "TipoMovimientoORM",
    "MovimientoORM",
    "AlertaORM",
]
