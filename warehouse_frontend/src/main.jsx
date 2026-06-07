import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { router } from '@/router'
import { initPreferences } from '@/lib/theme'
import { initLanguage } from '@/lib/i18n'
import { useLanguageStore } from '@/store/languageStore'
import '@/index.css'

initPreferences()
const savedLang = initLanguage()
useLanguageStore.setState({ language: savedLang })

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontFamily: 'DM Sans', fontSize: '14px', borderRadius: '8px' },
        }}
      />
    </QueryClientProvider>
  </StrictMode>
)
