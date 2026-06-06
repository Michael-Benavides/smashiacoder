# config/settings/local.py
import environ
from .base import *

env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env')

DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']
CORS_ALLOWED_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000']
