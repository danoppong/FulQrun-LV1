/**
 * Monday.com Connection API
 * Handles connection testing, saving, and retrieval
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-unified';
import { createMondayClient } from '@/lib/integrations/monday';
import { checkRateLimit } from '@/lib/validation';

// Force Node.js runtime (not Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: Test or retrieve Monday.com connection
export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Auth check
    const supabase = await AuthService.getServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get organization context
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const organizationId = profile.organization_id;
    const { searchParams } = new URL(req.url);
    const testToken = searchParams.get('test_token');

    // If testing a new token
    if (testToken) {
      const client = createMondayClient(testToken);
      const result = await client.testConnection();
      
      return NextResponse.json({
        success: result.success,
        user: result.user,
        error: result.error
      });
    }

    // Retrieve existing connection
    const { data: integration, error: fetchError } = await supabase
      .from('integrations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('integration_type', 'monday')
      .eq('status', 'active')
      .single();

    if (fetchError || !integration) {
      return NextResponse.json(
        { error: 'No active Monday.com connection found' },
        { status: 404 }
      );
    }

    // Test existing connection
    const apiToken = integration.credentials?.api_token;
    if (!apiToken) {
      return NextResponse.json(
        { error: 'API token not found in connection' },
        { status: 400 }
      );
    }

    const client = createMondayClient(apiToken as string);
    const result = await client.testConnection();

    return NextResponse.json({
      success: result.success,
      connection: {
        id: integration.id,
        status: integration.status,
        created_at: integration.created_at
      },
      user: result.user,
      error: result.error
    });

  } catch (error) {
    console.error('Monday.com connection GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create or update Monday.com connection
export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Auth check
    const supabase = await AuthService.getServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get organization context
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const organizationId = profile.organization_id;
    const body = await req.json();
    const { api_token, name, description } = body;

    if (!api_token) {
      return NextResponse.json(
        { error: 'API token is required' },
        { status: 400 }
      );
    }

    // Test the connection first
    const client = createMondayClient(api_token);
    const testResult = await client.testConnection();

    if (!testResult.success) {
      return NextResponse.json(
        { error: 'Invalid API token or connection failed', details: testResult.error },
        { status: 400 }
      );
    }

    // Get account info
    const account = await client.getAccount();

    // Check if connection already exists
    const { data: existing } = await supabase
      .from('integrations')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('integration_type', 'monday')
      .single();

    const integrationData = {
      organization_id: organizationId,
      integration_type: 'monday',
      name: name || `Monday.com - ${account?.name || 'Connection'}`,
      description: description || 'Monday.com integration for project management',
      status: 'active',
      credentials: {
        api_token,
        account_id: account?.id,
        account_name: account?.name,
        account_slug: account?.slug
      },
      settings: {
        sync_enabled: false,
        webhook_enabled: false,
        last_sync: null
      },
      metadata: {
        user_name: testResult.user?.name,
        user_email: testResult.user?.email,
        connected_at: new Date().toISOString()
      }
    };

    let result;

    if (existing) {
      // Update existing connection
      const { data, error } = await supabase
        .from('integrations')
        .update(integrationData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new connection
      const { data, error } = await supabase
        .from('integrations')
        .insert(integrationData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      connection: result,
      user: testResult.user,
      account
    });

  } catch (error) {
    console.error('Monday.com connection POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Remove Monday.com connection
export async function DELETE(req: NextRequest) {
  try {
    // Auth check
    const supabase = await AuthService.getServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get organization context
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const organizationId = profile.organization_id;

    // Soft delete by setting status to inactive
    const { error: updateError } = await supabase
      .from('integrations')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('organization_id', organizationId)
      .eq('integration_type', 'monday');

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: 'Monday.com connection removed'
    });

  } catch (error) {
    console.error('Monday.com connection DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
