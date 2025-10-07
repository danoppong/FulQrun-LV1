import { NextResponse } from 'next/server'
import { supabaseConfig } from '@/lib/config';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      configured: supabaseConfig.isConfigured,
      hasUrl: !!supabaseConfig.url,
      hasKey: !!supabaseConfig.anonKey,
      urlPrefix: supabaseConfig.url?.substring(0, 20) + '...' || 'none',
      keyPrefix: supabaseConfig.anonKey?.substring(0, 20) + '...' || 'none'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
