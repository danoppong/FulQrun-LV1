'use client'

import { useEffect } from 'react'
import { getStoredTheme, applyTheme } from '@/lib/theme'

interface ThemeProviderProps {
  children: React.ReactNode
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    const theme = getStoredTheme()
    applyTheme(theme)
  }, [])

  return <>{children}</>
}
