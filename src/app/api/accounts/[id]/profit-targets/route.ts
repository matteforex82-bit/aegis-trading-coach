import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

//+------------------------------------------------------------------+
//| GET /api/accounts/[id]/profit-targets - Calcoli Profit Target   |
//| Separati: Chiuso vs Flottante + Daily/Overall Loss             |
//+------------------------------------------------------------------+
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: accountId } = params
    
    console.log('📊 Calculating profit targets for account:', accountId)
    
    // Get account info
    const account = await db.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        login: true,
        startBalance: true,
        currentBalance: true,
        currentPhase: true,
        propFirmTemplate: {
          select: {
            id: true,
            name: true,
            rulesJson: true
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

    // Get all trades
    const allTrades = await db.trade.findMany({
      where: { accountId },
      select: {
        id: true,
        ticketId: true,
        symbol: true,
        side: true,
        volume: true,
        openPrice: true,
        closePrice: true,
        openTime: true,
        closeTime: true,
        pnlGross: true,
        commission: true,
        swap: true
      },
      orderBy: { openTime: 'desc' }
    })

    // Separate closed and open trades
    const closedTrades = allTrades.filter(t => t.closeTime !== null)
    const openTrades = allTrades.filter(t => t.closeTime === null)

    // Get template info for profit target percentage
    const template = account.propFirmTemplate?.rulesJson || null
    const accountSize = account.startBalance || 50000
    const currentPhase = account.currentPhase || 'PHASE_1'
    
    // Default profit target percentages by phase
    const profitTargetPercentages = {
      PHASE_1: 8, // 8%
      PHASE_2: 5, // 5%
      FUNDED: 5   // 5%
    }
    
    const profitTargetPercent = template?.rules?.[currentPhase]?.profitTarget?.percentage || profitTargetPercentages[currentPhase as keyof typeof profitTargetPercentages] || 8
    const profitTargetAmount = (accountSize * profitTargetPercent) / 100

    // 1. PROFIT TARGET CHIUSO (solo trade chiusi)
    const closedPnL = closedTrades.reduce((sum, t) => sum + (t.pnlGross || 0), 0)
    const closedCommission = closedTrades.reduce((sum, t) => sum + (t.commission || 0), 0)
    const closedSwap = closedTrades.reduce((sum, t) => sum + (t.swap || 0), 0)
    const closedNetPnL = closedPnL + closedCommission + closedSwap
    
    const closedProfitProgress = (closedNetPnL / profitTargetAmount) * 100
    const closedRemainingAmount = Math.max(0, profitTargetAmount - closedNetPnL)

    // 2. PROFIT TARGET FLOTTANTE (include posizioni aperte)
    const openPnL = openTrades.reduce((sum, t) => sum + (t.pnlGross || 0), 0)
    const openCommission = openTrades.reduce((sum, t) => sum + (t.commission || 0), 0)
    const openSwap = openTrades.reduce((sum, t) => sum + (t.swap || 0), 0)
    const openNetPnL = openPnL + openCommission + openSwap
    
    const totalNetPnL = closedNetPnL + openNetPnL
    const floatingProfitProgress = (totalNetPnL / profitTargetAmount) * 100
    const floatingRemainingAmount = Math.max(0, profitTargetAmount - totalNetPnL)

    // 3. DAILY LOSS (perdite della giornata corrente)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Inizio giornata
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1) // Fine giornata
    
    const todayClosedTrades = closedTrades.filter(t => {
      const closeTime = new Date(t.closeTime!)
      return closeTime >= today && closeTime < tomorrow
    })
    
    const todayClosedPnL = todayClosedTrades.reduce((sum, t) => sum + (t.pnlGross || 0) + (t.commission || 0) + (t.swap || 0), 0)
    const todayOpenPnL = openNetPnL // Tutte le posizioni aperte contribuiscono al daily
    const dailyTotalPnL = todayClosedPnL + todayOpenPnL
    const dailyLoss = Math.min(0, dailyTotalPnL) // Solo se negativo
    
    // Daily loss limit (esempio: 5% del conto)
    const dailyLossLimit = (accountSize * 5) / 100
    const dailyLossProgress = Math.abs(dailyLoss / dailyLossLimit) * 100

    // 4. OVERALL LOSS (perdite totali dal balance iniziale)
    const currentBalance = account.currentBalance || accountSize
    const overallLoss = Math.min(0, currentBalance - accountSize) // Solo se il conto è sotto il balance iniziale
    const overallLossAmount = Math.abs(overallLoss)
    const overallLossPercent = (overallLossAmount / accountSize) * 100
    
    // Overall loss limit (esempio: 10% del conto)
    const overallLossLimit = (accountSize * 10) / 100
    const overallLossProgress = (overallLossAmount / overallLossLimit) * 100

    const result = {
      // Account Info
      accountSize,
      currentBalance,
      profitTargetAmount,
      profitTargetPercent,
      
      // Profit Target Chiuso
      closed: {
        netPnL: closedNetPnL,
        progress: Math.round(closedProfitProgress * 100) / 100,
        remainingAmount: Math.round(closedRemainingAmount * 100) / 100,
        trades: closedTrades.length
      },
      
      // Profit Target Flottante (Live)
      floating: {
        netPnL: Math.round(totalNetPnL * 100) / 100,
        progress: Math.round(floatingProfitProgress * 100) / 100,
        remainingAmount: Math.round(floatingRemainingAmount * 100) / 100,
        openPositions: openTrades.length,
        openNetPnL: Math.round(openNetPnL * 100) / 100
      },
      
      // Daily Loss
      dailyLoss: {
        amount: Math.round(dailyLoss * 100) / 100,
        progress: Math.round(dailyLossProgress * 100) / 100,
        limit: dailyLossLimit,
        todayClosedPnL: Math.round(todayClosedPnL * 100) / 100,
        todayOpenPnL: Math.round(todayOpenPnL * 100) / 100
      },
      
      // Overall Loss
      overallLoss: {
        amount: Math.round(overallLossAmount * 100) / 100,
        percent: Math.round(overallLossPercent * 100) / 100,
        progress: Math.round(overallLossProgress * 100) / 100,
        limit: overallLossLimit,
        isInProfit: overallLoss >= 0
      }
    }

    console.log('✅ Profit targets calculated:', result)
    
    return NextResponse.json(result)
    
  } catch (error: any) {
    console.error('❌ Error calculating profit targets:', error)
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}