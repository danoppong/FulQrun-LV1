'use client'
import React from 'react';

import { useEffect, useState } from 'react'
import { getStoredTheme, applyTheme } from '@/lib/theme';

interface ThemeProviderProps {
  children: React.ReactNode
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Apply theme after component mounts to prevent hydration mismatches
    const theme = getStoredTheme()
    applyTheme(theme)
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}
