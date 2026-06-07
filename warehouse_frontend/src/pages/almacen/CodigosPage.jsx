import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Barcode, Download, Printer, QrCode } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useT } from '@/hooks/useT'
import { getLotesProducto, getProductos } from '@/api/inventario'

function formatFecha(iso) {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), 'dd/MM/yyyy', { locale: es })
  } catch {
    return iso
  }
}

function svgToPngBlob(svgEl, extraHeight = 0) {
  return new Promise((resolve, reject) => {
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height + extraHeight
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url)
        if (blob) resolve(blob)
        else reject(new Error('No se pudo generar la imagen'))
      }, 'image/png')
    }
    img.onerror = reject
    img.src = url
  })
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function CodigosPage() {
  const { t } = useT()
  const barcodeSvgRef = useRef(null)
  const barcodeWrapRef = useRef(null)
  const qrCanvasRef = useRef(null)

  const [productoId, setProductoId] = useState('')
  const [loteId, setLoteId] = useState('')
  const [showNombre, setShowNombre] = useState(true)
  const [showPrecio, setShowPrecio] = useState(false)

  const { data: productos = [] } = useQuery({
    queryKey: ['productos', 'codigos'],
    queryFn: async () => {
      const res = await getProductos({ solo_activos: true })
      return res.data.data ?? []
    },
  })

  const selectedProducto = useMemo(
    () => productos.find((p) => String(p.id) === productoId),
    [productos, productoId]
  )

  const { data: lotes = [] } = useQuery({
    queryKey: ['lotes-producto', productoId],
    queryFn: async () => {
      const res = await getLotesProducto(Number(productoId))
      return res.data.data ?? []
    },
    enabled: !!productoId,
  })

  const selectedLote = useMemo(
    () => lotes.find((l) => String(l.id) === loteId),
    [lotes, loteId]
  )

  useEffect(() => {
    setLoteId('')
  }, [productoId])

  useEffect(() => {
    if (!barcodeSvgRef.current || !selectedProducto?.codigo) return
    try {
      JsBarcode(barcodeSvgRef.current, selectedProducto.codigo, {
        format: 'CODE128',
        displayValue: true,
        fontSize: 14,
        height: 60,
        margin: 10,
      })
    } catch {
      // código inválido para barcode
    }
  }, [selectedProducto])

  useEffect(() => {
    if (!qrCanvasRef.current || !selectedLote || !selectedProducto) return
    const data = {
      producto: selectedProducto.nombre,
      codigo: selectedProducto.codigo,
      lote: selectedLote.numero_lote,
      fecha_ingreso: selectedLote.fecha_ingreso,
      fecha_vencimiento: selectedLote.fecha_vencimiento,
      cantidad: selectedLote.cantidad,
    }
    QRCode.toCanvas(qrCanvasRef.current, JSON.stringify(data), { width: 200, margin: 2 })
  }, [selectedLote, selectedProducto])

  async function downloadBarcodePng() {
    if (!barcodeSvgRef.current || !selectedProducto) return
    try {
      let extra = 0
      const wrap = barcodeWrapRef.current
      if (wrap && (showNombre || showPrecio)) {
        const lines = [showNombre && selectedProducto.nombre, showPrecio && `${t('Precio')}: $${selectedProducto.precio_venta}`].filter(Boolean)
        extra = lines.length * 22 + 10
      }
      const blob = await svgToPngBlob(barcodeSvgRef.current, extra)
      if (extra > 0) {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        await new Promise((res, rej) => {
          img.onload = res
          img.onerror = rej
          img.src = URL.createObjectURL(blob)
        })
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        ctx.fillStyle = '#111'
        ctx.font = '14px DM Sans, sans-serif'
        ctx.textAlign = 'center'
        let y = img.height - extra + 18
        if (showNombre) { ctx.fillText(selectedProducto.nombre, canvas.width / 2, y); y += 22 }
        if (showPrecio) ctx.fillText(`${t('Precio')}: $${selectedProducto.precio_venta}`, canvas.width / 2, y)
        const finalBlob = await new Promise((r) => canvas.toBlob(r, 'image/png'))
        downloadBlob(finalBlob, `barcode_${selectedProducto.codigo}.png`)
      } else {
        downloadBlob(blob, `barcode_${selectedProducto.codigo}.png`)
      }
      toast.success(t('Código de barras descargado'))
    } catch {
      toast.error(t('Error al generar la imagen'))
    }
  }

  function downloadQrPng() {
    if (!qrCanvasRef.current || !selectedLote) return
    qrCanvasRef.current.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, `qr_${selectedLote.numero_lote}.png`)
        toast.success(t('QR descargado'))
      }
    })
  }

  function printQrLabel() {
    if (!selectedLote || !selectedProducto) return
    const win = window.open('', '_blank', 'width=400,height=500')
    if (!win) {
      toast.error(t('Permite ventanas emergentes para imprimir'))
      return
    }
    const qrDataUrl = qrCanvasRef.current?.toDataURL('image/png') ?? ''
    win.document.write(`
      <!DOCTYPE html>
      <html><head><title>${t('Etiqueta')} ${selectedLote.numero_lote}</title>
      <style>
        body { font-family: sans-serif; padding: 24px; text-align: center; }
        h2 { margin: 0 0 8px; font-size: 16px; }
        p { margin: 4px 0; font-size: 13px; color: #444; }
        img { margin: 12px 0; }
      </style></head><body>
        <h2>${selectedProducto.nombre}</h2>
        <p>${t('Código')}: ${selectedProducto.codigo}</p>
        <p>${t('Lote')}: ${selectedLote.numero_lote}</p>
        <img src="${qrDataUrl}" width="180" />
        <p>${t('Ingreso')}: ${formatFecha(selectedLote.fecha_ingreso)}</p>
        <p>${t('Vence')}: ${formatFecha(selectedLote.fecha_vencimiento)}</p>
        <p>${t('Cantidad')}: ${selectedLote.cantidad} ${t('uds.')}</p>
      </body></html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title={t('Códigos QR y Barras')}
        description={t('Genera etiquetas para productos y lotes')}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Barcode size={18} />
              {t('Código de barras')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-700">{t('Producto')}</label>
              <select
                className="mt-1.5 h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm"
                value={productoId}
                onChange={(e) => setProductoId(e.target.value)}
              >
                <option value="">{t('Seleccionar producto...')}</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>{p.codigo} — {p.nombre}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={showNombre} onChange={(e) => setShowNombre(e.target.checked)} />
                {t('Mostrar nombre')}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={showPrecio} onChange={(e) => setShowPrecio(e.target.checked)} />
                {t('Mostrar precio')}
              </label>
            </div>

            <div
              ref={barcodeWrapRef}
              className="flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-6"
              style={{ animation: 'fadeInUp 0.5s ease forwards' }}
            >
              {selectedProducto ? (
                <>
                  <svg ref={barcodeSvgRef} />
                  {showNombre && (
                    <p className="mt-2 text-sm font-medium text-zinc-800">{selectedProducto.nombre}</p>
                  )}
                  {showPrecio && (
                    <p className="text-sm text-zinc-600">{t('Precio')}: ${selectedProducto.precio_venta}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-zinc-400">{t('Selecciona un producto para generar el código')}</p>
              )}
            </div>

            <Button onClick={downloadBarcodePng} disabled={!selectedProducto} className="w-full">
              <Download size={16} />
              {t('Descargar PNG')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <QrCode size={18} />
              {t('Código QR (lote)')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-700">{t('Producto')}</label>
              <select
                className="mt-1.5 h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm"
                value={productoId}
                onChange={(e) => setProductoId(e.target.value)}
              >
                <option value="">{t('Seleccionar producto...')}</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>{p.codigo} — {p.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700">{t('Lote')}</label>
              <select
                className="mt-1.5 h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm"
                value={loteId}
                onChange={(e) => setLoteId(e.target.value)}
                disabled={!productoId}
              >
                <option value="">{t('Seleccionar lote...')}</option>
                {lotes.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.numero_lote} — {l.cantidad} {t('uds.')}
                  </option>
                ))}
              </select>
              {productoId && lotes.length === 0 && (
                <p className="mt-1 text-xs text-zinc-500">{t('Sin lotes. Registra una entrada primero.')}</p>
              )}
            </div>

            <div
              className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-6"
              style={{ animation: 'fadeInUp 0.5s ease forwards' }}
            >
              {selectedLote && selectedProducto ? (
                <>
                  <canvas ref={qrCanvasRef} />
                  <div className="mt-3 text-center text-xs text-zinc-600">
                    <p className="font-medium">{selectedLote.numero_lote}</p>
                    <p>{t('Ingreso')}: {formatFecha(selectedLote.fecha_ingreso)}</p>
                    <p>{t('Cantidad')}: {selectedLote.cantidad}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-zinc-400">{t('Selecciona producto y lote')}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={downloadQrPng} disabled={!selectedLote} variant="outline" className="flex-1">
                <Download size={16} />
                {t('Descargar PNG')}
              </Button>
              <Button onClick={printQrLabel} disabled={!selectedLote} className="flex-1">
                <Printer size={16} />
                {t('Imprimir etiqueta')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
