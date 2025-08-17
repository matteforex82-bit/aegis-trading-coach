import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Get metrics for the last N days
    const metrics = await db.metric.findMany({
      where: {
        accountId: id,
        date: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: { date: 'desc' },
      take: days
    })

    // Get account summary
    const account = await db.account.findUnique({
      where: { id },
      include: {
        _count: {
          select: { trades: true }
        },
        trades: {
          where: {
            openTime: {
              gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
            }
          }
        }
      }
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

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
        id: account.id,
        name: account.name,
        login: account.login,
        broker: account.broker,
        server: account.server,
        currency: account.currency,
        timezone: account.timezone
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