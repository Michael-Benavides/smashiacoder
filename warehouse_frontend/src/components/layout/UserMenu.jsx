import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  User, Settings, Moon, Sun, LogOut, Bell,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import { useT } from '@/hooks/useT'
import { updateUsuario, cambiarPassword } from '@/api/auth'
import { getAlertas } from '@/api/administracion'
import { applyDarkMode } from '@/lib/theme'
import { useDarkMode } from '@/hooks/useDarkMode'
import { apiErrorMessage } from '@/lib/formUtils'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import ConfiguracionPanel from '@/components/administracion/ConfiguracionPanel'
import { cn } from '@/lib/utils'

export default function UserMenu() {
  const { t } = useT()
  const { user, logout, updateUser } = useAuthStore()
  const { isAdmin } = usePermissions()
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const isDark = useDarkMode()

  const [menuOpen, setMenuOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [saving, setSaving] = useState(false)

  const profileForm = useForm({
    defaultValues: {
      nombre: user?.nombre ?? '',
      password_actual: '',
      nueva_password: '',
      confirmar_password: '',
    },
  })

  const { data: alertas = [] } = useQuery({
    queryKey: ['alertas-user-menu'],
    queryFn: async () => {
      const res = await getAlertas()
      return res.data.data ?? []
    },
    refetchInterval: 60000,
  })

  const alertCount = Array.isArray(alertas) ? alertas.length : 0

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (showProfile && user) {
      profileForm.reset({
        nombre: user.nombre ?? '',
        password_actual: '',
        nueva_password: '',
        confirmar_password: '',
      })
    }
  }, [showProfile, user, profileForm])

  function handleLogout() {
    setMenuOpen(false)
    logout()
    navigate('/login')
  }

  function handleThemeToggle() {
    const next = isDark ? 'light' : 'dark'
    applyDarkMode(next)
    toast.success(next === 'dark' ? t('Modo oscuro activado') : t('Modo claro activado'))
  }

  async function onSaveProfile(data) {
    if (!user?.id) return
    setSaving(true)
    try {
      if (data.nombre?.trim() && data.nombre !== user.nombre) {
        const res = await updateUsuario(user.id, { nombre: data.nombre.trim() })
        updateUser(res.data.data)
        toast.success(t('Perfil actualizado'))
      }
      if (data.nueva_password) {
        await cambiarPassword(user.id, {
          password_actual: data.password_actual,
          nueva_password: data.nueva_password,
          confirmar_password: data.confirmar_password,
        })
        toast.success(t('Contraseña actualizada'))
        profileForm.setValue('password_actual', '')
        profileForm.setValue('nueva_password', '')
        profileForm.setValue('confirmar_password', '')
      }
      if (!data.nueva_password && data.nombre?.trim() === user.nombre) {
        toast.success(t('Sin cambios'))
      }
      setShowProfile(false)
    } catch (err) {
      toast.error(apiErrorMessage(err, t('Error al guardar')))
    } finally {
      setSaving(false)
    }
  }

  const menuOptions = useMemo(() => [
    {
      icon: User,
      label: t('Mi Perfil'),
      description: t('Editar nombre y contraseña'),
      action: () => { setShowProfile(true); setMenuOpen(false) },
      color: 'text-zinc-700 dark:text-zinc-300',
    },
    {
      icon: Settings,
      label: t('Configuración'),
      description: t('Apariencia, idioma y sistema'),
      action: () => { setShowSettings(true); setMenuOpen(false) },
      color: 'text-zinc-700 dark:text-zinc-300',
    },
    {
      icon: isDark ? Sun : Moon,
      label: isDark ? t('Modo Claro') : t('Modo Oscuro'),
      description: t('Cambiar tema de la interfaz'),
      action: () => { handleThemeToggle(); setMenuOpen(false) },
      color: 'text-zinc-700 dark:text-zinc-300',
    },
    {
      icon: Bell,
      label: t('Notificaciones'),
      description: `${alertCount} ${t('alertas pendientes')}`,
      action: () => { navigate('/administracion/auditoria'); setMenuOpen(false) },
      color: alertCount > 0 ? 'text-amber-500' : 'text-zinc-700 dark:text-zinc-300',
    },
    {
      icon: LogOut,
      label: t('Cerrar Sesión'),
      description: t('Salir de la cuenta'),
      action: handleLogout,
      color: 'text-red-500',
      divider: true,
    },
  ], [alertCount, isDark, t])

  return (
    <>
      <div ref={menuRef} className="relative mx-2 mb-3 rounded-xl bg-zinc-800/50 p-5">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex w-full items-center gap-3 text-left transition-opacity hover:opacity-90"
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-zinc-100"
            style={{ boxShadow: '0 0 0 2px color-mix(in srgb, var(--accent-color) 50%, transparent)' }}
          >
            {user?.nombre?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-100">
              {user?.nombre ?? t('Usuario')}
            </p>
            <p className="truncate text-xs text-zinc-500">
              {user?.email ?? t('Usuario')}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-5 py-5 text-xs font-semibold',
                  !isAdmin && 'bg-zinc-700 text-zinc-400',
                )}
                style={isAdmin
                  ? { backgroundColor: 'var(--accent-light)', color: 'var(--accent-color)' }
                  : undefined}
              >
                {isAdmin ? `⚡ ${t('Admin')}` : `👤 ${t('Usuario')}`}
              </span>
            </div>
          </div>
        </button>

        {menuOpen && (
          <div className="absolute bottom-full left-0 right-0 z-50 mx-2 mb-2 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl animate-fade-in-up dark:border-zinc-700 dark:bg-zinc-800">
            <div className="border-b border-zinc-100 p-5 dark:border-zinc-700">
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {user?.nombre}
              </p>
              <p className="text-xs text-zinc-400">{user?.email}</p>
            </div>

            {menuOptions.map((opt, i) => (
              <div key={i}>
                {opt.divider && (
                  <div className="my-1 border-t border-zinc-100 dark:border-zinc-700" />
                )}
                <button
                  type="button"
                  onClick={opt.action}
                  className="flex w-full items-center gap-3 px-5 py-5 transition-colors duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                >
                  <opt.icon size={15} className={opt.color} />
                  <div className="flex-1 text-left">
                    <p className={cn('text-xs font-semibold', opt.color)}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-zinc-400">{opt.description}</p>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showProfile} onClose={() => setShowProfile(false)} title={t('Mi Perfil')}>
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
          <Input
            label={t('Nombre')}
            error={profileForm.formState.errors.nombre?.message}
            {...profileForm.register('nombre', { required: t('El nombre es requerido') })}
          />
          <Input label={t('Email')} value={user?.email ?? ''} readOnly disabled />
          <div className="border-t border-zinc-100 pt-5 dark:border-zinc-800">
            <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('Cambiar contraseña')}</p>
            <div className="space-y-3">
              <Input
                label={t('Contraseña actual')}
                type="password"
                {...profileForm.register('password_actual')}
              />
              <Input
                label={t('Nueva contraseña')}
                type="password"
                {...profileForm.register('nueva_password', {
                  minLength: { value: 8, message: t('Mínimo 8 caracteres') },
                })}
              />
              <Input
                label={t('Confirmar contraseña')}
                type="password"
                error={profileForm.formState.errors.confirmar_password?.message}
                {...profileForm.register('confirmar_password', {
                  validate: (v, form) =>
                    !form.nueva_password || v === form.nueva_password || t('No coinciden'),
                })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-5">
            <Button type="button" variant="outline" onClick={() => setShowProfile(false)}>
              {t('Cancelar')}
            </Button>
            <Button type="submit" variant="gold" loading={saving}>
              {t('Guardar cambios')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        title={t('Configuración')}
        size="lg"
      >
        <div className="max-h-[70vh] overflow-y-auto">
          <ConfiguracionPanel compact />
        </div>
      </Modal>
    </>
  )
}
