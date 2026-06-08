import { useState } from 'react'
import Markdown from 'react-markdown'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { fetchAndDownloadReport } from '@/lib/download'
import { useT } from '@/hooks/useT'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const PDF_PATTERN = /GENERAR_PDF:(clientes|productos|proveedores|movimientos|inventario)/i

export function parseAssistantContent(content) {
  const match = content?.match(PDF_PATTERN)
  if (match) {
    return { type: 'pdf', reportType: match[1].toLowerCase() }
  }
  return { type: 'text', content: content ?? '' }
}

function PdfDownloadBubble({ reportType }) {
  const { t } = useT()
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const filename = await fetchAndDownloadReport(reportType, 'pdf')
      toast.success(`Descarga: ${filename}`)
    } catch (err) {
      toast.error(err.message ?? 'Error al descargar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm">{t('El listado es muy extenso. Te lo preparo como PDF para descarga.')}</p>
      <Button variant="gold" size="sm" loading={loading} onClick={handleDownload}>
        📄 {t('Descargar PDF')}
      </Button>
    </div>
  )
}

export function ChatbotMessage({ msg, locale = es }) {
  const parsed = msg.role === 'assistant' ? parseAssistantContent(msg.content) : null

  return (
    <div
      className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
      style={{ opacity: 0, animation: 'fadeInUp 0.3s ease forwards' }}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl p-5 text-sm leading-relaxed',
          msg.role === 'user'
            ? 'rounded-br-md bg-zinc-900 text-white'
            : cn(
                'rounded-bl-md bg-zinc-100 text-zinc-800',
                msg.error && 'border border-red-200 bg-red-50 text-red-800',
              ),
        )}
      >
        {msg.role === 'assistant' && parsed?.type === 'pdf' ? (
          <PdfDownloadBubble reportType={parsed.reportType} />
        ) : msg.role === 'assistant' ? (
          <div className="chat-markdown prose prose-sm max-w-none prose-p:my-1 prose-table:my-2">
            <Markdown
              components={{
                table: ({ children }) => (
                  <div className="my-2 overflow-x-auto rounded-lg border border-zinc-200">
                    <table className="w-full p-5 text-left text-xs">{children}</table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-zinc-900 text-zinc-100">{children}</thead>
                ),
                tbody: ({ children }) => <tbody className="divide-y divide-zinc-100">{children}</tbody>,
                tr: ({ children, ...props }) => {
                  const rowIndex = props['data-row-index']
                  return (
                    <tr className={rowIndex % 2 === 1 ? 'bg-zinc-50/80' : 'bg-white'}>
                      {children}
                    </tr>
                  )
                },
                th: ({ children }) => (
                  <th className="px-5 py-5 font-semibold">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="px-5 py-5 text-zinc-700">{children}</td>
                ),
              }}
            >
              {msg.content}
            </Markdown>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        )}
        <time className="mt-1 block text-xs opacity-60">
          {format(msg.timestamp, 'HH:mm', { locale })}
        </time>
      </div>
    </div>
  )
}
