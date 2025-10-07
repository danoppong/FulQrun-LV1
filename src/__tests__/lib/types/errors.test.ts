import { normalizeError, ApiError, ApiResponse, SupabaseError } from '@/lib/types/errors';

describe('Error Types', () => {
  describe('normalizeError', () => {
    it('should handle network errors', () => {
      const error = new TypeError('Failed to fetch')
      
      const result = normalizeError(error)
      
      expect(result.message).toBe('Network connection failed. Please check your internet connection and try again.')
      expect(result.code).toBe('NETWORK_ERROR')
      expect(result.details).toContain('network issues')
    })

    it('should handle fetch errors', () => {
      const error = new Error('fetch failed')
      
      const result = normalizeError(error)
      
      expect(result.message).toBe('Connection error. Please try again later.')
      expect(result.code).toBe('CONNECTION_ERROR')
      expect(result.details).toBe('fetch failed')
    })

    it('should handle error objects with message', () => {
      const error = {
        message: 'Custom error message',
        code: 'CUSTOM_ERROR',
        details: 'Error details',
        hint: 'Error hint'
      }
      
      const result = normalizeError(error)
      
      expect(result.message).toBe('Custom error message')
      expect(result.code).toBe('CUSTOM_ERROR')
      expect(result.details).toBe('Error details')
      expect(result.hint).toBe('Error hint')
    })

    it('should handle Error instances', () => {
      const error = new Error('Standard error message')
      
      const result = normalizeError(error)
      
      expect(result.message).toBe('Standard error message')
    })

    it('should handle unknown errors', () => {
      const error = 'string error'
      
      const result = normalizeError(error)
      
      expect(result.message).toBe('Unknown error')
    })

    it('should handle null/undefined errors', () => {
      const result = normalizeError(null)
      
      expect(result.message).toBe('Unknown error')
    })
  })

  describe('ApiError interface', () => {
    it('should allow optional properties', () => {
      const error: ApiError = {
        message: 'Required message'
      }
      
      expect(error.message).toBe('Required message')
      expect(error.code).toBeUndefined()
      expect(error.details).toBeUndefined()
      expect(error.hint).toBeUndefined()
    })

    it('should allow all properties', () => {
      const error: ApiError = {
        message: 'Error message',
        code: 'ERROR_CODE',
        details: 'Error details',
        hint: 'Error hint'
      }
      
      expect(error.message).toBe('Error message')
      expect(error.code).toBe('ERROR_CODE')
      expect(error.details).toBe('Error details')
      expect(error.hint).toBe('Error hint')
    })
  })

  describe('ApiResponse interface', () => {
    it('should handle successful response', () => {
      const response: ApiResponse<string> = {
        data: 'success data',
        error: null
      }
      
      expect(response.data).toBe('success data')
      expect(response.error).toBeNull()
    })

    it('should handle error response', () => {
      const response: ApiResponse<string> = {
        data: null,
        error: {
          message: 'Error occurred',
          code: 'ERROR_CODE'
        }
      }
      
      expect(response.data).toBeNull()
      expect(response.error?.message).toBe('Error occurred')
      expect(response.error?.code).toBe('ERROR_CODE')
    })
  })

  describe('SupabaseError interface', () => {
    it('should extend ApiError with HTTP status', () => {
      const error: SupabaseError = {
        message: 'Supabase error',
        code: 'SUPABASE_ERROR',
        status: 400,
        statusText: 'Bad Request'
      }
      
      expect(error.message).toBe('Supabase error')
      expect(error.code).toBe('SUPABASE_ERROR')
      expect(error.status).toBe(400)
      expect(error.statusText).toBe('Bad Request')
    })
  })
})
