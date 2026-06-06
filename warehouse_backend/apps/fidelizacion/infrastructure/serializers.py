# apps/fidelizacion/infrastructure/serializers.py
from rest_framework import serializers


NIVELES_VALIDOS = ["Bronce", "Plata", "Oro", "Platino"]


class CrearReglaFidelizacionSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=200, error_messages={
        "required": "El nombre es obligatorio.",
        "blank": "El nombre no puede estar vacío.",
    })
    puntos_por_unidad = serializers.IntegerField(min_value=1, error_messages={
        "min_value": "Los puntos por unidad deben ser mayores o iguales a 1.",
        "required": "Los puntos por unidad son obligatorios.",
    })
    nivel_minimo = serializers.ChoiceField(choices=NIVELES_VALIDOS, error_messages={
        "invalid_choice": "El nivel mínimo debe ser uno de: Bronce, Plata, Oro, Platino.",
    })
    nivel_maximo = serializers.ChoiceField(choices=NIVELES_VALIDOS, error_messages={
        "invalid_choice": "El nivel máximo debe ser uno de: Bronce, Plata, Oro, Platino.",
    })
    recompensa = serializers.CharField(max_length=500, error_messages={
        "required": "La recompensa es obligatoria.",
        "blank": "La recompensa no puede estar vacía.",
    })

    def validate(self, data):
        orden = {n: i for i, n in enumerate(NIVELES_VALIDOS)}
        if orden[data["nivel_minimo"]] > orden[data["nivel_maximo"]]:
            raise serializers.ValidationError({
                "nivel_minimo": "El nivel mínimo no puede ser superior al nivel máximo.",
            })
        return data


class ActualizarReglaFidelizacionSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=200, required=False)
    puntos_por_unidad = serializers.IntegerField(min_value=1, required=False, error_messages={
        "min_value": "Los puntos por unidad deben ser mayores o iguales a 1.",
    })
    nivel_minimo = serializers.ChoiceField(choices=NIVELES_VALIDOS, required=False)
    nivel_maximo = serializers.ChoiceField(choices=NIVELES_VALIDOS, required=False)
    recompensa = serializers.CharField(max_length=500, required=False)
    activo = serializers.BooleanField(required=False)

    def validate(self, data):
        nivel_min = data.get("nivel_minimo")
        nivel_max = data.get("nivel_maximo")
        if nivel_min and nivel_max:
            orden = {n: i for i, n in enumerate(NIVELES_VALIDOS)}
            if orden[nivel_min] > orden[nivel_max]:
                raise serializers.ValidationError({
                    "nivel_minimo": "El nivel mínimo no puede ser superior al nivel máximo.",
                })
        return data


class CanjearPuntosSerializer(serializers.Serializer):
    cliente_id = serializers.IntegerField(min_value=1, error_messages={
        "required": "El cliente es obligatorio.",
        "min_value": "El cliente_id debe ser un entero positivo.",
    })
    puntos_a_canjear = serializers.IntegerField(min_value=1, error_messages={
        "required": "Los puntos a canjear son obligatorios.",
        "min_value": "Los puntos a canjear deben ser mayores o iguales a 1.",
    })
    recompensa = serializers.CharField(max_length=500, error_messages={
        "required": "La recompensa es obligatoria.",
        "blank": "La recompensa no puede estar vacía.",
    })


class OtorgarPuntosVentaSerializer(serializers.Serializer):
    cliente_id = serializers.IntegerField(min_value=1, error_messages={
        "required": "El cliente es obligatorio.",
        "min_value": "El cliente_id debe ser un entero positivo.",
    })
    unidades_vendidas = serializers.IntegerField(min_value=1, error_messages={
        "required": "Las unidades vendidas son obligatorias.",
        "min_value": "Las unidades vendidas deben ser mayores o iguales a 1.",
    })
