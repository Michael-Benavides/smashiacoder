import { useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDownLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '@/components/layout/PageHeader'
import { SearchableSelect } from '@/components/shared/SearchableSelect'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { getProductos, registrarEntrada } from '@/api/inventario'
import { getProveedores } from '@/api/terceros'
import { applyApiErrors, apiErrorMessage } from '@/lib/formUtils'

const EMPTY = {
  producto_id: '',
  numero_lote: '',
  cantidad: '',
  proveedor_id: '',
  observaciones: '',
  fecha_vencimiento: '',
}

export default function EntradaPage() {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, control, setError, formState: { errors } } = useForm({
    defaultValues: EMPTY,
  })

  const { data: productos = [] } = useQuery({
    queryKey: ['productos', 'activos'],
    queryFn: async () => {
      const res = await getProductos({ solo_activos: true })
      return res.data.data ?? []
    },
  })

  const { data: proveedores = [] } = useQuery({
    queryKey: ['proveedores', 'activos'],
    queryFn: async () => {
      const res = await getProveedores({ solo_activos: true, page_size: 100 })
      return res.data.data ?? []
    },
  })

  const productoOptions = useMemo(
    () => productos.map((p) => ({
      value: String(p.id),
      label: `${p.codigo} — ${p.nombre} (stock: ${p.stock_actual})`,
      raw: p,
    })),
    [productos]
  )

  const proveedorOptions = useMemo(
    () => [
      { value: '', label: 'Sin proveedor' },
      ...proveedores.map((p) => ({ value: String(p.id), label: p.nombre })),
    ],
    [proveedores]
  )

  const mutation = useMutation({
    mutationFn: (data) => registrarEntrada(data),
    onSuccess: (res) => {
      const mov = res.data.data
      toast.success(
        `${res.data.message ?? 'Entrada registrada'} — Stock nuevo: ${mov?.stock_nuevo ?? '—'}`
      )
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['movimientos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      reset(EMPTY)
    },
    onError: (err) => {
      applyApiErrors(err, setError)
      toast.error(apiErrorMessage(err, 'Error al registrar entrada'))
    },
  })

  const onSubmit = (data) => {
    mutation.mutate({
      producto_id: Number(data.producto_id),
      numero_lote: data.numero_lote.trim(),
      cantidad: Number(data.cantidad),
      proveedor_id: data.proveedor_id ? Number(data.proveedor_id) : null,
      observaciones: data.observaciones?.trim() ?? '',
      fecha_vencimiento: data.fecha_vencimiento || null,
    })
  }

  return (
    <div>
      <PageHeader
        title="Entrada de inventario"
        description="Registra ingreso de mercancía y crea un nuevo lote FIFO"
      />

      <Card className="max-w-xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="producto_id"
              control={control}
              rules={{ required: 'Selecciona un producto' }}
              render={({ field }) => (
                <SearchableSelect
                  label="Producto"
                  options={productoOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Buscar producto..."
                  searchPlaceholder="Código o nombre..."
                  error={errors.producto_id?.message}
                />
              )}
            />

            <Input
              label="Número de lote"
              placeholder="LOTE-2026-001"
              error={errors.numero_lote?.message}
              {...register('numero_lote', { required: 'El número de lote es requerido' })}
            />

            <Input
              label="Cantidad"
              type="number"
              min={1}
              placeholder="1"
              error={errors.cantidad?.message}
              {...register('cantidad', {
                required: 'La cantidad es requerida',
                min: { value: 1, message: 'Mínimo 1 unidad' },
              })}
            />

            <Controller
              name="proveedor_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  label="Proveedor (opcional)"
                  options={proveedorOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Sin proveedor"
                  error={errors.proveedor_id?.message}
                />
              )}
            />

            <Input
              label="Fecha de vencimiento (opcional)"
              type="date"
              error={errors.fecha_vencimiento?.message}
              {...register('fecha_vencimiento')}
            />

            <div>
              <label className="text-sm font-medium text-zinc-700">Observaciones</label>
              <textarea
                className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                rows={3}
                placeholder="Notas adicionales..."
                {...register('observaciones')}
              />
              {errors.observaciones?.message && (
                <p className="mt-1 text-xs text-red-600">{errors.observaciones.message}</p>
              )}
            </div>

            <Button type="submit" loading={mutation.isPending} className="w-full">
              <ArrowDownLeft size={16} />
              Registrar entrada
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
