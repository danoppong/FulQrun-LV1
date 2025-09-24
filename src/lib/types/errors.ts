// Standard error types for API responses

export interface ApiError {
  message: string
  code?: string
  details?: string
  hint?: string
}

export interface ApiResponse<T> {
  data: T | null
  error: ApiError | null
}

export interface SupabaseError extends ApiError {
  status?: number
  statusText?: string
}

// Helper function to normalize errors
export function normalizeError(error: unknown): ApiError {
  // Handle network errors specifically
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return {
      message: 'Network connection failed. Please check your internet connection and try again.',
      code: 'NETWORK_ERROR',
      details: 'The application could not connect to the server. This may be due to network issues or server unavailability.'
    }
  }

  // Handle fetch errors
  if (error instanceof Error && error.message.includes('fetch')) {
    return {
      message: 'Connection error. Please try again later.',
      code: 'CONNECTION_ERROR',
      details: error.message
    }
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const errorObj = error as Record<string, unknown>
    return {
      message: (errorObj.message as string) || 'Unknown error',
      code: errorObj.code as string,
      details: errorObj.details as string,
      hint: errorObj.hint as string
    }
  }
  
  return {
    message: error instanceof Error ? error.message : 'Unknown error'
  }
}
