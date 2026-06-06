"""
Bridge module para que Django descubra los modelos ORM definidos en la
capa de infraestructura. La separación hexagonal se mantiene: el dominio
no importa Django.
"""

from .infrastructure.models import (  # noqa: F401
    AuditoriaORM,
    ConfiguracionORM,
)

__all__ = ["ConfiguracionORM", "AuditoriaORM"]
