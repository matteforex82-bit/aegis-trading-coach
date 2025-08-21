import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (userId) {
      // Get accounts for specific user
      const accounts = await db.account.findMany({
        where: { userId },
        include: {
          _count: {
            select: { trades: true }
          },
          propFirmTemplate: {
            include: {
              propFirm: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(accounts)
    } else {
      // Get all accounts
      const accounts = await db.account.findMany({
        include: {
          _count: {
            select: { trades: true }
          },
          user: {
            select: { name: true, email: true }
          },
          propFirmTemplate: {
            include: {
              propFirm: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(accounts)
    }
  } catch (error: any) {
    console.error('Error fetching accounts:', error)
    
    // 🚨 CRITICAL: Handle Prisma plan limit errors specifically
    if (error?.code === 'P5000' && error?.message?.includes('planLimitReached')) {
      console.error('🚨 PRISMA PLAN LIMIT REACHED - Database account suspended!')
      return NextResponse.json({
        error: 'Database service temporarily unavailable',
        code: 'PRISMA_PLAN_LIMIT',
        message: 'Database plan limit reached. Please upgrade your Prisma plan or contact support.',
        suggestion: 'Visit https://cloud.prisma.io/ to check your account status',
        timestamp: new Date().toISOString()
      }, { 
        status: 503,  // Service Unavailable instead of 500
        headers: {
          'Retry-After': '3600'  // Suggest retry in 1 hour
        }
      })
    }
    
    // Handle other Prisma errors
    if (error?.code?.startsWith('P')) {
      return NextResponse.json({
        error: 'Database error',
        code: error.code,
        message: 'Database operation failed',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }
    
    // Generic error fallback
    return NextResponse.json({
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}