# config/settings/base.py
import environ
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, []),
)

SECRET_KEY = env('SECRET_KEY')
DEBUG = env('DEBUG')
ALLOWED_HOSTS = env('ALLOWED_HOSTS')

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
]

LOCAL_APPS = [
    'apps.seguridad',
    'apps.inventario',
    'apps.terceros',
    'apps.fidelizacion',
    'apps.administracion',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {
    'default': env.db('DATABASE_URL', default='sqlite:///db.sqlite3')
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'es-ec'
TIME_ZONE = 'America/Guayaquil'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'apps.seguridad.infrastructure.authentication.WarehouseJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'apps.seguridad.infrastructure.permissions.EsUsuarioActivo',
    ),
    'DEFAULT_PAGINATION_CLASS': 'shared.pagination.ZarpronixPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'EXCEPTION_HANDLER': 'shared.responses.custom_exception_handler',
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[])
CORS_ALLOW_CREDENTIALS = True

# ── Email (SMTP) ──────────────────────────────────────────────────────
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
DEFAULT_FROM_EMAIL = env(
    'DEFAULT_FROM_EMAIL',
    default='Warehouse IQ <noreply@warehouse.local>',
)

SPECTACULAR_SETTINGS = {
    'TITLE': 'SmashIACodeR API',
    'DESCRIPTION': '''
    API REST del sistema de gestión de inventarios y fidelización SmashIACodeR.
    Desarrollado con Arquitectura Hexagonal (Puertos y Adaptadores).
    Universidad Politécnica Estatal del Carchi — UPEC 2026.
    ''',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'CONTACT': {
        'name': 'Michael Benavides',
        'email': 'admin@smashiacoder.com',
    },
    'LICENSE': {
        'name': 'Proyecto Académico UPEC',
    },
    'TAGS': [
        {'name': 'Autenticación', 'description': 'Login, logout y gestión de sesión JWT'},
        {'name': 'Usuarios', 'description': 'Gestión de usuarios y roles'},
        {'name': 'Categorías', 'description': 'Categorías de productos'},
        {'name': 'Ubicaciones', 'description': 'Ubicaciones y zonas del almacén'},
        {'name': 'Productos', 'description': 'Gestión completa de productos'},
        {'name': 'Lotes', 'description': 'Control de lotes con método FIFO'},
        {'name': 'Movimientos', 'description': 'Entradas, salidas y traslados de inventario'},
        {'name': 'Proveedores', 'description': 'Gestión de proveedores'},
        {'name': 'Clientes', 'description': 'Gestión de clientes'},
        {'name': 'Fidelización', 'description': 'Reglas de puntos y canjes'},
        {'name': 'Dashboard', 'description': 'KPIs y métricas del sistema'},
        {'name': 'Reportes', 'description': 'Generación de reportes PDF y Excel'},
        {'name': 'Auditoría', 'description': 'Registro de acciones del sistema'},
        {'name': 'Configuración', 'description': 'Parámetros del sistema'},
        {'name': 'Chatbot', 'description': 'Asistente IA con Groq Llama 3.3'},
    ],
    'COMPONENT_SPLIT_REQUEST': True,
    'SORT_OPERATIONS': False,
}
