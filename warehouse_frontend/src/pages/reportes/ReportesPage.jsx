import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  FileSpreadsheet, FileText, Mail, Package, ArrowLeftRight, Users,
  Warehouse, Truck, BarChart3, Calendar,
} from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useT } from '@/hooks/useT'
import { enviarReporte } from '@/api/administracion'
import { fetchAndDownloadReport } from '@/lib/download'
import { apiErrorMessage } from '@/lib/formUtils'

function firstDayOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function ReportesPage() {
  const { t } = useT()
  const [loadingKey, setLoadingKey] = useState(null)
  const [emailModal, setEmailModal] = useState(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [dateFilters, setDateFilters] = useState({
    fecha_desde: firstDayOfMonth(),
    fecha_hasta: todayISO(),
  })

  const reports = useMemo(() => [
    {
      tipo: 'general',
      title: t('Informe General de Bodega'),
      description: t('Resumen ejecutivo con valor del inventario, stock crítico, distribución por categoría, top movimientos del mes y alertas pendientes.'),
      icon: Warehouse,
      color: 'text-zinc-800 bg-zinc-200',
      highlights: [t('Resumen ejecutivo'), t('Stock crítico'), t('Alertas activas')],
    },
    {
      tipo: 'inventario',
      title: t('Informe de Inventario'),
      description: t('Detalle completo de productos con precios, valor en inventario, estado (OK/CRÍTICO/AGOTADO) y subtotales por categoría.'),
      icon: Package,
      color: 'text-emerald-800 bg-emerald-100',
      highlights: [t('Valor inventario'), t('Estado por producto'), t('Subtotales')],
    },
    {
      tipo: 'movimientos',
      title: t('Informe de Movimientos'),
      description: t('Entradas, salidas y traslados del período con resumen, gráfico ASCII diario (PDF) y detalle por producto y usuario.'),
      icon: ArrowLeftRight,
      color: 'text-blue-800 bg-blue-100',
      highlights: [t('Filtro por fechas'), t('Gráfico ASCII'), t('Detalle completo')],
      hasDateFilter: true,
    },
    {
      tipo: 'clientes',
      title: t('Clientes y Fidelización'),
      description: t('Distribución por nivel de membresía, puntos en circulación, top 10 clientes y historial de canjes recientes.'),
      icon: Users,
      color: 'text-violet-800 bg-violet-100',
      highlights: [t('Niveles Bronce–Platino'), t('Top puntos'), t('Canjes')],
    },
    {
      tipo: 'proveedores',
      title: t('Informe de Proveedores'),
      description: t('Proveedores activos con productos suministrados y total de unidades recibidas según movimientos de entrada.'),
      icon: Truck,
      color: 'text-orange-800 bg-orange-100',
      highlights: [t('Proveedores activos'), t('Productos suministrados'), t('Unidades recibidas')],
    },
  ], [t])

  const reportOptions = useMemo(
    () => reports.map((r) => ({ value: r.tipo, label: r.title })),
    [reports]
  )

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: { email: '', tipo: 'general', formato: 'pdf' },
  })

  function getParams(tipo) {
    if (tipo !== 'movimientos') return {}
    return {
      fecha_desde: dateFilters.fecha_desde || undefined,
      fecha_hasta: dateFilters.fecha_hasta || undefined,
    }
  }

  function openEmailModal(tipo) {
    setEmailModal(tipo)
    reset({ email: '', tipo, formato: 'pdf' })
    setValue('tipo', tipo)
  }

  async function handleDownload(tipo, formato) {
    const key = `${tipo}-${formato}`
    setLoadingKey(key)
    try {
      const filename = await fetchAndDownloadReport(tipo, formato, getParams(tipo))
      toast.success(`${t('Descarga iniciada')}: ${filename}`)
    } catch (err) {
      toast.error(err.message ?? t('Error al descargar el reporte'))
    } finally {
      setLoadingKey(null)
    }
  }

  async function onSendEmail(data) {
    setSendingEmail(true)
    try {
      await enviarReporte(data.tipo, data.formato, data.email, getParams(data.tipo))
      toast.success(`${t('Reporte enviado a')} ${data.email}`)
      setEmailModal(null)
    } catch (err) {
      toast.error(apiErrorMessage(err, t('Error al enviar el reporte')))
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title={t('Informes Gerenciales')}
        description={t('Reportes profesionales de bodega en PDF y Excel con envío por correo')}
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {reports.map(({ tipo, title, description, icon: Icon, color, highlights, hasDateFilter }) => (
          <Card
            key={tipo}
            className="group flex cursor-pointer flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-amber-500/10"
          >
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${color}`}>
                  <Icon size={22} />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base leading-snug">{title}</CardTitle>
                  <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">{description}</p>
                  <ul className="mt-2 flex flex-wrap gap-1">
                    {highlights.map((h) => (
                      <li
                        key={h}
                        className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600"
                      >
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardHeader>
            <CardContent className="mt-auto space-y-2 pt-0">
              {hasDateFilter && (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-600">
                    <Calendar size={13} />
                    {t('Período del informe')}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-500">{t('Desde')}</label>
                      <input
                        type="date"
                        value={dateFilters.fecha_desde}
                        onChange={(e) => setDateFilters((s) => ({ ...s, fecha_desde: e.target.value }))}
                        className="mt-0.5 h-8 w-full rounded-md border border-zinc-300 px-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500">{t('Hasta')}</label>
                      <input
                        type="date"
                        value={dateFilters.fecha_hasta}
                        onChange={(e) => setDateFilters((s) => ({ ...s, fecha_hasta: e.target.value }))}
                        className="mt-0.5 h-8 w-full rounded-md border border-zinc-300 px-2 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  loading={loadingKey === `${tipo}-pdf`}
                  disabled={!!loadingKey}
                  onClick={() => handleDownload(tipo, 'pdf')}
                >
                  <FileText size={15} />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  loading={loadingKey === `${tipo}-excel`}
                  disabled={!!loadingKey}
                  onClick={() => handleDownload(tipo, 'excel')}
                >
                  <FileSpreadsheet size={15} />
                  Excel
                </Button>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => openEmailModal(tipo)}
              >
                <Mail size={15} />
                {t('Enviar por correo')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex items-start gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
        <BarChart3 size={18} className="mt-0.5 shrink-0 text-zinc-500" />
        <p>
          {t('Todos los informes incluyen portada profesional con logo, fecha y período. Los archivos Excel tienen hoja de resumen ejecutivo, formato de moneda y resaltado condicional para stock crítico.')}
        </p>
      </div>

      <Modal
        open={!!emailModal}
        onClose={() => setEmailModal(null)}
        title={t('Enviar informe por correo')}
      >
        <form onSubmit={handleSubmit(onSendEmail)} className="space-y-4">
          <Input
            label={t('Correo electrónico')}
            type="email"
            placeholder="correo@ejemplo.com"
            error={errors.email?.message}
            {...register('email', {
              required: t('El correo es requerido'),
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: t('Correo inválido'),
              },
            })}
          />
          <div>
            <label className="text-sm font-medium text-zinc-700">{t('Tipo de informe')}</label>
            <select
              className="mt-1.5 h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm"
              {...register('tipo', { required: true })}
            >
              {reportOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700">{t('Formato')}</label>
            <select
              className="mt-1.5 h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm"
              {...register('formato', { required: true })}
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEmailModal(null)}>
              {t('Cancelar')}
            </Button>
            <Button type="submit" loading={sendingEmail}>
              <Mail size={15} />
              {t('Enviar')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
