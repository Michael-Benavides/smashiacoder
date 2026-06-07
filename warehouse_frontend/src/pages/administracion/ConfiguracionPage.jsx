import PageHeader from '@/components/layout/PageHeader'
import ConfiguracionPanel from '@/components/administracion/ConfiguracionPanel'

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Configuración"
        description="Ajustes del sistema, apariencia, notificaciones y seguridad"
      />
      <ConfiguracionPanel />
    </div>
  )
}
