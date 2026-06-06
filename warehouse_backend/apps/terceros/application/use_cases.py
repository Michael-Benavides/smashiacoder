# apps/terceros/application/use_cases.py
from typing import Optional

from shared.exceptions import (
    EntidadNoEncontradaException,
    ReglaNegocioException,
)

from ..domain.entities import ClienteDomain, ProveedorDomain
from ..domain.ports import ClienteRepositoryPort, ProveedorRepositoryPort


# ──────────────────────────────────────────────────────────────────────
# Niveles de fidelidad
# ──────────────────────────────────────────────────────────────────────

NIVEL_BRONCE = "Bronce"
NIVEL_PLATA = "Plata"
NIVEL_ORO = "Oro"
NIVEL_PLATINO = "Platino"


def calcular_nivel_fidelidad(puntos: int) -> str:
    """
    Reglas de negocio (escala exacta del proyecto Warehouse_iq):
        0    – 100   →  Bronce
        101  – 500   →  Plata
        501  – 2000  →  Oro
        2001+        →  Platino
    """
    if puntos <= 100:
        return NIVEL_BRONCE
    if puntos <= 500:
        return NIVEL_PLATA
    if puntos <= 2000:
        return NIVEL_ORO
    return NIVEL_PLATINO


# ──────────────────────────────────────────────────────────────────────
# Proveedores — CRUD
# ──────────────────────────────────────────────────────────────────────

class CrearProveedorUseCase:
    def __init__(self, repo: ProveedorRepositoryPort):
        self._repo = repo

    def ejecutar(self, nombre: str, ruc_nit: str = "", telefono: str = "",
                 email: str = "", direccion: str = "") -> ProveedorDomain:
        if not nombre or not nombre.strip():
            raise ReglaNegocioException(detail={"nombre": "El nombre del proveedor es obligatorio."})
        return self._repo.crear(ProveedorDomain(
            nombre=nombre.strip(),
            ruc_nit=ruc_nit,
            telefono=telefono,
            email=email,
            direccion=direccion,
        ))


class ActualizarProveedorUseCase:
    def __init__(self, repo: ProveedorRepositoryPort):
        self._repo = repo

    def ejecutar(self, id: int, **campos) -> ProveedorDomain:
        proveedor = self._repo.obtener_por_id(id)
        if not proveedor:
            raise EntidadNoEncontradaException(detail={"id": "Proveedor no encontrado."})
        for campo, valor in campos.items():
            if valor is not None:
                setattr(proveedor, campo, valor)
        return self._repo.actualizar(proveedor)


class DesactivarProveedorUseCase:
    def __init__(self, repo: ProveedorRepositoryPort):
        self._repo = repo

    def ejecutar(self, id: int) -> None:
        if not self._repo.obtener_por_id(id):
            raise EntidadNoEncontradaException(detail={"id": "Proveedor no encontrado."})
        self._repo.desactivar(id)


# ──────────────────────────────────────────────────────────────────────
# Clientes — CRUD
# ──────────────────────────────────────────────────────────────────────

class CrearClienteUseCase:
    def __init__(self, repo: ClienteRepositoryPort):
        self._repo = repo

    def ejecutar(self, nombre: str, identificacion: str = "", email: str = "",
                 telefono: str = "", direccion: str = "") -> ClienteDomain:
        if not nombre or not nombre.strip():
            raise ReglaNegocioException(detail={"nombre": "El nombre del cliente es obligatorio."})
        return self._repo.crear(ClienteDomain(
            nombre=nombre.strip(),
            identificacion=identificacion,
            email=email,
            telefono=telefono,
            direccion=direccion,
            puntos_fidelizacion=0,
            nivel_fidelidad=NIVEL_BRONCE,
        ))


class ActualizarClienteUseCase:
    def __init__(self, repo: ClienteRepositoryPort):
        self._repo = repo

    def ejecutar(self, id: int, **campos) -> ClienteDomain:
        cliente = self._repo.obtener_por_id(id)
        if not cliente:
            raise EntidadNoEncontradaException(detail={"id": "Cliente no encontrado."})
        # No permitimos modificar puntos_fidelizacion ni nivel_fidelidad
        # por esta vía (use ActualizarPuntosClienteUseCase para eso).
        campos.pop("puntos_fidelizacion", None)
        campos.pop("nivel_fidelidad", None)
        for campo, valor in campos.items():
            if valor is not None:
                setattr(cliente, campo, valor)
        return self._repo.actualizar(cliente)


class DesactivarClienteUseCase:
    def __init__(self, repo: ClienteRepositoryPort):
        self._repo = repo

    def ejecutar(self, id: int) -> None:
        if not self._repo.obtener_por_id(id):
            raise EntidadNoEncontradaException(detail={"id": "Cliente no encontrado."})
        self._repo.desactivar(id)


# ──────────────────────────────────────────────────────────────────────
# Clientes — Fidelización
# ──────────────────────────────────────────────────────────────────────

class ActualizarPuntosClienteUseCase:
    """
    Suma (o resta, si ``puntos_a_sumar`` es negativo) puntos al cliente y
    recalcula automáticamente su ``nivel_fidelidad`` según la escala oficial.
    Los puntos no pueden quedar por debajo de 0.
    """

    def __init__(self, repo: ClienteRepositoryPort):
        self._repo = repo

    def ejecutar(self, cliente_id: int, puntos_a_sumar: int) -> ClienteDomain:
        if puntos_a_sumar == 0:
            raise ReglaNegocioException(
                detail={"puntos_a_sumar": "La cantidad de puntos a aplicar no puede ser cero."}
            )
        cliente = self._repo.obtener_por_id(cliente_id)
        if not cliente:
            raise EntidadNoEncontradaException(
                detail={"cliente_id": "Cliente no encontrado."}
            )
        nuevo_total = max(0, cliente.puntos_fidelizacion + puntos_a_sumar)
        cliente.puntos_fidelizacion = nuevo_total
        cliente.nivel_fidelidad = calcular_nivel_fidelidad(nuevo_total)
        return self._repo.actualizar(cliente)
