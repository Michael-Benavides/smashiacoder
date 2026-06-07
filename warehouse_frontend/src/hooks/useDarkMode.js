import { useEffect, useState } from 'react'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.classList.contains('dark'),
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  return isDark
}

export function resolveIconBg(lightColor, isDark) {
  const darkMap = {
    '#F0FDF4': '#16A34A22',
    '#EFF6FF': '#2563EB22',
    '#FEF3C7': '#D9770622',
    '#FEF2F2': '#DC262622',
    '#F5F3FF': '#7C3AED22',
  }
  return isDark ? (darkMap[lightColor] ?? lightColor) : lightColor
}
