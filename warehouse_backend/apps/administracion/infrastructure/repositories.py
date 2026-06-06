# apps/administracion/infrastructure/repositories.py
from datetime import date, datetime, time
from typing import List, Optional

from django.utils import timezone

from ..domain.entities import AuditoriaDomain, ConfiguracionDomain
from ..domain.ports import (
    AuditoriaRepositoryPort,
    ConfiguracionRepositoryPort,
)
from .models import AuditoriaORM, ConfiguracionORM


# ──────────────────────────────────────────────────────────────────────
# Mappers
# ──────────────────────────────────────────────────────────────────────

def _config_orm_a_domain(orm: ConfiguracionORM) -> ConfiguracionDomain:
    return ConfiguracionDomain(
        id=orm.id,
        clave=orm.clave,
        valor=orm.valor,
        descripcion=orm.descripcion or "",
    )


def _auditoria_orm_a_domain(orm: AuditoriaORM) -> AuditoriaDomain:
    return AuditoriaDomain(
        id=orm.id,
        usuario_id=orm.usuario_id,
        accion=orm.accion,
        entidad=orm.entidad,
        entidad_id=orm.entidad_id,
        datos_anteriores=orm.datos_anteriores,
        datos_nuevos=orm.datos_nuevos,
        ip=orm.ip or "",
        fecha=orm.fecha,
    )


# ──────────────────────────────────────────────────────────────────────
# Configuración
# ──────────────────────────────────────────────────────────────────────

class DjangoConfiguracionRepository(ConfiguracionRepositoryPort):
    def crear(self, configuracion: ConfiguracionDomain) -> ConfiguracionDomain:
        orm = ConfiguracionORM.objects.create(
            clave=configuracion.clave,
            valor=configuracion.valor,
            descripcion=configuracion.descripcion or "",
        )
        return _config_orm_a_domain(orm)

    def obtener_por_clave(self, clave: str) -> Optional[ConfiguracionDomain]:
        try:
            return _config_orm_a_domain(ConfiguracionORM.objects.get(clave=clave))
        except ConfiguracionORM.DoesNotExist:
            return None

    def listar(self) -> List[ConfiguracionDomain]:
        return [_config_orm_a_domain(c) for c in ConfiguracionORM.objects.all()]

    def actualizar(self, configuracion: ConfiguracionDomain) -> ConfiguracionDomain:
        ConfiguracionORM.objects.filter(clave=configuracion.clave).update(
            valor=configuracion.valor,
            descripcion=configuracion.descripcion or "",
        )
        return self.obtener_por_clave(configuracion.clave)


# ──────────────────────────────────────────────────────────────────────
# Auditoría
# ──────────────────────────────────────────────────────────────────────

def _aplicar_filtros_auditoria(qs, entidad, usuario_id, fecha_desde, fecha_hasta):
    if entidad:
        qs = qs.filter(entidad__iexact=entidad)
    if usuario_id is not None:
        qs = qs.filter(usuario_id=usuario_id)
    if fecha_desde is not None:
        if isinstance(fecha_desde, date) and not isinstance(fecha_desde, datetime):
            fecha_desde = timezone.make_aware(datetime.combine(fecha_desde, time.min))
        qs = qs.filter(fecha__gte=fecha_desde)
    if fecha_hasta is not None:
        if isinstance(fecha_hasta, date) and not isinstance(fecha_hasta, datetime):
            fecha_hasta = timezone.make_aware(datetime.combine(fecha_hasta, time.max))
        qs = qs.filter(fecha__lte=fecha_hasta)
    return qs


class DjangoAuditoriaRepository(AuditoriaRepositoryPort):
    def crear(self, auditoria: AuditoriaDomain) -> AuditoriaDomain:
        orm = AuditoriaORM.objects.create(
            usuario_id=auditoria.usuario_id,
            accion=auditoria.accion,
            entidad=auditoria.entidad,
            entidad_id=auditoria.entidad_id,
            datos_anteriores=auditoria.datos_anteriores,
            datos_nuevos=auditoria.datos_nuevos,
            ip=auditoria.ip or None,
        )
        return _auditoria_orm_a_domain(orm)

    def listar(
        self,
        entidad: Optional[str] = None,
        usuario_id: Optional[int] = None,
        fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None,
    ) -> List[AuditoriaDomain]:
        qs = AuditoriaORM.objects.select_related('usuario').order_by('-fecha')
        qs = _aplicar_filtros_auditoria(qs, entidad, usuario_id, fecha_desde, fecha_hasta)
        return [_auditoria_orm_a_domain(a) for a in qs]

    def queryset_filtrado(
        self,
        entidad: Optional[str] = None,
        usuario_id: Optional[int] = None,
        fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None,
    ):
        """
        Helper específico de infraestructura (no expuesto en el puerto)
        para que la vista pueda paginar el ``QuerySet`` directamente con
        ``ZarpronixPagination`` sin materializar toda la lista.
        """
        qs = AuditoriaORM.objects.select_related('usuario').order_by('-fecha')
        return _aplicar_filtros_auditoria(qs, entidad, usuario_id, fecha_desde, fecha_hasta)
