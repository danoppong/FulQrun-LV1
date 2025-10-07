'use client'

import React from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface ComponentErrorBoundaryProps {
  children: React.ReactNode
  componentName?: string
  fallback?: React.ReactNode
}

export function ComponentErrorBoundary({ 
  children, 
  componentName, 
  fallback 
}: ComponentErrorBoundaryProps) {
  return (
    <ErrorBoundary
      level="component"
      context={componentName || 'Unknown Component'}
      fallback={fallback}
      onError={(error, errorInfo) => {
        // Log component-specific errors
        console.error(`Component Error in ${componentName}:`, error, errorInfo)
        
        // In production, send to error reporting service
        if (process.env.NODE_ENV === 'production') {
          // Example: Sentry.captureException(error, { tags: { component: componentName } })
        }
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
