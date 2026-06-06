import client from './client'

export const getProveedores = (params) => client.get('/terceros/proveedores', { params })
export const createProveedor = (data) => client.post('/terceros/proveedores', data)
export const updateProveedor = (id, data) => client.put(`/terceros/proveedores/${id}`, data)
export const deleteProveedor = (id) => client.delete(`/terceros/proveedores/${id}`)

export const getClientes = (params) => client.get('/terceros/clientes', { params })
export const createCliente = (data) => client.post('/terceros/clientes', data)
export const updateCliente = (id, data) => client.put(`/terceros/clientes/${id}`, data)
export const deleteCliente = (id) => client.delete(`/terceros/clientes/${id}`)
export const actualizarPuntos = (id, puntos_a_sumar) =>
  client.post(`/terceros/clientes/${id}/puntos`, { puntos_a_sumar })
