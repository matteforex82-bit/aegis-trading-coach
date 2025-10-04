import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

//+------------------------------------------------------------------+
//| GET /api/accounts/deleted - Get all soft deleted accounts       |
//+------------------------------------------------------------------+
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching deleted accounts...')
    
    // Get all soft deleted accounts
    const deletedAccounts = await db.tradingAccount.findMany({
      where: {
        deletedAt: {
          not: null
        }
      },
      include: {
        propFirmTemplate: {
          select: {
            name: true,
            accountSize: true,
            currency: true,
            propFirm: {
              select: {
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            trades: true,
            challenges: true
          }
        }
      },
      orderBy: {
        deletedAt: 'desc'
      }
    })

    console.log(`📊 Found ${deletedAccounts.length} deleted accounts`)

    // Format the response
    const formattedAccounts = deletedAccounts.map(account => ({
      id: account.id,
      login: account.login,
      name: account.name,
      broker: account.broker,
      server: account.server,
      currency: account.currency,
      currentPhase: account.currentPhase,
      startBalance: account.startBalance,
      currentBalance: account.currentBalance,
      initialBalance: account.initialBalance,
      deletedAt: account.deletedAt,
      createdAt: account.createdAt,
      propFirm: account.propFirmTemplate?.propFirm?.name || null,
      template: account.propFirmTemplate?.name || null,
      accountSize: account.propFirmTemplate?.accountSize || null,
      tradesCount: account._count.trades,
      challengesCount: account._count.challenges
    }))

    return NextResponse.json({
      success: true,
      deletedAccounts: formattedAccounts,
      total: deletedAccounts.length
    })

  } catch (error: any) {
    console.error('❌ Error fetching deleted accounts:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch deleted accounts',
        details: error.message 
      },
      { status: 500 }
    )
  }
}