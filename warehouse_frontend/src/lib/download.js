import { downloadReporte } from '@/api/administracion'

function parseFilename(contentDisposition, fallback) {
  if (!contentDisposition) return fallback
  const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
  if (match?.[1]) return match[1].replace(/['"]/g, '')
  return fallback
}

export function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function fetchAndDownloadReport(tipo, formato) {
  try {
    const res = await downloadReporte(tipo, formato)
    const ext = formato === 'pdf' ? 'pdf' : 'xlsx'
    const filename = parseFilename(
      res.headers['content-disposition'],
      `reporte_${tipo}_${Date.now()}.${ext}`
    )
    triggerBlobDownload(res.data, filename)
    return filename
  } catch (err) {
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text()
        const json = JSON.parse(text)
        throw new Error(json.error?.message ?? 'Error al descargar el reporte')
      } catch (parseErr) {
        if (parseErr.message && !parseErr.message.includes('JSON')) throw parseErr
      }
    }
    throw new Error(err.response?.data?.error?.message ?? err.message ?? 'Error al descargar')
  }
}
