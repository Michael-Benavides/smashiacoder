import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
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
  createProveedor,
  deleteProveedor,
  getProveedores,
  updateProveedor,
} from '@/api/terceros'
import { applyApiErrors, apiErrorMessage } from '@/lib/formUtils'

const EMPTY = { nombre: '', ruc_nit: '', telefono: '', email: '', direccion: '' }

export default function ProveedoresPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm({ defaultValues: EMPTY })

  const { data, isLoading } = useQuery({
    queryKey: ['proveedores', page, search],
    queryFn: async () => {
      const res = await getProveedores({
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

  const proveedores = data?.items ?? []
  const meta = data?.meta

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['proveedores'] })

  const createMutation = useMutation({
    mutationFn: createProveedor,
    onSuccess: (res) => { toast.success(res.data.message ?? 'Proveedor creado'); invalidate(); closeModal() },
    onError: (err) => { applyApiErrors(err, setError); toast.error(apiErrorMessage(err)) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProveedor(id, data),
    onSuccess: (res) => { toast.success(res.data.message ?? 'Proveedor actualizado'); invalidate(); closeModal() },
    onError: (err) => { applyApiErrors(err, setError); toast.error(apiErrorMessage(err)) },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProveedor,
    onSuccess: (res) => { toast.success(res.data.message ?? 'Proveedor desactivado'); invalidate(); setDeleteTarget(null) },
    onError: (err) => toast.error(apiErrorMessage(err, 'Error al eliminar')),
  })

  function openCreate() { setEditing(null); reset(EMPTY); setModalOpen(true) }
  function openEdit(row) {
    setEditing(row)
    reset({
      nombre: row.nombre ?? '',
      ruc_nit: row.ruc_nit ?? '',
      telefono: row.telefono ?? '',
      email: row.email ?? '',
      direccion: row.direccion ?? '',
    })
    setModalOpen(true)
  }
  function closeModal() { setModalOpen(false); setEditing(null); reset(EMPTY) }

  const onSubmit = (data) => {
    const payload = {
      nombre: data.nombre.trim(),
      ruc_nit: data.ruc_nit?.trim() ?? '',
      telefono: data.telefono?.trim() ?? '',
      email: data.email?.trim() ?? '',
      direccion: data.direccion?.trim() ?? '',
    }
    if (editing) updateMutation.mutate({ id: editing.id, data: payload })
    else createMutation.mutate(payload)
  }

  const columns = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'ruc_nit', header: 'RUC/NIT', render: (v) => v || '—' },
    { key: 'telefono', header: 'Teléfono', render: (v) => v || '—' },
    { key: 'email', header: 'Email', render: (v) => v || '—' },
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
          <Button variant="ghost" size="icon" onClick={() => openEdit(row)}><Pencil size={15} /></Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row)}><Trash2 size={15} className="text-red-600" /></Button>
        </div>
      ),
    },
  ]

  const stats = [
    { label: 'Total', value: meta?.total ?? proveedores.length },
    { label: 'Activos', value: proveedores.filter((p) => p.activo).length, variant: 'success' },
    { label: 'Inactivos', value: proveedores.filter((p) => !p.activo).length, variant: 'muted' },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader title="Proveedores" variant="list" stats={stats}>
        <SearchInput
          className="w-48"
          placeholder="Buscar..."
          value={search}
          onChange={(v) => { setSearch(v); setPage(1) }}
        />
        <Button variant="gold" onClick={openCreate}><Plus size={16} />Nuevo Proveedor</Button>
      </PageHeader>

      <DataTable columns={columns} data={proveedores} loading={isLoading} emptyTitle="Sin proveedores" />
      <Pagination meta={meta} onPageChange={setPage} />

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Editar proveedor' : 'Nuevo proveedor'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nombre" error={errors.nombre?.message} {...register('nombre', { required: 'Requerido' })} />
          <Input label="RUC/NIT" error={errors.ruc_nit?.message} {...register('ruc_nit')} />
          <Input label="Teléfono" error={errors.telefono?.message} {...register('telefono')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Dirección" error={errors.direccion?.message} {...register('direccion')} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        title="Desactivar proveedor"
        description={`¿Desactivar "${deleteTarget?.nombre}"?`}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
