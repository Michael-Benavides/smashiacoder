# SmashIACodeR

> Sistema de gestión de inventarios y fidelización con inteligencia artificial integrada.

![Stack](https://img.shields.io/badge/Backend-Django%206%20%2B%20DRF-092E20?style=flat-square&logo=django)
![Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat-square&logo=react)
![Stack](https://img.shields.io/badge/IA-Groq%20Llama%203.3-FF6B35?style=flat-square)
![Stack](https://img.shields.io/badge/BD-PostgreSQL-336791?style=flat-square&logo=postgresql)
![GitLab](https://img.shields.io/badge/GitLab-UPEC-FC6D26?style=flat-square&logo=gitlab)

---

## 📋 Descripción

**SmashIACodeR** es un sistema web completo para la gestión de inventarios y fidelización de clientes, desarrollado como proyecto universitario para la carrera de **Ingeniería en Computación** en la **Universidad Politécnica Estatal del Carchi (UPEC)**.

El sistema implementa una **Arquitectura Hexagonal (Puertos y Adaptadores)** estricta, cumpliendo con los estándares internacionales de calidad **ISO 9241**, **ISO/IEC 25010** e **ISO 9241-171**.

---

## ✨ Características Principales

- 🏗️ **Arquitectura Hexagonal** — domain / application / infrastructure por módulo
- 📦 **Gestión de Inventario** — productos, categorías, ubicaciones y lotes
- 🔄 **Movimientos FIFO** — entradas, salidas y traslados con transacciones atómicas
- 👥 **Terceros** — proveedores y clientes con sistema de fidelización
- 🎁 **Fidelización** — reglas de puntos, niveles y canjes
- 📊 **Dashboard** — KPIs en tiempo real, gráficas y widgets analíticos
- 📄 **Reportes** — PDF y Excel descargables con envío por correo
- 🤖 **Asistente IA** — chatbot con Groq Llama 3.3 y chatbot flotante draggable
- 🏭 **Layout de Almacén** — visualización por zonas y pasillos
- 🔍 **Códigos QR y Barras** — generación e impresión de etiquetas
- 🔐 **Roles** — Administrador y Usuario con rutas protegidas
- 🌙 **Modo Oscuro** — tema claro/oscuro con persistencia
- 🎨 **Color de Acento** — 6 colores configurables en toda la app
- 📱 **Responsive** — adaptado para escritorio y móvil

---

## 🛠️ Stack Tecnológico

### Backend

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Python | 3.12+ | Lenguaje principal |
| Django | 6.0 | Framework web |
| Django REST Framework | 3.17 | API REST |
| SimpleJWT | 5.5 | Autenticación JWT |
| bcrypt | 5.0 | Hash de contraseñas |
| ReportLab | 4.5 | Generación de PDF |
| openpyxl | 3.1 | Generación de Excel |
| Groq | 1.4 | Integración IA |
| PostgreSQL | 15+ | Base de datos producción |
| Gunicorn | 21.2 | Servidor WSGI |
| WhiteNoise | 6.6 | Archivos estáticos |

### Frontend

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| React | 19 | Framework UI |
| Vite | 8 | Build tool |
| Tailwind CSS | 4 | Estilos |
| Radix UI | — | Componentes base |
| TanStack Query | — | Gestión de estado servidor |
| Zustand | — | Estado global |
| Recharts | — | Gráficas |
| React Router | 6 | Navegación |
| Axios | — | Cliente HTTP |
| JsBarcode | — | Códigos de barras |
| QRCode | — | Códigos QR |
| react-markdown | — | Render de markdown |
| date-fns | — | Formateo de fechas |

---

## 📁 Estructura del Proyecto

```
P_Proto_1/
├── warehouse_backend/          # Backend Django
│   ├── apps/
│   │   ├── seguridad/         # Auth, roles, usuarios
│   │   │   ├── domain/        # Entidades y puertos
│   │   │   ├── application/   # Casos de uso
│   │   │   └── infrastructure/# Modelos, vistas, URLs
│   │   ├── inventario/        # Productos, lotes, movimientos
│   │   ├── terceros/          # Proveedores, clientes
│   │   ├── fidelizacion/      # Reglas y canjes
│   │   └── administracion/    # Dashboard, reportes, chatbot
│   ├── config/                # Configuración Django
│   ├── shared/                # Responses, pagination, exceptions
│   ├── manage.py
│   ├── build.sh               # Script de despliegue Render
│   └── requirements.txt
└── warehouse_frontend/        # Frontend React
    ├── src/
    │   ├── api/               # Clientes HTTP por módulo
    │   ├── components/        # UI, layout, shared
    │   ├── pages/             # Páginas por módulo
    │   ├── store/             # Estado global (Zustand)
    │   ├── hooks/             # Hooks personalizados
    │   ├── lib/               # Utils, theme, i18n
    │   └── router/            # Rutas protegidas
    └── package.json
```

---

## 🚀 Instalación y Ejecución Local

### Requisitos previos

- Python 3.12+
- Node.js 20+
- Git

### Backend

```bash
# 1. Clonar el repositorio
git clone https://gitlab.upec.edu.ec/Michael.B.C/proy_pract.git
cd proy_pract

# 2. Crear entorno virtual
cd warehouse_backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 5. Aplicar migraciones
python manage.py migrate

# 6. Inicializar roles y usuarios
python manage.py init_roles

# 7. Ejecutar servidor
python manage.py runserver
```

### Frontend

```bash
# En otra terminal
cd warehouse_frontend

# 1. Instalar dependencias
npm install

# 2. Ejecutar en desarrollo
npm run dev
```

### Credenciales por defecto

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | `admin@smashiacoder.com` | `Admin2024@` |
| Usuario | `usuario@smashiacoder.com` | `User2024@` |

> ⚠️ Cambia estas contraseñas antes de desplegar en producción.

---

## 🌐 Despliegue en Producción (Render)

### Backend

1. Crear cuenta en [render.com](https://render.com)
2. **New → Web Service** → conectar repositorio
3. Configurar:
   - **Build Command:** `./build.sh`
   - **Start Command:** `gunicorn config.wsgi:application`
   - **Variables de entorno:** ver `.env.example`

### Frontend

1. **New → Static Site** → conectar repositorio
2. Configurar:
   - **Root Directory:** `warehouse_frontend`
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
   - **Variable:** `VITE_API_BASE_URL=https://tu-backend.onrender.com`

---

## 📐 Arquitectura

El proyecto implementa **Arquitectura Hexagonal** estricta:

```
┌─────────────────────────────────────┐
│           Infrastructure            │
│  (Django ORM, DRF Views, URLs)      │
│                                     │
│         ┌─────────────┐             │
│         │ Application │             │
│         │ (Use Cases) │             │
│         │             │             │
│         │ ┌─────────┐ │             │
│         │ │ Domain  │ │             │
│         │ │Entities │ │             │
│         │ │ Ports   │ │             │
│         │ └─────────┘ │             │
│         └─────────────┘             │
└─────────────────────────────────────┘
```

---

## 📏 Estándares de Calidad Aplicados

| Norma | Aplicación |
|-------|------------|
| ISO 9241-110 | Respuestas JSON autodescriptivas y tolerancia a errores |
| ISO/IEC 25010 | Validación estricta de datos antes de persistir |
| ISO 9241-171 | Paginación con metadatos semánticos para accesibilidad |

---

## 👨‍💻 Desarrollado por

**Michael Benavides**, **Johan Almeida**, **Jhonatan Zambrano**  
Lenguajes de Programación — UPEC  
Proyecto de Prácticas 2026

---

## 📄 Licencia

Proyecto académico — Universidad Politécnica Estatal del Carchi (UPEC)
