# apps/inventario/infrastructure/movement_serializers.py
from rest_framework import serializers


class EntradaSerializer(serializers.Serializer):
    producto_id = serializers.IntegerField(
        error_messages={'required': 'El producto es obligatorio.'},
    )
    cantidad = serializers.IntegerField(
        min_value=1,
        error_messages={
            'required': 'La cantidad es obligatoria.',
            'min_value': 'La cantidad debe ser mayor o igual a 1.',
        },
    )
    numero_lote = serializers.CharField(
        max_length=100,
        error_messages={
            'required': 'El número de lote es obligatorio.',
            'blank': 'El número de lote no puede estar vacío.',
        },
    )
    proveedor_id = serializers.IntegerField(required=False, allow_null=True)
    observaciones = serializers.CharField(required=False, allow_blank=True, default="")
    fecha_vencimiento = serializers.DateField(required=False, allow_null=True)


class SalidaSerializer(serializers.Serializer):
    producto_id = serializers.IntegerField(
        error_messages={'required': 'El producto es obligatorio.'},
    )
    cantidad = serializers.IntegerField(
        min_value=1,
        error_messages={
            'required': 'La cantidad es obligatoria.',
            'min_value': 'La cantidad debe ser mayor o igual a 1.',
        },
    )
    cliente_id = serializers.IntegerField(required=False, allow_null=True)
    observaciones = serializers.CharField(required=False, allow_blank=True, default="")


class TrasladoSerializer(serializers.Serializer):
    producto_id = serializers.IntegerField(
        error_messages={'required': 'El producto es obligatorio.'},
    )
    ubicacion_origen_id = serializers.IntegerField(
        error_messages={'required': 'La ubicación origen es obligatoria.'},
    )
    ubicacion_destino_id = serializers.IntegerField(
        error_messages={'required': 'La ubicación destino es obligatoria.'},
    )
    cantidad = serializers.IntegerField(
        min_value=1,
        error_messages={
            'required': 'La cantidad es obligatoria.',
            'min_value': 'La cantidad debe ser mayor o igual a 1.',
        },
    )
    observaciones = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, data):
        if data.get('ubicacion_origen_id') == data.get('ubicacion_destino_id'):
            raise serializers.ValidationError({
                'ubicacion': 'El origen y destino del traslado deben ser distintos.',
            })
        return data
