'use client'

import React, { useState, useEffect } from 'react'
import { applyTheme, getStoredTheme, Theme } from '@/lib/theme'
import { SunIcon, MoonIcon, SwatchIcon } from '@heroicons/react/24/outline'

const themes: { key: Theme; name: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'light', name: 'Light', icon: SunIcon },
  { key: 'dark', name: 'Dark', icon: MoonIcon },
  { key: 'blue', name: 'Blue', icon: SwatchIcon },
  { key: 'purple', name: 'Purple', icon: SwatchIcon },
  { key: 'green', name: 'Green', icon: SwatchIcon },
  { key: 'orange', name: 'Orange', icon: SwatchIcon },
]

export default function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = getStoredTheme()
    setCurrentTheme(stored)
  }, [])

  const handleThemeChange = (theme: Theme) => {
    console.log('🎨 ThemeToggle: Changing theme to:', theme)
    applyTheme(theme)
    setCurrentTheme(theme)
  }

  if (!mounted) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-md bg-muted animate-pulse"></div>
        <span className="text-sm text-muted-foreground">Loading theme...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 p-4 bg-card rounded-lg border border-border">
      <span className="text-sm font-medium text-foreground mr-3">Theme:</span>
      <div className="flex space-x-1">
        {themes.map(({ key, name, icon: Icon }) => (
          <button
            key={key}
            onClick={() => handleThemeChange(key)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              currentTheme === key
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
            }`}
            title={`Switch to ${name} theme`}
          >
            <Icon className="w-4 h-4" />
            <span>{name}</span>
          </button>
        ))}
      </div>
      <div className="ml-4 text-xs text-muted-foreground">
        Current: <span className="font-medium text-foreground">{currentTheme}</span>
      </div>
    </div>
  )
}