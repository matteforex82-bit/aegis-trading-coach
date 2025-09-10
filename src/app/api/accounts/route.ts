import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user info
    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Admin users can access all accounts or specific user accounts
    if (currentUser.role === 'admin') {
      if (userId) {
        // Get accounts for specific user (exclude soft deleted)
        const accounts = await db.account.findMany({
          where: { 
            userId,
            deletedAt: null
          },
          include: {
            user: true,
            PropFirm: true
          }
        })
        return NextResponse.json(accounts)
      } else {
        // Get all accounts (exclude soft deleted) - admin only
        const accounts = await db.account.findMany({
          where: {
            deletedAt: null
          },
          include: {
            user: true,
            PropFirm: true
          }
        })
        return NextResponse.json(accounts)
      }
    } else {
      // Regular users can only access their own accounts
      const accounts = await db.account.findMany({
        where: { 
          userId: currentUser.id,
          deletedAt: null
        },
        include: {
          user: true,
          PropFirm: true
        }
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