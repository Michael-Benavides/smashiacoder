export function getFieldError(details, field) {
  const val = details?.[field]
  if (!val) return undefined
  if (typeof val === 'string') return val
  if (Array.isArray(val)) return val[0]
  if (typeof val === 'object' && val?.message) return val.message
  return String(val)
}

export function applyApiErrors(err, setError) {
  const details = err.response?.data?.error?.details
  if (!details || typeof details !== 'object') return
  Object.keys(details).forEach((field) => {
    const msg = getFieldError(details, field)
    if (msg) setError(field, { message: msg })
  })
}

export function apiErrorMessage(err, fallback = 'Error en la operación') {
  return err.response?.data?.error?.message ?? fallback
}
