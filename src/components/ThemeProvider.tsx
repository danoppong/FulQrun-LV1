'use client'
import React from 'react'

import { useEffect } from 'react'
import { getStoredTheme, applyTheme } from '@/lib/theme'

interface ThemeProviderProps {
  children: React.ReactNode
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    // Theme is already applied via the head script, but we can sync any changes
    const theme = getStoredTheme()
    applyTheme(theme)
  }, [])

  return <>{children}</>
}
