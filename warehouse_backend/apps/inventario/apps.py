from django.apps import AppConfig


class InventarioConfig(AppConfig):
    """Configuración de la app de inventario (Warehouse_iq)."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.inventario"
    label = "inventario"
    verbose_name = "Inventario"
