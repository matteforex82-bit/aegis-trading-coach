import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

//+------------------------------------------------------------------+
//| GET /api/accounts/[id] - Get single account by ID              |
//+------------------------------------------------------------------+
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: accountId } = params
    
    console.log('🔍 Fetching account:', accountId)
    
    // Get account with all related data
    const account = await db.account.findUnique({
      where: { id: accountId },
      include: {
        propFirmTemplate: {
          include: {
            propFirm: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            trades: true
          }
        }
      }
    })

    if (!account) {
      console.log('❌ Account not found:', accountId)
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    console.log('✅ Account found:', account.login, account.name)
    
    return NextResponse.json(account)
    
  } catch (error: any) {
    console.error('❌ Error fetching account:', error)
    
    // Handle Prisma plan limit errors
    if (error?.code === 'P5000' && error?.message?.includes('planLimitReached')) {
      console.error('🚨 PRISMA PLAN LIMIT REACHED - Database account suspended!')
      return NextResponse.json({
        error: 'Database service temporarily unavailable',
        code: 'PRISMA_PLAN_LIMIT',
        message: 'The database service is temporarily unavailable due to plan limits. Please upgrade your plan or try again later.'
      }, { status: 503 })
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

//+------------------------------------------------------------------+
//| PUT /api/accounts/[id] - Update account                        |
//+------------------------------------------------------------------+
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: accountId } = params
    const body = await request.json()
    
    console.log('📝 Updating account:', accountId, body)
    
    // Check if account exists
    const existingAccount = await db.account.findUnique({
      where: { id: accountId }
    })

    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Update account
    const updatedAccount = await db.account.update({
      where: { id: accountId },
      data: {
        name: body.name,
        broker: body.broker,
        server: body.server,
        currency: body.currency,
        timezone: body.timezone,
        initialBalance: body.initialBalance,
        currentBalance: body.currentBalance,
        currentPhase: body.currentPhase,
        accountType: body.accountType,
        isChallenge: body.isChallenge,
        updatedAt: new Date()
      },
      include: {
        propFirmTemplate: {
          include: {
            propFirm: true
          }
        }
      }
    })

    console.log('✅ Account updated successfully')
    
    return NextResponse.json(updatedAccount)
    
  } catch (error: any) {
    console.error('❌ Error updating account:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}