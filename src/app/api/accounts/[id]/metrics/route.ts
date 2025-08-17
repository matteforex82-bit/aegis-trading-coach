import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Hardcoded response for testing
    return NextResponse.json({
      summary: {
        totalTrades: 3,
        winningTrades: 2,
        losingTrades: 1,
        winRate: 66.67,
        totalVolume: 0.35,
        totalCommission: 7.0,
        totalSwap: -0.4,
        totalPnL: 117.5,
        accountBalance: 10117.5,
        currentDrawdown: 1.2,
        maxDrawdown: 2.5,
        maxDailyLoss: -50.0,
        totalMaxLoss: -200.0
      },
      account: {
        id: id,
        name: 'Account Demo MT5',
        login: '123456',
        broker: 'MetaQuotes',
        server: 'Demo Server',
        currency: 'USD',
        timezone: 'Europe/Rome'
      }
    })

  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}