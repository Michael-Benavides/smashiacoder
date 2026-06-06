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
