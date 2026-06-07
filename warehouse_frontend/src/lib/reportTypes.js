export const REPORTE_TIPO_MAP = {
  productos: 'inventario',
  clientes: 'clientes',
  proveedores: 'proveedores',
  movimientos: 'movimientos',
  inventario: 'inventario',
  general: 'general',
}

export function mapReporteTipo(tipo) {
  return REPORTE_TIPO_MAP[tipo] || 'inventario'
}
