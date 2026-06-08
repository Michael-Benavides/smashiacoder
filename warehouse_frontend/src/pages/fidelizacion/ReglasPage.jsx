import { useMemo, useState } from 'react'
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
import { useT } from '@/hooks/useT'
import { createRegla, deleteRegla, getReglas, updateRegla } from '@/api/fidelizacion'
import { applyApiErrors, apiErrorMessage } from '@/lib/formUtils'

const NIVELES = ['Bronce', 'Plata', 'Oro', 'Platino']

const EMPTY = {
  nombre: '',
  puntos_por_unidad: '',
  nivel_minimo: 'Bronce',
  nivel_maximo: 'Platino',
  recompensa: '',
}

function SelectField({ label, error, options, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-zinc-700">{label}</label>}
      <select
        className="h-9 w-full rounded-lg border border-zinc-300 bg-white px-5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        {...props}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default function ReglasPage() {
  const { t } = useT()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm({ defaultValues: EMPTY })

  const { data, isLoading } = useQuery({
    queryKey: ['reglas', page, search],
    queryFn: async () => {
      const res = await getReglas({
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

  const reglas = data?.items ?? []
  const meta = data?.meta

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['reglas'] })

  const createMutation = useMutation({
    mutationFn: createRegla,
    onSuccess: (res) => { toast.success(res.data.message ?? t('Regla creada')); invalidate(); closeModal() },
    onError: (err) => { applyApiErrors(err, setError); toast.error(apiErrorMessage(err)) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateRegla(id, data),
    onSuccess: (res) => { toast.success(res.data.message ?? t('Regla actualizada')); invalidate(); closeModal() },
    onError: (err) => { applyApiErrors(err, setError); toast.error(apiErrorMessage(err)) },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRegla,
    onSuccess: (res) => { toast.success(res.data.message ?? t('Regla desactivada')); invalidate(); setDeleteTarget(null) },
    onError: (err) => toast.error(apiErrorMessage(err)),
  })

  function openCreate() { setEditing(null); reset(EMPTY); setModalOpen(true) }
  function openEdit(row) {
    setEditing(row)
    reset({
      nombre: row.nombre ?? '',
      puntos_por_unidad: String(row.puntos_por_unidad ?? ''),
      nivel_minimo: row.nivel_minimo ?? 'Bronce',
      nivel_maximo: row.nivel_maximo ?? 'Platino',
      recompensa: row.recompensa ?? '',
    })
    setModalOpen(true)
  }
  function closeModal() { setModalOpen(false); setEditing(null); reset(EMPTY) }

  const onSubmit = (data) => {
    const payload = {
      nombre: data.nombre.trim(),
      puntos_por_unidad: Number(data.puntos_por_unidad),
      nivel_minimo: data.nivel_minimo,
      nivel_maximo: data.nivel_maximo,
      recompensa: data.recompensa.trim(),
    }
    if (editing) updateMutation.mutate({ id: editing.id, data: payload })
    else createMutation.mutate(payload)
  }

  const columns = useMemo(() => [
    { key: 'nombre', header: t('Nombre') },
    {
      key: 'puntos_por_unidad',
      header: t('Puntos/Unidad'),
      render: (v) => <span className="tabular-nums">{v}</span>,
    },
    {
      key: 'nivel_minimo',
      header: t('Nivel'),
      render: (_, row) => `${row.nivel_minimo} → ${row.nivel_maximo}`,
    },
    { key: 'recompensa', header: t('Recompensa') },
    {
      key: 'activo',
      header: t('Estado'),
      render: (v) => <Badge variant={v ? 'success' : 'default'}>{v ? t('Activo') : t('Inactivo')}</Badge>,
    },
    {
      key: 'acciones',
      header: t('Acciones'),
      render: (_, row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEdit(row)}><Pencil size={15} /></Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row)}><Trash2 size={15} className="text-red-600" /></Button>
        </div>
      ),
    },
  ], [t])

  const stats = useMemo(() => [
    { label: t('Total'), value: meta?.total ?? reglas.length },
    { label: t('Activas'), value: reglas.filter((r) => r.activo).length, variant: 'success' },
    { label: t('Inactivas'), value: reglas.filter((r) => !r.activo).length, variant: 'muted' },
  ], [meta?.total, reglas, t])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader title={t('Reglas de fidelización')} variant="list" stats={stats}>
        <SearchInput
          className="w-48"
          placeholder={t('Buscar...')}
          value={search}
          onChange={(v) => { setSearch(v); setPage(1) }}
        />
        <Button variant="gold" onClick={openCreate}><Plus size={16} />{t('Nueva Regla')}</Button>
      </PageHeader>

      <DataTable columns={columns} data={reglas} loading={isLoading} emptyTitle={t('Sin reglas')} />
      <Pagination meta={meta} onPageChange={setPage} />

      <Modal open={modalOpen} onClose={closeModal} title={editing ? t('Editar regla') : t('Nueva regla')}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label={t('Nombre')} error={errors.nombre?.message} {...register('nombre', { required: t('Requerido') })} />
          <Input
            label={t('Puntos por unidad')}
            type="number"
            min={1}
            error={errors.puntos_por_unidad?.message}
            {...register('puntos_por_unidad', { required: t('Requerido'), min: { value: 1, message: t('Mínimo 1') } })}
          />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label={t('Nivel mínimo')}
              options={NIVELES}
              error={errors.nivel_minimo?.message}
              {...register('nivel_minimo', { required: true })}
            />
            <SelectField
              label={t('Nivel máximo')}
              options={NIVELES}
              error={errors.nivel_maximo?.message}
              {...register('nivel_maximo', { required: true })}
            />
          </div>
          <Input label={t('Recompensa')} error={errors.recompensa?.message} {...register('recompensa', { required: t('Requerido') })} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeModal}>{t('Cancelar')}</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editing ? t('Guardar') : t('Crear')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        title={t('Desactivar regla')}
        description={`${t('¿Desactivar')} "${deleteTarget?.nombre}"?`}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
