/**
 * Monday.com Webhook API
 * Handles webhook creation and incoming events
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-unified';
import { createMondayClient } from '@/lib/integrations/monday';
import { checkRateLimit } from '@/lib/validation';

// Force Node.js runtime (not Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST: Create webhook or handle incoming event
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // If creating a webhook
    if (action === 'create') {
      return await createWebhook(req);
    }

    // Otherwise, handle incoming webhook event
    return await handleWebhookEvent(req);

  } catch (error) {
    console.error('Monday.com webhook POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create a new webhook
async function createWebhook(req: NextRequest) {
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

    // Get Monday.com connection
    const { data: integration } = await supabase
      .from('integrations')
      .select('credentials')
      .eq('organization_id', organizationId)
      .eq('integration_type', 'monday')
      .eq('status', 'active')
      .single();

    if (!integration?.credentials?.api_token) {
      return NextResponse.json(
        { error: 'No active Monday.com connection found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { board_id, event, url, config } = body;

    if (!board_id || !event || !url) {
      return NextResponse.json(
        { error: 'board_id, event, and url are required' },
        { status: 400 }
      );
    }

    // Create webhook
    const client = createMondayClient(integration.credentials.api_token as string);
    const webhook = await client.createWebhook({
      board_id,
      url,
      event,
      config
    });

    // Store webhook info in database
    await supabase
      .from('integrations')
      .update({
        settings: {
          ...integration.credentials,
          webhooks: [
            ...(integration.credentials?.webhooks || []),
            {
              id: webhook.id,
              board_id: webhook.board_id,
              event,
              url,
              created_at: new Date().toISOString()
            }
          ]
        }
      })
      .eq('organization_id', organizationId)
      .eq('integration_type', 'monday');

    return NextResponse.json({
      success: true,
      webhook
    });

  } catch (error) {
    console.error('Create webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle incoming webhook event
async function handleWebhookEvent(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Monday.com webhook payload structure
    const {
      event,
      boardId,
      itemId,
      itemName,
      columnId,
      columnTitle,
      columnValue,
      previousColumnValue,
      userId,
      triggerTime
    } = body;

    console.log('Monday.com webhook received:', {
      event,
      boardId,
      itemId,
      itemName,
      triggerTime
    });

    // Get Supabase client
    const supabase = await AuthService.getServerClient();

    // Find the integration by board_id in webhook settings
    const { data: integration } = await supabase
      .from('integrations')
      .select('*')
      .eq('integration_type', 'monday')
      .eq('status', 'active')
      .single();

    if (!integration) {
      console.warn('No active Monday.com integration found for webhook');
      return NextResponse.json({ received: true });
    }

    // Log the webhook event
    const webhookLog = {
      integration_id: integration.id,
      event_type: event,
      payload: body,
      processed_at: new Date().toISOString(),
      metadata: {
        board_id: boardId,
        item_id: itemId,
        item_name: itemName,
        column_id: columnId,
        column_title: columnTitle,
        user_id: userId,
        trigger_time: triggerTime
      }
    };

    // Store webhook event (you may want to create a webhook_logs table)
    console.log('Webhook event logged:', webhookLog);

    // Process the event based on type
    switch (event) {
      case 'create_item':
        console.log(`New item created: ${itemName} (${itemId}) on board ${boardId}`);
        // Add custom logic for new items
        break;

      case 'change_column_value':
        console.log(`Column ${columnTitle} changed from "${previousColumnValue}" to "${columnValue}"`);
        // Add custom logic for column changes
        break;

      case 'change_status_column_value':
        console.log(`Status changed to: ${columnValue}`);
        // Add custom logic for status changes
        break;

      case 'create_update':
        console.log(`New update created on item ${itemName}`);
        // Add custom logic for updates
        break;

      case 'item_deleted':
        console.log(`Item ${itemName} (${itemId}) was deleted`);
        // Add custom logic for deletions
        break;

      default:
        console.log(`Unknown event type: ${event}`);
    }

    // Update last sync time
    await supabase
      .from('integrations')
      .update({
        settings: {
          ...integration.settings,
          last_webhook_received: new Date().toISOString()
        }
      })
      .eq('id', integration.id);

    // Monday.com expects a 200 response
    return NextResponse.json({
      received: true,
      event,
      itemId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Handle webhook event error:', error);
    // Still return 200 to acknowledge receipt
    return NextResponse.json({
      received: true,
      error: 'Processing failed'
    });
  }
}

// DELETE: Remove a webhook
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

    // Get Monday.com connection
    const { data: integration } = await supabase
      .from('integrations')
      .select('credentials, settings')
      .eq('organization_id', organizationId)
      .eq('integration_type', 'monday')
      .eq('status', 'active')
      .single();

    if (!integration?.credentials?.api_token) {
      return NextResponse.json(
        { error: 'No active Monday.com connection found' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const webhookId = searchParams.get('webhook_id');

    if (!webhookId) {
      return NextResponse.json(
        { error: 'webhook_id is required' },
        { status: 400 }
      );
    }

    // Delete webhook from Monday.com
    const client = createMondayClient(integration.credentials.api_token as string);
    await client.deleteWebhook(webhookId);

    // Remove from database
    const webhooks = integration.settings?.webhooks || [];
    const updatedWebhooks = webhooks.filter((w: { id: string }) => w.id !== webhookId);

    await supabase
      .from('integrations')
      .update({
        settings: {
          ...integration.settings,
          webhooks: updatedWebhooks
        }
      })
      .eq('organization_id', organizationId)
      .eq('integration_type', 'monday');

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully'
    });

  } catch (error) {
    console.error('Delete webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
