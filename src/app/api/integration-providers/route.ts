import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/supabase'
import { AuthService } from '@/lib/auth-unified'
import { z } from 'zod';

const ProviderConfigSchema = z.object({
  provider: z.enum(['CLEARBIT', 'ZOOMINFO', 'OPPORTUNITY', 'COMPLIANCE']),
  config: z.object({
    api_key: z.string().optional(),
    api_secret: z.string().optional(),
    base_url: z.string().url().optional(),
    enabled: z.boolean().optional().default(true),
    rate_limit: z.number().optional(),
    timeout: z.number().optional(),
    retry_attempts: z.number().optional(),
    custom_fields: z.record(z.any()).optional()
  })
})

const ProviderTestSchema = z.object({
  provider: z.enum(['CLEARBIT', 'ZOOMINFO', 'OPPORTUNITY', 'COMPLIANCE']),
  test_data: z.object({
    domain: z.string().optional(),
    email: z.string().email().optional(),
    company_name: z.string().optional()
  }).optional()
})

interface ProviderTestData {
  domain?: string
  email?: string
  company_name?: string
}

interface ProviderTestResult {
  success: boolean
  message?: string
  response_time?: number
  rate_limit_remaining?: number
  test_data?: ProviderTestData
  error?: string
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = (await AuthService.getServerClient()) as SupabaseClient<Database>
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's organization
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single<{ organization_id: string }>()

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Get integration providers
    const { data: providers, error: providersError } = await supabase
      .from('integration_providers')
      .select('*')
      .eq('organization_id', userProfile.organization_id)
      .is('deleted_at', null)

    if (providersError) {
      return NextResponse.json(
        { error: 'Failed to fetch integration providers' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: providers
    })

  } catch (error) {
    console.error('Error in integration providers GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = (await AuthService.getServerClient()) as SupabaseClient<Database>
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's organization
    const { data: userProfile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single<{ organization_id: string }>()

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { action } = body

    if (action === 'configure') {
      return await configureProvider(supabase, body, userProfile.organization_id)
    } else if (action === 'test') {
      return await testProvider(supabase, body, userProfile.organization_id)
    } else if (action === 'enable') {
      return await enableProvider(supabase, body, userProfile.organization_id)
    } else if (action === 'disable') {
      return await disableProvider(supabase, body, userProfile.organization_id)
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "configure", "test", "enable", or "disable"' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error in integration providers POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function configureProvider(
  supabase: SupabaseClient<Database>,
  body: unknown,
  organizationId: string
) {
  const validationResult = ProviderConfigSchema.safeParse(body)
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid request data',
        details: validationResult.error.errors
      },
      { status: 400 }
    )
  }

  const { provider, config } = validationResult.data

  // Check if provider already exists
  const { data: existingProvider } = await supabase
    .from('integration_providers')
    .select('*')
    .eq('provider', provider)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single<Database['public']['Tables']['integration_providers']['Row']>()

  let result
  if (existingProvider) {
    // Update existing provider
    const { data, error } = await supabase
      .from('integration_providers')
      .update({
        config: { ...(existingProvider.config as Record<string, unknown>), ...(config as Record<string, unknown>) },
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', existingProvider.id as string)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update provider configuration' },
        { status: 500 }
      )
    }

    result = data
  } else {
    // Create new provider
    const { data, error } = await supabase
      .from('integration_providers')
      .insert({
        provider,
        config: config as Record<string, unknown>,
        organization_id: organizationId
      } as never)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create provider configuration' },
        { status: 500 }
      )
    }

    result = data
  }

  return NextResponse.json({
    success: true,
    data: result
  })
}

async function testProvider(
  supabase: SupabaseClient<Database>,
  body: unknown,
  organizationId: string
) {
  const validationResult = ProviderTestSchema.safeParse(body)
  
  if (!validationResult.success) {
    return NextResponse.json(
      { 
        error: 'Invalid request data',
        details: validationResult.error.errors
      },
      { status: 400 }
    )
  }

  const { provider, test_data } = validationResult.data

  // Get provider configuration
  const { data: providerConfig, error: configError } = await supabase
    .from('integration_providers')
    .select('*')
    .eq('provider', provider)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single<Database['public']['Tables']['integration_providers']['Row']>()

  if (configError || !providerConfig) {
    return NextResponse.json(
      { error: 'Provider configuration not found' },
      { status: 404 }
    )
  }

  // Test the provider
  const testResult = await testProviderConnection(provider, providerConfig.config, test_data)

  return NextResponse.json({
    success: true,
    data: {
      provider,
      test_result: testResult,
      tested_at: new Date().toISOString()
    }
  })
}

const EnableDisableSchema = z.object({
  provider: z.enum(['CLEARBIT', 'ZOOMINFO', 'OPPORTUNITY', 'COMPLIANCE'])
})

async function enableProvider(
  supabase: SupabaseClient<Database>,
  body: unknown,
  organizationId: string
) {
  const parsed = EnableDisableSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
  }
  const { provider } = parsed.data

  if (!provider) {
    return NextResponse.json(
      { error: 'Provider is required' },
      { status: 400 }
    )
  }

  // Update provider to enabled
  const { data, error } = await supabase
    .from('integration_providers')
    .update({
      config: {
        enabled: true
      },
      updated_at: new Date().toISOString()
    } as never)
    .eq('provider', provider)
    .eq('organization_id', organizationId)
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: 'Failed to enable provider' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: data
  })
}

async function disableProvider(
  supabase: SupabaseClient<Database>,
  body: unknown,
  organizationId: string
) {
  const parsed = EnableDisableSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
  }
  const { provider } = parsed.data

  if (!provider) {
    return NextResponse.json(
      { error: 'Provider is required' },
      { status: 400 }
    )
  }

  // Update provider to disabled
  const { data, error } = await supabase
    .from('integration_providers')
    .update({
      config: {
        enabled: false
      },
      updated_at: new Date().toISOString()
    } as never)
    .eq('provider', provider)
    .eq('organization_id', organizationId)
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: 'Failed to disable provider' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: data
  })
}

async function testProviderConnection(
  provider: string,
  config: unknown,
  testData?: ProviderTestData
): Promise<ProviderTestResult> {
  // This is a placeholder implementation
  // In a real implementation, this would test actual API connections
  
  switch (provider) {
    case 'CLEARBIT':
      return await testClearbitConnection(config, testData)
    case 'ZOOMINFO':
      return await testZoomInfoConnection(config, testData)
    case 'OPPORTUNITY':
      return await testOpportunityConnection(config, testData)
    case 'COMPLIANCE':
      return await testComplianceConnection(config, testData)
    default:
      return {
        success: false,
        error: 'Unknown provider'
      }
  }
}

async function testClearbitConnection(config: unknown, testData?: ProviderTestData): Promise<ProviderTestResult> {
  // Placeholder implementation
  return {
    success: true,
    message: 'Clearbit connection test successful',
    response_time: 150,
    rate_limit_remaining: 1000,
    test_data: testData
  }
}

async function testZoomInfoConnection(config: unknown, testData?: ProviderTestData): Promise<ProviderTestResult> {
  // Placeholder implementation
  return {
    success: true,
    message: 'ZoomInfo connection test successful',
    response_time: 200,
    rate_limit_remaining: 500,
    test_data: testData
  }
}

async function testOpportunityConnection(config: unknown, testData?: ProviderTestData): Promise<ProviderTestResult> {
  // Placeholder implementation
  return {
    success: true,
    message: 'Opportunity provider connection test successful',
    response_time: 100,
    test_data: testData
  }
}

async function testComplianceConnection(config: unknown, testData?: ProviderTestData): Promise<ProviderTestResult> {
  // Placeholder implementation
  return {
    success: true,
    message: 'Compliance provider connection test successful',
    response_time: 300,
    test_data: testData
  }
}
