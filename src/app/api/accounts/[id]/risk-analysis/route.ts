import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Risk calculation types
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
  alerts: {
    severity: 'CRITICAL' | 'WARNING' | 'INFO'
    message: string
    action?: string
  }[]
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Risk Analysis API called for account:', params.id)

    // Get account with open trades
    const account = await db.account.findUnique({
      where: { id: params.id },
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
    const riskMetrics = await calculateRiskMetrics(openTrades, currentBalance, params.id)
    
    console.log('⚡ Risk Level:', riskMetrics.riskLevel)
    console.log('📈 Current Exposure:', riskMetrics.totalExposurePercent.toFixed(2) + '%')
    
    return NextResponse.json({
      success: true,
      accountId: params.id,
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
    
    // Risk exposure is based on potential loss, not current P&L
    // For now, we'll use absolute current P&L as a proxy for exposure
    const tradeExposure = Math.abs(tradePnL)
    totalExposureUSD += tradeExposure

    // Check for missing stop loss
    if (!trade.sl || trade.sl === 0) {
      tradesWithoutSL.push(trade)
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