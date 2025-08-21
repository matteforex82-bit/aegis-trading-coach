import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const startTime = Date.now()
    
    // Test database connection with a simple query
    await db.$queryRaw`SELECT 1 as health_check`
    
    const responseTime = Date.now() - startTime
    
    // Get last successful sync from most recent trade or metric
    let lastSync = null
    try {
      // Try to get last trade first
      try {
        const lastTrade = await db.trade.findFirst({
          orderBy: { updatedAt: 'desc' },
          select: { updatedAt: true }
        })
        if (lastTrade) {
          lastSync = lastTrade.updatedAt
        }
      } catch (tradeError) {
        console.warn('Could not query trades table:', tradeError)
      }

      // If no trade found, try metrics
      if (!lastSync) {
        try {
          const lastMetric = await db.metric.findFirst({
            orderBy: { updatedAt: 'desc' },
            select: { updatedAt: true }
          })
          if (lastMetric) {
            lastSync = lastMetric.updatedAt
          }
        } catch (metricError) {
          console.warn('Could not query metrics table:', metricError)
        }
      }
    } catch (syncError) {
      console.warn('Could not determine last sync time:', syncError)
    }
    
    return NextResponse.json({
      status: 'online',
      lastSync: lastSync,
      database: true,
      responseTime: responseTime,
      timestamp: new Date().toISOString(),
      server: 'healthy'
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('Status check failed:', error)
    
    // Check if it's a Prisma plan limit error
    if (error?.code === 'P5000' && error?.message?.includes('planLimitReached')) {
      return NextResponse.json({
        status: 'offline',
        lastSync: null,
        database: false,
        error: 'DATABASE_PLAN_LIMIT',
        message: 'Database plan limit reached - upgrade required',
        suggestion: 'Visit https://cloud.prisma.io/ to upgrade your plan',
        timestamp: new Date().toISOString(),
        server: 'degraded'
      }, { 
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
    }
    
    // Other database errors
    return NextResponse.json({
      status: 'offline',
      lastSync: null,
      database: false,
      error: error?.code || 'UNKNOWN_ERROR',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      server: 'error'
    }, { status: 503 })
  }
}