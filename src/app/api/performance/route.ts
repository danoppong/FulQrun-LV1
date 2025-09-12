import { NextRequest, NextResponse } from 'next/server'
import { performanceMonitor } from '@/lib/performance-monitor'

export async function GET(request: NextRequest) {
  try {
    // Only allow in development or with proper authentication
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('authorization')
      if (!authHeader || authHeader !== `Bearer ${process.env.PERFORMANCE_API_KEY}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    const report = performanceMonitor.getPerformanceReport()
    
    return NextResponse.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Performance API error:', error)
    return NextResponse.json(
      { error: 'Failed to get performance data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only allow in development or with proper authentication
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('authorization')
      if (!authHeader || authHeader !== `Bearer ${process.env.PERFORMANCE_API_KEY}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'clear':
        performanceMonitor.cleanup()
        return NextResponse.json({ success: true, message: 'Performance data cleared' })
      
      case 'enable':
        performanceMonitor.enable()
        return NextResponse.json({ success: true, message: 'Performance monitoring enabled' })
      
      case 'disable':
        performanceMonitor.disable()
        return NextResponse.json({ success: true, message: 'Performance monitoring disabled' })
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Performance API error:', error)
    return NextResponse.json(
      { error: 'Failed to process performance action' },
      { status: 500 }
    )
  }
}
