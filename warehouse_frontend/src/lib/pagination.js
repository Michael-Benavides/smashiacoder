export function toPaginationMeta(pagination) {
  if (!pagination) return null
  return {
    pagination: {
      pagina_actual: pagination.pagina_actual ?? pagination.current_page ?? 1,
      total_paginas: pagination.total_paginas ?? pagination.total_pages ?? 1,
      total_registros: pagination.total_registros ?? pagination.count ?? 0,
      pagina_siguiente: pagination.pagina_siguiente ?? pagination.next ?? null,
      pagina_anterior: pagination.pagina_anterior ?? pagination.previous ?? null,
    },
  }
}
