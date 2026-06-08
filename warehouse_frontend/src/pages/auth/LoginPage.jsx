import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { login } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { useT } from '@/hooks/useT'
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
  const { t } = useT()
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
    <div className="flex min-h-screen flex-col lg:flex-row" style={{ backgroundColor: '#F5F5F5' }}>
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

      <div className="flex min-h-screen flex-1 items-center justify-center overflow-y-auto p-6 lg:min-h-0 lg:p-12">
        <div className="mx-auto w-full max-w-sm">
          {/* Banner de branding solo en móvil */}
          <div
            className="relative mb-6 overflow-hidden rounded-2xl p-5 text-white lg:hidden"
            style={{
              background: 'linear-gradient(-45deg, #09090B, #18181B, #1C1A14)',
            }}
          >
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-amber-400"
                style={{
                  width: `${3 + i}px`,
                  height: `${3 + i}px`,
                  left: `${20 + i * 20}%`,
                  top: `${20 + (i % 2) * 40}%`,
                  opacity: 0.3,
                  animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}

            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="mb-1 text-lg font-black">
                  Smash<span className="text-amber-400">IA</span>CodeR
                </h2>
                <p className="text-xs leading-relaxed text-zinc-400">
                  Gestión inteligente de inventarios
                </p>
              </div>
              <div className="flex flex-col gap-1.5 text-right">
                <span className="flex items-center justify-end gap-1 text-xs text-zinc-400">
                  <span>⚡</span> FIFO automatizado
                </span>
                <span className="flex items-center justify-end gap-1 text-xs text-zinc-400">
                  <span>📊</span> Dashboard en tiempo real
                </span>
                <span className="flex items-center justify-end gap-1 text-xs text-zinc-400">
                  <span>🤖</span> Asistente IA
                </span>
              </div>
            </div>
          </div>

          {/* Card principal del formulario */}
          <div
            className="mx-auto flex w-full max-w-sm flex-col rounded-3xl border border-zinc-700/50 bg-zinc-900/95 shadow-2xl backdrop-blur-sm"
            style={{ padding: '32px', gap: '16px' }}
          >
            <div className="mb-8 flex flex-col items-center">
              <div
                className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 shadow-lg shadow-amber-500/30"
                style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
              >
                <Zap size={22} className="text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Smash<span className="text-amber-400">IA</span>CodeR
              </h1>
              <p className="mt-1 text-center text-sm text-zinc-400">
                {t('Iniciar sesión')}
              </p>
              <p className="mt-0.5 text-center text-xs text-zinc-500">
                {t('Ingresa tus credenciales para continuar')}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-4">
                <label className="text-sm font-medium text-zinc-300">
                  {t('Correo electrónico')}
                </label>
                <input
                  type="email"
                  placeholder="admin@smashiacoder.com"
                  className={cn(
                    'h-12 w-full rounded-xl px-5 text-sm',
                    'border border-zinc-700 bg-zinc-800/80',
                    'text-white placeholder:text-zinc-600',
                    'transition-all duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20',
                    errors.email && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                  )}
                  {...register('email', { required: t('El correo es requerido') })}
                />
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-zinc-300">
                  {t('Contraseña')}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={cn(
                    'h-12 w-full rounded-xl px-5 text-sm',
                    'border border-zinc-700 bg-zinc-800/80',
                    'text-white placeholder:text-zinc-600',
                    'transition-all duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20',
                    errors.password && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                  )}
                  {...register('password', {
                    required: t('La contraseña es requerida'),
                    minLength: { value: 8, message: t('Mínimo 8 caracteres') },
                  })}
                />
                {errors.password && (
                  <p className="text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold',
                  'bg-amber-500 text-zinc-900 shadow-lg shadow-amber-500/25',
                  'transition-all duration-150 hover:bg-amber-400 active:scale-95',
                  'disabled:cursor-not-allowed disabled:opacity-70',
                )}
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-900/30 border-t-zinc-900" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  t('Iniciar sesión')
                )}
              </button>
            </form>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setValue('email', 'admin@smashiacoder.com')
                  setValue('password', 'Admin2024@')
                }}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/50 text-xs font-semibold text-zinc-300 transition-all duration-150 hover:bg-zinc-700/80 hover:text-white active:scale-95"
              >
                <span className="text-amber-400">⚡</span>
                Demo Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue('email', 'usuario@smashiacoder.com')
                  setValue('password', 'User2024@')
                }}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/50 text-xs font-semibold text-zinc-300 transition-all duration-150 hover:bg-zinc-700/80 hover:text-white active:scale-95"
              >
                <span>👤</span>
                Demo Usuario
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-zinc-600">
              © 2026 SmashIACodeR · UPEC
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
