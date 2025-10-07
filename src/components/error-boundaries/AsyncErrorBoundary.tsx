'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface AsyncErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  context?: string
}

interface AsyncErrorBoundaryState {
  hasError: boolean
  error?: Error
  retryCount: number
}

export class AsyncErrorBoundary extends Component<AsyncErrorBoundaryProps, AsyncErrorBoundaryState> {
  private retryTimeoutId?: NodeJS.Timeout

  constructor(props: AsyncErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, retryCount: 0 }
  }

  static getDerivedStateFromError(error: Error): Partial<AsyncErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, context } = this.props
    
    console.error(`Async Error in ${context}:`, error, errorInfo)
    
    if (onError) {
      onError(error, errorInfo)
    }

    // Auto-retry for certain types of errors
    if (this.shouldAutoRetry(error)) {
      this.scheduleRetry()
    }
  }

  private shouldAutoRetry(error: Error): boolean {
    const retryableErrors = [
      'NetworkError',
      'TimeoutError',
      'ChunkLoadError',
      'Loading chunk'
    ]
    
    return retryableErrors.some(errorType => 
      error.message.includes(errorType) || error.name.includes(errorType)
    ) && this.state.retryCount < 3
  }

  private scheduleRetry = () => {
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000) // Exponential backoff, max 10s
    
    this.retryTimeoutId = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        retryCount: prevState.retryCount + 1
      }))
    }, delay)
  }

  private handleManualRetry = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
    
    this.setState({
      hasError: false,
      error: undefined,
      retryCount: this.state.retryCount + 1
    })
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  render() {
    if (this.state.hasError) {
      const { fallback, context } = this.props
      const { error, retryCount } = this.state

      if (fallback) {
        return fallback
      }

      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Loading Error
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  {context && `Failed to load ${context}. `}
                  {retryCount > 0 && `Retry attempt ${retryCount}/3. `}
                  {error?.message}
                </p>
              </div>
              <div className="mt-3">
                <button
                  onClick={this.handleManualRetry}
                  disabled={retryCount >= 3}
                  className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {retryCount >= 3 ? 'Max retries reached' : 'Retry Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
