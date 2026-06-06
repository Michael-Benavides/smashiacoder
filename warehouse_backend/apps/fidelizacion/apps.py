from django.apps import AppConfig


class FidelizacionConfig(AppConfig):
    """Configuración de la app de fidelización (Warehouse_iq)."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.fidelizacion"
    label = "fidelizacion"
    verbose_name = "Fidelización"
