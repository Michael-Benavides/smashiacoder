import { useEffect, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftRight } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '@/components/layout/PageHeader'
import { SearchableSelect } from '@/components/shared/SearchableSelect'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useT } from '@/hooks/useT'
import { getProductos, getUbicaciones, registrarTraslado } from '@/api/inventario'
import { applyApiErrors, apiErrorMessage } from '@/lib/formUtils'

const EMPTY = {
  producto_id: '',
  ubicacion_origen_id: '',
  ubicacion_destino_id: '',
  cantidad: '',
  observaciones: '',
}

export default function TrasladoPage() {
  const { t } = useT()
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, control, watch, setValue, setError, formState: { errors } } = useForm({
    defaultValues: EMPTY,
  })

  const productoId = watch('producto_id')
  const origenId = watch('ubicacion_origen_id')
  const destinoId = watch('ubicacion_destino_id')
  const mismoOrigenDestino = origenId && destinoId && String(origenId) === String(destinoId)

  const { data: productos = [] } = useQuery({
    queryKey: ['productos', 'activos'],
    queryFn: async () => {
      const res = await getProductos({ solo_activos: true })
      return res.data.data ?? []
    },
  })

  const { data: ubicaciones = [] } = useQuery({
    queryKey: ['ubicaciones', 'activos'],
    queryFn: async () => {
      const res = await getUbicaciones({ solo_activos: true })
      return res.data.data ?? []
    },
  })

  const selectedProducto = useMemo(
    () => productos.find((p) => String(p.id) === String(productoId)),
    [productos, productoId]
  )

  useEffect(() => {
    if (selectedProducto?.ubicacion_id) {
      setValue('ubicacion_origen_id', String(selectedProducto.ubicacion_id))
    }
  }, [selectedProducto, setValue])

  const productoOptions = useMemo(
    () => productos.map((p) => ({
      value: String(p.id),
      label: `${p.codigo} — ${p.nombre} (stock: ${p.stock_actual})`,
    })),
    [productos]
  )

  const ubicacionOptions = useMemo(
    () => ubicaciones.map((u) => ({
      value: String(u.id),
      label: `${u.nombre} — ${u.zona}`,
    })),
    [ubicaciones]
  )

  const mutation = useMutation({
    mutationFn: (data) => registrarTraslado(data),
    onSuccess: (res) => {
      toast.success(res.data.message ?? t('Traslado registrado'))
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['movimientos'] })
      reset(EMPTY)
    },
    onError: (err) => {
      applyApiErrors(err, setError)
      const details = err.response?.data?.error?.details
      if (details?.ubicacion) {
        setError('ubicacion_destino_id', { message: details.ubicacion })
      }
      toast.error(apiErrorMessage(err, t('Error al registrar traslado')))
    },
  })

  const onSubmit = (data) => {
    if (String(data.ubicacion_origen_id) === String(data.ubicacion_destino_id)) return
    mutation.mutate({
      producto_id: Number(data.producto_id),
      ubicacion_origen_id: Number(data.ubicacion_origen_id),
      ubicacion_destino_id: Number(data.ubicacion_destino_id),
      cantidad: Number(data.cantidad),
      observaciones: data.observaciones?.trim() ?? '',
    })
  }

  return (
    <div>
      <PageHeader
        title={t('Traslado de inventario')}
        description={t('Mueve stock entre ubicaciones del almacén')}
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
                />
              )}
            />

            <Controller
              name="ubicacion_origen_id"
              control={control}
              rules={{ required: t('Selecciona el origen') }}
              render={({ field }) => (
                <SearchableSelect
                  label={t('Ubicación origen')}
                  options={ubicacionOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('Origen...')}
                  error={errors.ubicacion_origen_id?.message}
                />
              )}
            />

            <Controller
              name="ubicacion_destino_id"
              control={control}
              rules={{
                required: t('Selecciona el destino'),
                validate: (v) =>
                  !origenId || String(v) !== String(origenId) || t('El destino debe ser distinto al origen'),
              }}
              render={({ field }) => (
                <SearchableSelect
                  label={t('Ubicación destino')}
                  options={ubicacionOptions}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('Destino...')}
                  error={
                    errors.ubicacion_destino_id?.message
                    || (mismoOrigenDestino ? t('El origen y destino deben ser distintos') : undefined)
                  }
                />
              )}
            />

            <Input
              label={t('Cantidad')}
              type="number"
              min={1}
              placeholder="1"
              error={errors.cantidad?.message}
              {...register('cantidad', {
                required: t('La cantidad es requerida'),
                min: { value: 1, message: t('Mínimo 1 unidad') },
              })}
            />

            <div>
              <label className="text-sm font-medium text-zinc-700">{t('Observaciones')}</label>
              <textarea
                className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                rows={3}
                {...register('observaciones')}
              />
            </div>

            <Button
              type="submit"
              loading={mutation.isPending}
              disabled={mismoOrigenDestino}
              className="w-full"
            >
              <ArrowLeftRight size={16} />
              {t('Registrar traslado')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
