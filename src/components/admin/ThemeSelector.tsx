'use client'

import React, { useState, useEffect } from 'react'
import { applyTheme, getStoredTheme, Theme, themes } from '@/lib/theme'
import { SunIcon, MoonIcon, SwatchIcon } from '@heroicons/react/24/outline'

const themeIcons: Record<Theme, React.ComponentType<{ className?: string }>> = {
  light: SunIcon,
  dark: MoonIcon,
  blue: SwatchIcon,
  purple: SwatchIcon,
  green: SwatchIcon,
  orange: SwatchIcon,
}

export default function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = getStoredTheme()
    setCurrentTheme(stored)
  }, [])

  const handleThemeChange = (theme: Theme) => {
    applyTheme(theme)
    setCurrentTheme(theme)
  }

  if (!mounted) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Choose Theme</h3>
        <p className="text-sm text-muted-foreground">
          Select your preferred color scheme. Changes apply instantly.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(themes).map(([key, config]) => {
          const themeKey = key as Theme
          const Icon = themeIcons[themeKey]
          const isSelected = currentTheme === themeKey

          return (
            <button
              key={themeKey}
              onClick={() => handleThemeChange(themeKey)}
              className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                isSelected
                  ? 'border-primary bg-primary/10 shadow-md'
                  : 'border-border hover:border-primary/50 hover:bg-accent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-md ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-foreground">{config.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{themeKey}</div>
                </div>
              </div>
              
              {/* Color Preview */}
              <div className="mt-3 flex space-x-1">
                <div 
                  className="w-6 h-3 rounded-sm" 
                  style={{ backgroundColor: config.colors.primary }}
                />
                <div 
                  className="w-6 h-3 rounded-sm" 
                  style={{ backgroundColor: config.colors.secondary }}
                />
                <div 
                  className="w-6 h-3 rounded-sm" 
                  style={{ backgroundColor: config.colors.background }}
                />
              </div>

              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <div className="text-sm">
          <strong>Current Theme:</strong> {themes[currentTheme].name}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Theme preference is automatically saved and will persist across sessions.
        </div>
      </div>
    </div>
  )
}