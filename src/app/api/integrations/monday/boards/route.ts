/**
 * Monday.com Boards API
 * Handles board operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-unified';
import { createMondayClient } from '@/lib/integrations/monday';
import { checkRateLimit } from '@/lib/validation';

// Force Node.js runtime (not Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: List boards
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
    const boardIds = searchParams.get('ids')?.split(',');
    const limit = parseInt(searchParams.get('limit') || '50');
    const boardId = searchParams.get('board_id');

    // Create client and fetch boards
    const client = createMondayClient(integration.credentials.api_token as string);

    if (boardId) {
      // Get specific board
      const board = await client.getBoard(boardId);
      return NextResponse.json({ board });
    } else {
      // Get all boards or filtered by IDs
      const boards = await client.getBoards(boardIds, limit);
      return NextResponse.json({ boards });
    }

  } catch (error) {
    console.error('Monday.com boards GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST: Create a new board
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
    const { board_name, board_kind = 'public', workspace_id, description } = body;

    if (!board_name) {
      return NextResponse.json(
        { error: 'board_name is required' },
        { status: 400 }
      );
    }

    // Create board
    const client = createMondayClient(integration.credentials.api_token as string);
    const board = await client.createBoard(board_name, board_kind, workspace_id, description);

    return NextResponse.json({
      success: true,
      board
    });

  } catch (error) {
    console.error('Monday.com boards POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
