'use client'

import React from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface PageErrorBoundaryProps {
  children: React.ReactNode
  pageName?: string
}

export function PageErrorBoundary({ children, pageName }: PageErrorBoundaryProps) {
  return (
    <ErrorBoundary
      level="page"
      context={pageName || 'Unknown Page'}
      onError={(error, errorInfo) => {
        // Log page-specific errors
        console.error(`Page Error in ${pageName}:`, error, errorInfo)
        
        // In production, send to error reporting service
        if (process.env.NODE_ENV === 'production') {
          // Example: Sentry.captureException(error, { tags: { page: pageName } })
        }
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
