import { z } from 'zod';

// Common validation schemas
export const uuidSchema = z.string().uuid('Invalid UUID format')
export const emailSchema = z.string().email('Invalid email format')
export const dateSchema = z.string().datetime('Invalid date format')
export const positiveNumberSchema = z.number().positive('Must be a positive number')
export const nonEmptyStringSchema = z.string().min(1, 'Cannot be empty')

// API request validation schemas
export const analyticsDashboardSchema = z.object({
  organizationId: uuidSchema,
  userId: uuidSchema.optional(),
  startDate: dateSchema,
  endDate: dateSchema,
})

export const integrationsListSchema = z.object({
  organizationId: uuidSchema,
})

export const learningModuleSchema = z.object({
  moduleId: uuidSchema,
  userId: uuidSchema,
})

export const learningProgressSchema = z.object({
  userId: uuidSchema,
  moduleId: uuidSchema,
  progress: z.number().min(0).max(100),
  status: z.enum(['not_started', 'in_progress', 'completed', 'certified']),
})

// Validation helper functions
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      throw new Error(`Validation error: ${errorMessage}`)
    }
    throw error
  }
}

export function validateSearchParams<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): T {
  const params = Object.fromEntries(searchParams.entries())
  return validateRequest(schema, params)
}

// Sanitization helpers
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export function sanitizeHtml(input: string): string {
  // Basic HTML sanitization - in production, use DOMPurify
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
}

// Rate limiting helper (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now()
  const key = identifier
  const current = rateLimitMap.get(key)

  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (current.count >= maxRequests) {
    return false
  }

  current.count++
  return true
}

// ---------- Bulk import/export schemas ----------
export const leadImportRowSchema = z.object({
  first_name: z.string().min(1, 'first_name is required'),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  external_id: z.string().optional(),
})

export const leadBulkImportSchema = z.object({
  rows: z.array(leadImportRowSchema).min(1).max(5000),
})

export const opportunityImportRowSchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().optional(),
  value: z.number().optional(),
  deal_value: z.number().optional(),
  probability: z.number().min(0).max(100).optional(),
  stage: z.enum(['prospecting','qualifying','proposal','negotiation','closed_won','closed_lost']).optional(),
  close_date: z.string().optional(),
  company_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  external_id: z.string().optional(),
})

export const opportunityBulkImportSchema = z.object({
  rows: z.array(opportunityImportRowSchema).min(1).max(5000),
})

export const bulkExportQuerySchema = z.object({
  format: z.enum(['json', 'csv']).optional().default('csv'),
  limit: z.coerce.number().int().min(1).max(10000).optional().default(1000),
  status: z.string().optional(),
  stage: z.string().optional(),
})

export function getClientIpFromHeaders(headers: Headers): string {
  const xff = headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]?.trim() || 'unknown'
  return headers.get('x-real-ip') || 'unknown'
}
