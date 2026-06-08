from datetime import date, timedelta

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.administracion.infrastructure.models import AuditoriaORM
from apps.fidelizacion.infrastructure.models import CanjesFidelizacionORM, ReglaFidelizacionORM
from apps.inventario.infrastructure.models import (
    LoteORM,
    MovimientoORM,
    ProductoORM,
    TipoMovimientoORM,
)
from apps.seguridad.infrastructure.models import UsuarioORM
from apps.terceros.infrastructure.models import ClienteORM, ProveedorORM

SEED_MARKER = '[seed-test-data]'


class Command(BaseCommand):
    help = 'Inserta datos de prueba: reglas, canjes, lotes, movimientos y auditorías'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Recrea registros marcados con el identificador de seed',
        )

    def handle(self, *args, **options):
        self.stdout.write('Verificando datos base...')
        if ProductoORM.objects.count() < 5:
            call_command('seed_data')
        if UsuarioORM.objects.count() == 0:
            call_command('init_roles')

        usuarios = list(UsuarioORM.objects.filter(activo=True)[:3])
        if not usuarios:
            self.stderr.write(self.style.ERROR('No hay usuarios activos. Ejecuta init_roles primero.'))
            return

        clientes = list(ClienteORM.objects.filter(activo=True)[:10])
        productos = list(ProductoORM.objects.filter(activo=True)[:10])
        proveedores = list(ProveedorORM.objects.filter(activo=True)[:5])

        if len(clientes) < 3:
            self.stderr.write(self.style.ERROR('Se necesitan al menos 3 clientes. Ejecuta seed_data primero.'))
            return
        if len(productos) < 5:
            self.stderr.write(self.style.ERROR('Se necesitan al menos 5 productos. Ejecuta seed_data primero.'))
            return

        if options['force']:
            self._limpiar_seed_anterior()

        counts = {
            'reglas': self._seed_reglas(),
            'canjes': self._seed_canjes(clientes, usuarios),
            'lotes': self._seed_lotes(productos),
            'movimientos': self._seed_movimientos(productos, proveedores, clientes, usuarios),
            'auditorias': self._seed_auditorias(usuarios),
        }

        self.stdout.write(self.style.SUCCESS('\n=== Resumen de inserción ==='))
        for tabla, count in counts.items():
            self.stdout.write(f'  {tabla}: {count} registro(s) nuevo(s)')
        self.stdout.write(self.style.SUCCESS('\nSeed de datos de prueba completado.'))

    def _limpiar_seed_anterior(self):
        CanjesFidelizacionORM.objects.filter(recompensa__contains=SEED_MARKER).delete()
        ReglaFidelizacionORM.objects.filter(nombre__startswith='SEED-').delete()
        LoteORM.objects.filter(numero_lote__startswith='LOT-2025-').delete()
        MovimientoORM.objects.filter(observaciones__contains=SEED_MARKER).delete()
        AuditoriaORM.objects.filter(datos_nuevos__contains=SEED_MARKER).delete()
        self.stdout.write(self.style.WARNING('Registros de seed anteriores eliminados (--force).'))

    def _seed_reglas(self) -> int:
        reglas_data = [
            ('SEED-Compra mínima $50', 100, 'Bronce', 'Plata', '100 puntos por compra desde $50', True),
            ('SEED-Compra mínima $100', 250, 'Bronce', 'Oro', '250 puntos por compra desde $100', True),
            ('SEED-Compra mínima $200', 600, 'Plata', 'Platino', '600 puntos por compra desde $200', True),
            ('SEED-Producto especial cemento', 50, 'Bronce', 'Platino', '50 puntos bonus en cemento Portland', True),
            ('SEED-Producto especial arroz', 30, 'Bronce', 'Oro', '30 puntos bonus en arroz granel', True),
            ('SEED-Compra fin de semana', 75, 'Bronce', 'Plata', '75 puntos extra sábados y domingos', True),
            ('SEED-Cliente nivel Oro', 150, 'Oro', 'Oro', '150 puntos por unidad para clientes Oro', True),
            ('SEED-Cliente nivel Platino', 200, 'Platino', 'Platino', '200 puntos por unidad para clientes Platino', True),
            ('SEED-Promoción azúcar (inactiva)', 40, 'Bronce', 'Plata', '40 puntos en azúcar refinada', False),
            ('SEED-Canje doble puntos (inactiva)', 2, 'Plata', 'Platino', '2 puntos por dólar en temporada', False),
        ]
        created = 0
        for nombre, puntos, nmin, nmax, recompensa, activo in reglas_data:
            _, was_created = ReglaFidelizacionORM.objects.get_or_create(
                nombre=nombre,
                defaults={
                    'puntos_por_unidad': puntos,
                    'nivel_minimo': nmin,
                    'nivel_maximo': nmax,
                    'recompensa': recompensa,
                    'activo': activo,
                },
            )
            if was_created:
                created += 1
        return created

    def _seed_canjes(self, clientes, usuarios) -> int:
        now = timezone.now()
        canjes_data = [
            (0, 150, 'Descuento 10% en cemento — Estado: completado', 45, 'completado'),
            (1, 500, 'Gift card $25 en ferretería — Estado: completado', 30, 'completado'),
            (2, 200, 'Bolsa de arroz 5kg gratis — Estado: pendiente', 12, 'pendiente'),
            (3, 1200, 'Kit herramientas básicas — Estado: completado', 55, 'completado'),
            (4, 100, 'Descuento $5 en pintura — Estado: cancelado', 8, 'cancelado'),
            (5, 350, 'Despensa familiar — Estado: completado', 22, 'completado'),
            (6, 800, 'Taladro inalámbrico con descuento — Estado: pendiente', 40, 'pendiente'),
            (7, 180, 'Casco de seguridad gratis — Estado: completado', 18, 'completado'),
            (8, 2000, 'Premio mayor cliente Platino — Estado: completado', 58, 'completado'),
            (9, 450, 'Vale de compra $30 — Estado: cancelado', 5, 'cancelado'),
        ]
        created = 0
        for idx, (ci, puntos, recompensa, dias_atras, _estado) in enumerate(canjes_data):
            recompensa_full = f'{recompensa} {SEED_MARKER}'
            cliente = clientes[ci % len(clientes)]
            usuario = usuarios[idx % len(usuarios)]
            if CanjesFidelizacionORM.objects.filter(
                cliente=cliente,
                puntos_canjeados=puntos,
                recompensa=recompensa_full,
            ).exists():
                continue
            canje = CanjesFidelizacionORM.objects.create(
                cliente=cliente,
                puntos_canjeados=puntos,
                recompensa=recompensa_full,
                usuario=usuario,
            )
            CanjesFidelizacionORM.objects.filter(pk=canje.pk).update(
                fecha=now - timedelta(days=dias_atras, hours=idx * 2),
            )
            created += 1
        return created

    def _seed_lotes(self, productos) -> int:
        today = date.today()
        lotes_data = [
            ('LOT-2025-001', 0, today - timedelta(days=30), today + timedelta(days=180), 120, True, 'activo'),
            ('LOT-2025-002', 1, today - timedelta(days=15), today + timedelta(days=20), 85, True, 'activo'),
            ('LOT-2025-003', 2, today - timedelta(days=60), today + timedelta(days=365), 200, True, 'activo'),
            ('LOT-2025-004', 3, today - timedelta(days=10), today + timedelta(days=15), 45, True, 'activo'),
            ('LOT-2025-005', 4, today - timedelta(days=90), today + timedelta(days=90), 0, True, 'agotado'),
            ('LOT-2025-006', 5, today - timedelta(days=120), today - timedelta(days=5), 30, False, 'vencido'),
            ('LOT-2025-007', 6, today - timedelta(days=20), today + timedelta(days=240), 75, True, 'activo'),
            ('LOT-2025-008', 7, today - timedelta(days=5), today + timedelta(days=30), 150, True, 'activo'),
            ('LOT-2025-009', 8, today - timedelta(days=45), today + timedelta(days=200), 0, False, 'agotado'),
            ('LOT-2025-010', 9, today - timedelta(days=200), today - timedelta(days=30), 15, False, 'vencido'),
        ]
        created = 0
        for numero, pi, ingreso, vencimiento, cantidad, activo, _estado in lotes_data:
            producto = productos[pi % len(productos)]
            _, was_created = LoteORM.objects.get_or_create(
                producto=producto,
                numero_lote=numero,
                defaults={
                    'fecha_ingreso': ingreso,
                    'fecha_vencimiento': vencimiento,
                    'cantidad': cantidad,
                    'activo': activo,
                },
            )
            if was_created:
                created += 1
        return created

    def _get_tipo(self, tipo: str) -> TipoMovimientoORM:
        defaults = {'entrada': 'Entrada', 'salida': 'Salida', 'traslado': 'Traslado'}
        obj, _ = TipoMovimientoORM.objects.get_or_create(
            tipo=tipo,
            defaults={'nombre': defaults[tipo]},
        )
        return obj

    def _seed_movimientos(self, productos, proveedores, clientes, usuarios) -> int:
        now = timezone.now()
        tipo_entrada = self._get_tipo('entrada')
        tipo_salida = self._get_tipo('salida')
        tipo_traslado = self._get_tipo('traslado')

        movimientos_data = [
            ('entrada', 0, 50, 'Compra a proveedor TechSupply — recepción cemento', 25, 'proveedor', 0),
            ('entrada', 1, 30, 'Devolución de cliente — taladros sin uso', 18, None, 1),
            ('entrada', 2, 100, 'Compra a Distribuidora El Constructor — arroz granel', 40, 'proveedor', 2),
            ('entrada', 3, 25, 'Ajuste por inventario físico — desinfectante', 10, None, 0),
            ('salida', 4, 15, 'Venta mostrador — resmas papel A4', 7, 'cliente', 3),
            ('salida', 5, 20, 'Venta mayorista — arroz a restaurante', 14, 'cliente', 4),
            ('salida', 6, 8, 'Venta — cascos de seguridad obra Tulcán', 21, 'cliente', 5),
            ('salida', 7, 40, 'Venta ferretería — focos LED', 28, 'cliente', 6),
            ('traslado', 8, 60, 'Traslado Bodega Principal → Estante B-01 (tubos PVC)', 12, None, 1),
            ('traslado', 9, 10, 'Traslado Recepción → Despacho (pintura látex)', 5, None, 2),
        ]

        created = 0
        with transaction.atomic():
            for idx, (tipo, pi, cantidad, motivo, dias_atras, ref_tipo, ref_i) in enumerate(movimientos_data):
                obs = f'{motivo} {SEED_MARKER}'
                if MovimientoORM.objects.filter(observaciones=obs).exists():
                    continue

                producto = productos[pi % len(productos)]
                stock_anterior = producto.stock_actual

                if tipo == 'entrada':
                    stock_nuevo = stock_anterior + cantidad
                    tipo_obj = tipo_entrada
                    proveedor = proveedores[ref_i % len(proveedores)] if ref_tipo == 'proveedor' and proveedores else None
                    cliente = None
                elif tipo == 'salida':
                    stock_nuevo = max(0, stock_anterior - cantidad)
                    tipo_obj = tipo_salida
                    proveedor = None
                    cliente = clientes[ref_i % len(clientes)] if ref_tipo == 'cliente' else None
                else:
                    stock_nuevo = stock_anterior
                    tipo_obj = tipo_traslado
                    proveedor = None
                    cliente = None

                lote = LoteORM.objects.filter(producto=producto, cantidad__gt=0).first()
                usuario = usuarios[idx % len(usuarios)]

                mov = MovimientoORM.objects.create(
                    producto=producto,
                    lote=lote,
                    tipo_movimiento=tipo_obj,
                    cantidad=cantidad,
                    stock_anterior=stock_anterior,
                    stock_nuevo=stock_nuevo,
                    proveedor=proveedor,
                    cliente=cliente,
                    usuario=usuario,
                    observaciones=obs,
                )
                MovimientoORM.objects.filter(pk=mov.pk).update(
                    fecha=now - timedelta(days=dias_atras, hours=idx * 3),
                )
                producto.stock_actual = stock_nuevo
                producto.save(update_fields=['stock_actual'])
                created += 1
        return created

    def _seed_auditorias(self, usuarios) -> int:
        now = timezone.now()
        auditorias_data = [
            ('CREATE', 'inventario', 1, 'Creación de producto Cemento Portland 50kg', 2),
            ('UPDATE', 'inventario', 3, 'Actualización de stock mínimo de arroz granel', 5),
            ('DELETE', 'inventario', 99, 'Eliminación de producto duplicado PROD-TEMP', 8),
            ('CREATE', 'lotes', 1, 'Registro de lote LOT-2025-001 para cemento', 3),
            ('UPDATE', 'lotes', 6, 'Corrección de fecha de vencimiento lote vencido', 10),
            ('CREATE', 'canjes', 1, 'Registro de canje 150 puntos por descuento cemento', 1),
            ('UPDATE', 'canjes', 3, 'Actualización estado canje a completado', 4),
            ('CREATE', 'usuarios', 2, 'Alta de usuario operador de bodega Tulcán', 6),
            ('UPDATE', 'usuarios', 1, 'Cambio de rol a Administrador', 12),
            ('DELETE', 'canjes', 5, 'Anulación de canje duplicado por error de caja', 15),
        ]
        created = 0
        for idx, (accion, entidad, entidad_id, descripcion, dias_atras) in enumerate(auditorias_data):
            usuario = usuarios[idx % len(usuarios)]
            datos_nuevos = {
                'descripcion': descripcion,
                'modulo': entidad,
                SEED_MARKER: True,
            }
            if AuditoriaORM.objects.filter(
                accion=accion,
                entidad=entidad,
                entidad_id=entidad_id,
                datos_nuevos__descripcion=descripcion,
            ).exists():
                continue

            registro = AuditoriaORM.objects.create(
                usuario=usuario,
                accion=accion,
                entidad=entidad,
                entidad_id=entidad_id,
                datos_anteriores=None if accion == 'CREATE' else {'nota': 'valor anterior simulado'},
                datos_nuevos=datos_nuevos,
                ip='192.168.1.' + str(10 + idx),
            )
            AuditoriaORM.objects.filter(pk=registro.pk).update(
                fecha=now - timedelta(days=dias_atras, hours=idx),
            )
            created += 1
        return created
