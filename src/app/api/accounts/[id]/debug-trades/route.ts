import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params

    // Get account info
    const account = await db.account.findUnique({
      where: { id: accountId },
      select: { id: true, login: true, name: true }
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Get all trades for this account (both open and closed)
    const allTrades = await db.trade.findMany({
      where: { accountId },
      orderBy: { openTime: 'desc' },
      take: 20, // Show last 20
      select: {
        id: true,
        ticketId: true,
        symbol: true,
        side: true,
        volume: true,
        openPrice: true,
        closePrice: true,
        openTime: true,
        closeTime: true,
        pnlGross: true,
        swap: true,
        commission: true,
        comment: true
      }
    })

    // Count trades by type
    const closedTradesCount = await db.trade.count({
      where: { accountId, closeTime: { not: null } }
    })

    const openTradesCount = await db.trade.count({
      where: { accountId, closeTime: null }
    })

    const totalTradesCount = await db.trade.count({
      where: { accountId }
    })

    return NextResponse.json({
      success: true,
      debug: {
        account: {
          id: account.id,
          login: account.login,
          name: account.name
        },
        tradeCounts: {
          total: totalTradesCount,
          closed: closedTradesCount,
          open: openTradesCount
        },
        recentTrades: allTrades.map(trade => ({
          id: trade.id,
          ticketId: trade.ticketId,
          symbol: trade.symbol,
          side: trade.side,
          volume: trade.volume,
          openPrice: trade.openPrice,
          closePrice: trade.closePrice,
          openTime: trade.openTime,
          closeTime: trade.closeTime,
          pnlGross: trade.pnlGross,
          status: trade.closeTime ? 'closed' : 'open'
        }))
      }
    })

  } catch (error: any) {
    console.error('Debug trades error:', error)
    return NextResponse.json({
      error: 'Debug failed',
      details: error.message
    }, { status: 500 })
  }
}