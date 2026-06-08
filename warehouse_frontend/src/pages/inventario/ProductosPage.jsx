import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { SearchInput } from '@/components/shared/SearchInput'
import { Pagination } from '@/components/shared/Pagination'
import { toPaginationMeta } from '@/lib/pagination'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useT } from '@/hooks/useT'
import {
  buscarProductos,
  createProducto,
  deleteProducto,
  getCategorias,
  getLotesProducto,
  getProductos,
  getUbicaciones,
  updateProducto,
} from '@/api/inventario'

function getFieldError(details, field) {
  const val = details?.[field]
  if (!val) return undefined
  return typeof val === 'string' ? val : val?.[0]
}

function formatPrecio(val) {
  const n = Number(val)
  if (Number.isNaN(n)) return val ?? '—'
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n)
}

function formatFecha(iso) {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), 'dd MMM yyyy', { locale: es })
  } catch {
    return iso
  }
}

function SelectField({ label, error, options, placeholder, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-zinc-700">{label}</label>}
      <select
        className="h-9 w-full rounded-lg border border-zinc-300 bg-white px-5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent disabled:bg-zinc-50"
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

const PAGE_SIZE = 20

const EMPTY_FORM = {
  codigo: '',
  nombre: '',
  descripcion: '',
  categoria_id: '',
  precio_compra: '',
  precio_venta: '',
  unidad_medida: '',
  stock_minimo: '',
  ubicacion_id: '',
}

export default function ProductosPage() {
  const { t } = useT()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [lotesProducto, setLotesProducto] = useState(null)

  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm({
    defaultValues: EMPTY_FORM,
  })

  const debounceSearch = useCallback((value) => {
    const timer = setTimeout(() => setDebouncedSearch(value), 300)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    return debounceSearch(search)
  }, [search, debounceSearch])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, categoriaFilter])

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const res = await getCategorias({ solo_activos: true })
      return res.data.data ?? []
    },
  })

  const { data: ubicaciones = [] } = useQuery({
    queryKey: ['ubicaciones'],
    queryFn: async () => {
      const res = await getUbicaciones({ solo_activos: true })
      return res.data.data ?? []
    },
  })

  const categoriaMap = useMemo(
    () => new Map(categorias.map((c) => [c.id, c.nombre])),
    [categorias]
  )

  const categoriaOptions = useMemo(
    () => categorias.map((c) => ({ value: String(c.id), label: c.nombre })),
    [categorias]
  )

  const ubicacionOptions = useMemo(
    () => ubicaciones.map((u) => ({ value: String(u.id), label: `${u.nombre} (${u.zona})` })),
    [ubicaciones]
  )

  const { data: allProductos = [], isLoading } = useQuery({
    queryKey: ['productos', debouncedSearch, categoriaFilter],
    queryFn: async () => {
      let list
      const q = debouncedSearch.trim()
      if (q) {
        const res = await buscarProductos(q)
        list = res.data.data ?? []
      } else {
        const res = await getProductos({ solo_activos: false })
        list = res.data.data ?? []
      }
      if (categoriaFilter) {
        list = list.filter((p) => String(p.categoria_id) === categoriaFilter)
      }
      return list
    },
  })

  const productos = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return allProductos.slice(start, start + PAGE_SIZE)
  }, [allProductos, page])

  const meta = useMemo(
    () => toPaginationMeta({
      current_page: page,
      total_pages: Math.max(1, Math.ceil(allProductos.length / PAGE_SIZE)),
      count: allProductos.length,
    }),
    [allProductos.length, page]
  )

  const { data: lotes = [], isLoading: loadingLotes } = useQuery({
    queryKey: ['producto-lotes', lotesProducto?.id],
    queryFn: async () => {
      const res = await getLotesProducto(lotesProducto.id, { todos: true })
      return res.data.data ?? []
    },
    enabled: !!lotesProducto?.id,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['productos'] })

  const createMutation = useMutation({
    mutationFn: (data) => createProducto(data),
    onSuccess: (res) => {
      toast.success(res.data.message ?? t('Producto creado'))
      invalidate()
      closeModal()
    },
    onError: (err) => handleMutationError(err),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProducto(id, data),
    onSuccess: (res) => {
      toast.success(res.data.message ?? t('Producto actualizado'))
      invalidate()
      closeModal()
    },
    onError: (err) => handleMutationError(err),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteProducto(id),
    onSuccess: (res) => {
      toast.success(res.data.message ?? t('Producto eliminado'))
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

  const location = useLocation()
  const navigate = useNavigate()

  function openCreate() {
    setEditing(null)
    reset(EMPTY_FORM)
    setModalOpen(true)
  }

  useEffect(() => {
    if (location.state?.openCreate) {
      openCreate()
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state?.openCreate])

  function openEdit(row) {
    setEditing(row)
    reset({
      codigo: row.codigo ?? '',
      nombre: row.nombre ?? '',
      descripcion: row.descripcion ?? '',
      categoria_id: String(row.categoria_id ?? ''),
      precio_compra: row.precio_compra ?? '',
      precio_venta: row.precio_venta ?? '',
      unidad_medida: row.unidad_medida ?? '',
      stock_minimo: String(row.stock_minimo ?? ''),
      ubicacion_id: String(row.ubicacion_id ?? ''),
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    reset(EMPTY_FORM)
  }

  function openLotes(row) {
    setLotesProducto(row)
  }

  function buildPayload(data) {
    return {
      codigo: data.codigo.trim(),
      nombre: data.nombre.trim(),
      descripcion: data.descripcion?.trim() ?? '',
      categoria_id: Number(data.categoria_id),
      precio_compra: data.precio_compra,
      precio_venta: data.precio_venta,
      unidad_medida: data.unidad_medida.trim(),
      stock_minimo: Number(data.stock_minimo),
      ubicacion_id: Number(data.ubicacion_id),
    }
  }

  const onSubmit = (data) => {
    const payload = buildPayload(data)
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending

  const columns = useMemo(() => [
    { key: 'codigo', header: t('Código') },
    { key: 'nombre', header: t('Nombre') },
    {
      key: 'categoria_id',
      header: t('Categoría'),
      className: 'hide-mobile',
      render: (val) => categoriaMap.get(val) ?? '—',
    },
    {
      key: 'stock_actual',
      header: t('Stock Actual'),
      render: (val, row) => {
        const bajo = row.stock_actual <= row.stock_minimo
        return (
          <Badge variant={bajo ? 'danger' : 'success'}>
            {val} {row.unidad_medida}
          </Badge>
        )
      },
    },
    {
      key: 'stock_minimo',
      header: t('Stock Mínimo'),
      className: 'hide-mobile',
      render: (val, row) => `${val} ${row.unidad_medida}`,
    },
    {
      key: 'precio_venta',
      header: t('Precio Venta'),
      className: 'hide-mobile',
      render: (val) => formatPrecio(val),
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
      className: 'w-36',
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => openLotes(row)} title={t('Ver lotes')}>
            <Layers size={15} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => openEdit(row)} title={t('Editar')}>
            <Pencil size={15} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row)} title={t('Eliminar')}>
            <Trash2 size={15} className="text-red-600" />
          </Button>
        </div>
      ),
    },
  ], [t, categoriaMap])

  const stats = useMemo(() => [
    { label: t('Total'), value: meta?.total ?? productos.length },
    { label: t('Activos'), value: productos.filter((p) => p.activo).length, variant: 'success' },
    { label: t('Inactivos'), value: productos.filter((p) => !p.activo).length, variant: 'muted' },
  ], [meta?.total, productos, t])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader title={t('Productos')} variant="list" stats={stats}>
        <SearchInput
          className="w-48"
          placeholder={t('Buscar...')}
          value={search}
          onChange={setSearch}
        />
        <Button variant="gold" onClick={openCreate}>
          <Plus size={16} />
          {t('Nuevo Producto')}
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          className="h-9 rounded-lg border border-zinc-300 bg-white px-5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          value={categoriaFilter}
          onChange={(e) => { setCategoriaFilter(e.target.value); setPage(1) }}
        >
          <option value="">{t('Todas las categorías')}</option>
          {categorias.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={productos}
        loading={isLoading}
        onRowClick={openLotes}
        emptyTitle={t('Sin productos')}
        emptyDescription={t('Crea el primer producto o registra una entrada de inventario.')}
      />

      <Pagination meta={meta} onPageChange={setPage} />

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? t('Editar producto') : t('Nuevo producto')}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('Código')}
            placeholder="PROD-001"
            error={errors.codigo?.message}
            {...register('codigo', { required: t('El código es requerido') })}
          />
          <Input
            label={t('Nombre')}
            placeholder={t('Nombre del producto')}
            error={errors.nombre?.message}
            {...register('nombre', { required: t('El nombre es requerido') })}
          />
          <div className="sm:col-span-2">
            <Input
              label={t('Descripción')}
              placeholder={t('Descripción opcional')}
              error={errors.descripcion?.message}
              {...register('descripcion')}
            />
          </div>
          <SelectField
            label={t('Categoría')}
            placeholder={t('Seleccionar categoría')}
            options={categoriaOptions}
            error={errors.categoria_id?.message}
            {...register('categoria_id', { required: t('La categoría es requerida') })}
          />
          <SelectField
            label={t('Ubicación')}
            placeholder={t('Seleccionar ubicación')}
            options={ubicacionOptions}
            error={errors.ubicacion_id?.message}
            {...register('ubicacion_id', { required: t('La ubicación es requerida') })}
          />
          <Input
            label={t('Precio compra')}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            error={errors.precio_compra?.message}
            {...register('precio_compra', { required: t('El precio de compra es requerido') })}
          />
          <Input
            label={t('Precio venta')}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            error={errors.precio_venta?.message}
            {...register('precio_venta', { required: t('El precio de venta es requerido') })}
          />
          <Input
            label={t('Unidad de medida')}
            placeholder={t('Ej. unidad, kg, caja')}
            error={errors.unidad_medida?.message}
            {...register('unidad_medida', { required: t('La unidad es requerida') })}
          />
          <Input
            label={t('Stock mínimo')}
            type="number"
            min="0"
            placeholder="0"
            error={errors.stock_minimo?.message}
            {...register('stock_minimo', { required: t('El stock mínimo es requerido') })}
          />
          <div className="flex justify-end gap-2 pt-5 sm:col-span-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              {t('Cancelar')}
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? t('Guardar cambios') : t('Crear producto')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!lotesProducto}
        onClose={() => setLotesProducto(null)}
        title={`${t('Lotes')} — ${lotesProducto?.nombre ?? ''}`}
        size="lg"
      >
        {loadingLotes ? (
          <LoadingSpinner className="min-h-[120px]" />
        ) : !lotes.length ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            {t('Este producto no tiene lotes registrados.')}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200">
            <table className="w-full p-5 text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-5 py-5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {t('Nº Lote')}
                  </th>
                  <th className="px-5 py-5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {t('Ingreso')}
                  </th>
                  <th className="px-5 py-5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {t('Vencimiento')}
                  </th>
                  <th className="px-5 py-5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {t('Cantidad')}
                  </th>
                  <th className="px-5 py-5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {t('Estado')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {lotes.map((l) => (
                  <tr key={l.id}>
                    <td className="px-5 py-5 font-medium text-zinc-900">{l.numero_lote}</td>
                    <td className="px-5 py-5 text-zinc-600">{formatFecha(l.fecha_ingreso)}</td>
                    <td className="px-5 py-5 text-zinc-600">{formatFecha(l.fecha_vencimiento)}</td>
                    <td className="px-5 py-5 text-zinc-600">{l.cantidad}</td>
                    <td className="px-5 py-5">
                      <Badge variant={l.activo ? 'success' : 'default'}>
                        {l.activo ? t('Activo') : t('Inactivo')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        title={t('Eliminar producto')}
        description={`${t('¿Eliminar')} "${deleteTarget?.nombre}"? ${t('Esta acción no se puede deshacer.')}`}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
