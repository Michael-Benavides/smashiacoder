import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        set({ user, accessToken, refreshToken })
      },
      updateUser: (user) => set({ user }),
      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, refreshToken: null })
      },
      isAdmin: () => {
        const state = get()
        return state.user?.rol_id === 1 || state.user?.rol_nombre === 'Administrador'
      },
      isUser: () => {
        const state = get()
        return state.user !== null
      },
    }),
    { name: 'warehouse-auth' }
  )
)
