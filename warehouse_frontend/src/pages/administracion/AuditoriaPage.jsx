import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import PageHeader from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Pagination } from '@/components/shared/Pagination'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { getAuditoria } from '@/api/administracion'
import { toPaginationMeta } from '@/lib/pagination'

const ENTIDADES = [
  '',
  'producto',
  'cliente',
  'proveedor',
  'categoria',
  'ubicacion',
  'movimiento',
  'usuario',
  'configuracion',
  'regla_fidelizacion',
]

const ACCION_BADGE = {
  crear: 'success',
  actualizar: 'info',
  eliminar: 'danger',
  desactivar: 'warning',
  login: 'default',
  logout: 'default',
}

function formatFecha(iso) {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), "dd MMM yyyy, HH:mm", { locale: es })
  } catch {
    return iso
  }
}

function JsonBlock({ title, data }) {
  if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
    return (
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">{title}</p>
        <p className="text-sm text-zinc-500">Sin datos</p>
      </div>
    )
  }
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">{title}</p>
      <pre className="max-h-48 overflow-auto rounded-lg bg-zinc-950 p-4 text-xs leading-relaxed text-green-400">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

export default function AuditoriaPage() {
  const [page, setPage] = useState(1)
  const [entidad, setEntidad] = useState('')
  const [usuarioId, setUsuarioId] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [selected, setSelected] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['auditoria', page, entidad, usuarioId, fechaDesde, fechaHasta],
    queryFn: async () => {
      const res = await getAuditoria({
        page,
        page_size: 20,
        entidad: entidad || undefined,
        usuario_id: usuarioId || undefined,
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
      })
      return {
        items: res.data.data ?? [],
        meta: toPaginationMeta(res.data.meta?.pagination ?? res.data.pagination),
      }
    },
  })

  const registros = data?.items ?? []
  const meta = data?.meta

  const columns = useMemo(() => [
    {
      key: 'fecha',
      header: 'Fecha',
      render: (val) => formatFecha(val),
    },
    {
      key: 'usuario_nombre',
      header: 'Usuario',
      render: (val, row) => val ?? (row.usuario_id ? `#${row.usuario_id}` : '—'),
    },
    {
      key: 'accion',
      header: 'Acción',
      render: (val) => {
        const key = val?.toLowerCase?.() ?? ''
        const variant = ACCION_BADGE[key] ?? 'default'
        return <Badge variant={variant}>{val ?? '—'}</Badge>
      },
    },
    { key: 'entidad', header: 'Entidad' },
    {
      key: 'entidad_id',
      header: 'ID',
      render: (val) => val ?? '—',
    },
    {
      key: 'ip',
      header: 'IP',
      render: (val) => val || '—',
    },
  ], [])

  return (
    <div>
      <PageHeader
        title="Auditoría"
        description="Registro de acciones realizadas en el sistema"
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Entidad</label>
          <select
            className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm"
            value={entidad}
            onChange={(e) => { setEntidad(e.target.value); setPage(1) }}
          >
            <option value="">Todas</option>
            {ENTIDADES.filter(Boolean).map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <div className="w-32">
          <Input
            label="Usuario ID"
            type="number"
            min={1}
            value={usuarioId}
            onChange={(e) => { setUsuarioId(e.target.value); setPage(1) }}
            placeholder="ID"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Desde</label>
          <input
            type="date"
            className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm"
            value={fechaDesde}
            onChange={(e) => { setFechaDesde(e.target.value); setPage(1) }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Hasta</label>
          <input
            type="date"
            className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm"
            value={fechaHasta}
            onChange={(e) => { setFechaHasta(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={registros}
        loading={isLoading}
        onRowClick={setSelected}
        emptyTitle="Sin registros de auditoría"
        emptyDescription="Las acciones del sistema aparecerán aquí."
      />

      <Pagination meta={meta} onPageChange={setPage} />

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`Detalle — ${selected?.accion ?? ''} ${selected?.entidad ?? ''}`}
        size="lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p><span className="text-zinc-500">Usuario:</span> {selected.usuario_nombre ?? selected.usuario_id}</p>
              <p><span className="text-zinc-500">Fecha:</span> {formatFecha(selected.fecha)}</p>
              <p><span className="text-zinc-500">Entidad:</span> {selected.entidad} #{selected.entidad_id}</p>
              <p><span className="text-zinc-500">IP:</span> {selected.ip || '—'}</p>
            </div>
            <JsonBlock title="Datos anteriores" data={selected.datos_anteriores} />
            <JsonBlock title="Datos nuevos" data={selected.datos_nuevos} />
          </div>
        )}
      </Modal>
    </div>
  )
}
