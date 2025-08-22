import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface ConservativeRiskAnalysis {
  currentEquity: number
  startingBalance: number
  dailyLossLimitUSD: number
  overallLossLimitUSD: number
  dailyLossesRealized: number
  dailyLossesFloating: number
  maxRiskFromSL: number
  maxRiskFromNoSL: number
  dailyMarginLeft: number
  overallMarginLeft: number
  controllingLimit: 'DAILY' | 'OVERALL'
  finalSafeCapacity: number
  riskLevel: 'SAFE' | 'CAUTION' | 'DANGER' | 'CRITICAL'
  alerts: string[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 DYNAMIC Risk Analysis for account:', id)

    // Get account with open trades and PropFirm template
    const account = await db.account.findUnique({
      where: { id },
      include: {
        trades: {
          where: { closeTime: null }, // Only open positions
          orderBy: { openTime: 'desc' }
        },
        propFirmTemplate: {
          include: {
            propFirm: true
          }
        }
      }
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    console.log(`✅ Account found: ${account.name}`)
    console.log(`📊 Open trades: ${account.trades.length}`)
    console.log(`🏢 PropFirm: ${account.propFirmTemplate?.propFirm?.name || 'None'}`)

    // Calculate risk analysis
    const analysis = await calculateDynamicRisk(account)
    
    return NextResponse.json({
      success: true,
      accountId: id,
      riskAnalysis: analysis,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Dynamic Risk Analysis error:', error)
    return NextResponse.json(
      { error: 'Risk analysis failed', details: error.message },
      { status: 500 }
    )
  }
}

async function calculateDynamicRisk(account: any): Promise<ConservativeRiskAnalysis> {
  const openTrades = account.trades || []
  const startingBalance = account.initialBalance || 50000
  
  // Current equity calculation
  const floatingPL = openTrades.reduce((total: number, trade: any) => {
    return total + ((trade.pnlGross || 0) + (trade.commission || 0) + (trade.swap || 0))
  }, 0)
  const currentEquity = startingBalance + floatingPL
  
  console.log(`💰 Account Basics:`)
  console.log(`   Starting Balance: $${startingBalance}`)
  console.log(`   Current Equity: $${currentEquity.toFixed(2)}`)
  console.log(`   Floating P&L: $${floatingPL.toFixed(2)}`)
  
  // 🎯 STEP 1: GET REAL PROPFIRM LIMITS (DYNAMIC)
  let dailyLossLimitUSD = startingBalance * 0.05  // Default 5%
  let overallLossLimitUSD = startingBalance * 0.10  // Default 10%
  
  if (account?.propFirmTemplate?.rulesJson && account.currentPhase) {
    const rules = account.propFirmTemplate.rulesJson
    const phase = account.currentPhase
    const propFirmName = account.propFirmTemplate.propFirm?.name || 'Unknown'
    
    console.log(`🏢 PropFirm Details:`)
    console.log(`   Name: ${propFirmName}`)
    console.log(`   Phase: ${phase}`)
    
    // Daily loss limit
    const dailyRules = rules.dailyLossLimits?.[phase] || rules.dailyLossLimits?.PHASE_1
    if (dailyRules?.percentage) {
      dailyLossLimitUSD = startingBalance * (dailyRules.percentage / 100)
      console.log(`   Daily Limit: ${dailyRules.percentage}% = $${dailyLossLimitUSD}`)
    }
    
    // Overall loss limit  
    const overallRules = rules.overallLossLimits?.[phase] || rules.overallLossLimits?.PHASE_1
    if (overallRules?.percentage) {
      overallLossLimitUSD = startingBalance * (overallRules.percentage / 100)
      console.log(`   Overall Limit: ${overallRules.percentage}% = $${overallLossLimitUSD}`)
    }
    
    // Special cases for specific PropFirms
    if (propFirmName.includes('FUTURA') && phase === 'PHASE_1') {
      dailyLossLimitUSD = Math.min(dailyLossLimitUSD, startingBalance * 0.015) // 1.5%
      console.log(`   🎯 FUTURA Special: $${dailyLossLimitUSD} daily limit`)
    }
  }
  
  // 🎯 STEP 2: CALCOLA PERDITE REALI (DYNAMIC)
  
  // Balance without floating positions
  const currentBalanceClosedOnly = currentEquity - floatingPL
  
  // Total losses from start = Starting Balance - Current Balance (closed trades only)
  const totalLossesFromStart = Math.max(0, startingBalance - currentBalanceClosedOnly)
  
  // TODO: Calculate real daily losses from today's closed trades
  // For now, use approximation based on total losses pattern
  let dailyLossesToday = 0
  if (totalLossesFromStart > 0) {
    // Simple approximation: if there are losses, assume some happened today
    // This should be replaced with actual daily P&L calculation
    dailyLossesToday = Math.min(totalLossesFromStart * 0.1, dailyLossLimitUSD * 0.2) // Max 20% of daily limit
  }
  
  console.log(`📊 Loss Calculations:`)
  console.log(`   Balance Closed Only: $${currentBalanceClosedOnly.toFixed(2)}`)
  console.log(`   Total Losses From Start: $${totalLossesFromStart.toFixed(2)}`)
  console.log(`   Daily Losses Today (approx): $${dailyLossesToday.toFixed(2)}`)
  
  // 🎯 STEP 3: CALCOLA DRAWDOWN RIMANENTI
  const dailyDrawdownLeft = Math.max(0, dailyLossLimitUSD - dailyLossesToday)
  const overallDrawdownLeft = Math.max(0, overallLossLimitUSD - totalLossesFromStart)
  
  console.log(`🧮 Drawdown Remaining:`)
  console.log(`   Daily: $${dailyLossLimitUSD} - $${dailyLossesToday.toFixed(2)} = $${dailyDrawdownLeft.toFixed(2)}`)
  console.log(`   Overall: $${overallLossLimitUSD} - $${totalLossesFromStart.toFixed(2)} = $${overallDrawdownLeft.toFixed(2)}`)
  
  // 🎯 STEP 4: CONTROLLO INTELLIGENTE
  let controllingLimit: 'DAILY' | 'OVERALL'
  let baseMargin: number
  
  if (dailyDrawdownLeft > overallDrawdownLeft) {
    controllingLimit = 'OVERALL'
    baseMargin = overallDrawdownLeft
    console.log(`🧠 DECISION: $${dailyDrawdownLeft.toFixed(2)} > $${overallDrawdownLeft.toFixed(2)} → Use OVERALL`)
  } else {
    controllingLimit = 'DAILY'
    baseMargin = dailyDrawdownLeft
    console.log(`🧠 DECISION: $${dailyDrawdownLeft.toFixed(2)} ≤ $${overallDrawdownLeft.toFixed(2)} → Use DAILY`)
  }
  
  // 🎯 STEP 5: CALCOLA RISCHIO POSIZIONI APERTE
  let maxRiskFromSL = 0
  const alerts: string[] = []
  let hasNoSLPositions = false
  
  console.log(`📊 Analyzing ${openTrades.length} open positions:`)
  
  for (const trade of openTrades) {
    const tradePnL = (trade.pnlGross || 0) + (trade.commission || 0) + (trade.swap || 0)
    const stopLoss = trade.sl
    
    console.log(`   Trade ${trade.ticketId}: ${trade.symbol}, P&L: $${tradePnL.toFixed(2)}, SL: ${stopLoss || 'NONE'}`)
    
    if (stopLoss && stopLoss !== 0) {
      // Simple risk calculation for stop loss
      const riskAmount = Math.abs(tradePnL) + 500 // Current P&L + estimated additional risk
      maxRiskFromSL += riskAmount
      console.log(`     SL Risk: $${riskAmount.toFixed(2)}`)
    } else {
      hasNoSLPositions = true
      alerts.push(`🚨 CRITICAL: ${trade.symbol} NO STOP LOSS!`)
      console.log(`     NO SL: CRITICAL RISK`)
    }
  }
  
  // 🎯 STEP 6: CALCOLO FINALE
  let finalSafeCapacity: number
  
  if (hasNoSLPositions) {
    finalSafeCapacity = 0
    alerts.unshift('🚨 Posizioni senza Stop Loss - Margine = 0')
  } else {
    finalSafeCapacity = Math.max(0, baseMargin - maxRiskFromSL)
  }
  
  console.log(`✅ FINAL RESULT:`)
  console.log(`   Base Margin: $${baseMargin.toFixed(2)} (${controllingLimit})`)
  console.log(`   SL Risk: $${maxRiskFromSL.toFixed(2)}`)
  console.log(`   Final Safe Capacity: $${finalSafeCapacity.toFixed(2)}`)
  
  // Risk level
  let riskLevel: 'SAFE' | 'CAUTION' | 'DANGER' | 'CRITICAL'
  if (hasNoSLPositions || finalSafeCapacity <= 0) {
    riskLevel = 'CRITICAL'
  } else if (finalSafeCapacity < 500) {
    riskLevel = 'DANGER'
  } else if (finalSafeCapacity < 1000) {
    riskLevel = 'CAUTION'
  } else {
    riskLevel = 'SAFE'
  }
  
  return {
    currentEquity,
    startingBalance,
    dailyLossLimitUSD,
    overallLossLimitUSD,
    dailyLossesRealized: dailyLossesToday,
    dailyLossesFloating: Math.max(0, -floatingPL),
    maxRiskFromSL,
    maxRiskFromNoSL: 0,
    dailyMarginLeft: dailyDrawdownLeft,
    overallMarginLeft: overallDrawdownLeft,
    controllingLimit,
    finalSafeCapacity,
    riskLevel,
    alerts
  }
}