# apps/seguridad/infrastructure/serializers.py
from drf_spectacular.utils import OpenApiExample, extend_schema_serializer
from rest_framework import serializers


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            'Administrador',
            summary='admin@smashiacoder.com',
            description='Rol Administrador — acceso total al sistema.',
            value={'email': 'admin@smashiacoder.com', 'password': 'Admin2024@'},
            request_only=True,
        ),
        OpenApiExample(
            'Usuario estándar',
            summary='usuario@smashiacoder.com',
            description='Rol Usuario — acceso limitado.',
            value={'email': 'usuario@smashiacoder.com', 'password': 'User2024@'},
            request_only=True,
        ),
    ],
)
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(
        help_text='Correo del usuario registrado en el sistema.',
    )
    password = serializers.CharField(
        min_length=8,
        write_only=True,
        help_text='Contraseña (mínimo 8 caracteres).',
    )


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            'Nuevo operador',
            value={
                'nombre': 'Juan Pérez',
                'email': 'juan.perez@empresa.ec',
                'password': 'Operador2024@',
                'rol_id': 2,
            },
            request_only=True,
        ),
    ],
)
class CrearUsuarioSerializer(serializers.Serializer):
    nombre = serializers.CharField(
        max_length=200,
        help_text='Nombre completo del usuario.',
    )
    email = serializers.EmailField(help_text='Correo único de acceso.')
    password = serializers.CharField(
        min_length=8,
        write_only=True,
        help_text='Contraseña inicial (mínimo 8 caracteres).',
    )
    rol_id = serializers.IntegerField(
        help_text='ID del rol: 1=Administrador, 2=Usuario.',
    )


class ActualizarUsuarioSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=200, required=False)
    activo = serializers.BooleanField(required=False)
    rol_id = serializers.IntegerField(required=False)


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            'Rol supervisor',
            value={
                'nombre': 'Supervisor',
                'descripcion': 'Supervisa operaciones de almacén',
            },
            request_only=True,
        ),
    ],
)
class CrearRolSerializer(serializers.Serializer):
    nombre = serializers.CharField(max_length=100, help_text='Nombre único del rol.')
    descripcion = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text='Descripción opcional del rol.',
    )


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
