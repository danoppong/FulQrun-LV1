'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: 'page' | 'component' | 'critical'
  context?: string
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId?: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component', context } = this.props
    
    // Enhanced error logging
    const errorDetails = {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      level,
      context: context || 'Unknown',
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Server',
      url: typeof window !== 'undefined' ? window.location.href : 'Server',
      errorId: this.state.errorId
    }

    console.error('ErrorBoundary caught an error:', errorDetails)

    // Send to error reporting service (if configured)
    if (typeof window !== 'undefined' && (window as Window & { gtag?: (command: string, action: string, parameters: Record<string, unknown>) => void }).gtag) {
      ((window as any).gtag)('event', 'exception', {
        description: error.message,
        fatal: level === 'critical',
        custom_map: {
          error_id: this.state.errorId,
          error_level: level,
          error_context: context
        }
      })
    }

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo)
    }

    this.setState({ errorInfo })
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, errorId: undefined })
  }

  private handleReportError = () => {
    const { error, errorId } = this.state
    const errorReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'Server',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Server'
    }
    
    // In a real app, send this to your error reporting service
    console.log('Error report:', errorReport)
    alert('Error reported successfully. Thank you for your feedback!')
  }

  render() {
    if (this.state.hasError) {
      const { level = 'component', context, fallback } = this.props
      
      // Custom fallback UI
      if (fallback) {
        return fallback
      }

      if (level === 'critical') {
        return this.renderCriticalError()
      }
      
      if (level === 'page') {
        return this.renderPageError()
      }
      
      return this.renderComponentError()
    }

    return this.props.children
  }

  private renderCriticalError() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="max-w-lg w-full bg-white shadow-xl rounded-lg p-8">
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0">
              <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">Critical Error</h1>
              <p className="text-gray-600">A critical error has occurred and the application cannot continue.</p>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <h3 className="text-sm font-medium text-red-800 mb-2">Error Details</h3>
            <p className="text-sm text-red-700 font-mono">{this.state.error?.message}</p>
            <p className="text-xs text-red-600 mt-2">Error ID: {this.state.errorId}</p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Reload Application
            </button>
            <button
              onClick={this.handleReportError}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Report Error
            </button>
          </div>
        </div>
      </div>
    )
  }

  private renderPageError() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-800">Page Error</h3>
              <p className="text-sm text-gray-500">Something went wrong on this page.</p>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
            <p className="text-sm text-gray-700 font-mono">{this.state.error?.message}</p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={this.handleRetry}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Try Again
            </button>
            <button
              onClick={() => window.history.back()}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  private renderComponentError() {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Component Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>This component encountered an error. {this.props.context && `Context: ${this.props.context}`}</p>
            </div>
            <div className="mt-3">
              <button
                onClick={this.handleRetry}
                className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  return (error: Error, errorInfo?: string) => {
    console.error('Error caught by useErrorHandler:', error, errorInfo)
    
    // In production, you might want to log to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: log to error reporting service
      // errorReportingService.captureException(error, { extra: errorInfo })
    }
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}