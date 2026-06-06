import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { login } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors }, setError } = useForm()

  if (user) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await login(data.email, data.password)
      if (!res.data.success) {
        toast.error(res.data.error?.message ?? 'Error al iniciar sesión')
        return
      }
      const { access_token, refresh_token, usuario } = res.data.data
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      setAuth(usuario, access_token, refresh_token)
      toast.success(res.data.message ?? 'Bienvenido')
      navigate('/dashboard')
    } catch (err) {
      const apiError = err.response?.data?.error
      const details = apiError?.details ?? err.response?.data?.errors
      if (details?.email) {
        const msg = typeof details.email === 'string' ? details.email : details.email?.[0]
        if (msg) setError('email', { message: msg })
      }
      if (details?.password) {
        const msg = typeof details.password === 'string' ? details.password : details.password?.[0]
        if (msg) setError('password', { message: msg })
      }
      toast.error(apiError?.message ?? err.response?.data?.message ?? 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex">
      <div className="hidden lg:flex w-[420px] bg-zinc-900 flex-col justify-between p-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Package size={16} className="text-zinc-900" />
          </div>
          <span className="text-white font-bold text-base tracking-tight">Warehouse IQ</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white leading-snug mb-3">
            Gestión de inventarios inteligente
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Control total de tu almacén, movimientos FIFO, fidelización de clientes y reportes en tiempo real.
          </p>
        </div>
        <p className="text-zinc-600 text-xs">© 2026 Warehouse IQ · Universidad UPEC</p>
      </div>

      <div className="flex-1 flex items-center justify-center bg-zinc-50 p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-900 mb-1">Bienvenido</h1>
            <p className="text-sm text-zinc-500">Ingresa tus credenciales para continuar</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="admin@warehouse.com"
              error={errors.email?.message}
              {...register('email', { required: 'El correo es requerido' })}
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password', {
                required: 'La contraseña es requerida',
                minLength: { value: 8, message: 'Mínimo 8 caracteres' },
              })}
            />
            <Button type="submit" loading={loading} className="w-full mt-2">
              Iniciar sesión
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
