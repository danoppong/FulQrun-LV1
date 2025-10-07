'use client'
import React from 'react';

import { useTheme } from '@/hooks/useTheme'
import { themes, Theme } from '@/lib/theme'
import { CheckIcon } from '@heroicons/react/24/outline';

export default function ThemeSelector() {
  const { theme, changeTheme, mounted } = useTheme()

  if (!mounted) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-foreground">Theme</h3>
        <p className="text-sm text-muted-foreground">
          Choose your preferred color scheme
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(themes).map(([key, config]) => (
          <button
            key={key}
            onClick={() => changeTheme(key as Theme)}
            className={`relative p-3 rounded-lg border-2 transition-all duration-200 ${
              theme === key
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: config.colors.primary }}
              />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-foreground">
                  {config.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {key}
                </div>
              </div>
              {theme === key && (
                <CheckIcon className="w-5 h-5 text-primary" />
              )}
            </div>
            
            {/* Color preview */}
            <div className="mt-2 flex space-x-1">
              <div
                className="w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: config.colors.background }}
              />
              <div
                className="w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: config.colors.card }}
              />
              <div
                className="w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: config.colors.secondary }}
              />
              <div
                className="w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: config.colors.muted }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
