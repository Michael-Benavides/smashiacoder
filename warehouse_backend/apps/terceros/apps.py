from django.apps import AppConfig


class TercerosConfig(AppConfig):
    """Configuración de la app de terceros (Warehouse_iq)."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.terceros"
    label = "terceros"
    verbose_name = "Terceros"
