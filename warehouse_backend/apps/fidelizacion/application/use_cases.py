# apps/fidelizacion/application/use_cases.py
"""
Casos de uso del módulo de Fidelización.

Reusa explícitamente:
    - apps.terceros.application.use_cases.ActualizarPuntosClienteUseCase
    - apps.terceros.application.use_cases.calcular_nivel_fidelidad
para no duplicar la lógica de niveles del cliente.
"""

from typing import Optional

from shared.exceptions import (
    EntidadNoEncontradaException,
    ReglaNegocioException,
)

from apps.terceros.application.use_cases import ActualizarPuntosClienteUseCase
from apps.terceros.domain.entities import ClienteDomain
from apps.terceros.domain.ports import ClienteRepositoryPort

from ..domain.entities import (
    CanjesFidelizacionDomain,
    ReglaFidelizacionDomain,
)
from ..domain.ports import (
    CanjeRepositoryPort,
    ReglaFidelizacionRepositoryPort,
)


# ──────────────────────────────────────────────────────────────────────
# Reglas — CRUD
# ──────────────────────────────────────────────────────────────────────

class CrearReglaFidelizacionUseCase:
    def __init__(self, repo: ReglaFidelizacionRepositoryPort):
        self._repo = repo

    def ejecutar(
        self,
        nombre: str,
        puntos_por_unidad: int,
        nivel_minimo: str,
        nivel_maximo: str,
        recompensa: str,
    ) -> ReglaFidelizacionDomain:
        if not nombre or not nombre.strip():
            raise ReglaNegocioException(
                detail={"nombre": "El nombre de la regla es obligatorio."}
            )
        if puntos_por_unidad < 1:
            raise ReglaNegocioException(
                detail={"puntos_por_unidad": "Los puntos por unidad deben ser mayores o iguales a 1."}
            )
        if not recompensa or not recompensa.strip():
            raise ReglaNegocioException(
                detail={"recompensa": "La descripción de la recompensa es obligatoria."}
            )
        return self._repo.crear(ReglaFidelizacionDomain(
            nombre=nombre.strip(),
            puntos_por_unidad=puntos_por_unidad,
            nivel_minimo=nivel_minimo,
            nivel_maximo=nivel_maximo,
            recompensa=recompensa.strip(),
            activo=True,
        ))


class ActualizarReglaFidelizacionUseCase:
    def __init__(self, repo: ReglaFidelizacionRepositoryPort):
        self._repo = repo

    def ejecutar(self, id: int, **campos) -> ReglaFidelizacionDomain:
        regla = self._repo.obtener_por_id(id)
        if not regla:
            raise EntidadNoEncontradaException(
                detail={"id": "Regla de fidelización no encontrada."}
            )
        for campo, valor in campos.items():
            if valor is not None:
                setattr(regla, campo, valor)
        if regla.puntos_por_unidad < 1:
            raise ReglaNegocioException(
                detail={"puntos_por_unidad": "Los puntos por unidad deben ser mayores o iguales a 1."}
            )
        return self._repo.actualizar(regla)


class DesactivarReglaFidelizacionUseCase:
    def __init__(self, repo: ReglaFidelizacionRepositoryPort):
        self._repo = repo

    def ejecutar(self, id: int) -> None:
        if not self._repo.obtener_por_id(id):
            raise EntidadNoEncontradaException(
                detail={"id": "Regla de fidelización no encontrada."}
            )
        self._repo.desactivar(id)


# ──────────────────────────────────────────────────────────────────────
# Otorgar puntos a partir de una venta
# ──────────────────────────────────────────────────────────────────────

class OtorgarPuntosVentaUseCase:
    """
    Calcula los puntos que corresponden a una venta y los suma al cliente
    actualizando su ``nivel_fidelidad`` (delegando en
    ``ActualizarPuntosClienteUseCase``).

    Reglas:
        1. ``unidades_vendidas >= 1``.
        2. El cliente debe existir.
        3. Debe existir una regla activa cuyo rango ``[nivel_min, nivel_max]``
           cubra el ``nivel_fidelidad`` actual del cliente.
        4. Si la regla calcula 0 puntos, se devuelve el cliente sin cambios.
    """

    def __init__(
        self,
        cliente_repo: ClienteRepositoryPort,
        regla_repo: ReglaFidelizacionRepositoryPort,
    ):
        self._cliente_repo = cliente_repo
        self._regla_repo = regla_repo
        self._actualizar_puntos = ActualizarPuntosClienteUseCase(cliente_repo)

    def ejecutar(self, cliente_id: int, unidades_vendidas: int) -> ClienteDomain:
        if unidades_vendidas < 1:
            raise ReglaNegocioException(
                detail={"unidades_vendidas": "Las unidades vendidas deben ser mayores o iguales a 1."}
            )
        cliente = self._cliente_repo.obtener_por_id(cliente_id)
        if not cliente:
            raise EntidadNoEncontradaException(
                detail={"cliente_id": "Cliente no encontrado."}
            )
        regla = self._regla_repo.obtener_activa_para_nivel(cliente.nivel_fidelidad)
        if not regla:
            raise EntidadNoEncontradaException(
                detail={
                    "regla": (
                        "No existe una regla de fidelización activa aplicable "
                        f"al nivel '{cliente.nivel_fidelidad}'."
                    )
                }
            )
        puntos = regla.calcular_puntos(unidades_vendidas)
        if puntos == 0:
            return cliente
        return self._actualizar_puntos.ejecutar(
            cliente_id=cliente_id,
            puntos_a_sumar=puntos,
        )


# ──────────────────────────────────────────────────────────────────────
# Canjear puntos
# ──────────────────────────────────────────────────────────────────────

class CanjeaPuntosUseCase:
    """
    Canjea puntos de un cliente por una recompensa.

    La transaccionalidad (``django.db.transaction.atomic()``) se controla
    en la capa de infraestructura (la vista) para mantener este caso de
    uso libre de dependencias de framework. El caso de uso valida y
    orquesta; la atomicidad la garantiza la vista.

    Reglas críticas (alineadas con ISO/IEC 25010 — corrección y fiabilidad):
        1. ``puntos_a_canjear >= 1``.
        2. ``cliente.puntos_fidelizacion >= puntos_a_canjear`` (validación previa).
        3. Registra el canje en el repositorio.
        4. Resta los puntos al cliente recalculando su nivel de fidelidad.
        5. Devuelve el ``CanjesFidelizacionDomain`` recién creado.
    """

    def __init__(
        self,
        cliente_repo: ClienteRepositoryPort,
        canje_repo: CanjeRepositoryPort,
    ):
        self._cliente_repo = cliente_repo
        self._canje_repo = canje_repo
        self._actualizar_puntos = ActualizarPuntosClienteUseCase(cliente_repo)

    def ejecutar(
        self,
        cliente_id: int,
        puntos_a_canjear: int,
        recompensa: str,
        usuario_id: int,
    ) -> CanjesFidelizacionDomain:
        if puntos_a_canjear < 1:
            raise ReglaNegocioException(
                detail={"puntos_a_canjear": "Los puntos a canjear deben ser mayores o iguales a 1."}
            )
        if not recompensa or not recompensa.strip():
            raise ReglaNegocioException(
                detail={"recompensa": "La recompensa es obligatoria."}
            )

        cliente = self._cliente_repo.obtener_por_id(cliente_id)
        if not cliente:
            raise EntidadNoEncontradaException(
                detail={"cliente_id": "Cliente no encontrado."}
            )
        if cliente.puntos_fidelizacion < puntos_a_canjear:
            raise ReglaNegocioException(
                detail={
                    "puntos_a_canjear": (
                        "El cliente no cuenta con puntos suficientes "
                        f"(disponibles: {cliente.puntos_fidelizacion}, "
                        f"solicitados: {puntos_a_canjear})."
                    )
                }
            )

        canje = self._canje_repo.crear(CanjesFidelizacionDomain(
            cliente_id=cliente_id,
            puntos_canjeados=puntos_a_canjear,
            recompensa=recompensa.strip(),
            usuario_id=usuario_id,
        ))
        self._actualizar_puntos.ejecutar(
            cliente_id=cliente_id,
            puntos_a_sumar=-puntos_a_canjear,
        )
        return canje
