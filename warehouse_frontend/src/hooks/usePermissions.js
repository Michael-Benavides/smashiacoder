import { useAuthStore } from '@/store/authStore'

export function usePermissions() {
  const user = useAuthStore((s) => s.user)

  const isAdmin = user?.rol_nombre === 'Administrador' || user?.rol_id === 1

  const canAccess = (requiredRole) => {
    if (requiredRole === 'admin') return isAdmin
    return !!user
  }

  return { isAdmin, canAccess, user }
}
