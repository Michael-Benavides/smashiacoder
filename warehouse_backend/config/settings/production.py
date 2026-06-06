# config/settings/production.py
import environ

from .base import *  # noqa: F401,F403

env = environ.Env()

DEBUG = False

# ── HTTPS / TLS ────────────────────────────────────────────────────────
# Render expone HTTPS al cliente y termina TLS en su edge; el header
# X-Forwarded-Proto le indica a Django que la petición original fue HTTPS.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True

# HSTS — un año, incluyendo subdominios y elegible para preload.
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# ── Cookies seguras ────────────────────────────────────────────────────
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# ── Endurecimiento adicional ───────────────────────────────────────────
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"
