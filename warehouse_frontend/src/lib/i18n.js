import { create } from 'zustand'

const LANG_KEY = 'wi_language'

const translations = {
  es: {
    'nav.dashboard': 'Dashboard',
    'nav.inventory': 'Inventario',
    'nav.products': 'Productos',
    'nav.categories': 'Categorías',
    'nav.locations': 'Ubicaciones',
    'nav.operations': 'Operaciones',
    'nav.movements': 'Movimientos',
    'nav.entry': 'Entrada',
    'nav.exit': 'Salida',
    'nav.transfer': 'Traslado',
    'nav.thirdParties': 'Terceros',
    'nav.suppliers': 'Proveedores',
    'nav.clients': 'Clientes',
    'nav.loyalty': 'Fidelización',
    'nav.rules': 'Reglas',
    'nav.redemptions': 'Canjes',
    'nav.warehouse': 'Almacén',
    'nav.layout': 'Layout',
    'nav.codes': 'Códigos / QR',
    'nav.reports': 'Reportes',
    'nav.admin': 'Administración',
    'nav.audit': 'Auditoría',
    'nav.settings': 'Configuración',
    'nav.assistant': 'Asistente SmashIACodeR',
    'greeting.morning': 'Buenos días',
    'greeting.afternoon': 'Buenas tardes',
    'greeting.evening': 'Buenas noches',
    'dash.kpi.products': 'Productos activos',
    'dash.kpi.clients': 'Clientes activos',
    'dash.kpi.alerts': 'Alertas pendientes',
    'dash.kpi.suppliers': 'Proveedores activos',
    'dash.quickActions': 'Acciones Rápidas',
    'dash.quick.entry': 'Registrar Entrada',
    'dash.quick.exit': 'Registrar Salida',
    'dash.quick.newProduct': 'Nuevo Producto',
    'dash.quick.newClient': 'Nuevo Cliente',
    'dash.chart.title': 'Movimientos por día',
    'dash.inventory.summary': 'Resumen de Inventario',
    'dash.clients.recent': 'Últimos Clientes',
    'dash.stock.alerts': 'Alertas de stock',
    'dash.activity': 'Actividad Reciente',
    'dash.col.product': 'Producto',
    'dash.col.stock': 'Stock Actual',
    'dash.col.min': 'Stock Mínimo',
    'dash.col.status': 'Estado',
    'form.email': 'Correo electrónico',
    'form.password': 'Contraseña',
    'form.name': 'Nombre',
    'form.login': 'Iniciar sesión',
    'form.welcome': 'Bienvenido',
    'form.loginSubtitle': 'Ingresa tus credenciales para continuar',
    'form.search': 'Buscar...',
    'form.save': 'Guardar cambios',
    'form.cancel': 'Cancelar',
    'chat.title': 'Asistente SmashIACodeR',
    'chat.placeholder': 'Escribe tu mensaje...',
    'chat.pdfMessage': 'El listado es muy extenso. Te lo preparo como PDF para descarga.',
    'chat.downloadPdf': 'Descargar PDF',
    'chat.online': 'En línea',
    'chat.newChat': 'Nueva conversación',
    'chat.help': '¿En qué puedo ayudarte?',
  },
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.inventory': 'Inventory',
    'nav.products': 'Products',
    'nav.categories': 'Categories',
    'nav.locations': 'Locations',
    'nav.operations': 'Operations',
    'nav.movements': 'Movements',
    'nav.entry': 'Inbound',
    'nav.exit': 'Outbound',
    'nav.transfer': 'Transfer',
    'nav.thirdParties': 'Third Parties',
    'nav.suppliers': 'Suppliers',
    'nav.clients': 'Clients',
    'nav.loyalty': 'Loyalty',
    'nav.rules': 'Rules',
    'nav.redemptions': 'Redemptions',
    'nav.warehouse': 'Warehouse',
    'nav.layout': 'Layout',
    'nav.codes': 'Codes / QR',
    'nav.reports': 'Reports',
    'nav.admin': 'Administration',
    'nav.audit': 'Audit',
    'nav.settings': 'Settings',
    'nav.assistant': 'SmashIACodeR Assistant',
    'greeting.morning': 'Good morning',
    'greeting.afternoon': 'Good afternoon',
    'greeting.evening': 'Good evening',
    'dash.kpi.products': 'Active products',
    'dash.kpi.clients': 'Active clients',
    'dash.kpi.alerts': 'Pending alerts',
    'dash.kpi.suppliers': 'Active suppliers',
    'dash.quickActions': 'Quick Actions',
    'dash.quick.entry': 'Register Inbound',
    'dash.quick.exit': 'Register Outbound',
    'dash.quick.newProduct': 'New Product',
    'dash.quick.newClient': 'New Client',
    'dash.chart.title': 'Movements per day',
    'dash.inventory.summary': 'Inventory Summary',
    'dash.clients.recent': 'Recent Clients',
    'dash.stock.alerts': 'Stock alerts',
    'dash.activity': 'Recent Activity',
    'dash.col.product': 'Product',
    'dash.col.stock': 'Current Stock',
    'dash.col.min': 'Min Stock',
    'dash.col.status': 'Status',
    'form.email': 'Email address',
    'form.password': 'Password',
    'form.name': 'Name',
    'form.login': 'Sign in',
    'form.welcome': 'Welcome',
    'form.loginSubtitle': 'Enter your credentials to continue',
    'form.search': 'Search...',
    'form.save': 'Save changes',
    'form.cancel': 'Cancel',
    'chat.title': 'SmashIACodeR Assistant',
    'chat.placeholder': 'Type your message...',
    'chat.pdfMessage': 'The list is too large. I prepared it as a PDF for download.',
    'chat.downloadPdf': 'Download PDF',
    'chat.online': 'Online',
    'chat.newChat': 'New conversation',
    'chat.help': 'How can I help you?',
  },
}

export const useI18n = create((set, get) => ({
  language: localStorage.getItem(LANG_KEY) || 'es',
  setLanguage: (lang) => {
    localStorage.setItem(LANG_KEY, lang)
    set({ language: lang })
  },
  t: (key) => {
    const lang = get().language
    return translations[lang]?.[key] ?? translations.es[key] ?? key
  },
}))

export function initLanguage() {
  const lang = localStorage.getItem(LANG_KEY) || 'es'
  useI18n.setState({ language: lang })
  return lang
}

export function setLanguage(lang) {
  useI18n.getState().setLanguage(lang)
}

export function getLanguage() {
  return useI18n.getState().language
}
