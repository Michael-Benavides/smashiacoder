# apps/terceros/infrastructure/serializers.py
from rest_framework import serializers


# ──────────────────────────────────────────────────────────────────────
# Proveedor
# ──────────────────────────────────────────────────────────────────────

class CrearProveedorSerializer(serializers.Serializer):
    nombre = serializers.CharField(
        max_length=300,
        error_messages={
            'required': 'El nombre del proveedor es obligatorio.',
            'blank': 'El nombre del proveedor no puede estar vacío.',
            'max_length': 'El nombre del proveedor no puede superar los 300 caracteres.',
        },
    )
    ruc_nit = serializers.CharField(max_length=50, required=False, allow_blank=True, default="")
    telefono = serializers.CharField(max_length=50, required=False, allow_blank=True, default="")
    email = serializers.EmailField(required=False, allow_blank=True, default="")
    direccion = serializers.CharField(required=False, allow_blank=True, default="")


class ActualizarProveedorSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=300, required=False)
    ruc_nit = serializers.CharField(max_length=50, required=False, allow_blank=True)
    telefono = serializers.CharField(max_length=50, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    direccion = serializers.CharField(required=False, allow_blank=True)
    activo = serializers.BooleanField(required=False)


# ──────────────────────────────────────────────────────────────────────
# Cliente
# ──────────────────────────────────────────────────────────────────────

class CrearClienteSerializer(serializers.Serializer):
    nombre = serializers.CharField(
        max_length=300,
        error_messages={
            'required': 'El nombre del cliente es obligatorio.',
            'blank': 'El nombre del cliente no puede estar vacío.',
            'max_length': 'El nombre del cliente no puede superar los 300 caracteres.',
        },
    )
    identificacion = serializers.CharField(max_length=50, required=False, allow_blank=True, default="")
    email = serializers.EmailField(required=False, allow_blank=True, default="")
    telefono = serializers.CharField(max_length=50, required=False, allow_blank=True, default="")
    direccion = serializers.CharField(required=False, allow_blank=True, default="")


class ActualizarClienteSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=300, required=False)
    identificacion = serializers.CharField(max_length=50, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    telefono = serializers.CharField(max_length=50, required=False, allow_blank=True)
    direccion = serializers.CharField(required=False, allow_blank=True)
    activo = serializers.BooleanField(required=False)


class ActualizarPuntosClienteSerializer(serializers.Serializer):
    puntos_a_sumar = serializers.IntegerField(
        error_messages={'required': 'La cantidad de puntos a aplicar es obligatoria.'},
    )
