from decimal import Decimal

from django.core.management.base import BaseCommand

from apps.inventario.infrastructure.models import (
    CategoriaORM,
    ProductoORM,
    UbicacionORM,
)
from apps.terceros.infrastructure.models import ClienteORM, ProveedorORM


class Command(BaseCommand):
    help = 'Crea datos de prueba para el sistema'

    def handle(self, *args, **kwargs):
        categorias_data = [
            ('Electrónica', 'Equipos y dispositivos electrónicos'),
            ('Herramientas', 'Herramientas manuales y eléctricas'),
            ('Materiales de Construcción', 'Cemento, varillas y materiales'),
            ('Limpieza', 'Productos de limpieza y aseo'),
            ('Oficina', 'Útiles y suministros de oficina'),
            ('Alimentos', 'Productos alimenticios no perecederos'),
            ('Seguridad', 'Equipos de protección personal'),
            ('Iluminación', 'Focos, lámparas y accesorios'),
            ('Plomería', 'Tuberías, llaves y accesorios'),
            ('Pintura', 'Pinturas, brochas y rodillos'),
        ]
        categorias = []
        for nombre, desc in categorias_data:
            cat, _ = CategoriaORM.objects.get_or_create(
                nombre=nombre, defaults={'descripcion': desc},
            )
            categorias.append(cat)
        self.stdout.write(self.style.SUCCESS(f'{len(categorias)} categorias creadas'))

        ubicaciones_data = [
            ('Estante A-01', 'Pasillo A, estante 1', 'Zona A'),
            ('Estante A-02', 'Pasillo A, estante 2', 'Zona A'),
            ('Estante B-01', 'Pasillo B, estante 1', 'Zona B'),
            ('Estante B-02', 'Pasillo B, estante 2', 'Zona B'),
            ('Estante C-01', 'Pasillo C, estante 1', 'Zona C'),
            ('Bodega Principal', 'Área central de almacenamiento', 'Zona Central'),
            ('Bodega Secundaria', 'Área de desbordamiento', 'Zona Central'),
            ('Recepción', 'Área de recepción de mercancía', 'Zona Entrada'),
            ('Despacho', 'Área de despacho de pedidos', 'Zona Salida'),
            ('Cuarto Frío', 'Almacenamiento refrigerado', 'Zona Especial'),
        ]
        ubicaciones = []
        for nombre, desc, zona in ubicaciones_data:
            ub, _ = UbicacionORM.objects.get_or_create(
                nombre=nombre,
                defaults={'descripcion': desc, 'zona': zona},
            )
            ubicaciones.append(ub)
        self.stdout.write(self.style.SUCCESS(f'{len(ubicaciones)} ubicaciones creadas'))

        productos_data = [
            ('PROD-001', 'Cable HDMI 2.0 4K', categorias[0], 8.50, 15.99, 'Unidad', 5, ubicaciones[0]),
            ('PROD-002', 'Taladro Inalámbrico 18V', categorias[1], 45.00, 89.99, 'Unidad', 3, ubicaciones[1]),
            ('PROD-003', 'Cemento Portland 50kg', categorias[2], 9.00, 14.50, 'Saco', 20, ubicaciones[2]),
            ('PROD-004', 'Desinfectante Multiusos 1L', categorias[3], 2.50, 5.99, 'Litro', 15, ubicaciones[3]),
            ('PROD-005', 'Resma de Papel A4 500 hojas', categorias[4], 4.00, 7.50, 'Resma', 10, ubicaciones[4]),
            ('PROD-006', 'Arroz Granel 25kg', categorias[5], 18.00, 25.00, 'Saco', 8, ubicaciones[5]),
            ('PROD-007', 'Casco de Seguridad Industrial', categorias[6], 8.00, 16.99, 'Unidad', 5, ubicaciones[6]),
            ('PROD-008', 'Foco LED 15W E27', categorias[7], 1.80, 4.50, 'Unidad', 20, ubicaciones[0]),
            ('PROD-009', 'Tubo PVC 1/2 pulgada 6m', categorias[8], 3.50, 7.00, 'Unidad', 10, ubicaciones[1]),
            ('PROD-010', 'Pintura Látex Blanca 1 galón', categorias[9], 12.00, 22.99, 'Galón', 5, ubicaciones[2]),
        ]
        for codigo, nombre, cat, pc, pv, um, sm, ub in productos_data:
            ProductoORM.objects.get_or_create(
                codigo=codigo,
                defaults={
                    'nombre': nombre,
                    'categoria': cat,
                    'precio_compra': Decimal(str(pc)),
                    'precio_venta': Decimal(str(pv)),
                    'unidad_medida': um,
                    'stock_minimo': sm,
                    'stock_actual': sm * 3,
                    'ubicacion': ub,
                },
            )
        self.stdout.write(self.style.SUCCESS('10 productos creados'))

        proveedores_data = [
            ('TechSupply S.A.', '1792345678001', '022345678', 'ventas@techsupply.ec', 'Av. 10 de Agosto N45-100, Quito'),
            ('Ferretería Industrial Hnos. Mora', '0992345678001', '062345678', 'mora@ferreteria.ec', 'Calle Bolívar 234, Tulcán'),
            ('Distribuidora El Constructor', '1790123456001', '022987654', 'info@elconstructor.ec', 'Av. Amazonas 567, Quito'),
            ('CleanPro Ecuador', '0990987654001', '072345678', 'ventas@cleanpro.ec', 'Av. 9 de Octubre 890, Guayaquil'),
            ('Papelería Nacional S.A.', '1791234567001', '022111222', 'pedidos@papnacional.ec', 'Calle Sucre 123, Quito'),
            ('AgroDistribuciones Norte', '0401234567001', '062987654', 'agro@norte.ec', 'Av. Universitaria 456, Tulcán'),
            ('Seguridad Industrial Total', '1793456789001', '022333444', 'info@segind.ec', 'Av. República 789, Quito'),
            ('IluminaEc S.A.', '0991234567001', '042345678', 'ventas@iluminaec.ec', 'Av. de las Américas 321, Guayaquil'),
            ('Plomería y Más Cía. Ltda.', '1794567890001', '022555666', 'pedidos@plomeria.ec', 'Calle Olmedo 654, Quito'),
            ('Pinturas del Norte', '0402345678001', '062111333', 'ventas@pintnorte.ec', 'Av. Tulcán 987, Tulcán'),
        ]
        for nombre, ruc, tel, email, dir in proveedores_data:
            ProveedorORM.objects.get_or_create(
                nombre=nombre,
                defaults={
                    'ruc_nit': ruc,
                    'telefono': tel,
                    'email': email,
                    'direccion': dir,
                },
            )
        self.stdout.write(self.style.SUCCESS('10 proveedores creados'))

        clientes_data = [
            ('Juan Carlos Benavides', '0401234567', 'jcbenavides@gmail.com', '0991234567', 'Calle Sucre 123, Tulcán', 150, 'Plata'),
            ('María Fernanda López', '1723456789', 'mflopez@hotmail.com', '0987654321', 'Av. Amazonas 456, Quito', 520, 'Oro'),
            ('Carlos Andrés Mora', '0402345678', 'camora@empresa.ec', '0976543210', 'Calle Bolívar 789, Tulcán', 80, 'Bronce'),
            ('Ana Lucía Ramírez', '1734567890', 'alramirez@gmail.com', '0965432109', 'Av. 10 de Agosto 321, Quito', 2150, 'Platino'),
            ('Pedro Ignacio Vásquez', '0403456789', 'pivasquez@outlook.com', '0954321098', 'Calle Rocafuerte 654, Tulcán', 95, 'Bronce'),
            ('Sofía Valentina Cruz', '1745678901', 'svcruz@gmail.com', '0943210987', 'Av. República 987, Quito', 380, 'Plata'),
            ('Diego Sebastián Herrera', '0404567890', 'dsherrera@empresa.ec', '0932109876', 'Calle Colón 147, Ibarra', 610, 'Oro'),
            ('Gabriela Mishell Pozo', '1756789012', 'gmpozo@hotmail.com', '0921098765', 'Av. Universitaria 258, Tulcán', 45, 'Bronce'),
            ('Roberto Carlos Játiva', '0405678901', 'rcjativa@gmail.com', '0910987654', 'Calle Pichincha 369, Tulcán', 1800, 'Oro'),
            ('Valeria Estefanía Narváez', '1767890123', 'venarvaez@empresa.ec', '0909876543', 'Av. El Ejido 741, Quito', 2500, 'Platino'),
        ]
        for nombre, ident, email, tel, dir, puntos, nivel in clientes_data:
            ClienteORM.objects.get_or_create(
                nombre=nombre,
                defaults={
                    'identificacion': ident,
                    'email': email,
                    'telefono': tel,
                    'direccion': dir,
                    'puntos_fidelizacion': puntos,
                    'nivel_fidelidad': nivel,
                },
            )
        self.stdout.write(self.style.SUCCESS('10 clientes creados'))

        self.stdout.write(self.style.SUCCESS('\nDatos de prueba creados exitosamente'))
