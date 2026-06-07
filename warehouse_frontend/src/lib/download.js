import { downloadReporte } from '@/api/administracion'
import { mapReporteTipo } from '@/lib/reportTypes'

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

export async function fetchAndDownloadReport(tipo, formato, params = {}) {
  const tipoReal = mapReporteTipo(tipo)
  try {
    const res = await downloadReporte(tipoReal, formato, params)
    const ext = formato === 'pdf' ? 'pdf' : 'xlsx'
    const filename = parseFilename(
      res.headers['content-disposition'],
      `reporte_${tipoReal}_${Date.now()}.${ext}`
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
