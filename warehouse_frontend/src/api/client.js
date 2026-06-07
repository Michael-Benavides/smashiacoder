import axios from 'axios'

// Desarrollo: siempre /api (proxy Vite). Producción: VITE_API_BASE_URL en el build (Render).
const apiBase =
  import.meta.env.PROD && import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api`
    : '/api'

const client = axios.create({
  baseURL: apiBase,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        const { data } = await axios.post(`${apiBase}/auth/token/refresh/`, { refresh })
        const access = data.access
        localStorage.setItem('access_token', access)
        original.headers.Authorization = `Bearer ${access}`
        return client(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default client
