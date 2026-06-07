"""
Utilidades OpenAPI / drf-spectacular para SmashIACodeR.
Asigna tags, resúmenes, ejemplos y seguridad JWT en la documentación.
"""

import re

# Endpoints públicos (sin JWT en Swagger)
PUBLIC_OPERATIONS = {
    ('/api/seguridad/login', 'post'),
    ('/api/seguridad/recuperar', 'post'),
    ('/api/seguridad/restablecer', 'post'),
    ('/api/auth/token/', 'post'),
    ('/api/auth/token/refresh/', 'post'),
    ('/api/auth/token/verify/', 'post'),
}

# (patrón regex, tag)
PATH_TAG_RULES = [
    (r'^/api/auth/token', 'Autenticación'),
    (r'^/api/seguridad/login', 'Autenticación'),
    (r'^/api/seguridad/(me|logout|recuperar|restablecer)', 'Autenticación'),
    (r'^/api/seguridad/(usuarios|roles)', 'Usuarios'),
    (r'^/api/inventario/categorias', 'Categorías'),
    (r'^/api/inventario/ubicaciones', 'Ubicaciones'),
    (r'^/api/inventario/productos', 'Productos'),
    (r'^/api/inventario/lotes', 'Lotes'),
    (r'^/api/inventario/movimientos', 'Movimientos'),
    (r'^/api/inventario/dashboard/alertas', 'Dashboard'),
    (r'^/api/terceros/proveedores', 'Proveedores'),
    (r'^/api/terceros/clientes', 'Clientes'),
    (r'^/api/fidelizacion/', 'Fidelización'),
    (r'^/api/administracion/dashboard', 'Dashboard'),
    (r'^/api/administracion/reportes', 'Reportes'),
    (r'^/api/administracion/auditoria', 'Auditoría'),
    (r'^/api/administracion/configuracion', 'Configuración'),
    (r'^/api/administracion/chatbot', 'Chatbot'),
]

# (patrón regex, método, resumen, descripción)
OPERATION_DOCS = [
    (
        r'^/api/seguridad/login$',
        'post',
        'Iniciar sesión',
        'Autentica con email y contraseña. Copia el `access_token` de la respuesta '
        'y pégalo en el botón **Authorize** (formato: solo el token, sin "Bearer").',
    ),
    (
        r'^/api/seguridad/me$',
        'get',
        'Perfil del usuario autenticado',
        'Devuelve los datos del usuario en sesión. Requiere JWT válido.',
    ),
    (
        r'^/api/seguridad/logout$',
        'post',
        'Cerrar sesión',
        'Invalida el refresh token enviado en el cuerpo de la petición.',
    ),
    (
        r'^/api/seguridad/recuperar$',
        'post',
        'Recuperar contraseña',
        'Envía un correo con instrucciones para restablecer la contraseña.',
    ),
    (
        r'^/api/seguridad/restablecer$',
        'post',
        'Restablecer contraseña',
        'Establece una nueva contraseña usando el token recibido por correo.',
    ),
    (
        r'^/api/seguridad/roles$',
        'get',
        'Listar roles',
        'Lista todos los roles del sistema (Administrador, Usuario, etc.).',
    ),
    (
        r'^/api/seguridad/roles$',
        'post',
        'Crear rol',
        'Crea un nuevo rol. Solo administradores.',
    ),
    (
        r'^/api/seguridad/usuarios$',
        'get',
        'Listar usuarios',
        'Lista todos los usuarios registrados. Solo administradores.',
    ),
    (
        r'^/api/seguridad/usuarios$',
        'post',
        'Crear usuario',
        'Registra un nuevo usuario con rol asignado. Solo administradores.',
    ),
    (
        r'^/api/seguridad/usuarios/\{id\}$',
        'get',
        'Obtener usuario',
        'Devuelve el perfil de un usuario por ID.',
    ),
    (
        r'^/api/seguridad/usuarios/\{id\}$',
        'put',
        'Actualizar usuario',
        'Actualiza nombre u otros datos del perfil del usuario.',
    ),
    (
        r'^/api/seguridad/usuarios/\{id\}/cambiar-password$',
        'post',
        'Cambiar contraseña',
        'Cambia la contraseña del usuario autenticado.',
    ),
    (
        r'^/api/inventario/categorias$',
        'get',
        'Listar categorías',
        'Devuelve todas las categorías de productos activas.',
    ),
    (
        r'^/api/inventario/categorias$',
        'post',
        'Crear categoría',
        'Registra una nueva categoría de productos.',
    ),
    (
        r'^/api/inventario/ubicaciones$',
        'get',
        'Listar ubicaciones',
        'Devuelve ubicaciones y zonas del almacén.',
    ),
    (
        r'^/api/inventario/ubicaciones$',
        'post',
        'Crear ubicación',
        'Registra una nueva ubicación en el almacén.',
    ),
    (
        r'^/api/inventario/productos$',
        'get',
        'Listar productos',
        'Lista productos con paginación, filtros y búsqueda.',
    ),
    (
        r'^/api/inventario/productos$',
        'post',
        'Crear producto',
        'Registra un nuevo producto en inventario.',
    ),
    (
        r'^/api/inventario/productos/buscar$',
        'get',
        'Buscar productos',
        'Búsqueda rápida por código o nombre de producto.',
    ),
    (
        r'^/api/inventario/movimientos/entrada$',
        'post',
        'Registrar entrada',
        'Ingresa stock al almacén con número de lote (FIFO).',
    ),
    (
        r'^/api/inventario/movimientos/salida$',
        'post',
        'Registrar salida',
        'Registra salida de stock aplicando método FIFO.',
    ),
    (
        r'^/api/inventario/movimientos/traslado$',
        'post',
        'Registrar traslado',
        'Mueve stock entre ubicaciones del almacén.',
    ),
    (
        r'^/api/inventario/movimientos/$',
        'get',
        'Listar movimientos',
        'Historial de entradas, salidas y traslados.',
    ),
    (
        r'^/api/terceros/proveedores$',
        'get',
        'Listar proveedores',
        'Devuelve el catálogo de proveedores.',
    ),
    (
        r'^/api/terceros/proveedores$',
        'post',
        'Crear proveedor',
        'Registra un nuevo proveedor.',
    ),
    (
        r'^/api/terceros/clientes$',
        'get',
        'Listar clientes',
        'Devuelve clientes con puntos y nivel de fidelización.',
    ),
    (
        r'^/api/terceros/clientes$',
        'post',
        'Crear cliente',
        'Registra un nuevo cliente en el sistema.',
    ),
    (
        r'^/api/fidelizacion/reglas$',
        'get',
        'Listar reglas de fidelización',
        'Devuelve reglas de puntos por nivel (Bronce, Plata, Oro, Platino).',
    ),
    (
        r'^/api/fidelizacion/reglas$',
        'post',
        'Crear regla de fidelización',
        'Define una nueva regla de acumulación o canje de puntos.',
    ),
    (
        r'^/api/fidelizacion/canjear$',
        'post',
        'Canjear puntos',
        'Canjea puntos de fidelización de un cliente.',
    ),
    (
        r'^/api/administracion/dashboard$',
        'get',
        'Resumen del dashboard',
        'KPIs principales: productos, stock bajo, movimientos del día.',
    ),
    (
        r'^/api/administracion/dashboard/graficas$',
        'get',
        'Gráficas del dashboard',
        'Datos para gráficas de ventas, stock y movimientos.',
    ),
    (
        r'^/api/administracion/auditoria$',
        'get',
        'Registro de auditoría',
        'Historial de acciones realizadas en el sistema.',
    ),
    (
        r'^/api/administracion/configuracion$',
        'get',
        'Listar configuración',
        'Parámetros globales del sistema (clave-valor).',
    ),
    (
        r'^/api/administracion/chatbot/mensaje$',
        'post',
        'Enviar mensaje al chatbot',
        'Consulta al asistente IA (Groq Llama 3.3) sobre inventario.',
    ),
    (
        r'^/api/administracion/reportes/.*/enviar$',
        'post',
        'Enviar reporte por correo',
        'Genera y envía un reporte PDF o Excel por email.',
    ),
]

REQUEST_EXAMPLES = {
    ('/api/seguridad/login', 'post'): {
        'administrador': {
            'summary': 'Administrador (Michael - coordinación)',
            'description': 'Usuario con rol Administrador y acceso total.',
            'value': {
                'email': 'admin@smashiacoder.com',
                'password': 'Admin2024@',
            },
        },
        'usuario': {
            'summary': 'Usuario estándar',
            'description': 'Usuario con rol Usuario y acceso limitado.',
            'value': {
                'email': 'usuario@smashiacoder.com',
                'password': 'User2024@',
            },
        },
    },
    ('/api/seguridad/usuarios', 'post'): {
        'nuevo_usuario': {
            'summary': 'Crear usuario operador',
            'value': {
                'nombre': 'Juan Pérez',
                'email': 'juan.perez@empresa.ec',
                'password': 'Operador2024@',
                'rol_id': 2,
            },
        },
    },
    ('/api/seguridad/roles', 'post'): {
        'nuevo_rol': {
            'summary': 'Crear rol personalizado',
            'value': {
                'nombre': 'Supervisor',
                'descripcion': 'Supervisa operaciones de almacén',
            },
        },
    },
    ('/api/inventario/categorias', 'post'): {
        'categoria': {
            'summary': 'Nueva categoría',
            'value': {
                'nombre': 'Electrónica',
                'descripcion': 'Equipos y dispositivos electrónicos',
            },
        },
    },
    ('/api/inventario/ubicaciones', 'post'): {
        'ubicacion': {
            'summary': 'Nueva ubicación',
            'value': {
                'nombre': 'Estante A-01',
                'descripcion': 'Pasillo A, estante 1',
                'zona': 'Zona A',
            },
        },
    },
    ('/api/inventario/productos', 'post'): {
        'producto': {
            'summary': 'Nuevo producto',
            'value': {
                'codigo': 'PROD-001',
                'nombre': 'Cable HDMI 2.0 4K',
                'descripcion': 'Cable HDMI de alta velocidad',
                'categoria_id': 1,
                'precio_compra': '8.50',
                'precio_venta': '15.99',
                'unidad_medida': 'Unidad',
                'stock_minimo': 5,
                'ubicacion_id': 1,
            },
        },
    },
    ('/api/inventario/movimientos/entrada', 'post'): {
        'entrada': {
            'summary': 'Entrada de stock',
            'value': {
                'producto_id': 1,
                'cantidad': 50,
                'numero_lote': 'LOTE-2026-001',
                'proveedor_id': 1,
                'observaciones': 'Compra mensual',
            },
        },
    },
    ('/api/inventario/movimientos/salida', 'post'): {
        'salida': {
            'summary': 'Salida de stock',
            'value': {
                'producto_id': 1,
                'cantidad': 10,
                'cliente_id': 1,
                'observaciones': 'Venta al contado',
            },
        },
    },
    ('/api/terceros/proveedores', 'post'): {
        'proveedor': {
            'summary': 'Nuevo proveedor',
            'value': {
                'nombre': 'TechSupply S.A.',
                'ruc_nit': '1792345678001',
                'telefono': '022345678',
                'email': 'ventas@techsupply.ec',
                'direccion': 'Av. 10 de Agosto N45-100, Quito',
            },
        },
    },
    ('/api/terceros/clientes', 'post'): {
        'cliente': {
            'summary': 'Nuevo cliente',
            'value': {
                'nombre': 'Juan Carlos Benavides',
                'identificacion': '0401234567',
                'email': 'jcbenavides@gmail.com',
                'telefono': '0991234567',
                'direccion': 'Calle Sucre 123, Tulcán',
            },
        },
    },
    ('/api/fidelizacion/reglas', 'post'): {
        'regla': {
            'summary': 'Regla de puntos Oro',
            'value': {
                'nombre': 'Doble puntos fin de semana',
                'puntos_por_unidad': 2,
                'nivel_minimo': 'Oro',
                'nivel_maximo': 'Platino',
                'recompensa': '2 puntos por cada dólar en compras de sábado y domingo',
            },
        },
    },
    ('/api/fidelizacion/canjear', 'post'): {
        'canje': {
            'summary': 'Canjear puntos',
            'value': {
                'cliente_id': 1,
                'puntos': 100,
                'descripcion': 'Descuento 10% en próxima compra',
            },
        },
    },
    ('/api/administracion/chatbot/mensaje', 'post'): {
        'consulta': {
            'summary': 'Pregunta al chatbot',
            'value': {
                'mensaje': '¿Cuántos productos tienen stock bajo?',
            },
        },
    },
    ('/api/administracion/configuracion', 'post'): {
        'config': {
            'summary': 'Nuevo parámetro',
            'value': {
                'clave': 'empresa_nombre',
                'valor': 'SmashIACodeR Warehouse',
                'descripcion': 'Nombre comercial del almacén',
            },
        },
    },
}


def _resolve_tag(path: str) -> str:
    for pattern, tag in PATH_TAG_RULES:
        if re.search(pattern, path):
            return tag
    return 'API'


def _resolve_operation_doc(path: str, method: str):
    for pattern, doc_method, summary, description in OPERATION_DOCS:
        if doc_method == method and re.search(pattern, path):
            return summary, description
    return None, None


def _inject_request_examples(operation: dict, path: str, method: str) -> None:
    examples = REQUEST_EXAMPLES.get((path, method))
    if not examples:
        return
    request_body = operation.get('requestBody')
    if not request_body:
        return
    content = request_body.get('content', {})
    json_content = content.get('application/json')
    if json_content is not None:
        json_content['examples'] = examples


def postprocess_schema_hook(result, generator, request, public):
    """Asigna tags, resúmenes, ejemplos y seguridad JWT a cada operación."""
    paths = result.get('paths', {})
    for path, path_item in paths.items():
        for method, operation in path_item.items():
            if method not in ('get', 'post', 'put', 'patch', 'delete'):
                continue

            tag = _resolve_tag(path)
            operation['tags'] = [tag]

            summary, description = _resolve_operation_doc(path, method)
            if summary:
                operation['summary'] = summary
            if description:
                operation['description'] = description

            if (path, method) in PUBLIC_OPERATIONS:
                operation['security'] = []
            else:
                operation['security'] = [{'BearerAuth': []}]

            _inject_request_examples(operation, path, method)

    return result
