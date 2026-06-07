from django.core.management.base import BaseCommand

import bcrypt

from apps.seguridad.infrastructure.models import RolORM, UsuarioORM


class Command(BaseCommand):
    help = 'Inicializa roles y usuarios base del sistema'

    def handle(self, *args, **kwargs):
        admin_rol, _ = RolORM.objects.get_or_create(
            nombre='Administrador',
            defaults={'descripcion': 'Acceso total al sistema'},
        )
        usuario_rol, _ = RolORM.objects.get_or_create(
            nombre='Usuario',
            defaults={'descripcion': 'Acceso limitado al sistema'},
        )

        if not UsuarioORM.objects.filter(email='admin@smashiacoder.com').exists():
            pwd = bcrypt.hashpw(b'Admin2024@', bcrypt.gensalt()).decode()
            UsuarioORM.objects.create(
                nombre='Administrador',
                email='admin@smashiacoder.com',
                password_hash=pwd,
                rol=admin_rol,
                activo=True,
            )
            self.stdout.write(self.style.SUCCESS('Usuario admin creado'))

        if not UsuarioORM.objects.filter(email='usuario@smashiacoder.com').exists():
            pwd = bcrypt.hashpw(b'User2024@', bcrypt.gensalt()).decode()
            UsuarioORM.objects.create(
                nombre='Usuario Estándar',
                email='usuario@smashiacoder.com',
                password_hash=pwd,
                rol=usuario_rol,
                activo=True,
            )
            self.stdout.write(self.style.SUCCESS('Usuario estandar creado'))

        self.stdout.write(self.style.SUCCESS('Roles inicializados correctamente'))
