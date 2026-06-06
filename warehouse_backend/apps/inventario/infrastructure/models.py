# apps/inventario/infrastructure/models.py
from django.db import models
from apps.seguridad.infrastructure.models import UsuarioORM


class CategoriaORM(models.Model):
    nombre = models.CharField(max_length=200, unique=True)
    descripcion = models.TextField(blank=True, default="")
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'warehouse_categorias'
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'

    def __str__(self):
        return self.nombre


class UbicacionORM(models.Model):
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, default="")
    zona = models.CharField(max_length=100, blank=True, default="")
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'warehouse_ubicaciones'
        verbose_name = 'Ubicación'
        verbose_name_plural = 'Ubicaciones'

    def __str__(self):
        return self.nombre


class ProductoORM(models.Model):
    codigo = models.CharField(max_length=100, unique=True)
    nombre = models.CharField(max_length=300)
    descripcion = models.TextField(blank=True, default="")
    categoria = models.ForeignKey(CategoriaORM, on_delete=models.PROTECT, related_name='productos')
    precio_compra = models.DecimalField(max_digits=14, decimal_places=2)
    precio_venta = models.DecimalField(max_digits=14, decimal_places=2)
    unidad_medida = models.CharField(max_length=50)
    stock_actual = models.IntegerField(default=0)
    stock_minimo = models.IntegerField(default=0)
    ubicacion = models.ForeignKey(UbicacionORM, on_delete=models.PROTECT, related_name='productos')
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'warehouse_productos'
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"


class LoteORM(models.Model):
    producto = models.ForeignKey(ProductoORM, on_delete=models.CASCADE, related_name='lotes')
    numero_lote = models.CharField(max_length=100)
    fecha_ingreso = models.DateField()
    fecha_vencimiento = models.DateField(null=True, blank=True)
    cantidad = models.IntegerField(default=0)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'warehouse_lotes'
        verbose_name = 'Lote'
        verbose_name_plural = 'Lotes'
        unique_together = [('producto', 'numero_lote')]

    def __str__(self):
        return f"{self.producto.codigo} / {self.numero_lote}"


class TipoMovimientoORM(models.Model):
    TIPO_CHOICES = [
        ('entrada', 'Entrada'),
        ('salida', 'Salida'),
        ('traslado', 'Traslado'),
    ]
    nombre = models.CharField(max_length=100, unique=True)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)

    class Meta:
        db_table = 'warehouse_tipos_movimiento'
        verbose_name = 'Tipo de movimiento'
        verbose_name_plural = 'Tipos de movimiento'

    def __str__(self):
        return self.nombre


class MovimientoORM(models.Model):
    producto = models.ForeignKey(ProductoORM, on_delete=models.PROTECT, related_name='movimientos')
    lote = models.ForeignKey(LoteORM, on_delete=models.SET_NULL, null=True, blank=True)
    tipo_movimiento = models.ForeignKey(TipoMovimientoORM, on_delete=models.PROTECT)
    cantidad = models.IntegerField()
    stock_anterior = models.IntegerField()
    stock_nuevo = models.IntegerField()
    proveedor = models.ForeignKey('terceros.ProveedorORM', null=True, blank=True, on_delete=models.SET_NULL)
    cliente = models.ForeignKey('terceros.ClienteORM', null=True, blank=True, on_delete=models.SET_NULL)
    usuario = models.ForeignKey(UsuarioORM, on_delete=models.PROTECT)
    observaciones = models.TextField(blank=True, default="")
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'warehouse_movimientos'
        verbose_name = 'Movimiento'
        verbose_name_plural = 'Movimientos'
        ordering = ['-fecha']


class AlertaORM(models.Model):
    producto = models.ForeignKey(ProductoORM, on_delete=models.CASCADE, related_name='alertas')
    tipo = models.CharField(max_length=100)
    mensaje = models.TextField()
    atendida = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'warehouse_alertas'
        verbose_name = 'Alerta'
        verbose_name_plural = 'Alertas'
