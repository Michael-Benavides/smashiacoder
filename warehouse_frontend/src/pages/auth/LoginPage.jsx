import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { login } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/lib/i18n'

const BRANDING_ITEMS = [
  { icon: '⚡', text: 'Control FIFO automatizado' },
  { icon: '📊', text: 'Dashboard en tiempo real' },
  { icon: '🤖', text: 'Asistente IA integrado' },
]

const IA_SHIMMER_STYLE = {
  background: 'linear-gradient(90deg, #F59E0B, #FCD34D, #F59E0B)',
  backgroundSize: '200% auto',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  animation: 'shimmer 3s linear infinite',
}

export default function LoginPage() {
  const t = useI18n((s) => s.t)
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors }, setError, setValue } = useForm()

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  if (user) return null

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await login(data.email, data.password)
      if (!res.data?.success || !res.data?.data) {
        const apiError = res.data?.error
        const errores = apiError?.details ?? res.data?.errors
        const mensaje = apiError?.message ?? res.data?.message ?? 'Credenciales inválidas'
        if (errores?.email) {
          const msg = typeof errores.email === 'string' ? errores.email : errores.email?.[0]
          if (msg) setError('email', { message: msg })
        }
        if (errores?.password) {
          const msg = typeof errores.password === 'string' ? errores.password : errores.password?.[0]
          if (msg) setError('password', { message: msg })
        }
        toast.error(mensaje)
        return
      }
      const { access_token, refresh_token, usuario } = res.data.data
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      setAuth(usuario, access_token, refresh_token)
      toast.success(res.data.message ?? 'Bienvenido')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const apiError = err.response?.data?.error
      const errores = apiError?.details ?? err.response?.data?.errors
      const mensaje = apiError?.message ?? err.response?.data?.message ?? 'Credenciales inválidas'
      if (errores?.email) {
        const msg = typeof errores.email === 'string' ? errores.email : errores.email?.[0]
        if (msg) setError('email', { message: msg })
      }
      if (errores?.password) {
        const msg = typeof errores.password === 'string' ? errores.password : errores.password?.[0]
        if (msg) setError('password', { message: msg })
      }
      toast.error(mensaje)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen">
      <div
        className="relative hidden w-[420px] shrink-0 overflow-hidden lg:flex"
        style={{
          background: 'linear-gradient(-45deg, #09090B, #18181B, #1C1A14, #111110)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 8s ease infinite',
        }}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className="h-64 w-64 rounded-full border border-amber-500/10 animate-ping"
            style={{ animationDuration: '3s' }}
          />
          <div
            className="absolute inset-4 rounded-full border border-amber-500/15 animate-ping"
            style={{ animationDuration: '3s', animationDelay: '0.5s' }}
          />
          <div
            className="absolute inset-8 rounded-full border border-amber-500/20 animate-ping"
            style={{ animationDuration: '3s', animationDelay: '1s' }}
          />
        </div>

        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-amber-400"
            style={{
              width: `${4 + (i % 3) * 3}px`,
              height: `${4 + (i % 3) * 3}px`,
              left: `${10 + i * 11}%`,
              top: `${15 + (i % 4) * 20}%`,
              opacity: 0.2 + (i % 3) * 0.1,
              animation: `float ${4 + i * 0.6}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}

        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #F59E0B 0px, #F59E0B 1px, transparent 0px, transparent 50%)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500"
              style={{ animation: 'pulse-glow 2s infinite' }}
            >
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-lg font-black tracking-tight text-white">
              Smash<span style={IA_SHIMMER_STYLE}>IA</span>CodeR
            </span>
          </div>

          <div>
            <h2 className="mb-4 text-3xl font-black leading-tight text-white">
              Gestión inteligente de tu inventario
            </h2>
            <div className="space-y-3">
              {BRANDING_ITEMS.map((item, i) => (
                <div
                  key={item.text}
                  className="flex items-center gap-3"
                  style={{
                    opacity: 0,
                    animation: 'fadeInUp 0.5s ease forwards',
                    animationDelay: `${0.3 + i * 0.15}s`,
                  }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm text-zinc-400">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-zinc-600">© 2026 SmashIACodeR · UPEC</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950 lg:p-8">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-100 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:border-zinc-800 dark:bg-zinc-900 lg:max-w-md lg:p-10">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500"
              style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
            >
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-black text-zinc-900 dark:text-zinc-100">
              Smash<span className="text-amber-500">IA</span>CodeR
            </span>
          </div>
          <div className="mb-6">
            <h1 className="mb-1 text-2xl font-bold text-zinc-900">{t('form.welcome')}</h1>
            <p className="text-sm text-zinc-500">{t('form.loginSubtitle')}</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Input
              label={t('form.email')}
              type="email"
              placeholder="admin@warehouse.com"
              error={errors.email?.message}
              {...register('email', { required: 'El correo es requerido' })}
            />
            <Input
              label={t('form.password')}
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password', {
                required: 'La contraseña es requerida',
                minLength: { value: 8, message: 'Mínimo 8 caracteres' },
              })}
            />
            <Button type="submit" variant="gold" loading={loading} className="mt-2 w-full">
              {t('form.login')}
            </Button>
          </form>

          <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="mb-2 text-xs font-semibold text-zinc-500">
              Credenciales de prueba:
            </p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  setValue('email', 'admin@smashiacoder.com')
                  setValue('password', 'Admin2024@')
                }}
                className="w-full rounded-lg p-2 text-left text-xs transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                <span className="font-semibold text-amber-500">⚡ Admin</span>
                <span className="ml-2 text-zinc-400">admin@smashiacoder.com</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue('email', 'usuario@smashiacoder.com')
                  setValue('password', 'User2024@')
                }}
                className="w-full rounded-lg p-2 text-left text-xs transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                <span className="font-semibold text-zinc-500">👤 Usuario</span>
                <span className="ml-2 text-zinc-400">usuario@smashiacoder.com</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
