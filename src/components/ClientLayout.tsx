'use client'
import React from 'react';

import { useState, useEffect, createContext } from 'react'
import Navigation from './Navigation';

interface ClientLayoutProps {
  children: React.ReactNode
}

// Create a context for sidebar state (optional - for future enhancements)
export const SidebarContext = createContext<{ collapsed: boolean }>({ collapsed: false })

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Always render the same structure to prevent hydration mismatches
  // Using CSS variable for dynamic padding based on sidebar state
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {mounted && <Navigation />}
      <main className={mounted ? "pt-16 lg:pt-0 lg:pl-72 transition-all duration-300" : ""}>
        <div className="px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
