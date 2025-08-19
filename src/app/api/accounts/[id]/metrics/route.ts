import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Get account info
    const account = await db.account.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } }
      }
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Get all trades for this account
    const allTrades = await db.trade.findMany({
      where: { accountId: id },
      orderBy: { createdAt: 'desc' }
    })

    // Separate open and closed trades
    const trades = allTrades.filter(t => t.closeTime) // ONLY closed trades for P&L
    const openTrades = allTrades.filter(t => !t.closeTime)

    // Calculate metrics from real trades (using net P&L like MT5)
    const totalTrades = trades.length
    const winningTrades = trades.filter(t => {
      const netPnL = (t.pnlGross || 0) + (t.swap || 0) + (t.commission || 0)
      return netPnL > 0
    }).length
    const losingTrades = trades.filter(t => {
      const netPnL = (t.pnlGross || 0) + (t.swap || 0) + (t.commission || 0)
      return netPnL < 0
    }).length
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0

    const totalVolume = trades.reduce((sum, t) => sum + (t.volume || 0), 0)
    const totalCommission = trades.reduce((sum, t) => sum + (t.commission || 0), 0)
    const totalSwap = trades.reduce((sum, t) => sum + (t.swap || 0), 0)
    // Calculate total P&L including swap and commission (like MT5)
    const totalPnL = trades.reduce((sum, t) => {
      const grossPnL = t.pnlGross || 0
      const swap = t.swap || 0
      const commission = t.commission || 0
      return sum + grossPnL + swap + commission
    }, 0)

    // Calculate drawdown (simplified - from start balance)
    const startBalance = account.startBalance || 50000
    const currentBalance = startBalance + totalPnL
    const currentDrawdown = Math.max(0, ((startBalance - currentBalance) / startBalance) * 100)

    // Find max/min losses (using net P&L)
    const dailyLosses = trades
      .filter(t => {
        const netPnL = (t.pnlGross || 0) + (t.swap || 0) + (t.commission || 0)
        return netPnL < 0
      })
      .map(t => (t.pnlGross || 0) + (t.swap || 0) + (t.commission || 0))
    
    const maxDailyLoss = dailyLosses.length > 0 ? Math.min(...dailyLosses) : 0
    const totalMaxLoss = Math.min(0, totalPnL)

    return NextResponse.json({
      summary: {
        totalTrades, // Only closed trades
        winningTrades,
        losingTrades,
        winRate: Math.round(winRate * 100) / 100,
        totalVolume: Math.round(totalVolume * 100) / 100,
        totalCommission: Math.round(totalCommission * 100) / 100,
        totalSwap: Math.round(totalSwap * 100) / 100,
        totalPnL: Math.round(totalPnL * 100) / 100,
        accountBalance: Math.round(currentBalance * 100) / 100,
        currentDrawdown: Math.round(currentDrawdown * 100) / 100,
        maxDrawdown: Math.round(currentDrawdown * 100) / 100,
        maxDailyLoss: Math.round(maxDailyLoss * 100) / 100,
        totalMaxLoss: Math.round(totalMaxLoss * 100) / 100
      },
      account: {
        id: account.id,
        name: account.name || account.broker || 'Trading Account',
        login: account.login,
        broker: account.broker,
        server: account.server,
        currency: account.currency,
        timezone: account.timezone
      },
      openTrades: openTrades.map(t => ({
        id: t.id,
        ticketId: t.ticketId,
        symbol: t.symbol,
        side: t.side,
        volume: t.volume,
        openPrice: t.openPrice,
        openTime: t.openTime,
        currentPnL: (t.pnlGross || 0) + (t.swap || 0) + (t.commission || 0), // Use latest unrealized P&L from MT5
        comment: t.comment
      }))
    })

  } catch (error) {
    console.error('Error calculating metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}