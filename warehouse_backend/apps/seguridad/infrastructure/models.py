# apps/seguridad/infrastructure/models.py
from django.db import models


class RolORM(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, default="")

    class Meta:
        db_table = 'warehouse_roles'
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'

    def __str__(self):
        return self.nombre


class UsuarioORM(models.Model):
    nombre = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    rol = models.ForeignKey(RolORM, on_delete=models.PROTECT, related_name='usuarios')
    activo = models.BooleanField(default=True)
    avatar = models.CharField(max_length=500, null=True, blank=True)
    reset_token = models.CharField(max_length=255, null=True, blank=True)
    reset_token_expiry = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Atributos exigidos por DRF / Django para tratar este modelo como
    # ``request.user``. Se replica la convención de ``AbstractBaseUser``:
    # ``is_authenticated`` e ``is_anonymous`` son atributos de clase, mientras
    # que ``is_active`` se delega al campo ``activo`` ya existente.
    is_authenticated = True
    is_anonymous = False

    @property
    def is_active(self) -> bool:
        return self.activo

    class Meta:
        db_table = 'warehouse_usuarios'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f"{self.nombre} <{self.email}>"
