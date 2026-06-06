import { useState } from 'react'
import { FileSpreadsheet, FileText, Package, ArrowLeftRight, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { fetchAndDownloadReport } from '@/lib/download'

const REPORTS = [
  {
    tipo: 'inventario',
    title: 'Inventario',
    description: 'Lista completa de productos activos con stock actual, mínimo y precios.',
    icon: Package,
    color: 'text-zinc-700 bg-zinc-100',
  },
  {
    tipo: 'movimientos',
    title: 'Movimientos',
    description: 'Historial de entradas, salidas y traslados registrados en el sistema.',
    icon: ArrowLeftRight,
    color: 'text-blue-700 bg-blue-50',
  },
  {
    tipo: 'clientes',
    title: 'Clientes',
    description: 'Listado de clientes con puntos de fidelización y nivel de membresía.',
    icon: Users,
    color: 'text-violet-700 bg-violet-50',
  },
]

export default function ReportesPage() {
  const [loadingKey, setLoadingKey] = useState(null)

  async function handleDownload(tipo, formato) {
    const key = `${tipo}-${formato}`
    setLoadingKey(key)
    try {
      const filename = await fetchAndDownloadReport(tipo, formato)
      toast.success(`Descarga iniciada: ${filename}`)
    } catch (err) {
      toast.error(err.message ?? 'Error al descargar el reporte')
    } finally {
      setLoadingKey(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Reportes"
        description="Exporta datos del sistema en PDF o Excel"
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map(({ tipo, title, description, icon: Icon, color }) => (
          <Card key={tipo}>
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <CardTitle className="text-base">{title}</CardTitle>
                  <p className="mt-1 text-sm text-zinc-500">{description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex gap-2 pt-0">
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
