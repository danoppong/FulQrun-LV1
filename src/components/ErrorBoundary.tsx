'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // In production, you might want to log to an error reporting service
    // Example: logErrorToService(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI or use the provided fallback
      return this.props.fallback || <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error?: Error
}

export function ErrorFallback({ error }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="bg-white p-8 rounded-lg shadow">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          
          {process.env.NODE_ENV === 'development' && error && (
            <details className="text-left text-sm text-gray-500 mb-4">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Refresh Page
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook for functional components to trigger error boundaries
export function useErrorHandler() {
  return (error: Error) => {
    throw error
  }
}

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}
