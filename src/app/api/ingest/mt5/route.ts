import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log incoming data for debugging
    console.log('📥 Received MT5 data:', JSON.stringify(body, null, 2))
    
    // Support different payload formats
    const { account, trades, metrics } = body
    
    // Validate required fields
    if (!account) {
      return NextResponse.json(
        { error: 'Account data is required' },
        { status: 400 }
      )
    }

    // Handle different types of requests
    if (trades && Array.isArray(trades)) {
      // Historical sync or trade updates
      return await handleTradeSync(account, trades)
    } else if (metrics) {
      // Live metrics update
      return await handleMetricsSync(account, metrics)
    } else {
      return NextResponse.json(
        { error: 'Either trades or metrics data is required' },
        { status: 400 }
      )
    }

  } catch (error: any) {
    console.error('❌ Error processing MT5 ingest:', error)
    console.error('❌ Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

//+------------------------------------------------------------------+
//| Handle Trade Synchronization                                    |
//+------------------------------------------------------------------+
async function handleTradeSync(account: any, trades: any[]) {
  try {
    // Create/update account with PropFirm extensions
    const accountRecord = await createOrUpdateAccount(account)
    
    let processedTrades = 0
    let skippedTrades = 0

    for (const trade of trades) {
      try {
        console.log('🔄 Processing trade:', trade.ticket_id || trade.ticket)
        
        // Check if trade already exists
        const existingTrade = await db.trade.findUnique({
          where: { ticketId: trade.ticket_id?.toString() || trade.ticket?.toString() }
        })

        if (!existingTrade) {
          await createTradeWithPropFirmData(trade, accountRecord.id)
          processedTrades++
          console.log('✅ Trade processed:', trade.ticket_id || trade.ticket)
        } else {
          skippedTrades++
          console.log('⏭️ Trade exists, skipping:', trade.ticket_id || trade.ticket)
        }
      } catch (error) {
        console.error('❌ Error processing trade:', trade, error)
        skippedTrades++
      }
    }

    // Calculate and store metrics
    await calculateMetrics(accountRecord.id)

    console.log(`🎉 Trade sync completed: ${processedTrades} processed, ${skippedTrades} skipped`)

    return NextResponse.json({
      success: true,
      message: 'Trades synced successfully',
      processedTrades,
      skippedTrades,
      accountLogin: account.login,
      dashboardUrl: process.env.NEXTAUTH_URL || 'https://newdash-pied.vercel.app'
    })
  } catch (error: any) {
    console.error('❌ Error in trade sync:', error)
    console.error('❌ Trade sync stack:', error.stack)
    throw error
  }
}

//+------------------------------------------------------------------+
//| Handle Live Metrics Synchronization                             |
//+------------------------------------------------------------------+
async function handleMetricsSync(account: any, metrics: any) {
  try {
    // Create/update account
    const accountRecord = await createOrUpdateAccount(account)
    
    // Store live metrics
    const currentDate = new Date()
    const dateKey = currentDate.toISOString().split('T')[0]
    
    await db.metric.upsert({
      where: {
        accountId_date: {
          accountId: accountRecord.id,
          date: new Date(dateKey)
        }
      },
      update: {
        dailyPnL: metrics.dailyPnL || 0,
        cumulativePnL: metrics.totalPnL || 0,
        currentDrawdown: metrics.drawdown || 0,
        maxDrawdown: metrics.maxDrawdown || 0,
        accountBalance: metrics.balance || null,
        equity: metrics.equity || null,
        phase: (metrics.phase as any) || null,
        ruleViolations: metrics.ruleViolations || null,
        tradingDays: metrics.tradingDays || null,
      },
      create: {
        accountId: accountRecord.id,
        date: new Date(dateKey),
        dailyPnL: metrics.dailyPnL || 0,
        cumulativePnL: metrics.totalPnL || 0,
        maxDailyLoss: 0,
        totalMaxLoss: 0,
        currentDrawdown: metrics.drawdown || 0,
        maxDrawdown: metrics.maxDrawdown || 0,
        accountBalance: metrics.balance || null,
        equity: metrics.equity || null,
        phase: (metrics.phase as any) || null,
        ruleViolations: metrics.ruleViolations || null,
        tradingDays: metrics.tradingDays || null,
      }
    })

    console.log('📊 Live metrics updated for account:', account.login)

    return NextResponse.json({
      success: true,
      message: 'Metrics updated successfully',
      timestamp: currentDate.toISOString()
    })
  } catch (error: any) {
    console.error('❌ Error in metrics sync:', error)
    console.error('❌ Metrics sync stack:', error.stack)
    throw error
  }
}

//+------------------------------------------------------------------+
//| Create or Update Account with PropFirm Data                     |
//+------------------------------------------------------------------+
async function createOrUpdateAccount(account: any) {
  // Find or create PropFirm if specified
  let propFirmId = null
  if (account.propFirm) {
    const propFirm = await db.propFirm.upsert({
      where: { name: account.propFirm },
      update: {
        isActive: true
      },
      create: {
        name: account.propFirm,
        description: `${account.propFirm} Prop Trading Firm`,
        defaultRules: {
          profitTarget: account.profitTarget || null,
          maxDailyLoss: account.maxDailyLoss || null,
          maxTotalLoss: account.maxTotalLoss || null,
          maxDrawdown: account.maxDrawdown || null
        }
      }
    })
    propFirmId = propFirm.id
  }

  const existingAccount = await db.account.findUnique({
    where: { login: account.login.toString() }
  })

  if (existingAccount) {
    // Update existing account with PropFirm extensions
    return await db.account.update({
      where: { login: account.login.toString() },
      data: {
        name: account.name || existingAccount.name,
        broker: account.broker || existingAccount.broker,
        server: account.server || existingAccount.server,
        currency: account.currency || existingAccount.currency,
        timezone: account.timezone || existingAccount.timezone || 'Europe/Rome',
        // PropFirm extensions
        propFirmId: propFirmId || existingAccount.propFirmId,
        accountType: (account.accountType as any) || existingAccount.accountType,
        currentPhase: (account.phase as any) || existingAccount.currentPhase,
        startBalance: account.startBalance || existingAccount.startBalance,
        currentBalance: account.currentBalance || existingAccount.currentBalance,
        isChallenge: account.isChallenge ?? existingAccount.isChallenge,
        isFunded: account.isFunded ?? existingAccount.isFunded,
      }
    })
  } else {
    // Create new account with temporary user
    const tempUser = await db.user.create({
      data: {
        email: `temp_${account.login}@propcontrol.com`,
        name: `${account.propFirm || account.broker || 'Prop Firm'} Account`
      }
    })

    return await db.account.create({
      data: {
        login: account.login.toString(),
        name: account.name || `${account.broker} Account`,
        broker: account.broker,
        server: account.server,
        currency: account.currency,
        timezone: account.timezone || 'Europe/Rome',
        userId: tempUser.id,
        // PropFirm extensions
        propFirmId: propFirmId,
        accountType: (account.accountType as any) || 'DEMO',
        currentPhase: (account.phase as any) || 'DEMO',
        startBalance: account.startBalance || null,
        currentBalance: account.currentBalance || null,
        isChallenge: account.isChallenge || false,
        isFunded: account.isFunded || false,
      }
    })
  }
}

//+------------------------------------------------------------------+
//| Create Trade with PropFirm Data                                |
//+------------------------------------------------------------------+
async function createTradeWithPropFirmData(trade: any, accountId: string) {
  // Parse rule violations if present
  let ruleViolations = null
  if (trade.violatesRules && trade.ruleViolations) {
    try {
      ruleViolations = typeof trade.ruleViolations === 'string' 
        ? JSON.parse(trade.ruleViolations) 
        : trade.ruleViolations
    } catch (error) {
      console.error('Error parsing rule violations:', error)
    }
  }

  return await db.trade.create({
    data: {
      // Basic MT5 fields
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
      accountId: accountId,
      
      // PropFirm extensions
      tradePhase: (trade.phase as any) || null,
      violatesRules: Boolean(trade.violatesRules),
      ruleViolations: ruleViolations,
      equityAtOpen: trade.equityAtOpen || null,
      equityAtClose: trade.equityAtClose || null,
      drawdownAtOpen: trade.drawdownAtOpen || null,
      drawdownAtClose: trade.drawdownAtClose || null,
      dailyPnLAtOpen: trade.dailyPnLAtOpen || null,
      dailyPnLAtClose: trade.dailyPnLAtClose || null,
      isWeekendTrade: Boolean(trade.isWeekendTrade),
      newsTime: Boolean(trade.newsTime),
      holdingTime: trade.holdingTime || null,
      riskReward: trade.riskReward || null,
      riskPercent: trade.riskPercent || null,
      // challengeId will be set later if needed
    }
  })
}

//+------------------------------------------------------------------+
//| Calculate and Store Metrics with PropFirm Extensions          |
//+------------------------------------------------------------------+
async function calculateMetrics(accountId: string) {
  try {
    // Get account with PropFirm info
    const account = await db.account.findUnique({
      where: { id: accountId },
      include: { propFirm: true }
    })
    
    if (!account) return

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
    let peakEquity = account.startBalance || 0
    let tradingDaysCount = 0

    for (const date of Object.keys(tradesByDate).sort()) {
      const dayTrades = tradesByDate[date]
      const dailyPnL = dayTrades.reduce((sum, trade) => sum + trade.pnlGross, 0)
      
      cumulativePnL += dailyPnL
      tradingDaysCount++
      
      // Update max daily loss
      if (dailyPnL < maxDailyLoss) {
        maxDailyLoss = dailyPnL
      }
      
      // Update total max loss (most negative cumulative P&L)
      if (cumulativePnL < totalMaxLoss) {
        totalMaxLoss = cumulativePnL
      }
      
      // Calculate drawdown
      const currentEquity = peakEquity + cumulativePnL
      if (currentEquity > peakEquity) {
        peakEquity = currentEquity
      }
      
      const currentDrawdown = peakEquity - currentEquity
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown
      }

      // Collect rule violations for this day
      const dayViolations = dayTrades
        .filter(trade => trade.violatesRules && trade.ruleViolations)
        .map(trade => trade.ruleViolations)
        .filter(violations => violations !== null)

      // Get current phase from latest trade of the day
      const latestTrade = dayTrades[dayTrades.length - 1]
      const currentPhase = latestTrade?.tradePhase || account.currentPhase

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
          currentDrawdown,
          // PropFirm extensions
          phase: (currentPhase as any),
          ruleViolations: dayViolations.length > 0 ? dayViolations : null,
          tradingDays: tradingDaysCount,
        },
        create: {
          accountId,
          date: new Date(date),
          dailyPnL,
          cumulativePnL,
          maxDailyLoss,
          totalMaxLoss,
          maxDrawdown,
          currentDrawdown,
          // PropFirm extensions
          phase: (currentPhase as any),
          ruleViolations: dayViolations.length > 0 ? dayViolations : null,
          tradingDays: tradingDaysCount,
        }
      })
    }

    console.log(`📊 Metrics calculated for ${tradingDaysCount} trading days`)

  } catch (error) {
    console.error('Error calculating metrics:', error)
  }
}