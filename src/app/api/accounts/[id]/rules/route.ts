import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createRuleEngine } from '@/lib/rule-engine'

//+------------------------------------------------------------------+
//| GET /api/accounts/[id]/rules - Get account rule evaluation     |
//+------------------------------------------------------------------+
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params
    
    console.log('📋 Fetching rules for account:', accountId)
    
    // Get account with PropFirm template
    const account = await db.account.findUnique({
      where: { id: accountId },
      include: {
        propFirmTemplate: {
          include: {
            propFirm: true
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

    if (!account.propFirmTemplate) {
      // Return default rules structure if no template assigned
      return NextResponse.json({
        maxOverallDrawdown: 0,
        maxDailyLoss: 0,
        profitTarget: 0,
        tradingDays: 0,
        minTradingDays: 0,
        dailyPnL: 0,
        isCompliant: true,
        message: 'No PropFirm template assigned'
      })
    }

    // Get all trades for rule evaluation
    const trades = await db.trade.findMany({
      where: { accountId },
      orderBy: { openTime: 'asc' }
    })

    console.log(`📊 Found ${trades.length} trades for rule evaluation`)

    try {
      // Convert database trades to rule engine format
      const ruleEngineTrades = trades.map(trade => ({
        id: trade.id,
        ticketId: trade.ticketId,
        symbol: trade.symbol,
        volume: trade.volume,
        openPrice: trade.openPrice,
        closePrice: trade.closePrice || undefined,
        openTime: trade.openTime.toISOString(),
        closeTime: trade.closeTime?.toISOString() || undefined,
        pnlGross: trade.pnlGross,
        swap: trade.swap,
        commission: trade.commission,
        comment: trade.comment || '',
        side: trade.side as 'buy' | 'sell'
      }))

      // Convert account to rule engine format
      const ruleEngineAccount = {
        id: account.id,
        login: account.login,
        initialBalance: account.initialBalance || account.propFirmTemplate.accountSize,
        currentPhase: account.currentPhase as 'PHASE_1' | 'PHASE_2' | 'FUNDED',
        propFirmTemplate: {
          id: account.propFirmTemplate.id,
          name: account.propFirmTemplate.name,
          accountSize: account.propFirmTemplate.accountSize,
          currency: account.propFirmTemplate.currency,
          rulesJson: account.propFirmTemplate.rulesJson,
          propFirm: {
            name: account.propFirmTemplate.propFirm.name
          }
        }
      }

      // Create and run rule engine
      const ruleEngine = createRuleEngine(ruleEngineAccount, ruleEngineTrades)
      const evaluation = ruleEngine.evaluateRules()

      // Calculate additional metrics
      const closedTrades = trades.filter(t => t.closeTime)
      const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnlGross || 0), 0)
      
      // Get today's trades for daily P&L
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayTrades = closedTrades.filter(t => {
        const tradeDate = new Date(t.closeTime!)
        tradeDate.setHours(0, 0, 0, 0)
        return tradeDate.getTime() === today.getTime()
      })
      const dailyPnL = todayTrades.reduce((sum, t) => sum + (t.pnlGross || 0), 0)

      // Count trading days (days with at least one closed trade)
      const tradingDaysSet = new Set()
      closedTrades.forEach(trade => {
        if (trade.closeTime) {
          const date = new Date(trade.closeTime)
          tradingDaysSet.add(date.toDateString())
        }
      })
      const tradingDays = tradingDaysSet.size

      const rules = {
        maxOverallDrawdown: evaluation.metrics.currentDrawdown || 0,
        maxDailyLoss: evaluation.metrics.dailyProfit || 0,
        profitTarget: evaluation.metrics.totalProfit || 0,
        tradingDays: evaluation.metrics.tradingDays || tradingDays,
        minTradingDays: account.propFirmTemplate.rulesJson?.phase1?.minTradingDays || 0,
        dailyPnL,
        isCompliant: evaluation.isCompliant,
        // Additional metrics from rule engine
        bestDayActive: evaluation.metrics.bestTradingDay,
        bestDayProjection: evaluation.metrics.bestSingleTrade,
        dailyProtectionActiveRequired: 0,
        dailyProtectionProjectionRequired: 0,
        dailyProtectionActivePassing: true,
        dailyProtectionProjectionPassing: true,
        dailyOptimalExit: 0
      }

      console.log('✅ Rules evaluated:', rules)
      
      return NextResponse.json(rules)
      
    } catch (ruleError: any) {
      console.error('❌ Rule engine error:', ruleError)
      
      // Return basic metrics if rule engine fails
      const closedTrades = trades.filter(t => t.closeTime)
      const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnlGross || 0), 0)
      
      return NextResponse.json({
        maxOverallDrawdown: Math.abs(Math.min(0, totalPnL)),
        maxDailyLoss: 0,
        profitTarget: 0,
        tradingDays: 0,
        minTradingDays: 0,
        dailyPnL: 0,
        isCompliant: true,
        error: 'Rule engine unavailable, showing basic metrics'
      })
    }
    
  } catch (error: any) {
    console.error('❌ Error fetching rules:', error)
    
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