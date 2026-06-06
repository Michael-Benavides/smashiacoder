# apps/fidelizacion/infrastructure/models.py
from django.db import models

from apps.seguridad.infrastructure.models import UsuarioORM
from apps.terceros.infrastructure.models import ClienteORM


NIVEL_CHOICES = [
    ('Bronce', 'Bronce'),
    ('Plata', 'Plata'),
    ('Oro', 'Oro'),
    ('Platino', 'Platino'),
]


class ReglaFidelizacionORM(models.Model):
    nombre = models.CharField(max_length=200)
    puntos_por_unidad = models.IntegerField(default=1)
    nivel_minimo = models.CharField(max_length=50, choices=NIVEL_CHOICES, default='Bronce')
    nivel_maximo = models.CharField(max_length=50, choices=NIVEL_CHOICES, default='Platino')
    recompensa = models.CharField(max_length=500)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'fidelizacion'
        db_table = 'warehouse_reglas_fidelizacion'
        verbose_name = 'Regla de fidelización'
        verbose_name_plural = 'Reglas de fidelización'

    def __str__(self):
        return f"{self.nombre} ({self.puntos_por_unidad}p/u, {self.nivel_minimo}-{self.nivel_maximo})"


class CanjesFidelizacionORM(models.Model):
    cliente = models.ForeignKey(ClienteORM, on_delete=models.PROTECT, related_name='canjes')
    puntos_canjeados = models.IntegerField()
    recompensa = models.CharField(max_length=500)
    usuario = models.ForeignKey(UsuarioORM, on_delete=models.PROTECT, related_name='canjes_registrados')
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'fidelizacion'
        db_table = 'warehouse_canjes'
        verbose_name = 'Canje de fidelización'
        verbose_name_plural = 'Canjes de fidelización'
        ordering = ['-fecha']

    def __str__(self):
        return f"Canje #{self.id}: {self.puntos_canjeados}p → {self.recompensa}"
