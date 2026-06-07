# apps/administracion/infrastructure/report_data.py
"""Consultas y agregaciones para informes gerenciales de bodega."""

from collections import defaultdict
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional

from django.db.models import Count, Sum
from django.utils import timezone

from apps.fidelizacion.infrastructure.models import CanjesFidelizacionORM
from apps.inventario.infrastructure.models import (
    AlertaORM,
    MovimientoORM,
    ProductoORM,
)
from apps.terceros.infrastructure.models import ClienteORM, ProveedorORM

SYSTEM_NAME = 'Warehouse IQ'
NIVELES = ('Bronce', 'Plata', 'Oro', 'Platino')


def _now():
    return timezone.localtime()


def _month_start(dt=None):
    dt = dt or _now()
    return dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _parse_date(value: Optional[str], end_of_day: bool = False):
    if not value:
        return None
    try:
        d = datetime.strptime(value, '%Y-%m-%d')
        if timezone.is_aware(_now()):
            d = timezone.make_aware(d)
        if end_of_day:
            d = d.replace(hour=23, minute=59, second=59)
        return d
    except ValueError:
        return None


def _producto_estado(stock_actual: int, stock_minimo: int) -> str:
    if stock_actual <= 0:
        return 'AGOTADO'
    if stock_actual <= stock_minimo:
        return 'CRÍTICO'
    return 'OK'


def _valor_inventario_producto(p) -> Decimal:
    return Decimal(p.stock_actual) * p.precio_compra


def productos_activos_qs():
    return (
        ProductoORM.objects
        .select_related('categoria', 'ubicacion')
        .filter(activo=True)
        .order_by('categoria__nombre', 'codigo')
    )


def resumen_inventario_basico():
    productos = list(productos_activos_qs())
    total = len(productos)
    valor_total = sum((_valor_inventario_producto(p) for p in productos), Decimal('0'))
    bajo_minimo = sum(1 for p in productos if p.stock_actual <= p.stock_minimo)
    return {
        'total_productos': total,
        'valor_total_inventario': valor_total,
        'productos_bajo_stock': bajo_minimo,
    }


# ── REPORTE GENERAL ───────────────────────────────────────────────────

def datos_reporte_general():
    now = _now()
    inicio_mes = _month_start(now)
    productos = list(productos_activos_qs())
    resumen = resumen_inventario_basico()
    movimientos_mes = MovimientoORM.objects.filter(fecha__gte=inicio_mes).count()

    criticos = []
    for p in productos:
        if p.stock_actual <= p.stock_minimo:
            deficit = max(p.stock_minimo - p.stock_actual, 0)
            criticos.append({
                'codigo': p.codigo,
                'nombre': p.nombre,
                'categoria': p.categoria.nombre if p.categoria_id else '',
                'stock_actual': p.stock_actual,
                'stock_minimo': p.stock_minimo,
                'deficit': deficit,
                'ubicacion': p.ubicacion.nombre if p.ubicacion_id else '',
            })

    cat_map = defaultdict(lambda: {'cantidad': 0, 'valor': Decimal('0')})
    for p in productos:
        nombre = p.categoria.nombre if p.categoria_id else 'Sin categoría'
        cat_map[nombre]['cantidad'] += 1
        cat_map[nombre]['valor'] += _valor_inventario_producto(p)
    distribucion_categoria = [
        {'categoria': k, 'cantidad': v['cantidad'], 'valor': v['valor']}
        for k, v in sorted(cat_map.items(), key=lambda x: -x[1]['valor'])
    ]

    top_mov = list(
        MovimientoORM.objects
        .filter(fecha__gte=inicio_mes)
        .values('producto__codigo', 'producto__nombre')
        .annotate(total=Count('id'))
        .order_by('-total')[:10]
    )

    alertas = list(
        AlertaORM.objects
        .filter(atendida=False)
        .select_related('producto')
        .order_by('-created_at')[:50]
    )

    periodo = f"{inicio_mes.strftime('%Y-%m-%d')} — {now.strftime('%Y-%m-%d')}"
    return {
        'titulo': 'Informe General de Bodega',
        'periodo': periodo,
        'resumen_ejecutivo': {
            **resumen,
            'movimientos_mes': movimientos_mes,
        },
        'stock_critico': criticos,
        'distribucion_categoria': distribucion_categoria,
        'top_movimientos': top_mov,
        'alertas': alertas,
    }


# ── REPORTE INVENTARIO ────────────────────────────────────────────────

def datos_reporte_inventario():
    productos = list(productos_activos_qs())
    resumen = resumen_inventario_basico()
    filas = []
    subtotales = defaultdict(lambda: {'cantidad': 0, 'valor': Decimal('0')})

    for p in productos:
        valor = _valor_inventario_producto(p)
        estado = _producto_estado(p.stock_actual, p.stock_minimo)
        cat = p.categoria.nombre if p.categoria_id else 'Sin categoría'
        filas.append({
            'codigo': p.codigo,
            'nombre': p.nombre,
            'categoria': cat,
            'ubicacion': p.ubicacion.nombre if p.ubicacion_id else '',
            'stock_actual': p.stock_actual,
            'stock_minimo': p.stock_minimo,
            'precio_compra': p.precio_compra,
            'precio_venta': p.precio_venta,
            'valor_inventario': valor,
            'estado': estado,
        })
        subtotales[cat]['cantidad'] += 1
        subtotales[cat]['valor'] += valor

    subtotales_list = [
        {'categoria': k, 'cantidad': v['cantidad'], 'valor': v['valor']}
        for k, v in sorted(subtotales.items())
    ]
    return {
        'titulo': 'Informe de Inventario',
        'periodo': _now().strftime('%Y-%m-%d'),
        'resumen': resumen,
        'filas': filas,
        'subtotales_categoria': subtotales_list,
    }


# ── REPORTE MOVIMIENTOS ─────────────────────────────────────────────

def datos_reporte_movimientos(fecha_desde=None, fecha_hasta=None):
    inicio = _parse_date(fecha_desde) or _month_start()
    fin = _parse_date(fecha_hasta, end_of_day=True) or _now()

    qs = (
        MovimientoORM.objects
        .select_related('producto', 'tipo_movimiento', 'usuario')
        .filter(fecha__gte=inicio, fecha__lte=fin)
        .order_by('-fecha')
    )

    entradas = salidas = traslados = 0
    producto_mov_count = defaultdict(int)
    por_dia = defaultdict(lambda: {'entrada': 0, 'salida': 0, 'traslado': 0})

    filas = []
    for m in qs:
        tipo = m.tipo_movimiento.tipo if m.tipo_movimiento_id else ''
        if tipo == 'entrada':
            entradas += 1
            por_dia[m.fecha.date()]['entrada'] += m.cantidad
        elif tipo == 'salida':
            salidas += 1
            por_dia[m.fecha.date()]['salida'] += m.cantidad
        elif tipo == 'traslado':
            traslados += 1
            por_dia[m.fecha.date()]['traslado'] += m.cantidad

        if m.producto_id:
            producto_mov_count[m.producto_id] += 1

        filas.append({
            'fecha': timezone.localtime(m.fecha).strftime('%Y-%m-%d %H:%M') if m.fecha else '',
            'producto': f"{m.producto.codigo} - {m.producto.nombre}" if m.producto_id else '',
            'tipo': m.tipo_movimiento.nombre if m.tipo_movimiento_id else '',
            'cantidad': m.cantidad,
            'stock_anterior': m.stock_anterior,
            'stock_nuevo': m.stock_nuevo,
            'usuario': m.usuario.nombre if m.usuario_id and getattr(m.usuario, 'nombre', None) else '',
            'observaciones': m.observaciones or '',
        })

    producto_mas_movido = '—'
    if producto_mov_count:
        top_id = max(producto_mov_count, key=producto_mov_count.get)
        from apps.inventario.infrastructure.models import ProductoORM as P
        try:
            prod = P.objects.get(pk=top_id)
            producto_mas_movido = f"{prod.codigo} - {prod.nombre} ({producto_mov_count[top_id]} mov.)"
        except P.DoesNotExist:
            pass

    periodo = f"{inicio.strftime('%Y-%m-%d')} — {fin.strftime('%Y-%m-%d')}"
    return {
        'titulo': 'Informe de Movimientos',
        'periodo': periodo,
        'resumen': {
            'total_entradas': entradas,
            'total_salidas': salidas,
            'total_traslados': traslados,
            'producto_mas_movido': producto_mas_movido,
        },
        'por_dia': dict(sorted(por_dia.items())),
        'filas': filas,
        'fecha_desde': inicio.strftime('%Y-%m-%d'),
        'fecha_hasta': fin.strftime('%Y-%m-%d'),
    }


# ── REPORTE CLIENTES ──────────────────────────────────────────────────

def datos_reporte_clientes():
    clientes = list(ClienteORM.objects.filter(activo=True).order_by('nombre'))
    total = len(clientes)
    puntos_total = sum(c.puntos_fidelizacion for c in clientes)
    por_nivel = {n: 0 for n in NIVELES}
    for c in clientes:
        nivel = c.nivel_fidelidad if c.nivel_fidelidad in por_nivel else 'Bronce'
        por_nivel[nivel] = por_nivel.get(nivel, 0) + 1

    filas = [
        {
            'nombre': c.nombre,
            'identificacion': c.identificacion or '',
            'nivel': c.nivel_fidelidad,
            'puntos': c.puntos_fidelizacion,
            'email': c.email or '',
            'telefono': c.telefono or '',
        }
        for c in clientes
    ]

    top_puntos = sorted(filas, key=lambda x: -x['puntos'])[:10]

    canjes = list(
        CanjesFidelizacionORM.objects
        .select_related('cliente', 'usuario')
        .order_by('-fecha')[:20]
    )
    canjes_filas = [
        {
            'fecha': timezone.localtime(c.fecha).strftime('%Y-%m-%d %H:%M'),
            'cliente': c.cliente.nombre,
            'puntos': c.puntos_canjeados,
            'recompensa': c.recompensa,
            'usuario': c.usuario.nombre if c.usuario_id else '',
        }
        for c in canjes
    ]

    return {
        'titulo': 'Informe de Clientes y Fidelización',
        'periodo': _now().strftime('%Y-%m-%d'),
        'resumen': {
            'total_clientes': total,
            'distribucion_nivel': por_nivel,
            'puntos_circulacion': puntos_total,
        },
        'filas': filas,
        'top_puntos': top_puntos,
        'canjes_recientes': canjes_filas,
    }


# ── REPORTE PROVEEDORES ─────────────────────────────────────────────

def datos_reporte_proveedores():
    proveedores = list(ProveedorORM.objects.filter(activo=True).order_by('nombre'))

    entradas = (
        MovimientoORM.objects
        .filter(
            proveedor_id__isnull=False,
            tipo_movimiento__tipo='entrada',
        )
        .select_related('producto', 'proveedor')
        .values('proveedor_id', 'proveedor__nombre', 'producto__codigo', 'producto__nombre')
        .annotate(unidades=Sum('cantidad'))
        .order_by('proveedor__nombre', 'producto__codigo')
    )

    prov_map = defaultdict(lambda: {'nombre': '', 'productos': []})
    for row in entradas:
        pid = row['proveedor_id']
        prov_map[pid]['nombre'] = row['proveedor__nombre']
        prov_map[pid]['productos'].append({
            'codigo': row['producto__codigo'],
            'nombre': row['producto__nombre'],
            'unidades': row['unidades'] or 0,
        })

    lista = []
    for prov in proveedores:
        data = prov_map.get(prov.id, {'nombre': prov.nombre, 'productos': []})
        total_unidades = sum(p['unidades'] for p in data['productos'])
        lista.append({
            'id': prov.id,
            'nombre': prov.nombre,
            'ruc_nit': prov.ruc_nit or '',
            'email': prov.email or '',
            'telefono': prov.telefono or '',
            'productos': data['productos'],
            'total_unidades': total_unidades,
        })

    return {
        'titulo': 'Informe de Proveedores',
        'periodo': _now().strftime('%Y-%m-%d'),
        'proveedores': lista,
        'total_proveedores': len(lista),
    }
