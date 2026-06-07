import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import ChatbotFloat from '@/components/shared/ChatbotFloat'

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main
          className="flex-1 overflow-y-auto p-4 lg:p-6"
          style={{ padding: 'var(--density-padding, 1rem)' }}
        >
          <Outlet />
        </main>
      </div>
      <ChatbotFloat />
    </div>
  )
}
