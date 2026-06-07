import { useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUpRight } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '@/components/layout/PageHeader'
import { SearchableSelect } from '@/components/shared/SearchableSelect'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useT } from '@/hooks/useT'
import { getProductos, registrarSalida } from '@/api/inventario'
import { getClientes } from '@/api/terceros'
import { applyApiErrors, apiErrorMessage } from '@/lib/formUtils'

const EMPTY = {
  producto_id: '',
  cantidad: '',
  cliente_id: '',
  observaciones: '',
}

export default function SalidaPage() {
  const { t } = useT()
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, control, watch, setError, formState: { errors } } = useForm({
    defaultValues: EMPTY,
  })

  const productoId = watch('producto_id')
  const cantidad = watch('cantidad')

  const { data: productos = [] } = useQuery({
    queryKey: ['productos', 'activos'],
    queryFn: async () => {
      const res = await getProductos({ solo_activos: true })
      return res.data.data ?? []
    },
  })

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes', 'activos'],
    queryFn: async () => {
      const res = await getClientes({ solo_activos: true, page_size: 100 })
      return res.data.data ?? []
    },
  })

  const selectedProducto = useMemo(
    () => productos.find((p) => String(p.id) === String(productoId)),
    [productos, productoId]
  )

  const stockDisponible = selectedProducto?.stock_actual ?? 0
  const cantidadNum = Number(cantidad) || 0
  const excedeStock = cantidadNum > stockDisponible

  const productoOptions = useMemo(
    () => productos.map((p) => ({
      value: String(p.id),
      label: `${p.codigo} — ${p.nombre}`,
      raw: p,
    })),
    [productos]
  )

  const clienteOptions = useMemo(
    () => [
      { value: '', label: t('Sin cliente') },
      ...clientes.map((c) => ({ value: String(c.id), label: c.nombre })),
    ],
    [clientes, t]
  )

  const mutation = useMutation({
    mutationFn: (data) => registrarSalida(data),
    onSuccess: (res) => {
      const movs = res.data.data
      const stockNuevo = Array.isArray(movs) ? movs[movs.length - 1]?.stock_nuevo : movs?.stock_nuevo
      toast.success(
        `${res.data.message ?? t('Salida registrada')} — ${t('Stock nuevo')}: ${stockNuevo ?? '—'}`
      )
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['movimientos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      reset(EMPTY)
    },
    onError: (err) => {
      applyApiErrors(err, setError)
      toast.error(apiErrorMessage(err, t('Error al registrar salida')))
    },
  })

  const onSubmit = (data) => {
    if (Number(data.cantidad) > stockDisponible) return
    mutation.mutate({
      producto_id: Number(data.producto_id),
      cantidad: Number(data.cantidad),
      cliente_id: data.cliente_id ? Number(data.cliente_id) : null,
      observaciones: data.observaciones?.trim() ?? '',
    })
  }

  return (
    <div>
      <PageHeader
        title={t('Salida de inventario')}
        description={t('Registra egreso de mercancía aplicando FIFO en los lotes')}
      />

      <Card className="max-w-xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="producto_id"
              control={control}
              rules={{ required: t('Selecciona un producto') }}
              render={({ field }) => (
                <SearchableSelect
                  label={t('Producto')}
                  options={productoOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('Buscar producto...')}
                  error={errors.producto_id?.message}
                  renderOption={(opt) => (
                    <span>
                      {opt.label}
                      {opt.raw && (
                        <Badge variant={opt.raw.stock_actual <= opt.raw.stock_minimo ? 'danger' : 'success'} className="ml-2">
                          {t('Stock')}: {opt.raw.stock_actual}
                        </Badge>
                      )}
                    </span>
                  )}
                />
              )}
            />

            {selectedProducto && (
              <p className="text-sm text-zinc-600">
                {t('Stock disponible')}:{' '}
                <span className="font-semibold text-zinc-900">{stockDisponible}</span>{' '}
                {selectedProducto.unidad_medida}
              </p>
            )}

            <Input
              label={t('Cantidad')}
              type="number"
              min={1}
              max={stockDisponible || undefined}
              placeholder="1"
              error={errors.cantidad?.message || (excedeStock ? `${t('No puede superar el stock disponible')} (${stockDisponible})` : undefined)}
              {...register('cantidad', {
                required: t('La cantidad es requerida'),
                min: { value: 1, message: t('Mínimo 1 unidad') },
                validate: (v) =>
                  !selectedProducto || Number(v) <= stockDisponible
                    || `${t('Máximo')} ${stockDisponible} ${t('unidades disponibles')}`,
              })}
            />

            <Controller
              name="cliente_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  label={t('Cliente (opcional)')}
                  options={clienteOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('Sin cliente')}
                  error={errors.cliente_id?.message}
                />
              )}
            />

            <div>
              <label className="text-sm font-medium text-zinc-700">{t('Observaciones')}</label>
              <textarea
                className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                rows={3}
                placeholder={t('Notas adicionales...')}
                {...register('observaciones')}
              />
            </div>

            <Button
              type="submit"
              loading={mutation.isPending}
              disabled={excedeStock || !productoId}
              className="w-full"
            >
              <ArrowUpRight size={16} />
              {t('Registrar salida')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
