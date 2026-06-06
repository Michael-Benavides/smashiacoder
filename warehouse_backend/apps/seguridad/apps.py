from django.apps import AppConfig


class SeguridadConfig(AppConfig):
    """Configuración de la app de seguridad (Warehouse_iq)."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.seguridad"
    label = "seguridad"
    verbose_name = "Seguridad"
