import { useLanguageStore } from '@/store/languageStore'
import { t as translate } from '@/lib/i18n'

export function useT() {
  const language = useLanguageStore((s) => s.language)
  return {
    t: (key) => translate(key, language),
    language,
  }
}
