import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useT } from '@/hooks/useT'

export function ConfirmDialog({ open, onClose, onConfirm, title, description, loading }) {
  const { t } = useT()

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-zinc-600 mb-6">{description}</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>{t('Cancelar')}</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>{t('Eliminar')}</Button>
      </div>
    </Modal>
  )
}
