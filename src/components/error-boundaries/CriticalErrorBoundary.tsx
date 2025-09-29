'use client'

import React from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

interface CriticalErrorBoundaryProps {
  children: React.ReactNode
  context?: string
}

export function CriticalErrorBoundary({ children, context }: CriticalErrorBoundaryProps) {
  return (
    <ErrorBoundary
      level="critical"
      context={context || 'Critical System'}
      onError={(error, errorInfo) => {
        // Log critical errors with highest priority
        console.error(`CRITICAL ERROR in ${context}:`, error, errorInfo)
        
        // Send immediate alerts for critical errors
        if (typeof window !== 'undefined') {
          // Send to error reporting service immediately
          if ((window as Window & { gtag?: (command: string, action: string, parameters: Record<string, unknown>) => void }).gtag) {
            ((window as Window & { gtag: (command: string, action: string, parameters: Record<string, unknown>) => void }).gtag)('event', 'exception', {
              description: error.message,
              fatal: true,
              custom_map: {
                error_level: 'critical',
                error_context: context
              }
            })
          }
          
          // In production, you might want to send to a monitoring service
          if (process.env.NODE_ENV === 'production') {
            // Example: Sentry.captureException(error, { level: 'fatal', tags: { context } })
          }
        }
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
