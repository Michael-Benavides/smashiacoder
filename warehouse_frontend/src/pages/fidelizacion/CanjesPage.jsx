import { useMemo, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Gift } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '@/components/layout/PageHeader'
import { SearchableSelect } from '@/components/shared/SearchableSelect'
import { DataTable } from '@/components/shared/DataTable'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { canjearPuntos } from '@/api/fidelizacion'
import { getClientes } from '@/api/terceros'
import { applyApiErrors, apiErrorMessage } from '@/lib/formUtils'
import { cn } from '@/lib/utils'

const EMPTY = { cliente_id: '', puntos_a_canjear: '', recompensa: '' }

const NIVEL_STYLES = {
  Bronce: 'bg-amber-50 text-amber-800 border-amber-200',
  Plata: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  Oro: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  Platino: 'bg-violet-50 text-violet-700 border-violet-200',
}

function formatFecha(iso) {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), "dd MMM yyyy, HH:mm", { locale: es })
  } catch {
    return iso
  }
}

export default function CanjesPage() {
  const queryClient = useQueryClient()
  const [recentCanjes, setRecentCanjes] = useState([])

  const { register, handleSubmit, reset, control, watch, setError, formState: { errors } } = useForm({
    defaultValues: EMPTY,
  })

  const clienteId = watch('cliente_id')
  const puntosCanjear = Number(watch('puntos_a_canjear')) || 0

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes', 'activos'],
    queryFn: async () => {
      const res = await getClientes({ solo_activos: true, page_size: 100 })
      return res.data.data ?? []
    },
  })

  const selectedCliente = useMemo(
    () => clientes.find((c) => String(c.id) === String(clienteId)),
    [clientes, clienteId]
  )

  const puntosDisponibles = selectedCliente?.puntos_fidelizacion ?? 0
  const excedePuntos = puntosCanjear > puntosDisponibles

  const clienteOptions = useMemo(
    () => clientes.map((c) => ({
      value: String(c.id),
      label: c.nombre,
      raw: c,
    })),
    [clientes]
  )

  const clienteMap = useMemo(
    () => new Map(clientes.map((c) => [c.id, c.nombre])),
    [clientes]
  )

  const mutation = useMutation({
    mutationFn: canjearPuntos,
    onSuccess: (res) => {
      const { canje, cliente } = res.data.data ?? {}
      toast.success(
        `${res.data.message ?? 'Canje registrado'} — Puntos restantes: ${cliente?.puntos_fidelizacion ?? '—'}`
      )
      if (canje) {
        setRecentCanjes((prev) => [{ ...canje, cliente_nombre: cliente?.nombre }, ...prev])
      }
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      reset(EMPTY)
    },
    onError: (err) => {
      applyApiErrors(err, setError)
      toast.error(apiErrorMessage(err, 'Error al canjear puntos'))
    },
  })

  const onSubmit = (data) => {
    if (Number(data.puntos_a_canjear) > puntosDisponibles) return
    mutation.mutate({
      cliente_id: Number(data.cliente_id),
      puntos_a_canjear: Number(data.puntos_a_canjear),
      recompensa: data.recompensa.trim(),
    })
  }

  const canjesColumns = [
    {
      key: 'fecha',
      header: 'Fecha',
      render: (val) => formatFecha(val),
    },
    {
      key: 'cliente_id',
      header: 'Cliente',
      render: (val, row) => row.cliente_nombre ?? clienteMap.get(val) ?? `#${val}`,
    },
    {
      key: 'puntos_canjeados',
      header: 'Puntos',
      render: (val) => <Badge variant="warning">-{val}</Badge>,
    },
    { key: 'recompensa', header: 'Recompensa' },
  ]

  return (
    <div>
      <PageHeader title="Canjes" description="Canjea puntos de fidelización por recompensas" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Controller
                name="cliente_id"
                control={control}
                rules={{ required: 'Selecciona un cliente' }}
                render={({ field }) => (
                  <SearchableSelect
                    label="Cliente"
                    options={clienteOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Buscar cliente..."
                    error={errors.cliente_id?.message}
                    renderOption={(opt) => (
                      <span className="flex items-center justify-between gap-2">
                        <span>{opt.label}</span>
                        {opt.raw && (
                          <span className={cn(
                            'rounded border px-1.5 py-0.5 text-xs',
                            NIVEL_STYLES[opt.raw.nivel_fidelidad] ?? ''
                          )}>
                            {opt.raw.puntos_fidelizacion} pts
                          </span>
                        )}
                      </span>
                    )}
                  />
                )}
              />

              {selectedCliente && (
                <p className="text-sm text-zinc-600">
                  Puntos disponibles:{' '}
                  <strong className="text-zinc-900">{puntosDisponibles}</strong>
                  {' · '}Nivel: {selectedCliente.nivel_fidelidad}
                </p>
              )}

              <Input
                label="Puntos a canjear"
                type="number"
                min={1}
                max={puntosDisponibles || undefined}
                error={
                  errors.puntos_a_canjear?.message
                  || (excedePuntos ? `No puede superar los ${puntosDisponibles} puntos disponibles` : undefined)
                }
                {...register('puntos_a_canjear', {
                  required: 'Requerido',
                  min: { value: 1, message: 'Mínimo 1 punto' },
                  validate: (v) =>
                    !selectedCliente || Number(v) <= puntosDisponibles
                    || `Máximo ${puntosDisponibles} puntos`,
                })}
              />

              <Input
                label="Recompensa"
                placeholder="Ej. Descuento 10%"
                error={errors.recompensa?.message}
                {...register('recompensa', { required: 'La recompensa es requerida' })}
              />

              <Button
                type="submit"
                loading={mutation.isPending}
                disabled={!clienteId || excedePuntos}
                className="w-full"
              >
                <Gift size={16} />
                Registrar canje
              </Button>
            </form>
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-zinc-900">Canjes recientes</h2>
          <DataTable
            columns={canjesColumns}
            data={recentCanjes}
            emptyTitle="Sin canjes en esta sesión"
            emptyDescription="Los canjes registrados aparecerán aquí."
          />
        </div>
      </div>
    </div>
  )
}
