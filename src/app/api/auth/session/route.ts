import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseConfig } from '@/lib/config';

/**
 * POST /api/auth/session
 * Syncs the client-side auth session to HTTP cookies for server-side access
 */
export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token } = await request.json();

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: 'Missing access_token or refresh_token' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true });

    // Create a server client that can set cookies
    const supabase = createServerClient(
      supabaseConfig.url!,
      supabaseConfig.anonKey!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({
              name,
              value,
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            });
          },
          remove(name: string, options: any) {
            response.cookies.set({
              name,
              value: '',
              ...options,
              maxAge: 0,
            });
          },
        },
      }
    );

    // Set the session using the provided tokens
    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      console.error('Failed to set session:', error);
      return NextResponse.json(
        { error: 'Failed to set session' },
        { status: 500 }
      );
    }

    return response;
  } catch (error) {
    console.error('Error syncing session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

