import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Check database connection
    let databaseConnected = false
    let pendingTrades = 0
    let totalTradesToday = 0
    let lastSyncTime: string | null = null

    try {
      // Test database connection
      await db.$queryRaw`SELECT 1`
      databaseConnected = true

      // Get pending trades (trades without sync timestamp)
      const pendingTradesResult = await db.trade.findMany({
        where: {
          syncedAt: null
        },
        select: {
          id: true
        }
      })
      pendingTrades = pendingTradesResult.length

      // Get today's trades count
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const todayTradesResult = await db.trade.findMany({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        },
        select: {
          id: true
        }
      })
      totalTradesToday = todayTradesResult.length

      // Get last sync time
      const lastTrade = await db.trade.findFirst({
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          createdAt: true
        }
      })
      if (lastTrade) {
        lastSyncTime = lastTrade.createdAt.toISOString()
      }
    } catch (dbError) {
      console.log('Database connection failed:', dbError)
      databaseConnected = false
    }

    // Simulate API connection status (in real implementation, you'd check actual API connectivity)
    const apiConnected = databaseConnected

    // Generate system status
    const status = {
      apiConnected,
      databaseConnected,
      lastSyncTime,
      pendingTrades,
      totalTradesToday,
      uptime: process.uptime ? Math.floor(process.uptime()) : 0, // Available in Node.js environment
      memoryUsage: process.memoryUsage ? {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100
      } : { used: 0, total: 0 },
      dashboardUrl: 'https://newdash-pied.vercel.app',
      apiKey: '10102019',
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      status,
      checks: {
        database: databaseConnected ? 'OK' : 'FAILED',
        api: apiConnected ? 'OK' : 'FAILED'
      }
    })
  } catch (error) {
    console.error('Error fetching system status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch system status',
        status: {
          apiConnected: false,
          databaseConnected: false,
          lastSyncTime: null,
          pendingTrades: 0,
          totalTradesToday: 0,
          uptime: 0,
          memoryUsage: { used: 0, total: 0 },
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}