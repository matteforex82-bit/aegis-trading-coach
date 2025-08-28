import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

//+------------------------------------------------------------------+
//| GET /api/accounts/[id]/stats - Get account trading statistics  |
//+------------------------------------------------------------------+
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: accountId } = params
    
    console.log('📊 Fetching stats for account:', accountId)
    
    // Check if account exists
    const account = await db.account.findUnique({
      where: { id: accountId },
      select: { id: true, login: true }
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Get all trades for this account
    const allTrades = await db.trade.findMany({
      where: { accountId },
      select: {
        id: true,
        pnlGross: true,
        volume: true,
        closeTime: true,
        commission: true,
        swap: true
      }
    })

    // Separate closed and open trades
    const closedTrades = allTrades.filter(t => t.closeTime !== null)
    const openTrades = allTrades.filter(t => t.closeTime === null)

    // Calculate statistics
    const totalTrades = closedTrades.length
    const winningTrades = closedTrades.filter(t => (t.pnlGross || 0) > 0).length
    const losingTrades = closedTrades.filter(t => (t.pnlGross || 0) < 0).length
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0

    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnlGross || 0), 0)
    const totalVolume = closedTrades.reduce((sum, t) => sum + (t.volume || 0), 0)
    const totalCommission = closedTrades.reduce((sum, t) => sum + (t.commission || 0), 0)
    const totalSwap = closedTrades.reduce((sum, t) => sum + (t.swap || 0), 0)

    const stats = {
      totalPnL,
      totalVolume,
      winRate: Math.round(winRate * 100) / 100,
      winningTrades,
      losingTrades,
      closedTrades: totalTrades,
      openPositions: openTrades.length,
      totalCommission,
      totalSwap,
      netPnL: totalPnL + totalCommission + totalSwap
    }

    console.log('✅ Stats calculated:', stats)
    
    return NextResponse.json(stats)
    
  } catch (error: any) {
    console.error('❌ Error fetching stats:', error)
    
    // Handle Prisma plan limit errors
    if (error?.code === 'P5000' && error?.message?.includes('planLimitReached')) {
      return NextResponse.json({
        error: 'Database service temporarily unavailable',
        code: 'PRISMA_PLAN_LIMIT'
      }, { status: 503 })
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}