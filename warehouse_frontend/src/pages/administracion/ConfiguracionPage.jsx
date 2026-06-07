import PageHeader from '@/components/layout/PageHeader'
import ConfiguracionPanel from '@/components/administracion/ConfiguracionPanel'
import { useT } from '@/hooks/useT'

export default function ConfiguracionPage() {
  const { t } = useT()
  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title={t('Configuración')}
        description={t('Ajustes del sistema, apariencia, notificaciones y seguridad')}
      />
      <ConfiguracionPanel />
    </div>
  )
}
