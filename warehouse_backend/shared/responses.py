"""
Respuestas HTTP estandarizadas y manejador de excepciones global.

Adaptador de la capa de infraestructura: traduce excepciones del dominio
(definidas en ``shared.exceptions``) a respuestas DRF consistentes.
"""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

from .exceptions import (
    ConflictException,
    DomainException,
    EntidadNoEncontradaException,
    ForbiddenException,
    NotFoundException,
    ReglaNegocioException,
    UnauthorizedException,
    ValidationException,
    WarehouseException,
)


def success_response(data=None, message: str = "OK",
                     status_code: int = status.HTTP_200_OK) -> Response:
    """Construye una respuesta exitosa con el formato estándar del proyecto."""
    return Response(
        {
            "success": True,
            "message": message,
            "data": data,
        },
        status=status_code,
    )


def error_response(message: str, details=None,
                   status_code: int = status.HTTP_400_BAD_REQUEST,
                   code: str = "error") -> Response:
    """
    Construye una respuesta de error con el formato estándar del proyecto.

    El orden de parámetros está alineado con el patrón de uso en las vistas:
        error_response("mensaje", e.detail)
        error_response("mensaje", e.detail, status.HTTP_401_UNAUTHORIZED)
        error_response("mensaje", status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    """
    payload = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
        },
    }
    if details is not None:
        payload["error"]["details"] = details
    return Response(payload, status=status_code)


_DOMAIN_TO_HTTP = [
    (EntidadNoEncontradaException, status.HTTP_404_NOT_FOUND),
    (NotFoundException, status.HTTP_404_NOT_FOUND),
    (ValidationException, status.HTTP_400_BAD_REQUEST),
    (UnauthorizedException, status.HTTP_401_UNAUTHORIZED),
    (ForbiddenException, status.HTTP_403_FORBIDDEN),
    (ConflictException, status.HTTP_409_CONFLICT),
    (ReglaNegocioException, status.HTTP_400_BAD_REQUEST),
    (DomainException, status.HTTP_400_BAD_REQUEST),
]


def custom_exception_handler(exc, context):
    """
    Manejador global de excepciones para DRF.

    Traduce excepciones del dominio a respuestas HTTP coherentes y
    envuelve el resto de errores de DRF en el formato estándar.
    """
    for exc_class, http_status in _DOMAIN_TO_HTTP:
        if isinstance(exc, exc_class):
            return error_response(
                message=exc.message,
                details=getattr(exc, "detail", None) or None,
                status_code=http_status,
                code=exc.code,
            )

    if isinstance(exc, WarehouseException):
        return error_response(
            message=exc.message,
            details=getattr(exc, "detail", None) or None,
            status_code=status.HTTP_400_BAD_REQUEST,
            code=exc.code,
        )

    response = exception_handler(exc, context)
    if response is not None:
        original = response.data
        response.data = {
            "success": False,
            "error": {
                "code": "api_error",
                "message": "Se ha producido un error en la solicitud.",
                "details": original,
            },
        }
    return response
