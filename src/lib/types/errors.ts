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
  if (error && typeof error === 'object' && 'message' in error) {
    return {
      message: (error as any).message || 'Unknown error',
      code: (error as any).code,
      details: (error as any).details,
      hint: (error as any).hint
    }
  }
  
  return {
    message: error instanceof Error ? error.message : 'Unknown error'
  }
}
