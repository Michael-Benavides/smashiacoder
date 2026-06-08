import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { SearchInput } from '@/components/shared/SearchInput'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useT } from '@/hooks/useT'
import {
  createUbicacion,
  deleteUbicacion,
  getUbicaciones,
  updateUbicacion,
} from '@/api/inventario'

function getFieldError(details, field) {
  const val = details?.[field]
  if (!val) return undefined
  return typeof val === 'string' ? val : val?.[0]
}

export default function UbicacionesPage() {
  const { t } = useT()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm({
    defaultValues: { nombre: '', descripcion: '', zona: '' },
  })

  const { data: ubicaciones = [], isLoading } = useQuery({
    queryKey: ['ubicaciones'],
    queryFn: async () => {
      const res = await getUbicaciones({ solo_activos: false })
      return res.data.data ?? []
    },
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return ubicaciones
    return ubicaciones.filter(
      (u) =>
        u.nombre?.toLowerCase().includes(q) ||
        u.descripcion?.toLowerCase().includes(q) ||
        u.zona?.toLowerCase().includes(q)
    )
  }, [ubicaciones, search])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['ubicaciones'] })

  const createMutation = useMutation({
    mutationFn: (data) => createUbicacion(data),
    onSuccess: (res) => {
      toast.success(res.data.message ?? t('Ubicación creada'))
      invalidate()
      closeModal()
    },
    onError: (err) => handleMutationError(err),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateUbicacion(id, data),
    onSuccess: (res) => {
      toast.success(res.data.message ?? t('Ubicación actualizada'))
      invalidate()
      closeModal()
    },
    onError: (err) => handleMutationError(err),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteUbicacion(id),
    onSuccess: (res) => {
      toast.success(res.data.message ?? t('Ubicación eliminada'))
      invalidate()
      setDeleteTarget(null)
    },
    onError: (err) => {
      toast.error(err.response?.data?.error?.message ?? t('Error al eliminar'))
    },
  })

  function handleMutationError(err) {
    const details = err.response?.data?.error?.details
    if (details) {
      Object.keys(details).forEach((field) => {
        const msg = getFieldError(details, field)
        if (msg) setError(field, { message: msg })
      })
    }
    toast.error(err.response?.data?.error?.message ?? t('Error en la operación'))
  }

  function openCreate() {
    setEditing(null)
    reset({ nombre: '', descripcion: '', zona: '' })
    setModalOpen(true)
  }

  function openEdit(row) {
    setEditing(row)
    reset({
      nombre: row.nombre ?? '',
      descripcion: row.descripcion ?? '',
      zona: row.zona ?? '',
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    reset({ nombre: '', descripcion: '', zona: '' })
  }

  const onSubmit = (data) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending

  const columns = useMemo(() => [
    { key: 'nombre', header: t('Nombre') },
    {
      key: 'descripcion',
      header: t('Descripción'),
      render: (val) => val || '—',
    },
    {
      key: 'zona',
      header: t('Zona'),
      render: (val) => (val ? <Badge variant="info">{val}</Badge> : '—'),
    },
    {
      key: 'activo',
      header: t('Estado'),
      render: (val) => (
        <Badge variant={val ? 'success' : 'default'}>
          {val ? t('Activo') : t('Inactivo')}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: t('Acciones'),
      className: 'w-28',
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => openEdit(row)} title={t('Editar')}>
            <Pencil size={15} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row)} title={t('Eliminar')}>
            <Trash2 size={15} className="text-red-600" />
          </Button>
        </div>
      ),
    },
  ], [t])

  const stats = useMemo(() => [
    { label: t('Total'), value: filtered.length },
    { label: t('Activas'), value: filtered.filter((u) => u.activo).length, variant: 'success' },
    { label: t('Inactivas'), value: filtered.filter((u) => !u.activo).length, variant: 'muted' },
  ], [filtered, t])

  return (
    <div>
      <PageHeader title={t('Ubicaciones')} variant="list" stats={stats}>
        <SearchInput
          className="w-48"
          placeholder={t('Buscar...')}
          value={search}
          onChange={setSearch}
        />
        <Button variant="gold" onClick={openCreate}>
          <Plus size={16} />
          {t('Nueva Ubicación')}
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={filtered}
        loading={isLoading}
        emptyTitle={t('Sin ubicaciones')}
        emptyDescription={t('Crea la primera ubicación para asignar productos en el almacén.')}
      />

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? t('Editar ubicación') : t('Nueva ubicación')}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t('Nombre')}
            placeholder={t('Ej. Estante A-01')}
            error={errors.nombre?.message}
            {...register('nombre', { required: t('El nombre es requerido') })}
          />
          <Input
            label={t('Zona')}
            placeholder={t('Ej. Zona Fría')}
            error={errors.zona?.message}
            {...register('zona', { required: t('La zona es requerida') })}
          />
          <Input
            label={t('Descripción')}
            placeholder={t('Descripción opcional')}
            error={errors.descripcion?.message}
            {...register('descripcion')}
          />
          <div className="flex justify-end gap-2 pt-5">
            <Button type="button" variant="outline" onClick={closeModal}>
              {t('Cancelar')}
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? t('Guardar cambios') : t('Crear ubicación')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        title={t('Eliminar ubicación')}
        description={`${t('¿Eliminar')} "${deleteTarget?.nombre}"? ${t('Esta acción no se puede deshacer.')}`}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
