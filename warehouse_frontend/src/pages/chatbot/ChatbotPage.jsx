import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Bot, RotateCcw, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { enviarMensajeChatbot } from '@/api/administracion'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { apiErrorMessage } from '@/lib/formUtils'
import { cn } from '@/lib/utils'

const MAX_CHARS = 4000

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-zinc-100 px-4 py-3">
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
    </div>
  )
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  function nuevaConversacion() {
    setMessages([])
    setInput('')
    inputRef.current?.focus()
  }

  async function handleSend() {
    const texto = input.trim()
    if (!texto || loading) return

    const userMsg = {
      role: 'user',
      content: texto,
      timestamp: new Date(),
    }

    const historial = messages.map(({ role, content }) => ({ role, content }))
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await enviarMensajeChatbot(texto, historial)
      const respuesta = res.data.data?.respuesta ?? res.data.data?.message ?? 'Sin respuesta'
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: respuesta, timestamp: new Date() },
      ])
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Error al enviar el mensaje'))
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: apiErrorMessage(err, 'No pude procesar tu mensaje. Intenta de nuevo.'),
          timestamp: new Date(),
          error: true,
        },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const charsLeft = MAX_CHARS - input.length

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white">
            <Bot size={18} />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-900">Asistente Warehouse IQ</h1>
            <Badge variant="success" className="mt-0.5">En línea</Badge>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={nuevaConversacion}>
          <RotateCcw size={14} />
          Nueva conversación
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length === 0 && !loading && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Bot size={40} className="mb-3 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-700">¿En qué puedo ayudarte?</p>
            <p className="mt-1 max-w-sm text-xs text-zinc-500">
              Consulta sobre inventario, movimientos, clientes, fidelización o reportes del sistema.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'rounded-br-md bg-zinc-900 text-white'
                    : cn(
                        'rounded-bl-md bg-zinc-100 text-zinc-800',
                        msg.error && 'border border-red-200 bg-red-50 text-red-800'
                      )
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <time className="mt-1 block text-[10px] opacity-60">
                  {format(msg.timestamp, 'HH:mm', { locale: es })}
                </time>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <TypingIndicator />
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-zinc-100 px-5 py-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            className="min-h-[44px] max-h-32 flex-1 resize-none rounded-xl border border-zinc-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="Escribe tu mensaje..."
            value={input}
            maxLength={MAX_CHARS}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={!input.trim() || loading} size="icon" className="shrink-0">
            <Send size={16} />
          </Button>
        </div>
        <p className={cn('mt-1.5 text-right text-xs', charsLeft < 200 ? 'text-amber-600' : 'text-zinc-400')}>
          {input.length} / {MAX_CHARS}
        </p>
      </div>
    </div>
  )
}
