import client from './client'

export const getDashboard = () => client.get('/administracion/dashboard')

export const getDashboardGraficas = () => client.get('/administracion/dashboard/graficas')

export const getAlertas = () => client.get('/administracion/dashboard/alertas')

export const atenderAlerta = (id) => client.put(`/administracion/dashboard/alertas/${id}/atender`)

export const getAuditoria = (params) => client.get('/administracion/auditoria', { params })

export const getConfiguracion = () => client.get('/administracion/configuracion')

export const updateConfiguracion = (clave, valor) =>
  client.put(`/administracion/configuracion/${clave}`, { valor })

export const createConfiguracion = (data) =>
  client.post('/administracion/configuracion', data)

export const enviarReporte = (tipo, formato, email, params = {}) =>
  client.post(`/administracion/reportes/${tipo}/enviar`, { email, formato, ...params })

export const enviarMensajeChatbot = (mensaje, historial = []) =>
  client.post('/administracion/chatbot/mensaje', { mensaje, historial })

export const downloadReporte = (tipo, formato, params = {}) =>
  client.get(`/administracion/reportes/${tipo}/${formato}`, { responseType: 'blob', params })

export const REPORTE_TIPOS = [
  'general',
  'inventario',
  'movimientos',
  'clientes',
  'proveedores',
]
