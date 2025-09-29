'use client'
import React from 'react'

import { useState, useEffect } from 'react'
import Navigation from './Navigation'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Always render the same structure to prevent hydration mismatches
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {mounted && <Navigation />}
      <main className={mounted ? "lg:pl-72" : ""}>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
