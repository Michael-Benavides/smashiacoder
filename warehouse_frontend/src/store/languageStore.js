import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useLanguageStore = create(
  persist(
    (set) => ({
      language: 'es',
      setLanguage: (lang) => {
        localStorage.setItem('wi_language', lang)
        document.documentElement.setAttribute('lang', lang)
        set({ language: lang })
      },
    }),
    {
      name: 'wi-language',
      onRehydrateStorage: () => (state) => {
        if (state?.language) {
          document.documentElement.setAttribute('lang', state.language)
          localStorage.setItem('wi_language', state.language)
        }
      },
    },
  ),
)
