'use client'

import { useState, useEffect } from 'react'
import { Theme, getStoredTheme, applyTheme } from '@/lib/theme'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const storedTheme = getStoredTheme()
    setTheme(storedTheme)
    applyTheme(storedTheme)
    setMounted(true)
  }, [])

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  return {
    theme,
    changeTheme,
    mounted,
  }
}
