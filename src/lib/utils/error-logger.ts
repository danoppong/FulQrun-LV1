// Centralized Error Handling System
// Enterprise-grade error logging, reporting, and monitoring

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Error types and interfaces
export interface ErrorLogEntry {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  message: string;
  stack?: string;
  context: Record<string, unknown>;
  userId?: string;
  organizationId: string;
  module: string;
  function: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface ErrorReport {
  id: string;
  errorId: string;
  reportType: 'automatic' | 'manual' | 'escalated';
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  assignedTo?: string;
  priority: number;
  tags: string[];
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByLevel: Record<string, number>;
  errorsByModule: Record<string, number>;
  errorsByDay: Record<string, number>;
  averageResolutionTime: number;
  criticalErrors: number;
  unresolvedErrors: number;
}

export interface ErrorAlert {
  id: string;
  alertType: 'threshold' | 'pattern' | 'critical' | 'escalation';
  condition: string;
  threshold?: number;
  isActive: boolean;
  notificationChannels: string[];
  recipients: string[];
  organizationId: string;
}

// Error Logger Class
export class ErrorLogger {
  private static instance: ErrorLogger;
  private errorBuffer: ErrorLogEntry[] = [];
  private flushInterval: NodeJS.Timeout;

  private constructor() {
    // Flush error buffer every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushBuffer();
    }, 30000);
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Log an error with context
   */
  async logError(
    level: 'debug' | 'info' | 'warn' | 'error' | 'critical',
    message: string,
    context: {
      module: string;
      function: string;
      userId?: string;
      organizationId: string;
      additionalData?: Record<string, unknown>;
    },
    error?: Error
  ): Promise<string> {
    try {
      const errorEntry: ErrorLogEntry = {
        id: crypto.randomUUID(),
        level,
        message,
        stack: error?.stack,
        context: {
          ...context.additionalData,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          timestamp: new Date().toISOString(),
        },
        userId: context.userId,
        organizationId: context.organizationId,
        module: context.module,
        function: context.function,
        timestamp: new Date(),
        resolved: false,
      };

      // Add to buffer for batch processing
      this.errorBuffer.push(errorEntry);

      // Flush immediately for critical errors
      if (level === 'critical') {
        await this.flushBuffer();
      }

      // Create error report for high-level errors
      if (level === 'error' || level === 'critical') {
        await this.createErrorReport(errorEntry);
      }

      return errorEntry.id;
    } catch (logError) {
      // Fallback to console if database logging fails
      console.error('Failed to log error:', logError);
      console.error('Original error:', message, error);
      return '';
    }
  }

  /**
   * Log debug information
   */
  async debug(
    message: string,
    context: {
      module: string;
      function: string;
      organizationId: string;
      additionalData?: Record<string, unknown>;
    }
  ): Promise<string> {
    return this.logError('debug', message, context);
  }

  /**
   * Log informational message
   */
  async info(
    message: string,
    context: {
      module: string;
      function: string;
      organizationId: string;
      additionalData?: Record<string, unknown>;
    }
  ): Promise<string> {
    return this.logError('info', message, context);
  }

  /**
   * Log warning
   */
  async warn(
    message: string,
    context: {
      module: string;
      function: string;
      organizationId: string;
      additionalData?: Record<string, unknown>;
    }
  ): Promise<string> {
    return this.logError('warn', message, context);
  }

  /**
   * Log error
   */
  async error(
    message: string,
    context: {
      module: string;
      function: string;
      userId?: string;
      organizationId: string;
      additionalData?: Record<string, unknown>;
    },
    error?: Error
  ): Promise<string> {
    return this.logError('error', message, context, error);
  }

  /**
   * Log critical error
   */
  async critical(
    message: string,
    context: {
      module: string;
      function: string;
      userId?: string;
      organizationId: string;
      additionalData?: Record<string, unknown>;
    },
    error?: Error
  ): Promise<string> {
    return this.logError('critical', message, context, error);
  }

  /**
   * Get error logs with filtering
   */
  async getErrorLogs(
    organizationId: string,
    filters: {
      level?: string;
      module?: string;
      userId?: string;
      dateFrom?: Date;
      dateTo?: Date;
      resolved?: boolean;
    } = {},
    limit: number = 100,
    offset: number = 0
  ): Promise<ErrorLogEntry[]> {
    try {
      let query = supabase
        .from('error_logs')
        .select('*')
        .eq('organization_id', organizationId)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (filters.level) {
        query = query.eq('level', filters.level);
      }
      if (filters.module) {
        query = query.eq('module', filters.module);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.dateFrom) {
        query = query.gte('timestamp', filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        query = query.lte('timestamp', filters.dateTo.toISOString());
      }
      if (filters.resolved !== undefined) {
        query = query.eq('resolved', filters.resolved);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(log => ({
        id: log.id,
        level: log.level,
        message: log.message,
        stack: log.stack,
        context: log.context,
        userId: log.user_id,
        organizationId: log.organization_id,
        module: log.module,
        function: log.function,
        timestamp: new Date(log.timestamp),
        resolved: log.resolved,
        resolvedAt: log.resolved_at ? new Date(log.resolved_at) : undefined,
        resolvedBy: log.resolved_by,
      }));
    } catch (error) {
      console.error('Error fetching error logs:', error);
      throw error;
    }
  }

  /**
   * Resolve an error
   */
  async resolveError(errorId: string, resolvedBy: string): Promise<void> {
    try {
      await supabase
        .from('error_logs')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy,
        })
        .eq('id', errorId);
    } catch (error) {
      console.error('Error resolving error:', error);
      throw error;
    }
  }

  /**
   * Get error metrics
   */
  async getErrorMetrics(
    organizationId: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<ErrorMetrics> {
    try {
      let query = supabase
        .from('error_logs')
        .select('level, module, timestamp, resolved, resolved_at')
        .eq('organization_id', organizationId);

      if (dateFrom) {
        query = query.gte('timestamp', dateFrom.toISOString());
      }
      if (dateTo) {
        query = query.lte('timestamp', dateTo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const metrics: ErrorMetrics = {
        totalErrors: data.length,
        errorsByLevel: {},
        errorsByModule: {},
        errorsByDay: {},
        averageResolutionTime: 0,
        criticalErrors: 0,
        unresolvedErrors: 0,
      };

      let totalResolutionTime = 0;
      let resolvedCount = 0;

      for (const log of data) {
        // Count by level
        metrics.errorsByLevel[log.level] = (metrics.errorsByLevel[log.level] || 0) + 1;

        // Count by module
        metrics.errorsByModule[log.module] = (metrics.errorsByModule[log.module] || 0) + 1;

        // Count by day
        const day = new Date(log.timestamp).toISOString().split('T')[0];
        metrics.errorsByDay[day] = (metrics.errorsByDay[day] || 0) + 1;

        // Count critical errors
        if (log.level === 'critical') {
          metrics.criticalErrors++;
        }

        // Count unresolved errors
        if (!log.resolved) {
          metrics.unresolvedErrors++;
        }

        // Calculate resolution time
        if (log.resolved && log.resolved_at) {
          const resolutionTime = new Date(log.resolved_at).getTime() - new Date(log.timestamp).getTime();
          totalResolutionTime += resolutionTime;
          resolvedCount++;
        }
      }

      if (resolvedCount > 0) {
        metrics.averageResolutionTime = totalResolutionTime / resolvedCount;
      }

      return metrics;
    } catch (error) {
      console.error('Error getting error metrics:', error);
      throw error;
    }
  }

  // Private methods
  private async flushBuffer(): Promise<void> {
    if (this.errorBuffer.length === 0) return;

    try {
      const logsToFlush = [...this.errorBuffer];
      this.errorBuffer = [];

      await supabase
        .from('error_logs')
        .insert(
          logsToFlush.map(log => ({
            id: log.id,
            level: log.level,
            message: log.message,
            stack: log.stack,
            context: log.context,
            user_id: log.userId,
            organization_id: log.organizationId,
            module: log.module,
            function: log.function,
            timestamp: log.timestamp.toISOString(),
            resolved: log.resolved,
          }))
        );
    } catch (error) {
      console.error('Error flushing error buffer:', error);
      // Re-add logs to buffer if flush failed
      this.errorBuffer.unshift(...this.errorBuffer);
    }
  }

  private async createErrorReport(errorEntry: ErrorLogEntry): Promise<void> {
    try {
      const impact = errorEntry.level === 'critical' ? 'critical' : 'high';
      const priority = errorEntry.level === 'critical' ? 1 : 2;

      await supabase
        .from('error_reports')
        .insert({
          error_id: errorEntry.id,
          report_type: 'automatic',
          description: errorEntry.message,
          impact,
          status: 'open',
          priority,
          tags: [errorEntry.module, errorEntry.level],
          organization_id: errorEntry.organizationId,
        });
    } catch (error) {
      console.error('Error creating error report:', error);
    }
  }

  /**
   * Cleanup method
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushBuffer();
  }
}

// Error Reporter Class
export class ErrorReporter {
  private static instance: ErrorReporter;

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  /**
   * Create manual error report
   */
  async createErrorReport(
    errorId: string,
    description: string,
    impact: 'low' | 'medium' | 'high' | 'critical',
    organizationId: string,
    tags: string[] = []
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('error_reports')
        .insert({
          error_id: errorId,
          report_type: 'manual',
          description,
          impact,
          status: 'open',
          priority: this.getPriorityFromImpact(impact),
          tags,
          organization_id: organizationId,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating error report:', error);
      throw error;
    }
  }

  /**
   * Update error report status
   */
  async updateErrorReport(
    reportId: string,
    updates: {
      status?: 'open' | 'investigating' | 'resolved' | 'closed';
      assignedTo?: string;
      description?: string;
      tags?: string[];
    }
  ): Promise<void> {
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.status) updateData.status = updates.status;
      if (updates.assignedTo) updateData.assigned_to = updates.assignedTo;
      if (updates.description) updateData.description = updates.description;
      if (updates.tags) updateData.tags = updates.tags;

      await supabase
        .from('error_reports')
        .update(updateData)
        .eq('id', reportId);
    } catch (error) {
      console.error('Error updating error report:', error);
      throw error;
    }
  }

  /**
   * Get error reports
   */
  async getErrorReports(
    organizationId: string,
    filters: {
      status?: string;
      impact?: string;
      assignedTo?: string;
    } = {},
    limit: number = 100,
    offset: number = 0
  ): Promise<ErrorReport[]> {
    try {
      let query = supabase
        .from('error_reports')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.impact) {
        query = query.eq('impact', filters.impact);
      }
      if (filters.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(report => ({
        id: report.id,
        errorId: report.error_id,
        reportType: report.report_type,
        description: report.description,
        impact: report.impact,
        status: report.status,
        assignedTo: report.assigned_to,
        priority: report.priority,
        tags: report.tags,
        organizationId: report.organization_id,
        createdAt: new Date(report.created_at),
        updatedAt: new Date(report.updated_at),
      }));
    } catch (error) {
      console.error('Error getting error reports:', error);
      throw error;
    }
  }

  private getPriorityFromImpact(impact: string): number {
    switch (impact) {
      case 'critical': return 1;
      case 'high': return 2;
      case 'medium': return 3;
      case 'low': return 4;
      default: return 3;
    }
  }
}

// Convenience functions for easy usage
export const errorLogger = ErrorLogger.getInstance();
export const errorReporter = ErrorReporter.getInstance();

// Helper functions
export const logError = (
  message: string,
  context: {
    module: string;
    function: string;
    userId?: string;
    organizationId: string;
    additionalData?: Record<string, unknown>;
  },
  error?: Error
) => errorLogger.error(message, context, error);

export const logCritical = (
  message: string,
  context: {
    module: string;
    function: string;
    userId?: string;
    organizationId: string;
    additionalData?: Record<string, unknown>;
  },
  error?: Error
) => errorLogger.critical(message, context, error);

export const logWarning = (
  message: string,
  context: {
    module: string;
    function: string;
    organizationId: string;
    additionalData?: Record<string, unknown>;
  }
) => errorLogger.warn(message, context);

export const logInfo = (
  message: string,
  context: {
    module: string;
    function: string;
    organizationId: string;
    additionalData?: Record<string, unknown>;
  }
) => errorLogger.info(message, context);

export const logDebug = (
  message: string,
  context: {
    module: string;
    function: string;
    organizationId: string;
    additionalData?: Record<string, unknown>;
  }
) => errorLogger.debug(message, context);
