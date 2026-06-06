# apps/administracion/domain/ports.py
from abc import ABC, abstractmethod
from datetime import date
from typing import List, Optional

from .entities import AuditoriaDomain, ConfiguracionDomain


class ConfiguracionRepositoryPort(ABC):
    @abstractmethod
    def crear(self, configuracion: ConfiguracionDomain) -> ConfiguracionDomain: ...
    @abstractmethod
    def obtener_por_clave(self, clave: str) -> Optional[ConfiguracionDomain]: ...
    @abstractmethod
    def listar(self) -> List[ConfiguracionDomain]: ...
    @abstractmethod
    def actualizar(self, configuracion: ConfiguracionDomain) -> ConfiguracionDomain: ...


class AuditoriaRepositoryPort(ABC):
    @abstractmethod
    def crear(self, auditoria: AuditoriaDomain) -> AuditoriaDomain: ...

    @abstractmethod
    def listar(
        self,
        entidad: Optional[str] = None,
        usuario_id: Optional[int] = None,
        fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None,
    ) -> List[AuditoriaDomain]: ...
