import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Coins, Pencil, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { SearchInput } from '@/components/shared/SearchInput'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Pagination } from '@/components/shared/Pagination'
import { toPaginationMeta } from '@/lib/pagination'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import {
  actualizarPuntos,
  createCliente,
  deleteCliente,
  getClientes,
  updateCliente,
} from '@/api/terceros'
import { applyApiErrors, apiErrorMessage } from '@/lib/formUtils'
import { cn } from '@/lib/utils'

const EMPTY = { nombre: '', identificacion: '', email: '', telefono: '', direccion: '' }

const NIVEL_STYLES = {
  Bronce: 'bg-amber-50 text-amber-800 border-amber-200',
  Plata: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  Oro: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  Platino: 'bg-violet-50 text-violet-700 border-violet-200',
}

function NivelBadge({ nivel }) {
  const style = NIVEL_STYLES[nivel] ?? 'bg-zinc-100 text-zinc-700'
  return (
    <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium', style)}>
      {nivel ?? '—'}
    </span>
  )
}

export default function ClientesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [puntosModal, setPuntosModal] = useState(null)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm({ defaultValues: EMPTY })
  const puntosForm = useForm({ defaultValues: { puntos_a_sumar: '' } })

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', page, search],
    queryFn: async () => {
      const res = await getClientes({
        page,
        page_size: 20,
        search: search.trim() || undefined,
        solo_activos: false,
      })
      return {
        items: res.data.data ?? [],
        meta: toPaginationMeta(res.data.meta?.pagination ?? res.data.pagination),
      }
    },
  })

  const clientes = data?.items ?? []
  const meta = data?.meta

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['clientes'] })

  const createMutation = useMutation({
    mutationFn: createCliente,
    onSuccess: (res) => { toast.success(res.data.message ?? 'Cliente creado'); invalidate(); closeModal() },
    onError: (err) => { applyApiErrors(err, setError); toast.error(apiErrorMessage(err)) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateCliente(id, data),
    onSuccess: (res) => { toast.success(res.data.message ?? 'Cliente actualizado'); invalidate(); closeModal() },
    onError: (err) => { applyApiErrors(err, setError); toast.error(apiErrorMessage(err)) },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCliente,
    onSuccess: (res) => { toast.success(res.data.message ?? 'Cliente desactivado'); invalidate(); setDeleteTarget(null) },
    onError: (err) => toast.error(apiErrorMessage(err)),
  })

  const puntosMutation = useMutation({
    mutationFn: ({ id, puntos }) => actualizarPuntos(id, puntos),
    onSuccess: (res) => {
      toast.success(res.data.message ?? 'Puntos actualizados')
      invalidate()
      setPuntosModal(null)
      puntosForm.reset({ puntos_a_sumar: '' })
    },
    onError: (err) => {
      applyApiErrors(err, puntosForm.setError)
      toast.error(apiErrorMessage(err))
    },
  })

  function openCreate() { setEditing(null); reset(EMPTY); setModalOpen(true) }
  function openEdit(row) {
    setEditing(row)
    reset({
      nombre: row.nombre ?? '',
      identificacion: row.identificacion ?? '',
      email: row.email ?? '',
      telefono: row.telefono ?? '',
      direccion: row.direccion ?? '',
    })
    setModalOpen(true)
  }
  function closeModal() { setModalOpen(false); setEditing(null); reset(EMPTY) }

  const onSubmit = (data) => {
    const payload = {
      nombre: data.nombre.trim(),
      identificacion: data.identificacion?.trim() ?? '',
      email: data.email?.trim() ?? '',
      telefono: data.telefono?.trim() ?? '',
      direccion: data.direccion?.trim() ?? '',
    }
    if (editing) updateMutation.mutate({ id: editing.id, data: payload })
    else createMutation.mutate(payload)
  }

  const onPuntosSubmit = (data) => {
    puntosMutation.mutate({
      id: puntosModal.id,
      puntos: Number(data.puntos_a_sumar),
    })
  }

  const columns = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'identificacion', header: 'Identificación', render: (v) => v || '—' },
    { key: 'email', header: 'Email', render: (v) => v || '—' },
    {
      key: 'puntos_fidelizacion',
      header: 'Puntos',
      render: (v) => <span className="tabular-nums font-medium">{v ?? 0}</span>,
    },
    {
      key: 'nivel_fidelidad',
      header: 'Nivel',
      render: (v) => <NivelBadge nivel={v} />,
    },
    {
      key: 'activo',
      header: 'Estado',
      render: (v) => <Badge variant={v ? 'success' : 'default'}>{v ? 'Activo' : 'Inactivo'}</Badge>,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (_, row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => { setPuntosModal(row); puntosForm.reset({ puntos_a_sumar: '' }) }} title="Ajustar puntos">
            <Coins size={15} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => openEdit(row)}><Pencil size={15} /></Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row)}><Trash2 size={15} className="text-red-600" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Clientes" description="Clientes y programa de fidelización">
        <Button onClick={openCreate}><Plus size={16} />Nuevo Cliente</Button>
      </PageHeader>

      <div className="mb-4 max-w-sm">
        <SearchInput
          placeholder="Buscar por nombre o identificación..."
          value={search}
          onChange={(v) => { setSearch(v); setPage(1) }}
        />
      </div>

      <DataTable columns={columns} data={clientes} loading={isLoading} emptyTitle="Sin clientes" />
      <Pagination meta={meta} onPageChange={setPage} />

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Editar cliente' : 'Nuevo cliente'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nombre" error={errors.nombre?.message} {...register('nombre', { required: 'Requerido' })} />
          <Input label="Identificación" error={errors.identificacion?.message} {...register('identificacion')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Teléfono" error={errors.telefono?.message} {...register('telefono')} />
          <Input label="Dirección" error={errors.direccion?.message} {...register('direccion')} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!puntosModal}
        onClose={() => setPuntosModal(null)}
        title={`Ajustar puntos — ${puntosModal?.nombre ?? ''}`}
        size="sm"
      >
        {puntosModal && (
          <form onSubmit={puntosForm.handleSubmit(onPuntosSubmit)} className="space-y-4">
            <p className="text-sm text-zinc-600">
              Puntos actuales: <strong>{puntosModal.puntos_fidelizacion}</strong>
              {' · '}Nivel: <NivelBadge nivel={puntosModal.nivel_fidelidad} />
            </p>
            <Input
              label="Puntos a sumar/restar"
              type="number"
              placeholder="Ej. 50 o -20"
              hint="Usa valores negativos para restar puntos"
              error={puntosForm.formState.errors.puntos_a_sumar?.message}
              {...puntosForm.register('puntos_a_sumar', { required: 'Ingresa la cantidad' })}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPuntosModal(null)}>Cancelar</Button>
              <Button type="submit" loading={puntosMutation.isPending}>Aplicar</Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        title="Desactivar cliente"
        description={`¿Desactivar "${deleteTarget?.nombre}"?`}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
