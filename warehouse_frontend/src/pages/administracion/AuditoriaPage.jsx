import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import PageHeader from '@/components/layout/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { Pagination } from '@/components/shared/Pagination'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useT } from '@/hooks/useT'
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

const ACCION_STYLES = {
  crear: 'bg-green-50 text-green-700 border border-green-200',
  create: 'bg-green-50 text-green-700 border border-green-200',
  actualizar: 'bg-blue-50 text-blue-700 border border-blue-200',
  update: 'bg-blue-50 text-blue-700 border border-blue-200',
  eliminar: 'bg-red-50 text-red-700 border border-red-200',
  delete: 'bg-red-50 text-red-700 border border-red-200',
  login: 'bg-amber-50 text-amber-700 border border-amber-200',
}

function formatFecha(iso) {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), "dd MMM yyyy, HH:mm", { locale: es })
  } catch {
    return iso
  }
}

function JsonBlock({ title, data, emptyLabel }) {
  if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
    return (
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">{title}</p>
        <p className="text-sm text-zinc-500">{emptyLabel}</p>
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
  const { t } = useT()
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
      header: t('Fecha'),
      render: (val) => formatFecha(val),
    },
    {
      key: 'usuario_nombre',
      header: t('Usuario'),
      render: (val, row) => val ?? (row.usuario_id ? `#${row.usuario_id}` : '—'),
    },
    {
      key: 'accion',
      header: t('Acción'),
      render: (val) => {
        const key = val?.toLowerCase?.() ?? ''
        const style = ACCION_STYLES[key] ?? 'bg-zinc-100 text-zinc-700 border border-zinc-200'
        return (
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${style}`}>
            {val ?? '—'}
          </span>
        )
      },
    },
    { key: 'entidad', header: t('Entidad') },
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
  ], [t])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title={t('Auditoría')}
        description={t('Registro de acciones realizadas en el sistema')}
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">{t('Entidad')}</label>
          <select
            className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm"
            value={entidad}
            onChange={(e) => { setEntidad(e.target.value); setPage(1) }}
          >
            <option value="">{t('Todas')}</option>
            {ENTIDADES.filter(Boolean).map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <div className="w-32">
          <Input
            label={t('Usuario ID')}
            type="number"
            min={1}
            value={usuarioId}
            onChange={(e) => { setUsuarioId(e.target.value); setPage(1) }}
            placeholder="ID"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">{t('Desde')}</label>
          <input
            type="date"
            className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm"
            value={fechaDesde}
            onChange={(e) => { setFechaDesde(e.target.value); setPage(1) }}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">{t('Hasta')}</label>
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
        emptyTitle={t('Sin registros de auditoría')}
        emptyDescription={t('Las acciones del sistema aparecerán aquí.')}
      />

      <Pagination meta={meta} onPageChange={setPage} />

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`${t('Detalle')} — ${selected?.accion ?? ''} ${selected?.entidad ?? ''}`}
        size="lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p><span className="text-zinc-500">{t('Usuario')}:</span> {selected.usuario_nombre ?? selected.usuario_id}</p>
              <p><span className="text-zinc-500">{t('Fecha')}:</span> {formatFecha(selected.fecha)}</p>
              <p><span className="text-zinc-500">{t('Entidad')}:</span> {selected.entidad} #{selected.entidad_id}</p>
              <p><span className="text-zinc-500">IP:</span> {selected.ip || '—'}</p>
            </div>
            <JsonBlock title={t('Datos anteriores')} data={selected.datos_anteriores} emptyLabel={t('Sin datos')} />
            <JsonBlock title={t('Datos nuevos')} data={selected.datos_nuevos} emptyLabel={t('Sin datos')} />
          </div>
        )}
      </Modal>
    </div>
  )
}
