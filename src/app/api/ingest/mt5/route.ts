import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log incoming data for debugging
    console.log('📥 Received MT5 data:', JSON.stringify(body, null, 2))
    
    // Validate required fields - adjust based on your MT5 format
    const { account, trades } = body
    
    if (!account || !trades) {
      return NextResponse.json(
        { error: 'Account and trades are required' },
        { status: 400 }
      )
    }

    // Find or create account
    const existingAccount = await db.account.findUnique({
      where: { login: account.login.toString() }
    })

    let accountRecord
    if (existingAccount) {
      // Update existing account
      accountRecord = await db.account.update({
        where: { login: account.login.toString() },
        data: {
          name: account.name || existingAccount.name,
          broker: account.broker,
          server: account.server,
          currency: account.currency,
          timezone: account.timezone || 'Europe/Rome'
        }
      })
    } else {
      // Create new account with temporary user
      const tempUser = await db.user.create({
        data: {
          email: `temp_${account.login}@newdash-pied.vercel.app`,
          name: account.broker || 'Prop Firm Account'
        }
      })

      accountRecord = await db.account.create({
        data: {
          login: account.login.toString(),
          name: account.name,
          broker: account.broker,
          server: account.server,
          currency: account.currency,
          timezone: account.timezone || 'Europe/Rome',
          userId: tempUser.id
        }
      })
    }

    // Process trades - adapt to your MT5 format
    let processedTrades = 0
    let skippedTrades = 0

    for (const trade of trades) {
      try {
        console.log('🔄 Processing trade:', trade)
        
        // Check if trade already exists
        const existingTrade = await db.trade.findUnique({
          where: { ticketId: trade.ticket_id?.toString() || trade.ticket?.toString() }
        })

        if (!existingTrade) {
          await db.trade.create({
            data: {
              ticketId: trade.ticket_id?.toString() || trade.ticket?.toString(),
              positionId: trade.position_id?.toString() || '0',
              orderId: trade.order_id?.toString() || trade.order?.toString() || '0',
              symbol: trade.symbol || '',
              side: trade.side || 'buy',
              volume: trade.volume || 0,
              openTime: trade.open_time ? new Date(trade.open_time) : new Date(),
              closeTime: trade.close_time ? new Date(trade.close_time) : null,
              openPrice: trade.open_price || trade.price || 0,
              closePrice: trade.close_price || 0,
              sl: trade.sl || null,
              tp: trade.tp || null,
              commission: trade.commission || 0,
              swap: trade.swap || 0,
              taxes: trade.taxes || 0,
              pnlGross: trade.pnl_gross || trade.pnl || 0,
              comment: trade.comment || null,
              magic: trade.magic || null,
              dealReason: trade.deal_reason || null,
              closeReason: trade.close_reason || null,
              accountId: accountRecord.id
            }
          })
          processedTrades++
          console.log('✅ Trade processed successfully:', trade.ticket_id || trade.ticket)
        } else {
          skippedTrades++
          console.log('⏭️ Trade already exists, skipping:', trade.ticket_id || trade.ticket)
        }
      } catch (error) {
        console.error('❌ Error processing trade:', trade, error)
        skippedTrades++
      }
    }

    // Calculate and store metrics
    await calculateMetrics(accountRecord.id)

    console.log(`🎉 Ingest completed: ${processedTrades} processed, ${skippedTrades} skipped`)

    return NextResponse.json({
      success: true,
      message: 'Data ingested successfully',
      processedTrades,
      skippedTrades,
      accountLogin: account.login,
      dashboardUrl: 'https://newdash-pied.vercel.app'
    })

  } catch (error) {
    console.error('❌ Error processing MT5 ingest:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

async function calculateMetrics(accountId: string) {
  try {
    // Get all trades for this account
    const trades = await db.trade.findMany({
      where: { accountId },
      orderBy: { openTime: 'asc' }
    })

    if (trades.length === 0) return

    // Group trades by date
    const tradesByDate: { [key: string]: typeof trades } = {}
    
    trades.forEach(trade => {
      const date = trade.openTime.toISOString().split('T')[0]
      if (!tradesByDate[date]) {
        tradesByDate[date] = []
      }
      tradesByDate[date].push(trade)
    })

    // Calculate metrics for each date
    let cumulativePnL = 0
    let maxDailyLoss = 0
    let totalMaxLoss = 0
    let maxDrawdown = 0
    let peakEquity = 0

    for (const date of Object.keys(tradesByDate).sort()) {
      const dayTrades = tradesByDate[date]
      const dailyPnL = dayTrades.reduce((sum, trade) => sum + trade.pnlGross, 0)
      
      cumulativePnL += dailyPnL
      
      // Update max daily loss
      if (dailyPnL < maxDailyLoss) {
        maxDailyLoss = dailyPnL
      }
      
      // Update total max loss (most negative cumulative P&L)
      if (cumulativePnL < totalMaxLoss) {
        totalMaxLoss = cumulativePnL
      }
      
      // Calculate drawdown
      if (cumulativePnL > peakEquity) {
        peakEquity = cumulativePnL
      }
      
      const currentDrawdown = peakEquity - cumulativePnL
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown
      }

      // Store or update metrics for this date
      await db.metric.upsert({
        where: {
          accountId_date: {
            accountId,
            date: new Date(date)
          }
        },
        update: {
          dailyPnL,
          cumulativePnL,
          maxDailyLoss,
          totalMaxLoss,
          maxDrawdown,
          currentDrawdown
        },
        create: {
          accountId,
          date: new Date(date),
          dailyPnL,
          cumulativePnL,
          maxDailyLoss,
          totalMaxLoss,
          maxDrawdown,
          currentDrawdown
        }
      })
    }

  } catch (error) {
    console.error('Error calculating metrics:', error)
  }
}