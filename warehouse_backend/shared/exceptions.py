"""
Excepciones de dominio compartidas para Warehouse_iq.

Estas excepciones pertenecen al núcleo de la Arquitectura Hexagonal y son
agnósticas a frameworks. Se traducen a respuestas HTTP en
``shared.responses.custom_exception_handler``.
"""


class WarehouseException(Exception):
    """Excepción base para todos los errores del dominio del proyecto."""

    default_message = "Ha ocurrido un error en el sistema."
    default_code = "warehouse_error"

    def __init__(self, message: str | None = None, code: str | None = None,
                 detail=None):
        self.message = message or self.default_message
        self.code = code or self.default_code
        self.detail = detail if detail is not None else {}
        super().__init__(self.message)


class DomainException(WarehouseException):
    """Violación de una regla de negocio."""

    default_message = "Se ha violado una regla de negocio."
    default_code = "domain_error"


class ReglaNegocioException(DomainException):
    """
    Violación específica de una regla de negocio.

    Usada por los casos de uso (capa application) cuando se intenta una
    operación que viola una invariante del dominio. ``detail`` lleva el
    mapeo campo → mensaje compatible con el formato de errores del frontend.
    """

    default_message = "Se ha violado una regla de negocio."
    default_code = "rule_violation"


class NotFoundException(WarehouseException):
    """El recurso solicitado no existe."""

    default_message = "Recurso no encontrado."
    default_code = "not_found"


class EntidadNoEncontradaException(NotFoundException):
    """La entidad de dominio referenciada no existe en el repositorio."""

    default_message = "La entidad solicitada no existe."
    default_code = "entity_not_found"


class ValidationException(WarehouseException):
    """Datos de entrada inválidos."""

    default_message = "Los datos proporcionados no son válidos."
    default_code = "validation_error"


class UnauthorizedException(WarehouseException):
    """El usuario no está autenticado."""

    default_message = "No autenticado."
    default_code = "unauthorized"


class ForbiddenException(WarehouseException):
    """El usuario no tiene permiso para ejecutar la acción."""

    default_message = "No tiene permisos para realizar esta acción."
    default_code = "forbidden"


class ConflictException(WarehouseException):
    """El recurso entra en conflicto con el estado actual."""

    default_message = "Conflicto con el estado actual del recurso."
    default_code = "conflict"
