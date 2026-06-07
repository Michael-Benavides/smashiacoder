# apps/administracion/infrastructure/views.py
from datetime import datetime, timedelta

from django.db.models import Count, F, Q, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView

from apps.seguridad.infrastructure.permissions import EsAdministrador
from shared.pagination import ZarpronixPagination
from shared.responses import error_response, success_response

from apps.inventario.infrastructure.models import (
    AlertaORM,
    CategoriaORM,
    LoteORM,
    MovimientoORM,
    ProductoORM,
)
from apps.terceros.infrastructure.models import ClienteORM, ProveedorORM

from .models import AuditoriaORM
from .repositories import (
    DjangoAuditoriaRepository,
    DjangoConfiguracionRepository,
)
from .serializers import (
    ActualizarConfiguracionSerializer,
    CrearConfiguracionSerializer,
)


# ──────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────

def _config_a_dict(c) -> dict:
    return {
        "id": c.id,
        "clave": c.clave,
        "valor": c.valor,
        "descripcion": c.descripcion,
    }


def _auditoria_orm_a_dict(orm: AuditoriaORM) -> dict:
    return {
        "id": orm.id,
        "usuario_id": orm.usuario_id,
        "usuario_nombre": getattr(orm.usuario, "nombre", None) if orm.usuario_id else None,
        "accion": orm.accion,
        "entidad": orm.entidad,
        "entidad_id": orm.entidad_id,
        "datos_anteriores": orm.datos_anteriores,
        "datos_nuevos": orm.datos_nuevos,
        "ip": orm.ip or "",
        "fecha": orm.fecha.isoformat() if orm.fecha else None,
    }


def _parse_fecha(valor: str):
    """
    Acepta ISO date (YYYY-MM-DD) o ISO datetime. Devuelve datetime o None
    si el valor no es parseable.
    """
    if not valor:
        return None
    valor = valor.strip()
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(valor, fmt)
        except ValueError:
            continue
    return None


def _parse_int(valor):
    if valor in (None, ""):
        return None
    try:
        return int(valor)
    except (ValueError, TypeError):
        return None


# ──────────────────────────────────────────────────────────────────────
# Auditoría — solo lectura paginada con filtros
# ──────────────────────────────────────────────────────────────────────

class AuditoriaListView(APIView):
    """GET /administracion/auditoria

    Query params (todos opcionales):
        - entidad: filtra por nombre de entidad (case-insensitive exact).
        - usuario_id: filtra por id del usuario que ejecutó la acción.
        - fecha_desde: ISO date / datetime (incluye desde 00:00).
        - fecha_hasta: ISO date / datetime (incluye hasta 23:59:59.999).
    """
    permission_classes = [EsAdministrador]

    def get(self, request):
        entidad = request.query_params.get('entidad', '').strip() or None
        usuario_id = _parse_int(request.query_params.get('usuario_id'))
        fecha_desde = _parse_fecha(request.query_params.get('fecha_desde'))
        fecha_hasta = _parse_fecha(request.query_params.get('fecha_hasta'))

        repo = DjangoAuditoriaRepository()
        qs = repo.queryset_filtrado(
            entidad=entidad,
            usuario_id=usuario_id,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
        )

        paginator = ZarpronixPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        return paginator.get_paginated_response(
            [_auditoria_orm_a_dict(a) for a in page]
        )


# ──────────────────────────────────────────────────────────────────────
# Configuración — CRUD parcial (sin DELETE)
# ──────────────────────────────────────────────────────────────────────

class ConfiguracionListCreateView(APIView):
    """GET /administracion/configuracion
       POST /administracion/configuracion"""
    permission_classes = [EsAdministrador]

    def get(self, request):
        repo = DjangoConfiguracionRepository()
        configs = repo.listar()
        return success_response(
            data=[_config_a_dict(c) for c in configs],
        )

    def post(self, request):
        serializer = CrearConfiguracionSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response("Datos de configuración inválidos.", serializer.errors)

        clave = serializer.validated_data['clave'].strip()
        valor = serializer.validated_data['valor']
        descripcion = serializer.validated_data.get('descripcion', "") or ""

        repo = DjangoConfiguracionRepository()
        if repo.obtener_por_clave(clave) is not None:
            return error_response(
                "La clave de configuración ya existe.",
                details={"clave": "Esta clave ya está registrada. Use PUT para actualizarla."},
                status_code=status.HTTP_409_CONFLICT,
            )

        from ..domain.entities import ConfiguracionDomain
        creado = repo.crear(ConfiguracionDomain(
            clave=clave,
            valor=valor,
            descripcion=descripcion,
        ))
        return success_response(
            data=_config_a_dict(creado),
            message="Configuración creada exitosamente.",
            status_code=status.HTTP_201_CREATED,
        )


class ConfiguracionDetailView(APIView):
    """GET /administracion/configuracion/<clave>
       PUT /administracion/configuracion/<clave>"""
    permission_classes = [EsAdministrador]

    def get(self, request, clave: str):
        repo = DjangoConfiguracionRepository()
        config = repo.obtener_por_clave(clave)
        if not config:
            return error_response(
                "Configuración no encontrada.",
                details={"clave": f"No existe una configuración con clave '{clave}'."},
                status_code=status.HTTP_404_NOT_FOUND,
            )
        return success_response(data=_config_a_dict(config))

    def put(self, request, clave: str):
        serializer = ActualizarConfiguracionSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return error_response("Datos de configuración inválidos.", serializer.errors)

        repo = DjangoConfiguracionRepository()
        config = repo.obtener_por_clave(clave)
        if not config:
            return error_response(
                "Configuración no encontrada.",
                details={"clave": f"No existe una configuración con clave '{clave}'."},
                status_code=status.HTTP_404_NOT_FOUND,
            )

        valor = serializer.validated_data.get('valor')
        descripcion = serializer.validated_data.get('descripcion')
        if valor is not None:
            config.valor = valor
        if descripcion is not None:
            config.descripcion = descripcion

        actualizado = repo.actualizar(config)
        return success_response(
            data=_config_a_dict(actualizado),
            message="Configuración actualizada.",
        )


# ──────────────────────────────────────────────────────────────────────
# Dashboard — Resumen y Gráficas
# ──────────────────────────────────────────────────────────────────────

def _producto_stock_bajo_a_dict(p: ProductoORM) -> dict:
    return {
        "id": p.id,
        "codigo": p.codigo,
        "nombre": p.nombre,
        "categoria": p.categoria.nombre if p.categoria_id else None,
        "ubicacion": p.ubicacion.nombre if p.ubicacion_id else None,
        "stock_actual": p.stock_actual,
        "stock_minimo": p.stock_minimo,
        "diferencia": p.stock_actual - p.stock_minimo,
        "unidad_medida": p.unidad_medida,
    }


def _movimiento_reciente_a_dict(m: MovimientoORM) -> dict:
    return {
        "id": m.id,
        "fecha": m.fecha.isoformat() if m.fecha else None,
        "producto": {
            "id": m.producto_id,
            "codigo": m.producto.codigo if m.producto_id else None,
            "nombre": m.producto.nombre if m.producto_id else None,
        },
        "tipo": m.tipo_movimiento.tipo if m.tipo_movimiento_id else None,
        "tipo_nombre": m.tipo_movimiento.nombre if m.tipo_movimiento_id else None,
        "cantidad": m.cantidad,
    }


class DashboardResumenView(APIView):
    """GET /administracion/dashboard

    Devuelve los KPIs principales del sistema:
        - total_productos_activos
        - total_clientes_activos
        - total_proveedores_activos
        - alertas_no_atendidas
        - productos_stock_bajo (lista, stock_actual <= stock_minimo)
        - movimientos_recientes (últimos 10)
    """

    def get(self, request):
        productos_bajo_qs = ProductoORM.objects.select_related(
            'categoria', 'ubicacion',
        ).filter(
            activo=True,
            stock_actual__lte=F('stock_minimo'),
        ).order_by(F('stock_actual') - F('stock_minimo'))

        movimientos_qs = MovimientoORM.objects.select_related(
            'producto', 'tipo_movimiento',
        ).order_by('-fecha')[:10]

        productos_activos = list(
            ProductoORM.objects.filter(activo=True, stock_minimo__gt=0)
        )
        productos_activos.sort(
            key=lambda p: p.stock_actual / p.stock_minimo if p.stock_minimo else 999,
        )
        productos_menor_stock = [
            {
                **_producto_stock_bajo_a_dict(p),
                "ratio": round(p.stock_actual / p.stock_minimo, 2) if p.stock_minimo else 0,
                "estado": (
                    "AGOTADO" if p.stock_actual <= 0
                    else "CRÍTICO" if p.stock_actual <= p.stock_minimo
                    else "OK"
                ),
            }
            for p in productos_activos[:5]
        ]

        ultimos_clientes_qs = ClienteORM.objects.filter(activo=True).order_by('-created_at')[:5]
        ultimos_clientes = [
            {
                "id": c.id,
                "nombre": c.nombre,
                "nivel_fidelidad": c.nivel_fidelidad,
                "puntos_fidelizacion": c.puntos_fidelizacion,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in ultimos_clientes_qs
        ]

        hoy = timezone.now().date()
        limite_vencimiento = hoy + timedelta(days=30)
        valor_total = (
            ProductoORM.objects.filter(activo=True).aggregate(
                total=Sum(F('stock_actual') * F('precio_compra')),
            )['total']
            or 0
        )
        entradas_hoy = MovimientoORM.objects.filter(
            fecha__date=hoy,
            tipo_movimiento__tipo='entrada',
        ).exists()
        lotes_por_vencer = [
            {
                "producto": lote.producto.nombre,
                "producto_id": lote.producto_id,
                "numero_lote": lote.numero_lote,
                "fecha_vencimiento": lote.fecha_vencimiento.isoformat(),
                "cantidad": lote.cantidad,
                "dias_restantes": (lote.fecha_vencimiento - hoy).days,
            }
            for lote in LoteORM.objects.select_related('producto').filter(
                activo=True,
                cantidad__gt=0,
                fecha_vencimiento__isnull=False,
                fecha_vencimiento__gte=hoy,
                fecha_vencimiento__lte=limite_vencimiento,
            ).order_by('fecha_vencimiento')[:20]
        ]

        data = {
            "total_productos_activos": ProductoORM.objects.filter(activo=True).count(),
            "total_clientes_activos": ClienteORM.objects.filter(activo=True).count(),
            "total_proveedores_activos": ProveedorORM.objects.filter(activo=True).count(),
            "alertas_no_atendidas": AlertaORM.objects.filter(atendida=False).count(),
            "productos_stock_bajo": [
                _producto_stock_bajo_a_dict(p) for p in productos_bajo_qs
            ],
            "productos_menor_stock": productos_menor_stock,
            "ultimos_clientes": ultimos_clientes,
            "movimientos_recientes": [
                _movimiento_reciente_a_dict(m) for m in movimientos_qs
            ],
            "valor_total_inventario": float(valor_total),
            "entradas_hoy": entradas_hoy,
            "lotes_por_vencer": lotes_por_vencer,
        }
        return success_response(data=data)


class DashboardGraficasView(APIView):
    """GET /administracion/dashboard/graficas

    Datasets para visualizaciones del frontend:
        - movimientos_por_dia: últimos 30 días, entradas vs salidas por fecha.
        - top_productos_movidos: 10 productos con más movimientos en el mes.
        - distribucion_stock_categorias: stock total agrupado por categoría.
    """

    def get(self, request):
        ahora = timezone.now()
        inicio_30d = ahora - timedelta(days=30)

        # ── Movimientos por día (últimos 30 días, separando entradas/salidas) ──
        movs_qs = (
            MovimientoORM.objects
            .filter(fecha__gte=inicio_30d)
            .annotate(fecha_dia=TruncDate('fecha'))
            .values('fecha_dia')
            .annotate(
                entradas=Sum(
                    'cantidad',
                    filter=Q(tipo_movimiento__tipo='entrada'),
                ),
                salidas=Sum(
                    'cantidad',
                    filter=Q(tipo_movimiento__tipo='salida'),
                ),
                traslados=Sum(
                    'cantidad',
                    filter=Q(tipo_movimiento__tipo='traslado'),
                ),
            )
            .order_by('fecha_dia')
        )
        movimientos_por_dia = [
            {
                "fecha": row["fecha_dia"].isoformat() if row["fecha_dia"] else None,
                "entradas": int(row["entradas"] or 0),
                "salidas": int(row["salidas"] or 0),
                "traslados": int(row["traslados"] or 0),
            }
            for row in movs_qs
        ]

        # ── Top 10 productos más movidos en el mes ──
        top_qs = (
            MovimientoORM.objects
            .filter(fecha__gte=inicio_30d)
            .values('producto_id', 'producto__codigo', 'producto__nombre')
            .annotate(
                total_movimientos=Count('id'),
                cantidad_total=Sum('cantidad'),
            )
            .order_by('-total_movimientos')[:10]
        )
        top_productos_movidos = [
            {
                "producto_id": row["producto_id"],
                "codigo": row["producto__codigo"],
                "nombre": row["producto__nombre"],
                "total_movimientos": row["total_movimientos"],
                "cantidad_total": int(row["cantidad_total"] or 0),
            }
            for row in top_qs
        ]

        # ── Stock total por categoría (solo productos activos) ──
        dist_qs = (
            CategoriaORM.objects
            .filter(activo=True)
            .annotate(
                stock_total=Sum(
                    'productos__stock_actual',
                    filter=Q(productos__activo=True),
                ),
                productos_activos=Count(
                    'productos',
                    filter=Q(productos__activo=True),
                ),
            )
            .values('id', 'nombre', 'stock_total', 'productos_activos')
            .order_by('-stock_total')
        )
        distribucion_stock_categorias = [
            {
                "categoria_id": row["id"],
                "categoria": row["nombre"],
                "stock_total": int(row["stock_total"] or 0),
                "productos_activos": row["productos_activos"],
            }
            for row in dist_qs
        ]

        return success_response(data={
            "movimientos_por_dia": movimientos_por_dia,
            "top_productos_movidos": top_productos_movidos,
            "distribucion_stock_categorias": distribucion_stock_categorias,
            "rango": {
                "desde": inicio_30d.isoformat(),
                "hasta": ahora.isoformat(),
            },
        })
