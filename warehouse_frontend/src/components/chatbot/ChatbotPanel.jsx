import { useEffect, useRef, useState } from 'react'
import { es, enUS } from 'date-fns/locale'
import { Bot, RotateCcw, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { enviarMensajeChatbot } from '@/api/administracion'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ChatbotMessage } from '@/components/chatbot/ChatbotMessage'
import { useT } from '@/hooks/useT'
import { apiErrorMessage } from '@/lib/formUtils'
import { cn } from '@/lib/utils'

const MAX_CHARS = 4000

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-zinc-100 p-5">
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
    </div>
  )
}

export default function ChatbotPanel({
  className,
  headerExtra,
  showNewChat = true,
  compact = false,
}) {
  const { t, language } = useT()
  const locale = language === 'en' ? enUS : es

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

    const userMsg = { role: 'user', content: texto, timestamp: new Date() }
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
          content: apiErrorMessage(err, 'No pude procesar tu mensaje.'),
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
    <div className={cn('flex flex-col overflow-hidden bg-white', className)}>
      <div className="flex items-center justify-between border-b border-zinc-100 p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-900 text-white">
            <Bot size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">{t('Asistente SmashIACodeR')}</h2>
            <Badge variant="success" className="mt-0.5">{t('En línea')}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {headerExtra}
          {showNewChat && (
            <Button variant="ghost" size="sm" onClick={nuevaConversacion}>
              <RotateCcw size={14} />
              {!compact && t('Nueva conversación')}
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {messages.length === 0 && !loading && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Bot size={compact ? 32 : 40} className="mb-3 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-700">{t('¿En qué puedo ayudarte?')}</p>
          </div>
        )}
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <ChatbotMessage key={i} msg={msg} locale={locale} />
          ))}
          {loading && (
            <div className="flex justify-start">
              <TypingIndicator />
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-zinc-100 p-5">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            className="min-h-[40px] max-h-24 flex-1 resize-none rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder={t('Escribe un mensaje...')}
            value={input}
            maxLength={MAX_CHARS}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={!input.trim() || loading} size="icon" className="shrink-0">
            <Send size={15} />
          </Button>
        </div>
        {!compact && (
          <p className={cn('mt-1 text-right text-xs', charsLeft < 200 ? 'text-amber-600' : 'text-zinc-400')}>
            {input.length} / {MAX_CHARS}
          </p>
        )}
      </div>
    </div>
  )
}
