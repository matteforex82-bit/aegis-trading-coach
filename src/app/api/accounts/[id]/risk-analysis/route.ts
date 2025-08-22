import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

//+------------------------------------------------------------------+
//| 🚨 RISK EXPOSURE SCANNER - LOGICA CONSERVATIVA CORRETTA         |
//| Principio: ASSUMERE IL PEGGIO per non avere sorprese           |
//+------------------------------------------------------------------+

interface ConservativeRiskAnalysis {
  // 🎯 PRINCIPI CONSERVATIVI:
  // 1. Ogni posizione con SL = PERDITA CERTA (per essere sicuri)
  // 2. Ogni posizione senza SL = PERDITA MASSIMA POSSIBILE
  // 3. Daily limit = LIMITE PROPFIRM REALE (non default)
  // 4. Margine sicurezza = QUANTO POSSO PERDERE ANCORA OGGI

  currentEquity: number
  startingBalance: number
  
  // LIMITI PROPFIRM REALI
  dailyLossLimitUSD: number      // Es: $750 per Futura Funding 1.5%
  overallLossLimitUSD: number    // Es: $5000 per 10% overall
  
  // PERDITE GIA' SUBITE
  dailyLossesRealized: number    // Perdite trade chiusi oggi
  dailyLossesFloating: number    // Perdite posizioni aperte ora
  
  // RISCHIO FUTURO (CONSERVATIVO)
  maxRiskFromSL: number          // Se tutti gli SL vengono colpiti
  maxRiskFromNoSL: number        // Se tutte le posizioni senza SL vanno male
  
  // MARGINE DISPONIBILE
  dailyMarginLeft: number        // Quanto posso perdere ancora oggi
  overallMarginLeft: number      // Quanto posso perdere in totale
  
  // CONTROLLO INTELLIGENTE
  controllingLimit: 'DAILY' | 'OVERALL'  // Quale limite è più restrittivo
  finalSafeCapacity: number      // Il vero margine di sicurezza
  
  riskLevel: 'SAFE' | 'CAUTION' | 'DANGER' | 'CRITICAL'
  alerts: string[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 NEW CONSERVATIVE Risk Analysis for account:', id)

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

    // 🎯 STEP 1: GET REAL PROPFIRM LIMITS
    const analysis = await calculateConservativeRisk(account)
    
    console.log('🚨 CONSERVATIVE ANALYSIS RESULTS:')
    console.log(`   Current Equity: $${analysis.currentEquity}`)
    console.log(`   Daily Limit (PropFirm): $${analysis.dailyLossLimitUSD}`)
    console.log(`   Max SL Risk: $${analysis.maxRiskFromSL}`)
    console.log(`   CONTROLLING LIMIT: ${analysis.controllingLimit}`)
    console.log(`   FINAL SAFE CAPACITY: $${analysis.finalSafeCapacity}`)
    
    return NextResponse.json({
      success: true,
      accountId: id,
      riskAnalysis: analysis,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Conservative Risk Analysis error:', error)
    return NextResponse.json(
      { error: 'Risk analysis failed', details: error.message },
      { status: 500 }
    )
  }
}

async function calculateConservativeRisk(account: any): Promise<ConservativeRiskAnalysis> {
  const openTrades = account.trades
  const startingBalance = account.initialBalance || 50000
  
  // Current equity calculation
  const floatingPL = openTrades.reduce((total: number, trade: any) => {
    return total + ((trade.pnlGross || 0) + (trade.commission || 0) + (trade.swap || 0))
  }, 0)
  const currentEquity = startingBalance + floatingPL
  
  console.log(`💰 Account Status:`)
  console.log(`   Starting Balance: $${startingBalance}`)
  console.log(`   Floating P&L: $${floatingPL.toFixed(2)}`)
  console.log(`   Current Equity: $${currentEquity.toFixed(2)}`)
  
  // 🎯 STEP 1: GET REAL PROPFIRM LIMITS
  let dailyLossLimitUSD = startingBalance * 0.05  // Default 5%
  let overallLossLimitUSD = startingBalance * 0.10  // Default 10%
  
  if (account?.propFirmTemplate?.rulesJson && account.currentPhase) {
    const rules = account.propFirmTemplate.rulesJson
    const phase = account.currentPhase
    const propFirmName = account.propFirmTemplate.propFirm?.name || 'Unknown'
    
    console.log(`🏢 PropFirm: ${propFirmName}`)
    console.log(`📋 Template: ${account.propFirmTemplate.name}`)
    console.log(`🎯 Phase: ${phase}`)
    
    // Daily loss limit
    const dailyRules = rules.dailyLossLimits?.[phase] || rules.dailyLossLimits?.PHASE_1
    if (dailyRules?.percentage) {
      dailyLossLimitUSD = startingBalance * (dailyRules.percentage / 100)
      console.log(`📊 PropFirm Daily Limit: ${dailyRules.percentage}% = $${dailyLossLimitUSD}`)
    }
    
    // Overall loss limit  
    const overallRules = rules.overallLossLimits?.[phase] || rules.overallLossLimits?.PHASE_1
    if (overallRules?.percentage) {
      overallLossLimitUSD = startingBalance * (overallRules.percentage / 100)
      console.log(`📊 PropFirm Overall Limit: ${overallRules.percentage}% = $${overallLossLimitUSD}`)
    }
    
    // Special cases
    if (propFirmName.includes('FUTURA') && phase === 'PHASE_1') {
      dailyLossLimitUSD = Math.min(dailyLossLimitUSD, startingBalance * 0.015) // 1.5%
      console.log(`🎯 FUTURA FUNDING Phase 1 Special: $${dailyLossLimitUSD} daily limit`)
    }
  }
  
  // 🎯 STEP 2: CALCULATE DAILY LOSSES (CONSERVATIVE)
  let dailyLossesRealized = 0 // TODO: Calculate from today's closed trades
  let dailyLossesFloating = Math.max(0, -floatingPL) // Only count losses, not profits
  
  // 🎯 STEP 3: CALCULATE MAXIMUM RISK FROM OPEN POSITIONS (CONSERVATIVE)
  let maxRiskFromSL = 0
  let maxRiskFromNoSL = 0
  const alerts: string[] = []
  
  console.log(`📊 Analyzing ${openTrades.length} open positions (CONSERVATIVE):`)
  
  for (const trade of openTrades) {
    const tradePnL = (trade.pnlGross || 0) + (trade.commission || 0) + (trade.swap || 0)
    const symbol = trade.symbol
    const volume = trade.volume || 0
    const side = trade.side
    const openPrice = trade.openPrice
    const stopLoss = trade.sl
    
    console.log(`🔍 Trade ${trade.ticketId}: ${symbol} ${side} ${volume} lots, P&L: $${tradePnL.toFixed(2)}`)
    
    if (stopLoss && stopLoss !== 0) {
      // HAS STOP LOSS: Count as CERTAIN LOSS (conservative)
      const priceDifference = Math.abs(openPrice - stopLoss)
      const riskUSD = calculateGoldRiskUSD(symbol, priceDifference, volume)
      
      // 🚨 CONSERVATIVE: Always count SL as a loss that WILL happen
      maxRiskFromSL += riskUSD
      
      console.log(`   ✅ HAS SL at ${stopLoss}: CONSERVATIVE RISK = $${riskUSD.toFixed(2)}`)
      
    } else {
      // NO STOP LOSS: Maximum possible loss
      const worstCaseRisk = calculateWorstCaseRisk(symbol, volume, tradePnL)
      maxRiskFromNoSL += worstCaseRisk
      
      alerts.push(`🚨 CRITICAL: ${symbol} has no Stop Loss! Risk: $${worstCaseRisk.toFixed(0)}`)
      console.log(`   🚨 NO SL: WORST CASE RISK = $${worstCaseRisk.toFixed(2)}`)
    }
  }
  
  // 🎯 STEP 4: CALCULATE MARGINS AVAILABLE
  const dailyMarginLeft = Math.max(0, dailyLossLimitUSD - dailyLossesRealized - dailyLossesFloating - maxRiskFromSL - maxRiskFromNoSL)
  const overallMarginLeft = Math.max(0, currentEquity - (startingBalance - overallLossLimitUSD))
  
  // 🎯 STEP 5: INTELLIGENT CONTROL
  let controllingLimit: 'DAILY' | 'OVERALL' = 'DAILY'
  let finalSafeCapacity = dailyMarginLeft
  
  if (overallMarginLeft < dailyMarginLeft) {
    controllingLimit = 'OVERALL'
    finalSafeCapacity = overallMarginLeft
  }
  
  // 🎯 STEP 6: RISK LEVEL DETERMINATION
  let riskLevel: 'SAFE' | 'CAUTION' | 'DANGER' | 'CRITICAL'
  
  if (finalSafeCapacity <= 0) {
    riskLevel = 'CRITICAL'
    alerts.unshift('🚨 CRITICAL: No safe capacity left!')
  } else if (finalSafeCapacity < 500) {
    riskLevel = 'DANGER' 
    alerts.unshift('⚠️ DANGER: Very low safe capacity!')
  } else if (finalSafeCapacity < 1000) {
    riskLevel = 'CAUTION'
  } else {
    riskLevel = 'SAFE'
  }
  
  console.log(`🧠 CONSERVATIVE DECISION:`)
  console.log(`   Daily Margin Left: $${dailyMarginLeft.toFixed(2)}`)
  console.log(`   Overall Margin Left: $${overallMarginLeft.toFixed(2)}`)
  console.log(`   Controlling Limit: ${controllingLimit}`)
  console.log(`   Final Safe Capacity: $${finalSafeCapacity.toFixed(2)}`)
  console.log(`   Risk Level: ${riskLevel}`)
  
  return {
    currentEquity,
    startingBalance,
    dailyLossLimitUSD,
    overallLossLimitUSD,
    dailyLossesRealized,
    dailyLossesFloating,
    maxRiskFromSL,
    maxRiskFromNoSL,
    dailyMarginLeft,
    overallMarginLeft,
    controllingLimit,
    finalSafeCapacity,
    riskLevel,
    alerts
  }
}

function calculateGoldRiskUSD(symbol: string, priceDifference: number, volume: number): number {
  const cleanSymbol = symbol.replace('.p', '').replace('.', '').toUpperCase()
  
  if (cleanSymbol.includes('XAU') || cleanSymbol.includes('GOLD')) {
    // GOLD: 100 ounces per lot, price difference is direct USD
    const riskUSD = priceDifference * volume * 100
    return Math.min(riskUSD, 5000) // Cap at $5000 per trade
  }
  
  // For other instruments, use conservative estimate
  const standardLot = 100000
  const riskUSD = priceDifference * volume * standardLot * 0.0001 * 10 // ~$10 per pip
  return Math.min(riskUSD, 2000) // Cap at $2000 per trade
}

function calculateWorstCaseRisk(symbol: string, volume: number, currentPnL: number): number {
  const cleanSymbol = symbol.replace('.p', '').replace('.', '').toUpperCase()
  
  if (cleanSymbol.includes('XAU') || cleanSymbol.includes('GOLD')) {
    // GOLD: Can move $50-100 in extreme conditions
    const worstCaseMove = 50 // $50 per ounce
    return worstCaseMove * volume * 100 // 100 ounces per lot
  }
  
  // Other instruments: Use current P&L * 5 as worst case
  return Math.abs(currentPnL) * 5
}