import client from './client'

export const login = (email, password) =>
  client.post('/seguridad/login', { email, password })

export const getMe = () => client.get('/seguridad/me')

export const logout = (refreshToken) =>
  client.post('/seguridad/logout', { refresh_token: refreshToken })
