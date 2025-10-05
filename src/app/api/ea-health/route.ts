import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Dedicated health check endpoint for EA with detailed diagnostics
export async function GET() {
  const startTime = Date.now()
  
  try {
    // Test database connection with timeout
    const dbTest = await Promise.race([
      db.$queryRaw`SELECT 1 as health`,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      )
    ])
    
    const responseTime = Date.now() - startTime
    
    // Test TradingAccount table
    let tradingAccountTest = 'unknown'
    try {
      const count = await db.tradingAccount.count()
      tradingAccountTest = `OK (${count} accounts)`
    } catch (e: any) {
      tradingAccountTest = `ERROR: ${e.code}`
    }

    const dbUrl = process.env.DATABASE_URL || 'NOT_SET'
    const safeUrl = dbUrl.replace(/:([^@]+)@/, ':***@').substring(0, 80)

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        responseTime: `${responseTime}ms`,
        test: 'passed',
        url: safeUrl,
        tradingAccountTable: tradingAccountTest
      },
      server: {
        status: 'operational',
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
      },
      api: {
        endpoint: '/api/ingest/mt5',
        status: 'ready',
        version: '3.0'
      },
      message: '✅ EA Health Check - All systems operational'
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*'
      }
    })
    
  } catch (error: any) {
    console.error('❌ EA Health check failed:', error)
    
    const responseTime = Date.now() - startTime
    
    // Determine error type and appropriate response
    let errorType = 'unknown'
    let suggestion = 'Check server logs for details'
    
    if (error.message?.includes('timeout')) {
      errorType = 'database_timeout'
      suggestion = 'Database is responding slowly, EA should retry with backoff'
    } else if (error?.code === 'P5000') {
      errorType = 'prisma_plan_limit'
      suggestion = 'Database plan limit reached, upgrade required'
    } else if (error?.code?.startsWith('P')) {
      errorType = 'database_error'
      suggestion = 'Database connection issue, EA should retry'
    }
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'error',
        responseTime: `${responseTime}ms`,
        error: error.message,
        code: error.code || 'unknown'
      },
      server: {
        status: 'degraded',
        uptime: process.uptime()
      },
      api: {
        endpoint: '/api/ingest/mt5',
        status: 'unavailable',
        version: '3.0'
      },
      error: {
        type: errorType,
        message: error.message,
        suggestion: suggestion,
        ea_action: errorType === 'prisma_plan_limit' ? 'WAIT_LONGER' : 'RETRY_WITH_BACKOFF'
      },
      message: '🚨 EA Health Check - System issues detected'
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Retry-After': errorType === 'prisma_plan_limit' ? '3600' : '300'
      }
    })
  }
}

// POST method for EA to send basic ping
export async function POST() {
  return NextResponse.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    message: '✅ EA endpoint ready for data'
  }, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  })
}