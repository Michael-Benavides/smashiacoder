"""
Bridge module para que Django descubra los modelos ORM definidos en la
capa de infraestructura. Mantiene la separación hexagonal: el código del
dominio sigue sin importar Django.
"""

from .infrastructure.models import RolORM, UsuarioORM  # noqa: F401

__all__ = ["RolORM", "UsuarioORM"]
