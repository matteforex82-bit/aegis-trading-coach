import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Risk calculation types
interface WorstCaseScenario {
  totalPotentialLoss: number      // Somma di tutte le perdite possibili
  totalPotentialLossPercent: number // In percentuale del balance
  breakdown: {
    tradesWithSL: {
      count: number
      potentialLoss: number      // Distanza da current price a SL in $
    }
    tradesWithoutSL: {
      count: number
      estimatedLoss: number      // Stima basata su ATR o 100 pips default
    }
    tradesInProfit: {
      count: number
      protectedProfit: number    // Trades con SL in profit (guadagno garantito)
    }
  }
  wouldViolateDailyLimit: boolean
  marginToViolation: number       // Quanto manca per violare il 5%
}

interface RiskMetrics {
  totalExposurePercent: number
  totalExposureUSD: number
  maxAdditionalRisk: number
  tradesWithoutSL: any[]
  correlatedPairs: {
    currency: string
    exposure: number
    trades: any[]
  }[]
  riskLevel: 'SAFE' | 'CAUTION' | 'DANGER'
  worstCaseScenario: WorstCaseScenario
  alerts: {
    severity: 'CRITICAL' | 'WARNING' | 'INFO'
    message: string
    action?: string
  }[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 Risk Analysis API called for account:', id)

    // Get account with open trades
    const account = await db.account.findUnique({
      where: { id },
      include: {
        trades: {
          where: { closeTime: null }, // Only open positions
          orderBy: { openTime: 'desc' }
        }
      }
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    const openTrades = account.trades
    console.log('📊 Analyzing', openTrades.length, 'open positions')

    // Calculate account balance (starting balance + current P&L)
    const currentBalance = account.initialBalance || 50000
    
    // Calculate risk metrics
    const riskMetrics = await calculateRiskMetrics(openTrades, currentBalance, id)
    
    console.log('⚡ Risk Level:', riskMetrics.riskLevel)
    console.log('📈 Current Exposure:', riskMetrics.totalExposurePercent.toFixed(2) + '%')
    
    return NextResponse.json({
      success: true,
      accountId: id,
      balance: currentBalance,
      riskMetrics,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Risk Analysis error:', error)
    return NextResponse.json(
      { 
        error: 'Risk analysis failed', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

async function calculateRiskMetrics(
  openTrades: any[], 
  currentBalance: number, 
  accountId: string
): Promise<RiskMetrics> {
  
  // 1. Calculate total exposure
  let totalExposureUSD = 0
  const tradesWithoutSL: any[] = []
  const currencyExposure: { [key: string]: { exposure: number, trades: any[] } } = {}

  openTrades.forEach(trade => {
    const tradePnL = (trade.pnlGross || 0) + (trade.commission || 0) + (trade.swap || 0)
    let tradeExposure = 0

    // 🎯 CORRECT RISK CALCULATION
    if (trade.sl && trade.sl !== 0) {
      // HAS STOP LOSS: Risk = potential loss from current price to SL
      const currentPrice = trade.openPrice // Fallback if no current price
      const stopLoss = trade.sl
      const volume = trade.volume || 0
      
      // Calculate risk based on price difference to SL
      let priceDifference = 0
      if (trade.side === 'BUY') {
        // BUY: Risk if price goes down to SL
        priceDifference = Math.max(0, currentPrice - stopLoss)
      } else {
        // SELL: Risk if price goes up to SL  
        priceDifference = Math.max(0, stopLoss - currentPrice)
      }
      
      // Estimate risk in USD (simplified calculation)
      if (trade.symbol && trade.symbol.includes('USD')) {
        tradeExposure = priceDifference * volume * 100000 // Standard lot size
      } else {
        // For non-USD pairs, use a more conservative approach
        tradeExposure = priceDifference * volume * 50000
      }
      
      // If SL is in profit (protective stop), risk is minimal
      if (trade.side === 'BUY' && stopLoss > trade.openPrice) {
        tradeExposure = Math.min(tradeExposure, Math.abs(tradePnL) * 0.1) // Very low risk
      } else if (trade.side === 'SELL' && stopLoss < trade.openPrice) {
        tradeExposure = Math.min(tradeExposure, Math.abs(tradePnL) * 0.1) // Very low risk
      }
      
    } else {
      // NO STOP LOSS: High risk - use current P&L as exposure
      tradeExposure = Math.abs(tradePnL) * 2 // Double penalty for no SL
      tradesWithoutSL.push(trade)
    }
    
    // Cap individual trade exposure to reasonable limits
    tradeExposure = Math.min(tradeExposure, currentBalance * 0.02) // Max 2% per trade
    totalExposureUSD += tradeExposure
    
    // Debug logging
    console.log(`📊 Trade ${trade.ticketId || 'N/A'} ${trade.symbol}:`)
    console.log(`   Side: ${trade.side}, Volume: ${trade.volume}`)
    console.log(`   Current P&L: $${tradePnL.toFixed(2)}`)
    console.log(`   Stop Loss: ${trade.sl || 'NONE'}`)
    console.log(`   Calculated Risk Exposure: $${tradeExposure.toFixed(2)}`)
    console.log(`   Has SL Protection: ${trade.sl && trade.sl !== 0 ? 'YES' : 'NO'}`)

    // Check for missing stop loss (already handled above)
    if (!trade.sl || trade.sl === 0) {
      // Already added to tradesWithoutSL above
    }

    // Track currency exposure for correlation analysis
    const symbol = trade.symbol.replace('.p', '').replace('.', '')
    const baseCurrency = symbol.substring(0, 3) // First 3 chars (e.g., EUR from EURUSD)
    
    if (!currencyExposure[baseCurrency]) {
      currencyExposure[baseCurrency] = { exposure: 0, trades: [] }
    }
    currencyExposure[baseCurrency].exposure += tradeExposure
    currencyExposure[baseCurrency].trades.push(trade)
  })

  // 2. Calculate exposure percentage
  const totalExposurePercent = (totalExposureUSD / currentBalance) * 100
  
  // 3. Calculate max additional risk (5% daily limit)
  const dailyLimitUSD = currentBalance * 0.05
  const maxAdditionalRisk = Math.max(0, dailyLimitUSD - totalExposureUSD)
  
  // 4. Determine risk level
  let riskLevel: 'SAFE' | 'CAUTION' | 'DANGER'
  if (totalExposurePercent > 4) {
    riskLevel = 'DANGER'
  } else if (totalExposurePercent > 2) {
    riskLevel = 'CAUTION' 
  } else {
    riskLevel = 'SAFE'
  }

  // 5. Find correlated pairs (3+ trades on same base currency)
  const correlatedPairs = Object.entries(currencyExposure)
    .filter(([currency, data]) => data.trades.length >= 3)
    .map(([currency, data]) => ({
      currency,
      exposure: data.exposure,
      trades: data.trades
    }))

  // 6. Generate alerts
  const alerts: RiskMetrics['alerts'] = []

  // Critical: No Stop Loss
  if (tradesWithoutSL.length > 0) {
    alerts.push({
      severity: 'CRITICAL',
      message: `${tradesWithoutSL.length} trade(s) without Stop Loss detected!`,
      action: 'Set stop losses immediately to protect account'
    })
  }

  // High exposure warnings
  if (riskLevel === 'DANGER') {
    alerts.push({
      severity: 'CRITICAL',
      message: `High risk exposure: ${totalExposurePercent.toFixed(1)}% of account at risk`,
      action: 'Close positions immediately or reduce position sizes'
    })
  } else if (riskLevel === 'CAUTION') {
    alerts.push({
      severity: 'WARNING',
      message: `Moderate risk exposure: ${totalExposurePercent.toFixed(1)}% of account`,
      action: 'Monitor closely and consider reducing exposure'
    })
  }

  // Correlation warnings
  correlatedPairs.forEach(pair => {
    alerts.push({
      severity: 'WARNING',
      message: `High ${pair.currency} correlation: ${pair.trades.length} positions`,
      action: `Consider diversifying beyond ${pair.currency} pairs`
    })
  })

  // 7. Calculate Worst Case Scenario
  const worstCaseScenario = calculateWorstCaseScenario(openTrades, currentBalance)
  
  // Update alerts based on worst case scenario
  if (worstCaseScenario.wouldViolateDailyLimit) {
    alerts.unshift({
      severity: 'CRITICAL',
      message: `🔴 WORST CASE: Would violate 5% limit (-${worstCaseScenario.totalPotentialLossPercent.toFixed(1)}%)`,
      action: 'Reduce positions NOW or add protective stops'
    })
  } else if (worstCaseScenario.totalPotentialLossPercent > 4) {
    alerts.unshift({
      severity: 'WARNING',
      message: `⚠️ WORST CASE: One bad move from violation (-${worstCaseScenario.totalPotentialLossPercent.toFixed(1)}%)`,
      action: 'Limited room for new positions'
    })
  } else if (worstCaseScenario.totalPotentialLossPercent > 3) {
    alerts.unshift({
      severity: 'INFO',
      message: `📊 WORST CASE: Limited room for expansion (-${worstCaseScenario.totalPotentialLossPercent.toFixed(1)}%)`,
      action: 'Consider tighter stops for new trades'
    })
  }

  console.log('💥 Worst Case Total Loss:', worstCaseScenario.totalPotentialLoss.toFixed(2))
  console.log('💥 Worst Case Percentage:', worstCaseScenario.totalPotentialLossPercent.toFixed(2) + '%')
  console.log('💥 Would Violate Daily Limit:', worstCaseScenario.wouldViolateDailyLimit)

  // Save critical alerts to database
  if (alerts.some(alert => alert.severity === 'CRITICAL')) {
    try {
      await saveCriticalAlerts(accountId, alerts.filter(a => a.severity === 'CRITICAL'))
    } catch (error) {
      console.error('Failed to save critical alerts:', error)
    }
  }

  return {
    totalExposurePercent,
    totalExposureUSD,
    maxAdditionalRisk,
    tradesWithoutSL,
    correlatedPairs,
    riskLevel,
    worstCaseScenario,
    alerts
  }
}

async function saveCriticalAlerts(accountId: string, criticalAlerts: any[]) {
  console.log('🚨 Saving', criticalAlerts.length, 'critical alerts')
  
  for (const alert of criticalAlerts) {
    // Check if similar alert already exists and is unresolved
    const existingAlert = await db.riskAlert.findFirst({
      where: {
        accountId,
        severity: 'CRITICAL',
        message: alert.message,
        resolved: false
      }
    })

    if (!existingAlert) {
      await db.riskAlert.create({
        data: {
          accountId,
          severity: 'CRITICAL',
          type: alert.message.includes('Stop Loss') ? 'NO_SL' : 'HIGH_RISK',
          message: alert.message,
          data: { action: alert.action },
          resolved: false
        }
      })
    }
  }
}

//+------------------------------------------------------------------+
//| Calculate Worst Case Scenario - CRITICAL RISK ASSESSMENT        |
//+------------------------------------------------------------------+
function calculateWorstCaseScenario(openTrades: any[], currentBalance: number): WorstCaseScenario {
  console.log('💥 Calculating Worst Case Scenario for', openTrades.length, 'trades...')
  
  let totalPotentialLoss = 0
  let tradesWithSLCount = 0
  let tradesWithSLLoss = 0
  let tradesWithoutSLCount = 0
  let tradesWithoutSLLoss = 0
  let tradesInProfitCount = 0
  let protectedProfit = 0
  
  openTrades.forEach(trade => {
    const tradePnL = (trade.pnlGross || 0) + (trade.commission || 0) + (trade.swap || 0)
    const currentPrice = trade.openPrice // Fallback if no current price available
    const volume = trade.volume || 0
    
    console.log(`💥 Analyzing ${trade.symbol} #${trade.ticketId}:`)
    
    if (trade.sl && trade.sl !== 0) {
      // HAS STOP LOSS: Calculate exact potential loss
      const stopLoss = trade.sl
      let potentialLoss = 0
      
      // Calculate price difference to SL
      let priceDifference = 0
      if (trade.side === 'BUY') {
        priceDifference = Math.max(0, currentPrice - stopLoss)
      } else {
        priceDifference = Math.max(0, stopLoss - currentPrice)
      }
      
      // Convert to USD loss
      if (trade.symbol && trade.symbol.includes('USD')) {
        potentialLoss = priceDifference * volume * 100000 // Standard lot
      } else {
        potentialLoss = priceDifference * volume * 50000 // Conservative estimate
      }
      
      // Check if SL is in profit (protective stop)
      const isProtectiveStop = (trade.side === 'BUY' && stopLoss > trade.openPrice) || 
                               (trade.side === 'SELL' && stopLoss < trade.openPrice)
      
      if (isProtectiveStop) {
        // Protective stop - count as locked profit instead of loss
        tradesInProfitCount++
        protectedProfit += Math.abs(tradePnL) // Current profit is protected
        console.log(`   ✅ PROTECTIVE STOP: +$${Math.abs(tradePnL).toFixed(2)} profit locked`)
      } else {
        // Normal stop loss - potential loss
        tradesWithSLCount++
        tradesWithSLLoss += potentialLoss
        totalPotentialLoss += potentialLoss
        console.log(`   📊 SL RISK: -$${potentialLoss.toFixed(2)} if SL hit`)
      }
      
    } else {
      // NO STOP LOSS: Use worst case estimate
      tradesWithoutSLCount++
      
      let estimatedLoss = 0
      
      if (trade.symbol && trade.symbol.includes('USD')) {
        // Forex major pairs: 100 pips worst case
        estimatedLoss = volume * 100000 * 0.0100 // 100 pips
      } else if (trade.symbol && (trade.symbol.includes('XAU') || trade.symbol.includes('XAG'))) {
        // Gold/Silver: 1% worst case
        estimatedLoss = currentPrice * volume * 0.01
      } else if (trade.symbol && (trade.symbol.includes('NAS') || trade.symbol.includes('SPX'))) {
        // Indices: 2% worst case
        estimatedLoss = Math.abs(tradePnL) * 3 // 3x current P&L as worst case
      } else {
        // Other instruments: Conservative 1.5%
        estimatedLoss = Math.abs(tradePnL) * 2.5
      }
      
      // Cap at 3% of balance per trade to avoid unrealistic numbers
      estimatedLoss = Math.min(estimatedLoss, currentBalance * 0.03)
      
      tradesWithoutSLLoss += estimatedLoss
      totalPotentialLoss += estimatedLoss
      console.log(`   🚨 NO SL: Estimated worst case -$${estimatedLoss.toFixed(2)}`)
    }
  })
  
  const totalPotentialLossPercent = (totalPotentialLoss / currentBalance) * 100
  const dailyLimitUSD = currentBalance * 0.05 // 5% daily limit
  const wouldViolateDailyLimit = totalPotentialLoss > dailyLimitUSD
  const marginToViolation = Math.max(0, dailyLimitUSD - totalPotentialLoss)
  
  console.log('💥 WORST CASE BREAKDOWN:')
  console.log(`   📊 Trades with SL: ${tradesWithSLCount} (risk: -$${tradesWithSLLoss.toFixed(2)})`)
  console.log(`   🚨 Trades without SL: ${tradesWithoutSLCount} (risk: -$${tradesWithoutSLLoss.toFixed(2)})`)
  console.log(`   ✅ Protected trades: ${tradesInProfitCount} (profit: +$${protectedProfit.toFixed(2)})`)
  console.log(`   💥 TOTAL RISK: -$${totalPotentialLoss.toFixed(2)} (${totalPotentialLossPercent.toFixed(1)}%)`)
  console.log(`   ⚖️ Would violate 5% limit: ${wouldViolateDailyLimit ? 'YES' : 'NO'}`)
  console.log(`   📈 Margin to violation: $${marginToViolation.toFixed(2)}`)
  
  return {
    totalPotentialLoss,
    totalPotentialLossPercent,
    breakdown: {
      tradesWithSL: {
        count: tradesWithSLCount,
        potentialLoss: tradesWithSLLoss
      },
      tradesWithoutSL: {
        count: tradesWithoutSLCount,
        estimatedLoss: tradesWithoutSLLoss
      },
      tradesInProfit: {
        count: tradesInProfitCount,
        protectedProfit: protectedProfit
      }
    },
    wouldViolateDailyLimit,
    marginToViolation
  }
}