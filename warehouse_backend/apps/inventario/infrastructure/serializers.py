# apps/inventario/infrastructure/serializers.py
from decimal import Decimal

from rest_framework import serializers


# ──────────────────────────────────────────────────────────────────────
# Categoría
# ──────────────────────────────────────────────────────────────────────

class CrearCategoriaSerializer(serializers.Serializer):
    nombre = serializers.CharField(
        max_length=200,
        error_messages={
            'required': 'El nombre de la categoría es obligatorio.',
            'blank': 'El nombre de la categoría no puede estar vacío.',
            'max_length': 'El nombre de la categoría no puede superar los 200 caracteres.',
        },
    )
    descripcion = serializers.CharField(
        required=False, allow_blank=True, default="",
    )


class ActualizarCategoriaSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=200, required=False)
    descripcion = serializers.CharField(required=False, allow_blank=True)
    activo = serializers.BooleanField(required=False)


# ──────────────────────────────────────────────────────────────────────
# Ubicación
# ──────────────────────────────────────────────────────────────────────

class CrearUbicacionSerializer(serializers.Serializer):
    nombre = serializers.CharField(
        max_length=200,
        error_messages={
            'required': 'El nombre de la ubicación es obligatorio.',
            'blank': 'El nombre de la ubicación no puede estar vacío.',
            'max_length': 'El nombre de la ubicación no puede superar los 200 caracteres.',
        },
    )
    descripcion = serializers.CharField(required=False, allow_blank=True, default="")
    zona = serializers.CharField(
        max_length=100, required=False, allow_blank=True, default="",
    )


class ActualizarUbicacionSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=200, required=False)
    descripcion = serializers.CharField(required=False, allow_blank=True)
    zona = serializers.CharField(max_length=100, required=False, allow_blank=True)
    activo = serializers.BooleanField(required=False)


# ──────────────────────────────────────────────────────────────────────
# Producto
# ──────────────────────────────────────────────────────────────────────

class CrearProductoSerializer(serializers.Serializer):
    codigo = serializers.CharField(
        max_length=100,
        error_messages={
            'required': 'El código del producto es obligatorio.',
            'blank': 'El código del producto no puede estar vacío.',
            'max_length': 'El código del producto no puede superar los 100 caracteres.',
        },
    )
    nombre = serializers.CharField(
        max_length=300,
        error_messages={
            'required': 'El nombre del producto es obligatorio.',
            'blank': 'El nombre del producto no puede estar vacío.',
        },
    )
    descripcion = serializers.CharField(required=False, allow_blank=True, default="")
    categoria_id = serializers.IntegerField(
        error_messages={'required': 'La categoría del producto es obligatoria.'},
    )
    precio_compra = serializers.DecimalField(
        max_digits=14, decimal_places=2,
        error_messages={'required': 'El precio de compra es obligatorio.'},
    )
    precio_venta = serializers.DecimalField(
        max_digits=14, decimal_places=2,
        error_messages={'required': 'El precio de venta es obligatorio.'},
    )
    unidad_medida = serializers.CharField(
        max_length=50,
        error_messages={'required': 'La unidad de medida es obligatoria.'},
    )
    stock_minimo = serializers.IntegerField(
        error_messages={'required': 'El stock mínimo es obligatorio.'},
    )
    ubicacion_id = serializers.IntegerField(
        error_messages={'required': 'La ubicación del producto es obligatoria.'},
    )

    def validate_precio_compra(self, value: Decimal) -> Decimal:
        if value < 0:
            raise serializers.ValidationError("El precio de compra no puede ser negativo.")
        return value

    def validate_precio_venta(self, value: Decimal) -> Decimal:
        if value < 0:
            raise serializers.ValidationError("El precio de venta no puede ser negativo.")
        return value

    def validate_stock_minimo(self, value: int) -> int:
        if value < 0:
            raise serializers.ValidationError("El stock mínimo no puede ser negativo.")
        return value


class ActualizarProductoSerializer(serializers.Serializer):
    codigo = serializers.CharField(max_length=100, required=False)
    nombre = serializers.CharField(max_length=300, required=False)
    descripcion = serializers.CharField(required=False, allow_blank=True)
    categoria_id = serializers.IntegerField(required=False)
    precio_compra = serializers.DecimalField(max_digits=14, decimal_places=2, required=False)
    precio_venta = serializers.DecimalField(max_digits=14, decimal_places=2, required=False)
    unidad_medida = serializers.CharField(max_length=50, required=False)
    stock_minimo = serializers.IntegerField(required=False)
    ubicacion_id = serializers.IntegerField(required=False)
    activo = serializers.BooleanField(required=False)

    def validate_precio_compra(self, value: Decimal) -> Decimal:
        if value < 0:
            raise serializers.ValidationError("El precio de compra no puede ser negativo.")
        return value

    def validate_precio_venta(self, value: Decimal) -> Decimal:
        if value < 0:
            raise serializers.ValidationError("El precio de venta no puede ser negativo.")
        return value

    def validate_stock_minimo(self, value: int) -> int:
        if value < 0:
            raise serializers.ValidationError("El stock mínimo no puede ser negativo.")
        return value


# ──────────────────────────────────────────────────────────────────────
# Lote
# ──────────────────────────────────────────────────────────────────────

class CrearLoteSerializer(serializers.Serializer):
    producto_id = serializers.IntegerField(
        error_messages={'required': 'El producto del lote es obligatorio.'},
    )
    numero_lote = serializers.CharField(
        max_length=100,
        error_messages={
            'required': 'El número de lote es obligatorio.',
            'blank': 'El número de lote no puede estar vacío.',
        },
    )
    fecha_ingreso = serializers.DateField(
        error_messages={'required': 'La fecha de ingreso es obligatoria.'},
    )
    fecha_vencimiento = serializers.DateField(required=False, allow_null=True)
    cantidad = serializers.IntegerField(
        error_messages={'required': 'La cantidad del lote es obligatoria.'},
    )

    def validate_cantidad(self, value: int) -> int:
        if value < 0:
            raise serializers.ValidationError("La cantidad del lote no puede ser negativa.")
        return value

    def validate(self, data):
        ingreso = data.get('fecha_ingreso')
        venc = data.get('fecha_vencimiento')
        if ingreso and venc and venc < ingreso:
            raise serializers.ValidationError({
                'fecha_vencimiento': 'La fecha de vencimiento no puede ser anterior a la fecha de ingreso.',
            })
        return data
