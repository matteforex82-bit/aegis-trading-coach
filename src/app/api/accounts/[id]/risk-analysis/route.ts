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

// 🚨 CRITICAL: TRUE Safe Capacity (considering MINIMUM equity touched)
interface TrueSafeCapacity {
  // Il VERO spazio di manovra considerando il worst case sequenziale
  trueSafeCapacity: number        // Quanto posso VERAMENTE perdere senza violare
  theoreticalCapacity: number     // Il vecchio calcolo (INGANNEVOLE)
  floatingPL: number              // P&L corrente flottante
  startingBalance: number         // Balance di inizio giornata
  currentEquity: number           // Equity attuale
  dailyLimitUSD: number          // Limite giornaliero in USD (5%)
  
  // Scenari di simulazione sequenziale
  scenarios: {
    ifAllSLHit: {
      minEquityTouched: number    // Il punto più basso che toccheresti
      wouldViolate: boolean       // True se viola il 5%
      marginToViolation: number   // Quanto manca alla violazione
      sequence: {
        trade: string
        slLoss: number
        runningEquity: number
        violatesHere: boolean
      }[]
    }
    ifWorstFirst: {
      // Simula se i trades peggiori chiudono per primi
      sequence: string[]          // Ordine dei trades (peggiore → migliore)
      minEquityReached: number    // Punto più basso in questa sequenza
      wouldViolate: boolean
    }
  }
  
  warning: string | null // Messaggio di warning critico se necessario
  riskLevel: 'SAFE' | 'DANGER' | 'CRITICAL' // Basato sulla vera capacità
}

interface RiskMetrics {
  totalExposurePercent: number
  totalExposureUSD: number
  maxAdditionalRisk: number // ⚠️ DEPRECATED - USE trueSafeCapacity instead
  tradesWithoutSL: any[]
  correlatedPairs: {
    currency: string
    exposure: number
    trades: any[]
  }[]
  riskLevel: 'SAFE' | 'CAUTION' | 'DANGER'
  worstCaseScenario: WorstCaseScenario
  trueSafeCapacity: TrueSafeCapacity // 🚨 CRITICAL: Real safe capacity calculation
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
    
    // Calculate current equity (balance + floating P&L)
    const floatingPL = openTrades.reduce((total, trade) => {
      return total + ((trade.pnlGross || 0) + (trade.commission || 0) + (trade.swap || 0))
    }, 0)
    const currentEquity = currentBalance + floatingPL
    
    console.log('🏦 Account Status:')
    console.log(`   Balance: $${currentBalance}`)
    console.log(`   Floating P&L: $${floatingPL.toFixed(2)}`)
    console.log(`   Current Equity: $${currentEquity.toFixed(2)}`)
    
    // Calculate risk metrics with complete account data
    const riskMetrics = await calculateRiskMetrics(openTrades, currentBalance, currentEquity, floatingPL, id)
    
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
  currentEquity: number,
  floatingPL: number,
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
      
      // Calculate precise risk in USD based on instrument type
      tradeExposure = calculatePreciseRiskExposure(trade.symbol, priceDifference, volume, currentPrice)
      
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
  
  // 8. 🚨 CRITICAL: Calculate TRUE Safe Capacity (minimum equity based)
  const trueSafeCapacity = calculateTrueSafeCapacity(openTrades, currentBalance, currentEquity, floatingPL, dailyLimitUSD)
  
  // 🚨 CRITICAL ALERTS based on TRUE Safe Capacity (overrides worst case alerts)
  if (trueSafeCapacity.trueSafeCapacity === 0) {
    alerts.unshift({
      severity: 'CRITICAL',
      message: `🚨 STOP TRADING NOW! Any SL hit will violate daily limit!`,
      action: 'Close positions immediately or risk PropFirm violation'
    })
  } else if (trueSafeCapacity.scenarios.ifAllSLHit.wouldViolate) {
    alerts.unshift({
      severity: 'CRITICAL', 
      message: `🔴 DANGER: Sequential SL hits would violate daily limit!`,
      action: 'Reduce position sizes or tighten stops immediately'
    })
  } else if (trueSafeCapacity.trueSafeCapacity < 500) {
    alerts.unshift({
      severity: 'WARNING',
      message: `⚠️ CRITICAL: Only $${trueSafeCapacity.trueSafeCapacity.toFixed(0)} TRUE safe capacity left!`,
      action: 'Extreme caution required - one bad trade could violate limit'
    })
  }

  // Add specific warning from trueSafeCapacity calculation
  if (trueSafeCapacity.warning) {
    alerts.unshift({
      severity: 'CRITICAL',
      message: trueSafeCapacity.warning,
      action: 'Review minimum equity scenario immediately'
    })
  }
  
  // Update alerts based on worst case scenario (secondary to TRUE safe capacity)
  if (worstCaseScenario.wouldViolateDailyLimit && trueSafeCapacity.trueSafeCapacity > 0) {
    alerts.push({
      severity: 'WARNING',
      message: `📊 THEORETICAL: Would violate 5% limit (-${worstCaseScenario.totalPotentialLossPercent.toFixed(1)}%)`,
      action: 'Check TRUE Safe Capacity for real risk assessment'
    })
  }

  console.log('💥 Worst Case Total Loss:', worstCaseScenario.totalPotentialLoss.toFixed(2))
  console.log('💥 Worst Case Percentage:', worstCaseScenario.totalPotentialLossPercent.toFixed(2) + '%')
  console.log('💥 Would Violate Daily Limit:', worstCaseScenario.wouldViolateDailyLimit)
  
  console.log('🚨 TRUE SAFE CAPACITY ANALYSIS:')
  console.log(`   TRUE Safe Capacity: $${trueSafeCapacity.trueSafeCapacity.toFixed(2)} (REAL limit)`)
  console.log(`   Theoretical Capacity: $${trueSafeCapacity.theoreticalCapacity.toFixed(2)} (MISLEADING)`)
  console.log(`   Min Equity if all SL hit: $${trueSafeCapacity.scenarios.ifAllSLHit.minEquityTouched.toFixed(2)}`)
  console.log(`   Would violate on sequential losses: ${trueSafeCapacity.scenarios.ifAllSLHit.wouldViolate ? 'YES 🚨' : 'NO ✅'}`)
  console.log(`   Risk Level: ${trueSafeCapacity.riskLevel}`)
  if (trueSafeCapacity.warning) {
    console.log(`   ⚠️ WARNING: ${trueSafeCapacity.warning}`)
  }

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
    maxAdditionalRisk, // ⚠️ DEPRECATED - keeping for backward compatibility
    tradesWithoutSL,
    correlatedPairs,
    riskLevel,
    worstCaseScenario,
    trueSafeCapacity, // 🚨 CRITICAL: Use this instead of maxAdditionalRisk
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
      
      // Calculate precise potential loss in USD
      potentialLoss = calculatePreciseRiskExposure(trade.symbol, priceDifference, volume, currentPrice)
      
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
      
      // Calculate worst case loss estimate based on instrument type and typical volatility
      let estimatedLoss = calculateWorstCaseEstimate(trade.symbol, volume, currentPrice, tradePnL, currentBalance)
      
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

//+------------------------------------------------------------------+
//| Calculate Precise Risk Exposure in USD - ACCURATE PIP VALUES    |
//+------------------------------------------------------------------+
function calculatePreciseRiskExposure(symbol: string, priceDifference: number, volume: number, currentPrice: number): number {
  if (!symbol || priceDifference === 0 || volume === 0) {
    return 0
  }

  // Clean symbol name
  const cleanSymbol = symbol.replace('.p', '').replace('.', '').toUpperCase()
  
  console.log(`🔧 Calculating precise risk for ${cleanSymbol}: price diff=${priceDifference}, volume=${volume}, current=${currentPrice}`)

  // Standard lot size
  const standardLot = 100000
  const contractSize = volume * standardLot

  let riskInUSD = 0

  if (cleanSymbol.includes('XAU') || cleanSymbol.includes('GOLD')) {
    // GOLD (XAUUSD): Price difference is directly in USD per ounce
    // Each lot = 100 ounces, so risk = priceDifference * volume * 100
    riskInUSD = priceDifference * volume * 100
    console.log(`   🥇 GOLD calculation: ${priceDifference} * ${volume} * 100 = $${riskInUSD.toFixed(2)}`)
    
  } else if (cleanSymbol.includes('XAG') || cleanSymbol.includes('SILVER')) {
    // SILVER (XAGUSD): Price difference is directly in USD per ounce  
    // Each lot = 5000 ounces, so risk = priceDifference * volume * 5000
    riskInUSD = priceDifference * volume * 5000
    console.log(`   🥈 SILVER calculation: ${priceDifference} * ${volume} * 5000 = $${riskInUSD.toFixed(2)}`)
    
  } else if (cleanSymbol.startsWith('USD')) {
    // USD is base currency (e.g., USDCAD, USDCHF, USDJPY)
    // Risk = (priceDifference / current price) * contract size
    if (currentPrice > 0) {
      riskInUSD = (priceDifference / currentPrice) * contractSize
      console.log(`   💱 USD base: (${priceDifference} / ${currentPrice}) * ${contractSize} = $${riskInUSD.toFixed(2)}`)
    } else {
      // Fallback if no current price
      riskInUSD = priceDifference * contractSize * 0.01
      console.log(`   💱 USD base (fallback): ${priceDifference} * ${contractSize} * 0.01 = $${riskInUSD.toFixed(2)}`)
    }
    
  } else if (cleanSymbol.endsWith('USD')) {
    // USD is quote currency (e.g., EURUSD, GBPUSD, AUDUSD)
    // Risk = priceDifference * contract size (direct USD calculation)
    riskInUSD = priceDifference * contractSize
    console.log(`   💱 USD quote: ${priceDifference} * ${contractSize} = $${riskInUSD.toFixed(2)}`)
    
  } else if (cleanSymbol.includes('JPY')) {
    // Japanese Yen pairs (e.g., EURJPY, GBPJPY)
    // JPY pip value is different, need to convert to USD
    // Approximate conversion: assume USDJPY ≈ 150 for rough calculation
    const usdJpyRate = 150 // This should ideally be fetched from current rates
    riskInUSD = (priceDifference * contractSize) / usdJpyRate
    console.log(`   🇯🇵 JPY pair: (${priceDifference} * ${contractSize}) / ${usdJpyRate} = $${riskInUSD.toFixed(2)}`)
    
  } else {
    // Cross pairs (e.g., EURGBP, AUDCAD, etc.)
    // Use conservative estimate: assume average pip value of $10 per standard lot
    const conservativePipValue = 10
    const pips = priceDifference * 10000 // Convert price difference to pips
    riskInUSD = pips * volume * conservativePipValue
    console.log(`   ⚖️ Cross pair: ${pips} pips * ${volume} lots * $${conservativePipValue} = $${riskInUSD.toFixed(2)}`)
  }

  // Apply reasonable limits to prevent unrealistic calculations
  const maxRiskPerTrade = 5000 // Max $5000 risk per trade calculation
  riskInUSD = Math.min(Math.abs(riskInUSD), maxRiskPerTrade)
  
  console.log(`   ✅ Final calculated risk: $${riskInUSD.toFixed(2)}`)
  
  return riskInUSD
}

//+------------------------------------------------------------------+
//| Calculate Worst Case Estimate for Trades WITHOUT Stop Loss      |
//+------------------------------------------------------------------+
function calculateWorstCaseEstimate(symbol: string, volume: number, currentPrice: number, currentPnL: number, accountBalance: number): number {
  if (!symbol || volume === 0) {
    return 0
  }

  const cleanSymbol = symbol.replace('.p', '').replace('.', '').toUpperCase()
  console.log(`💀 Calculating worst case estimate for ${cleanSymbol} (NO SL): volume=${volume}, price=${currentPrice}`)

  let worstCaseDistance = 0
  let estimatedLoss = 0

  if (cleanSymbol.includes('XAU') || cleanSymbol.includes('GOLD')) {
    // GOLD: Can move $50-100 in extreme conditions
    worstCaseDistance = 50 // $50 per ounce worst case
    estimatedLoss = worstCaseDistance * volume * 100 // 100 ounces per lot
    console.log(`   🥇 GOLD worst case: $${worstCaseDistance} * ${volume} * 100 = $${estimatedLoss.toFixed(2)}`)
    
  } else if (cleanSymbol.includes('XAG') || cleanSymbol.includes('SILVER')) {
    // SILVER: Can move $2-5 in extreme conditions  
    worstCaseDistance = 3 // $3 per ounce worst case
    estimatedLoss = worstCaseDistance * volume * 5000 // 5000 ounces per lot
    console.log(`   🥈 SILVER worst case: $${worstCaseDistance} * ${volume} * 5000 = $${estimatedLoss.toFixed(2)}`)
    
  } else if (cleanSymbol.includes('USD')) {
    // FOREX pairs: 100-200 pips worst case depending on pair volatility
    let worstCasePips = 150 // Default 150 pips
    
    // Adjust based on pair volatility
    if (cleanSymbol.includes('GBP')) {
      worstCasePips = 200 // GBP pairs more volatile
    } else if (cleanSymbol.includes('JPY')) {
      worstCasePips = 300 // JPY pairs can move more pips (but smaller pip value)
    } else if (cleanSymbol.includes('CHF')) {
      worstCasePips = 100 // CHF pairs more stable
    }
    
    // Convert pips to price difference
    let pipValue = 0.0001 // Standard pip for most pairs
    if (cleanSymbol.includes('JPY')) {
      pipValue = 0.01 // JPY pip is 2 decimal places
    }
    
    worstCaseDistance = worstCasePips * pipValue
    estimatedLoss = calculatePreciseRiskExposure(symbol, worstCaseDistance, volume, currentPrice)
    console.log(`   💱 FOREX worst case: ${worstCasePips} pips (${worstCaseDistance}) = $${estimatedLoss.toFixed(2)}`)
    
  } else {
    // Cross pairs or other instruments: Use conservative percentage
    const conservativePercentage = 0.02 // 2% worst case
    estimatedLoss = Math.abs(currentPnL) * 5 // 5x current P&L as extreme scenario
    console.log(`   ⚖️ Other instrument worst case: ${Math.abs(currentPnL)} * 5 = $${estimatedLoss.toFixed(2)}`)
  }

  // Apply caps to prevent unrealistic numbers
  const maxWorstCasePerTrade = accountBalance * 0.05 // Max 5% of account per trade
  estimatedLoss = Math.min(Math.abs(estimatedLoss), maxWorstCasePerTrade)
  
  console.log(`   💀 Final worst case estimate: $${estimatedLoss.toFixed(2)}`)
  
  return estimatedLoss
}

//+------------------------------------------------------------------+
//| 🚨 CRITICAL: Calculate TRUE Safe Capacity (Sequential Risk)     |
//+------------------------------------------------------------------+
function calculateTrueSafeCapacity(
  openTrades: any[], 
  startingBalance: number, 
  currentEquity: number, 
  floatingPL: number,
  dailyLimitUSD: number
): TrueSafeCapacity {
  
  console.log('🚨 CRITICAL: Calculating TRUE Safe Capacity...')
  console.log(`   Starting Balance: $${startingBalance}`)
  console.log(`   Current Equity: $${currentEquity.toFixed(2)}`)
  console.log(`   Floating P&L: $${floatingPL.toFixed(2)}`)
  console.log(`   Daily Limit: $${dailyLimitUSD} (5%)`)
  
  // Calculate the old (misleading) theoretical capacity
  const theoreticalCapacity = Math.max(0, dailyLimitUSD - Math.abs(floatingPL))
  
  // Prepare trades with their potential Stop Loss losses
  const tradesWithLossPotential = openTrades.map(trade => {
    const tradePnL = (trade.pnlGross || 0) + (trade.commission || 0) + (trade.swap || 0)
    let slLoss = 0
    
    if (trade.sl && trade.sl !== 0) {
      // 🚨 CRITICAL FIX: Proper Stop Loss vs Stop Profit detection
      const openPrice = trade.openPrice
      const stopLoss = trade.sl
      const isBuy = (trade.side === 'BUY' || trade.side === 'buy')
      
      console.log(`🔍 DEBUGGING ${trade.symbol}: Open=${openPrice}, SL=${stopLoss}, Side=${trade.side}, P&L=$${tradePnL.toFixed(2)}`)
      
      // Determine if this is a PROTECTIVE STOP (stop profit) or RISK STOP (stop loss)
      const isStopProfit = isBuy ? (stopLoss > openPrice) : (stopLoss < openPrice)
      
      console.log(`🔍 Is Stop Profit? ${isStopProfit} (Buy: ${isBuy}, SL > Open: ${stopLoss > openPrice}, SL < Open: ${stopLoss < openPrice})`)
      
      if (isStopProfit && tradePnL > 0) {
        // ✅ PROTECTIVE STOP: SL protects profits - use current P&L as protected profit
        slLoss = tradePnL // Simply use current profit as the protected amount
        
        console.log(`✅ PROTECTIVE STOP confirmed for ${trade.symbol}: +$${slLoss.toFixed(2)} profit protected`)
      } else {
        // 🚨 RISK STOP: Real stop loss - calculate potential loss from current price to SL
        const priceDifference = Math.abs(openPrice - stopLoss)
        const potentialRisk = -calculatePreciseRiskExposure(trade.symbol, priceDifference, trade.volume || 0, openPrice)
        
        if (tradePnL > 0) {
          // Trade in profit but SL would cause loss: net effect = SL loss - current profit
          slLoss = potentialRisk + tradePnL // tradePnL is positive, potentialRisk is negative
        } else {
          // Trade already in loss: total loss = current loss + additional SL loss  
          slLoss = potentialRisk + tradePnL // both negative = bigger loss
        }
        
        console.log(`🚨 RISK STOP confirmed for ${trade.symbol}: ${slLoss.toFixed(2)} potential loss`)
      }
    } else {
      // No SL: use worst case estimate as potential loss
      slLoss = -calculateWorstCaseEstimate(trade.symbol, trade.volume || 0, trade.openPrice, tradePnL, startingBalance)
    }
    
    return {
      ...trade,
      potentialSLLoss: slLoss,
      currentPnL: tradePnL,
      symbol: trade.symbol,
      ticketId: trade.ticketId || 'N/A'
    }
  })
  
  // Sort trades: RISK STOPS first (worst losses), then PROTECTIVE STOPS 
  const sortedTrades = [...tradesWithLossPotential].sort((a, b) => {
    // Negative values (losses) come first, then positive values (profits)
    if (a.potentialSLLoss < 0 && b.potentialSLLoss >= 0) return -1
    if (a.potentialSLLoss >= 0 && b.potentialSLLoss < 0) return 1
    // Within same category, sort by magnitude
    return a.potentialSLLoss - b.potentialSLLoss
  })
  
  console.log('🔄 Simulating sequential SL hits (worst first):')
  
  // Simulate sequential closure starting from worst trades
  let runningEquity = currentEquity
  let minEquityTouched = currentEquity
  const sequence: any[] = []
  let violationFound = false
  let violationAtStep = -1
  
  for (let i = 0; i < sortedTrades.length; i++) {
    const trade = sortedTrades[i]
    
    // 🚨 CRITICAL FIX: Proper handling of Stop Profit vs Stop Loss
    if (trade.potentialSLLoss > 0) {
      // PROTECTIVE STOP: SL would lock in profits - IMPROVE equity
      runningEquity = runningEquity - trade.currentPnL + trade.potentialSLLoss
      console.log(`   ${i + 1}. ${trade.symbol}: ✅ PROFIT PROTECTED +$${trade.potentialSLLoss.toFixed(2)} → Equity: $${runningEquity.toFixed(2)}`)
    } else {
      // RISK STOP: SL would cause loss - DECREASE equity  
      runningEquity = runningEquity - trade.currentPnL + trade.potentialSLLoss
      minEquityTouched = Math.min(minEquityTouched, runningEquity)
      
      const drawdownAtThisPoint = startingBalance - runningEquity
      const violatesHere = drawdownAtThisPoint > dailyLimitUSD
      
      if (violatesHere && !violationFound) {
        violationFound = true
        violationAtStep = i
      }
      
      console.log(`   ${i + 1}. ${trade.symbol}: 🚨 RISK LOSS ${trade.potentialSLLoss.toFixed(2)} → Equity: $${runningEquity.toFixed(2)} ${violatesHere ? '🚨 VIOLATION!' : ''}`)
    }
    
    // Always track minimum equity (even with protective stops)
    minEquityTouched = Math.min(minEquityTouched, runningEquity)
    
    const drawdownAtThisPoint = startingBalance - runningEquity
    const violatesHere = drawdownAtThisPoint > dailyLimitUSD
    
    sequence.push({
      trade: `${trade.symbol} #${trade.ticketId}`,
      slLoss: trade.potentialSLLoss,
      runningEquity: runningEquity,
      violatesHere: violatesHere,
      isProtectiveStop: trade.potentialSLLoss > 0
    })
  }
  
  // Calculate TRUE safe capacity
  const maxDrawdownAllowed = startingBalance - dailyLimitUSD // Minimum equity allowed
  const currentDrawdownUsed = startingBalance - minEquityTouched
  const trueSafeCapacity = Math.max(0, dailyLimitUSD - currentDrawdownUsed)
  
  // Determine risk level
  let riskLevel: 'SAFE' | 'DANGER' | 'CRITICAL'
  if (violationFound || trueSafeCapacity === 0) {
    riskLevel = 'CRITICAL'
  } else if (trueSafeCapacity < 500) {
    riskLevel = 'DANGER' 
  } else {
    riskLevel = 'SAFE'
  }
  
  // Generate warning message
  let warning: string | null = null
  if (violationFound) {
    warning = `⚠️ DANGER: Sequential SL hits would violate daily limit at step ${violationAtStep + 1}!`
  } else if (trueSafeCapacity === 0) {
    warning = `⚠️ CRITICAL: Zero safe capacity - any loss will violate daily limit!`
  } else if (trueSafeCapacity < 200) {
    warning = `⚠️ WARNING: Only $${trueSafeCapacity.toFixed(2)} real capacity remaining!`
  }
  
  console.log('🚨 TRUE SAFE CAPACITY RESULTS:')
  console.log(`   Minimum Equity Touched: $${minEquityTouched.toFixed(2)}`)
  console.log(`   TRUE Safe Capacity: $${trueSafeCapacity.toFixed(2)} (REAL)`)
  console.log(`   Theoretical Capacity: $${theoreticalCapacity.toFixed(2)} (MISLEADING)`)
  console.log(`   Sequential Violation Risk: ${violationFound ? 'YES 🚨' : 'NO ✅'}`)
  console.log(`   Risk Level: ${riskLevel}`)
  
  return {
    trueSafeCapacity,
    theoreticalCapacity, 
    floatingPL,
    startingBalance,
    currentEquity,
    dailyLimitUSD,
    scenarios: {
      ifAllSLHit: {
        minEquityTouched,
        wouldViolate: violationFound,
        marginToViolation: Math.max(0, dailyLimitUSD - (startingBalance - minEquityTouched)),
        sequence
      },
      ifWorstFirst: {
        sequence: sortedTrades.map(t => `${t.symbol}: ${t.potentialSLLoss.toFixed(2)}`),
        minEquityReached: minEquityTouched,
        wouldViolate: violationFound
      }
    },
    warning,
    riskLevel
  }
}