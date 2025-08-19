import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createRuleEngine } from '@/lib/rule-engine'

//+------------------------------------------------------------------+
//| POST /api/accounts/[id]/evaluate-rules - Evaluate PropFirm Rules|
//+------------------------------------------------------------------+
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: accountId } = params
    
    console.log('🔍 Evaluating rules for account:', accountId)
    
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
        { success: false, error: 'Account not found' },
        { status: 404 }
      )
    }

    if (!account.propFirmTemplate) {
      return NextResponse.json(
        { success: false, error: 'Account has no PropFirm template assigned' },
        { status: 400 }
      )
    }

    // Get all trades for the account
    const trades = await db.trade.findMany({
      where: { accountId },
      orderBy: { openTime: 'asc' }
    })

    console.log(`📊 Found ${trades.length} trades for rule evaluation`)

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
      profit: trade.profit,
      swap: trade.swap,
      commission: trade.commission,
      comment: trade.comment || '',
      type: trade.type as 'BUY' | 'SELL',
      isOpen: trade.isOpen
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
    const result = ruleEngine.evaluateRules()

    console.log('✅ Rule evaluation completed')
    console.log(`   Compliance: ${result.isCompliant ? 'PASSED' : 'FAILED'}`)
    console.log(`   Violations: ${result.violations.length}`)
    console.log(`   Critical: ${result.violations.filter(v => v.severity === 'CRITICAL').length}`)

    // Log violations for debugging
    result.violations.forEach(violation => {
      const emoji = violation.severity === 'CRITICAL' ? '🚨' : '⚠️'
      console.log(`   ${emoji} ${violation.ruleType}: ${violation.message}`)
    })

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        login: account.login,
        propFirm: account.propFirmTemplate.propFirm.name,
        template: account.propFirmTemplate.name,
        currentPhase: account.currentPhase
      },
      evaluation: result,
      evaluatedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Error evaluating rules:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to evaluate PropFirm rules',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

//+------------------------------------------------------------------+
//| GET /api/accounts/[id]/evaluate-rules - Quick Rule Check       |
//+------------------------------------------------------------------+
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: accountId } = params
    
    // Get account basics
    const account = await db.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        login: true,
        currentPhase: true,
        initialBalance: true,
        propFirmTemplate: {
          select: {
            name: true,
            rulesJson: true,
            propFirm: {
              select: { name: true }
            }
          }
        }
      }
    })

    if (!account?.propFirmTemplate) {
      return NextResponse.json({
        success: false,
        hasRules: false,
        message: 'No PropFirm template assigned'
      })
    }

    // Get trade count and basic metrics
    const tradeCount = await db.trade.count({
      where: { accountId }
    })

    const totalProfit = await db.trade.aggregate({
      where: { accountId },
      _sum: {
        profit: true,
        swap: true,
        commission: true
      }
    })

    const profit = (totalProfit._sum.profit || 0) + 
                  (totalProfit._sum.swap || 0) + 
                  (totalProfit._sum.commission || 0)

    return NextResponse.json({
      success: true,
      hasRules: true,
      account: {
        id: account.id,
        login: account.login,
        propFirm: account.propFirmTemplate.propFirm.name,
        template: account.propFirmTemplate.name,
        currentPhase: account.currentPhase
      },
      quickMetrics: {
        totalTrades: tradeCount,
        totalProfit: profit,
        initialBalance: account.initialBalance
      }
    })

  } catch (error: any) {
    console.error('❌ Error in quick rule check:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to perform quick rule check' },
      { status: 500 }
    )
  }
}