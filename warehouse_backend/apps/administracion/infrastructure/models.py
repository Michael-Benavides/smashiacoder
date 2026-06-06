# apps/administracion/infrastructure/models.py
from django.db import models

from apps.seguridad.infrastructure.models import UsuarioORM


class ConfiguracionORM(models.Model):
    clave = models.CharField(max_length=200, unique=True)
    valor = models.TextField()
    descripcion = models.TextField(blank=True, default="")

    class Meta:
        app_label = 'administracion'
        db_table = 'warehouse_configuracion'
        verbose_name = 'Configuración del sistema'
        verbose_name_plural = 'Configuraciones del sistema'
        ordering = ['clave']

    def __str__(self):
        return f"{self.clave} = {self.valor}"


class AuditoriaORM(models.Model):
    usuario = models.ForeignKey(
        UsuarioORM,
        on_delete=models.PROTECT,
        related_name='auditorias',
    )
    accion = models.CharField(max_length=100)
    entidad = models.CharField(max_length=100)
    entidad_id = models.IntegerField()
    datos_anteriores = models.JSONField(null=True, blank=True)
    datos_nuevos = models.JSONField(null=True, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'administracion'
        db_table = 'warehouse_auditoria'
        verbose_name = 'Registro de auditoría'
        verbose_name_plural = 'Registros de auditoría'
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['entidad', 'entidad_id']),
            models.Index(fields=['usuario']),
            models.Index(fields=['-fecha']),
        ]

    def __str__(self):
        return f"[{self.fecha:%Y-%m-%d %H:%M}] {self.accion} {self.entidad}#{self.entidad_id}"
