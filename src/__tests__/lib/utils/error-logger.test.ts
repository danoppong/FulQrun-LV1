jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => {
      const queryChain = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({ data: { id: 'test-id' }, error: null }))
          }))
        })),
        select: jest.fn(() => queryChain),
        eq: jest.fn(() => queryChain),
        order: jest.fn(() => queryChain),
        range: jest.fn(() => ({ data: [], error: null })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({ error: null }))
        }))
      }
      return queryChain
    })
  }))
}))

jest.mock('@/lib/config', () => ({
  supabaseConfig: {
    isConfigured: true,
    url: 'https://test.supabase.co',
    anonKey: 'test-key'
  }
}))

import { ErrorLogger, ErrorReporter, errorLogger, errorReporter } from '@/lib/utils/error-logger';

describe('ErrorLogger', () => {
  let logger: ErrorLogger

  beforeEach(() => {
    jest.clearAllMocks()
    logger = ErrorLogger.getInstance()
  })

  describe('logError', () => {
    it('should log error with context', async () => {
      const errorId = await logger.logError('error', 'Test error message', {
        module: 'test',
        function: 'testFunction',
        organizationId: 'test-org',
        additionalData: { test: 'data' }
      })

      expect(errorId).toBeDefined()
      expect(typeof errorId).toBe('string')
    })

    it('should log critical errors immediately', async () => {
      const errorId = await logger.logError('critical', 'Critical error', {
        module: 'test',
        function: 'testFunction',
        organizationId: 'test-org'
      })

      expect(errorId).toBeDefined()
    })

    it('should handle logging failures gracefully', async () => {
      const errorId = await logger.logError('error', 'Test error', {
        module: 'test',
        function: 'testFunction',
        organizationId: 'test-org'
      })

      expect(errorId).toBeDefined()
    })
  })

  describe('convenience methods', () => {
    it('should provide debug logging', async () => {
      const errorId = await logger.debug('Debug message', {
        module: 'test',
        function: 'testFunction',
        organizationId: 'test-org'
      })

      expect(errorId).toBeDefined()
    })

    it('should provide info logging', async () => {
      const errorId = await logger.info('Info message', {
        module: 'test',
        function: 'testFunction',
        organizationId: 'test-org'
      })

      expect(errorId).toBeDefined()
    })

    it('should provide warning logging', async () => {
      const errorId = await logger.warn('Warning message', {
        module: 'test',
        function: 'testFunction',
        organizationId: 'test-org'
      })

      expect(errorId).toBeDefined()
    })

    it('should provide error logging', async () => {
      const errorId = await logger.error('Error message', {
        module: 'test',
        function: 'testFunction',
        organizationId: 'test-org'
      })

      expect(errorId).toBeDefined()
    })

    it('should provide critical logging', async () => {
      const errorId = await logger.critical('Critical message', {
        module: 'test',
        function: 'testFunction',
        organizationId: 'test-org'
      })

      expect(errorId).toBeDefined()
    })
  })

  describe('getErrorLogs', () => {
    it('should fetch error logs with filters', async () => {
      const logs = await logger.getErrorLogs('test-org', {
        level: 'error',
        module: 'test'
      })

      expect(Array.isArray(logs)).toBe(true)
    })
  })

  describe('resolveError', () => {
    it('should resolve an error', async () => {
      await expect(logger.resolveError('test-error-id', 'test-user')).resolves.not.toThrow()
    })
  })

  describe('getErrorMetrics', () => {
    it('should get error metrics', async () => {
      const metrics = await logger.getErrorMetrics('test-org')

      expect(metrics).toHaveProperty('totalErrors')
      expect(metrics).toHaveProperty('errorsByLevel')
      expect(metrics).toHaveProperty('errorsByModule')
      expect(metrics).toHaveProperty('errorsByDay')
      expect(metrics).toHaveProperty('averageResolutionTime')
      expect(metrics).toHaveProperty('criticalErrors')
      expect(metrics).toHaveProperty('unresolvedErrors')
    })
  })
})

describe('ErrorReporter', () => {
  let reporter: ErrorReporter

  beforeEach(() => {
    jest.clearAllMocks()
    reporter = ErrorReporter.getInstance()
  })

  describe('createErrorReport', () => {
    it('should create manual error report', async () => {
      const reportId = await reporter.createErrorReport(
        'test-error-id',
        'Test error description',
        'high',
        'test-org',
        ['tag1', 'tag2']
      )

      expect(reportId).toBeDefined()
    })
  })

  describe('updateErrorReport', () => {
    it('should update error report', async () => {
      await expect(reporter.updateErrorReport('test-report-id', {
        status: 'resolved',
        assignedTo: 'test-user'
      })).resolves.not.toThrow()
    })
  })

  describe('getErrorReports', () => {
    it('should get error reports', async () => {
      const reports = await reporter.getErrorReports('test-org', {
        status: 'open'
      })

      expect(Array.isArray(reports)).toBe(true)
    })
  })
})

describe('Convenience functions', () => {
  it('should provide logError function', async () => {
    const errorId = await errorLogger.error('Test error', {
      module: 'test',
      function: 'testFunction',
      organizationId: 'test-org'
    })

    expect(errorId).toBeDefined()
  })

  it('should provide errorReporter instance', () => {
    expect(errorReporter).toBeInstanceOf(ErrorReporter)
  })
})