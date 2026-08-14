import { useEffect, useState } from 'react'

const STORAGE_KEY = 'zt-console-theme'

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light'
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  // Mặc định luôn là light theo yêu cầu — không tự dò theo hệ điều hành,
  // để trải nghiệm lần đầu nhất quán (nền trắng) dù thiết bị đang ở dark mode.
  return 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  function toggleTheme() {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  }

  return { theme, toggleTheme }
}
