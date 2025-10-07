import { ErrorHandler, useErrorHandler } from '@/lib/utils/error-handling'
import { ApiError } from '@/lib/types/errors';

// Mock the error logger
jest.mock('@/lib/utils/error-logger', () => ({
  errorLogger: {
    logError: jest.fn().mockResolvedValue('mock-error-id')
  }
}))

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('handleApiError', () => {
    it('should handle API errors with message', async () => {
      const error: ApiError = {
        message: 'Database connection failed',
        code: 'DB_ERROR'
      }

      const result = await ErrorHandler.handleApiError(error, {
        module: 'test',
        function: 'testFunction',
        organizationId: 'test-org'
      })

      expect(result).toBe('Database connection failed')
    })

    it('should handle errors with details array', async () => {
      const error = {
        details: ['Error 1', 'Error 2']
      }

      const result = await ErrorHandler.handleApiError(error, {
        module: 'test',
        function: 'testFunction',
        organizationId: 'test-org'
      })

      expect(result).toBe('Error 1, Error 2')
    })

    it('should use fallback message for unknown errors', async () => {
      const error = {}

      const result = await ErrorHandler.handleApiError(error, {
        module: 'test',
        function: 'testFunction',
        organizationId: 'test-org',
        fallbackMessage: 'Custom fallback'
      })

      expect(result).toBe('Custom fallback')
    })

    it('should handle Error instances', async () => {
      const error = new Error('Test error message')

      const result = await ErrorHandler.handleApiError(error, {
        module: 'test',
        function: 'testFunction',
        organizationId: 'test-org'
      })

      expect(result).toBe('Test error message')
    })

    it('should not log errors when logError is false', async () => {
      const { errorLogger } = require('@/lib/utils/error-logger')
      
      const error: ApiError = {
        message: 'Test error'
      }

      await ErrorHandler.handleApiError(error, {
        module: 'test',
        function: 'testFunction',
        organizationId: 'test-org',
        logError: false
      })

      expect(errorLogger.logError).not.toHaveBeenCalled()
    })
  })

  describe('handleValidationErrors', () => {
    it('should filter valid error strings', () => {
      const errors = ['Valid error', '', 'Another valid error', '   ']
      
      const result = ErrorHandler.handleValidationErrors(errors)
      
      expect(result).toEqual(['Valid error', 'Another valid error'])
    })

    it('should handle non-array input', () => {
      const result = ErrorHandler.handleValidationErrors('not an array')
      
      expect(result).toEqual(['Invalid validation data'])
    })

    it('should handle null input', () => {
      const result = ErrorHandler.handleValidationErrors(null)
      
      expect(result).toEqual(['Invalid validation data'])
    })
  })

  describe('handleAsyncError', () => {
    it('should return data when operation succeeds', async () => {
      const operation = jest.fn().mockResolvedValue('success data')
      
      const result = await ErrorHandler.handleAsyncError(operation, {
        module: 'test',
        function: 'testFunction',
        organizationId: 'test-org'
      })
      
      expect(result).toEqual({ data: 'success data', error: null })
    })

    it('should return error when operation fails', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'))
      
      const result = await ErrorHandler.handleAsyncError(operation, {
        module: 'test',
        function: 'testFunction',
        organizationId: 'test-org'
      })
      
      expect(result.data).toBeNull()
      expect(result.error).toBe('Operation failed')
    })
  })

  describe('handleComponentError', () => {
    it('should call setError with error message', async () => {
      const setError = jest.fn()
      const error = new Error('Component error')
      
      await ErrorHandler.handleComponentError(error, setError)
      
      expect(setError).toHaveBeenCalledWith('Component error')
    })
  })

  describe('handleLoadingError', () => {
    it('should call setError and setLoading', () => {
      const setError = jest.fn()
      const setLoading = jest.fn()
      const error = new Error('Loading error')
      
      ErrorHandler.handleLoadingError(error, setError, setLoading)
      
      expect(setLoading).toHaveBeenCalledWith(false)
    })
  })
})

describe('useErrorHandler', () => {
  it('should provide error handling functions', () => {
    const { handleError, handleLoadingError, handleAsyncOperation } = useErrorHandler()
    
    expect(typeof handleError).toBe('function')
    expect(typeof handleLoadingError).toBe('function')
    expect(typeof handleAsyncOperation).toBe('function')
  })

  it('should handle async operations successfully', async () => {
    const { handleAsyncOperation } = useErrorHandler()
    const setError = jest.fn()
    const setLoading = jest.fn()
    
    const operation = jest.fn().mockResolvedValue('success')
    
    const result = await handleAsyncOperation(operation, setError, setLoading)
    
    expect(result).toBe('success')
    expect(setLoading).toHaveBeenCalledWith(true)
    expect(setLoading).toHaveBeenCalledWith(false)
    expect(setError).toHaveBeenCalledWith('')
  })

  it('should handle async operation failures', async () => {
    const { handleAsyncOperation } = useErrorHandler()
    const setError = jest.fn()
    const setLoading = jest.fn()
    
    const operation = jest.fn().mockRejectedValue(new Error('Operation failed'))
    
    const result = await handleAsyncOperation(operation, setError, setLoading)
    
    expect(result).toBeNull()
    expect(setLoading).toHaveBeenCalledWith(true)
    expect(setLoading).toHaveBeenCalledWith(false)
  })
})
