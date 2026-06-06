"""
Paginación estándar para todas las APIs de Warehouse_iq.

Mantiene el formato de respuesta consistente con
``shared.responses.success_response`` para que el frontend reciba siempre
la misma envolvente.
"""

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class ZarpronixPagination(PageNumberPagination):
    """Paginación basada en número de página, con tamaño configurable."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response(
            {
                "success": True,
                "message": "OK",
                "data": data,
                "pagination": {
                    "count": self.page.paginator.count,
                    "next": self.get_next_link(),
                    "previous": self.get_previous_link(),
                    "page_size": self.get_page_size(self.request),
                    "current_page": self.page.number,
                    "total_pages": self.page.paginator.num_pages,
                },
            }
        )
