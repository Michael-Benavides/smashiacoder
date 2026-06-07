# apps/seguridad/infrastructure/serializers.py
from rest_framework import serializers


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)


class CrearUsuarioSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    rol_id = serializers.IntegerField()


class ActualizarUsuarioSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=200, required=False)
    activo = serializers.BooleanField(required=False)
    rol_id = serializers.IntegerField(required=False)


class CrearRolSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=100)
    descripcion = serializers.CharField(required=False, allow_blank=True, default="")


class RecuperarPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class RestablecerPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    token = serializers.CharField()
    nueva_password = serializers.CharField(min_length=8)


class CambiarPasswordSerializer(serializers.Serializer):
    password_actual = serializers.CharField(min_length=8, write_only=True)
    nueva_password = serializers.CharField(min_length=8, write_only=True)
    confirmar_password = serializers.CharField(min_length=8, write_only=True)

    def validate(self, data):
        if data['nueva_password'] != data['confirmar_password']:
            raise serializers.ValidationError({
                'confirmar_password': 'Las contraseñas no coinciden.',
            })
        return data
