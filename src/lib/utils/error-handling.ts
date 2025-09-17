/**
 * Standardized Error Handling Utilities
 * Provides consistent error handling patterns across the application
 */

import { ApiError } from '@/lib/types/errors'

export interface ErrorHandlerOptions {
  showToast?: boolean
  logError?: boolean
  fallbackMessage?: string
}

export class ErrorHandler {
  /**
   * Handle API errors consistently
   */
  static handleApiError(error: ApiError | Error, options: ErrorHandlerOptions = {}): string {
    const { showToast = false, logError = true, fallbackMessage = 'An unexpected error occurred' } = options

    let errorMessage = fallbackMessage

    if (error && typeof error === 'object') {
      if ('message' in error && typeof error.message === 'string') {
        errorMessage = error.message
      } else if ('details' in error && Array.isArray(error.details)) {
        errorMessage = (error as any).details.join(', ')
      }
    }

    if (logError) {
      console.error('API Error:', error)
    }

    if (showToast) {
      // TODO: Implement toast notification system
      console.warn('Toast notification not implemented:', errorMessage)
    }

    return errorMessage
  }

  /**
   * Handle form validation errors
   */
  static handleValidationErrors(errors: string[]): string[] {
    if (!Array.isArray(errors)) {
      return ['Invalid validation data']
    }
    return errors.filter(error => typeof error === 'string' && error.trim().length > 0)
  }

  /**
   * Handle async operation errors
   */
  static async handleAsyncError<T>(
    operation: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      const data = await operation()
      return { data, error: null }
    } catch (error) {
      const errorMessage = this.handleApiError(error as ApiError, options)
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Handle component state errors
   */
  static handleComponentError(error: unknown, setError: (error: string) => void): void {
    const errorMessage = this.handleApiError(error as ApiError, { logError: true })
    setError(errorMessage)
  }

  /**
   * Handle loading state errors
   */
  static handleLoadingError(
    error: unknown,
    setError: (error: string) => void,
    setLoading: (loading: boolean) => void
  ): void {
    this.handleComponentError(error, setError)
    setLoading(false)
  }
}

/**
 * React hook for consistent error handling
 */
export function useErrorHandler() {
  const handleError = (error: unknown, setError: (error: string) => void) => {
    ErrorHandler.handleComponentError(error, setError)
  }

  const handleLoadingError = (
    error: unknown,
    setError: (error: string) => void,
    setLoading: (loading: boolean) => void
  ) => {
    ErrorHandler.handleLoadingError(error, setError, setLoading)
  }

  const handleAsyncOperation = async <T>(
    operation: () => Promise<T>,
    setError: (error: string) => void,
    setLoading: (loading: boolean) => void
  ): Promise<T | null> => {
    setLoading(true)
    setError('')

    try {
      const result = await operation()
      setLoading(false)
      return result
    } catch (error) {
      ErrorHandler.handleLoadingError(error, setError, setLoading)
      return null
    }
  }

  return {
    handleError,
    handleLoadingError,
    handleAsyncOperation
  }
}

