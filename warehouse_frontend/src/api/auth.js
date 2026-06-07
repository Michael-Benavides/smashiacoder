import client from './client'

export const login = (email, password) =>
  client.post('/seguridad/login', { email, password })

export const getMe = () => client.get('/seguridad/me')

export const logout = (refreshToken) =>
  client.post('/seguridad/logout', { refresh_token: refreshToken })

export const updateUsuario = (id, data) =>
  client.put(`/seguridad/usuarios/${id}`, data)

export const cambiarPassword = (id, data) =>
  client.post(`/seguridad/usuarios/${id}/cambiar-password`, data)
