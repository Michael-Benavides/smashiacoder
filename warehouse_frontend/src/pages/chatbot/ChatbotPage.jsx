import ChatbotPanel from '@/components/chatbot/ChatbotPanel'

export default function ChatbotPage() {
  return (
    <div className="animate-fade-in-up space-y-6">
      <ChatbotPanel className="h-[calc(100vh-8rem)] rounded-xl border border-zinc-200 shadow-sm dark:border-zinc-800" />
    </div>
  )
}
