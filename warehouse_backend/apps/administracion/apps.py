from django.apps import AppConfig


class AdministracionConfig(AppConfig):
    """Configuración de la app de administración (Warehouse_iq)."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.administracion"
    label = "administracion"
    verbose_name = "Administración"
