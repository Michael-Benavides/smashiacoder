# apps/administracion/infrastructure/serializers.py
from rest_framework import serializers


class CrearConfiguracionSerializer(serializers.Serializer):
    clave = serializers.CharField(max_length=200, error_messages={
        "required": "La clave es obligatoria.",
        "blank": "La clave no puede estar vacía.",
    })
    valor = serializers.CharField(error_messages={
        "required": "El valor es obligatorio.",
        "blank": "El valor no puede estar vacío.",
    })
    descripcion = serializers.CharField(required=False, allow_blank=True, default="")


class ActualizarConfiguracionSerializer(serializers.Serializer):
    valor = serializers.CharField(required=False, error_messages={
        "blank": "El valor no puede estar vacío.",
    })
    descripcion = serializers.CharField(required=False, allow_blank=True)
