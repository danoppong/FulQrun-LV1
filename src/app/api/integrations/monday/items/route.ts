/**
 * Monday.com Items API
 * Handles item CRUD operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-unified';
import { createMondayClient } from '@/lib/integrations/monday';
import { checkRateLimit } from '@/lib/validation';

// Force Node.js runtime (not Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: List items from a board
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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const boardId = searchParams.get('board_id');
    const itemId = searchParams.get('item_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search');

    if (!boardId && !itemId) {
      return NextResponse.json(
        { error: 'Either board_id or item_id is required' },
        { status: 400 }
      );
    }

    // Create client
    const client = createMondayClient(integration.credentials.api_token as string);

    if (itemId) {
      // Get specific item
      const item = await client.getItem(itemId);
      return NextResponse.json({ item });
    } else if (boardId) {
      // Get items from board
      let items = await client.getItems(boardId, limit, page);
      
      // Apply search filter if provided
      if (search) {
        items = items.filter(item => 
          item.name.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      return NextResponse.json({ items, count: items.length });
    }

  } catch (error) {
    console.error('Monday.com items GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST: Create a new item
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
    const { board_id, item_name, group_id, column_values } = body;

    if (!board_id || !item_name) {
      return NextResponse.json(
        { error: 'board_id and item_name are required' },
        { status: 400 }
      );
    }

    // Create item
    const client = createMondayClient(integration.credentials.api_token as string);
    const item = await client.createItem(board_id, item_name, group_id, column_values);

    return NextResponse.json({
      success: true,
      item
    });

  } catch (error) {
    console.error('Monday.com items POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT/PATCH: Update an item
export async function PUT(req: NextRequest) {
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
    const { item_id, board_id, column_values } = body;

    if (!item_id || !board_id || !column_values) {
      return NextResponse.json(
        { error: 'item_id, board_id, and column_values are required' },
        { status: 400 }
      );
    }

    // Update item
    const client = createMondayClient(integration.credentials.api_token as string);
    const item = await client.updateItem(item_id, board_id, column_values);

    return NextResponse.json({
      success: true,
      item
    });

  } catch (error) {
    console.error('Monday.com items PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete or archive an item
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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('item_id');
    const archive = searchParams.get('archive') === 'true';

    if (!itemId) {
      return NextResponse.json(
        { error: 'item_id is required' },
        { status: 400 }
      );
    }

    // Delete or archive item
    const client = createMondayClient(integration.credentials.api_token as string);
    
    if (archive) {
      await client.archiveItem(itemId);
    } else {
      await client.deleteItem(itemId);
    }

    return NextResponse.json({
      success: true,
      message: archive ? 'Item archived successfully' : 'Item deleted successfully'
    });

  } catch (error) {
    console.error('Monday.com items DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
