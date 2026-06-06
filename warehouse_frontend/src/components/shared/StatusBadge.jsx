import { Badge } from '@/components/ui/Badge'

const statusMap = {
  activo: 'success',
  inactivo: 'default',
  pendiente: 'warning',
  error: 'danger',
  info: 'info',
}

export default function StatusBadge({ status, label }) {
  const variant = statusMap[status?.toLowerCase()] ?? 'default'
  return <Badge variant={variant}>{label ?? status}</Badge>
}
