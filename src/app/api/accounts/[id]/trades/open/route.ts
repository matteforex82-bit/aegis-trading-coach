import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

//+------------------------------------------------------------------+
//| GET /api/accounts/[id]/trades/open - Get open positions        |
//+------------------------------------------------------------------+
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: accountId } = params
    
    console.log('📈 Fetching open trades for account:', accountId)
    
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

    // Get all open trades (closeTime is null)
    const openTrades = await db.trade.findMany({
      where: {
        accountId,
        closeTime: null  // Only open positions
      },
      orderBy: { openTime: 'desc' },
      select: {
        id: true,
        ticketId: true,
        symbol: true,
        side: true,
        volume: true,
        openPrice: true,
        currentPrice: true,
        openTime: true,
        pnlGross: true,
        unrealizedPnL: true,
        commission: true,
        swap: true,
        comment: true,
        stopLoss: true,
        takeProfit: true
      }
    })

    // Calculate additional metrics for each trade
    const enrichedTrades = openTrades.map(trade => {
      const pnl = trade.unrealizedPnL || trade.pnlGross || 0
      const netPnl = pnl + (trade.commission || 0) + (trade.swap || 0)
      
      return {
        ...trade,
        netPnL: netPnl,
        pips: calculatePips(trade.symbol, trade.openPrice, trade.currentPrice || trade.openPrice),
        duration: calculateDuration(trade.openTime),
        isProfit: netPnl > 0
      }
    })

    console.log(`✅ Found ${enrichedTrades.length} open trades`)
    
    return NextResponse.json(enrichedTrades)
    
  } catch (error: any) {
    console.error('❌ Error fetching open trades:', error)
    
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

//+------------------------------------------------------------------+
//| Helper Functions                                                |
//+------------------------------------------------------------------+

function calculatePips(symbol: string, openPrice: number, currentPrice: number): number {
  if (!symbol || !openPrice || !currentPrice) return 0
  
  // Determine pip value based on symbol
  let pipMultiplier = 10000 // Default for most pairs
  
  if (symbol.includes('JPY')) {
    pipMultiplier = 100 // JPY pairs have 2 decimal places
  } else if (symbol.includes('XAU') || symbol.includes('GOLD')) {
    pipMultiplier = 10 // Gold has 1 decimal place for pips
  }
  
  return Math.round((currentPrice - openPrice) * pipMultiplier * 100) / 100
}

function calculateDuration(openTime: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(openTime).getTime()
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) {
    return `${days}d ${hours}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}