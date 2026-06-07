import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import ChatbotFloat from '@/components/shared/ChatbotFloat'

export default function Layout() {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ padding: 'var(--density-padding, 1.5rem)' }}
        >
          <Outlet />
        </main>
      </div>
      <ChatbotFloat />
    </div>
  )
}
