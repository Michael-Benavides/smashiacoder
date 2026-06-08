import client from './client'

export const getReglas = (params) => client.get('/fidelizacion/', { params })
export const getCanjes = (params) => client.get('/fidelizacion/canjes', { params })
export const createRegla = (data) => client.post('/fidelizacion/', data)
export const updateRegla = (id, data) => client.put(`/fidelizacion/${id}`, data)
export const deleteRegla = (id) => client.delete(`/fidelizacion/${id}`)
export const canjearPuntos = (data) => client.post('/fidelizacion/canjear', data)
