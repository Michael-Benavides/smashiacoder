# apps/terceros/infrastructure/models.py
from django.db import models


class ProveedorORM(models.Model):
    nombre = models.CharField(max_length=300)
    ruc_nit = models.CharField(max_length=50, blank=True, default="")
    telefono = models.CharField(max_length=50, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    direccion = models.TextField(blank=True, default="")
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'terceros'
        db_table = 'warehouse_proveedores'
        verbose_name = 'Proveedor'
        verbose_name_plural = 'Proveedores'

    def __str__(self):
        return f"{self.ruc_nit} - {self.nombre}" if self.ruc_nit else self.nombre


class ClienteORM(models.Model):
    nombre = models.CharField(max_length=300)
    identificacion = models.CharField(max_length=50, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    telefono = models.CharField(max_length=50, blank=True, default="")
    direccion = models.TextField(blank=True, default="")
    puntos_fidelizacion = models.IntegerField(default=0)
    nivel_fidelidad = models.CharField(max_length=50, default="Bronce")
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'terceros'
        db_table = 'warehouse_clientes'
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'

    def __str__(self):
        return f"{self.identificacion} - {self.nombre}" if self.identificacion else self.nombre
