//+------------------------------------------------------------------+
//| PropFirm Rule Engine - Real-time Rule Violation Detection       |
//+------------------------------------------------------------------+

interface Trade {
  id: string
  ticketId: string
  symbol: string
  volume: number
  openPrice: number
  closePrice?: number
  openTime: string
  closeTime?: string
  pnlGross: number
  swap: number
  commission: number
  comment: string
  side: 'buy' | 'sell'
}

interface Account {
  id: string
  login: string
  initialBalance: number
  currentPhase: 'PHASE_1' | 'PHASE_2' | 'FUNDED'
  propFirmTemplate?: {
    id: string
    name: string
    accountSize: number
    currency: string
    rulesJson: PropFirmRules
    propFirm: {
      name: string
    }
  }
}

interface PropFirmRules {
  phase1: PhaseRules
  phase2: PhaseRules
  funded: PhaseRules
}

interface PhaseRules {
  profitTarget?: number // Percentage
  profitTargetAmount?: number // Absolute amount
  maxDailyLoss: number // Percentage
  maxDailyLossAmount: number // Absolute amount
  maxOverallLoss: number // Percentage
  maxOverallLossAmount: number // Absolute amount
  minTradingDays?: number
  maxTradingDays?: number
  consistencyRules?: boolean
  simpleProtectionRules?: {
    dailyProtection: boolean // 50% Daily Protection
    tradeProtection: boolean // 50% Trade Protection
  }
}

interface RuleViolation {
  ruleType: string
  severity: 'WARNING' | 'CRITICAL'
  message: string
  currentValue: number
  limitValue: number
  violationTime: string
}

interface RuleEngineResult {
  isCompliant: boolean
  violations: RuleViolation[]
  metrics: {
    totalProfit: number
    dailyProfit: number
    bestTradingDay: number
    bestSingleTrade: number
    currentDrawdown: number
    tradingDays: number
    totalTrades: number
    winRate: number
    profitFactor: number
  }
  phaseProgress: {
    profitProgress: number // Percentage of target achieved
    daysProgress: number // Days traded
    canAdvance: boolean
    nextPhase?: string
  }
}

//+------------------------------------------------------------------+
//| Rule Engine Class                                               |
//+------------------------------------------------------------------+
export class PropFirmRuleEngine {
  
  constructor(
    private account: Account,
    private trades: Trade[]
  ) {}

  //+------------------------------------------------------------------+
  //| Main Rule Evaluation Method                                     |
  //+------------------------------------------------------------------+
  public evaluateRules(): RuleEngineResult {
    if (!this.account.propFirmTemplate) {
      throw new Error('Account has no PropFirm template assigned')
    }

    const template = this.account.propFirmTemplate
    const currentPhaseRules = this.getCurrentPhaseRules()
    const metrics = this.calculateMetrics()
    const violations = this.checkAllRules(currentPhaseRules, metrics)
    const phaseProgress = this.calculatePhaseProgress(currentPhaseRules, metrics)

    return {
      isCompliant: violations.filter(v => v.severity === 'CRITICAL').length === 0,
      violations,
      metrics,
      phaseProgress
    }
  }

  //+------------------------------------------------------------------+
  //| Get Current Phase Rules                                         |
  //+------------------------------------------------------------------+
  private getCurrentPhaseRules(): PhaseRules {
    const rules = this.account.propFirmTemplate!.rulesJson
    
    switch (this.account.currentPhase) {
      case 'PHASE_1':
        return rules.phase1
      case 'PHASE_2':
        return rules.phase2
      case 'FUNDED':
        return rules.funded
      default:
        return rules.phase1
    }
  }

  //+------------------------------------------------------------------+
  //| Calculate Trading Metrics                                       |
  //+------------------------------------------------------------------+
  private calculateMetrics() {
    const closedTrades = this.trades.filter(t => t.closeTime !== null)
    const openTrades = this.trades.filter(t => t.closeTime === null)
    
    // Total P&L (closed + unrealized)
    const closedProfit = closedTrades.reduce((sum, t) => sum + (t.pnlGross || 0), 0)
    const unrealizedProfit = openTrades.reduce((sum, t) => sum + (t.pnlGross || 0), 0)
    const totalProfit = closedProfit + unrealizedProfit

    // Daily metrics
    const dailyProfits = this.calculateDailyProfits()
    const todayProfit = dailyProfits[this.formatDate(new Date())] || 0
    const bestTradingDay = Math.max(...Object.values(dailyProfits), 0)

    // Best single trade
    const bestSingleTrade = Math.max(...closedTrades.map(t => (t.pnlGross || 0)), 0)

    // Drawdown calculation
    const currentDrawdown = this.calculateDrawdown()

    // Trading days (days with at least one trade)
    const tradingDays = Object.keys(dailyProfits).length

    // Win rate
    const winningTrades = closedTrades.filter(t => {
      const pnl = (t.pnlGross || 0)
      return pnl > 0
    }).length
    const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0

    // Profit Factor
    const grossProfit = closedTrades
      .filter(t => {
        const pnl = (t.pnlGross || 0)
        return pnl > 0
      })
      .reduce((sum, t) => sum + (t.pnlGross || 0), 0)
    
    const grossLoss = Math.abs(closedTrades
      .filter(t => {
        const pnl = (t.pnlGross || 0)
        return pnl < 0
      })
      .reduce((sum, t) => sum + (t.pnlGross || 0), 0))

    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0

    return {
      totalProfit,
      dailyProfit: todayProfit,
      bestTradingDay,
      bestSingleTrade,
      currentDrawdown,
      tradingDays,
      totalTrades: this.trades.length,
      winRate,
      profitFactor
    }
  }

  //+------------------------------------------------------------------+
  //| Check All Rules                                                 |
  //+------------------------------------------------------------------+
  private checkAllRules(rules: PhaseRules, metrics: any): RuleViolation[] {
    const violations: RuleViolation[] = []

    // 1. Daily Loss Rule
    if (metrics.dailyProfit < 0) {
      const dailyLossPercent = Math.abs(metrics.dailyProfit / this.account.initialBalance) * 100
      if (dailyLossPercent > rules.maxDailyLoss) {
        violations.push({
          ruleType: 'DAILY_LOSS',
          severity: 'CRITICAL',
          message: `Daily loss limit exceeded: ${dailyLossPercent.toFixed(2)}% > ${rules.maxDailyLoss}%`,
          currentValue: dailyLossPercent,
          limitValue: rules.maxDailyLoss,
          violationTime: new Date().toISOString()
        })
      }
    }

    // 2. Overall Loss Rule
    if (metrics.totalProfit < 0) {
      const overallLossPercent = Math.abs(metrics.totalProfit / this.account.initialBalance) * 100
      if (overallLossPercent > rules.maxOverallLoss) {
        violations.push({
          ruleType: 'OVERALL_LOSS',
          severity: 'CRITICAL',
          message: `Overall loss limit exceeded: ${overallLossPercent.toFixed(2)}% > ${rules.maxOverallLoss}%`,
          currentValue: overallLossPercent,
          limitValue: rules.maxOverallLoss,
          violationTime: new Date().toISOString()
        })
      }
    }

    // 3. Simple Protection Rules (Phase 2 and Funded only)
    if ((this.account.currentPhase === 'PHASE_2' || this.account.currentPhase === 'FUNDED') 
        && rules.consistencyRules) {
      
      // 50% Daily Protection Rule
      if (metrics.bestTradingDay > 0) {
        const requiredProfit = metrics.bestTradingDay * 2 // Must be at least 2x best day
        if (metrics.totalProfit > 0 && metrics.totalProfit < requiredProfit) {
          violations.push({
            ruleType: 'DAILY_PROTECTION',
            severity: 'CRITICAL',
            message: `50% Daily Protection violated: Total profit €${metrics.totalProfit.toFixed(2)} < 2x best day €${requiredProfit.toFixed(2)}`,
            currentValue: metrics.totalProfit,
            limitValue: requiredProfit,
            violationTime: new Date().toISOString()
          })
        }
      }

      // 50% Trade Protection Rule
      if (metrics.bestSingleTrade > 0) {
        const requiredProfit = metrics.bestSingleTrade * 2 // Must be at least 2x best trade
        if (metrics.totalProfit > 0 && metrics.totalProfit < requiredProfit) {
          violations.push({
            ruleType: 'TRADE_PROTECTION',
            severity: 'CRITICAL',
            message: `50% Trade Protection violated: Total profit €${metrics.totalProfit.toFixed(2)} < 2x best trade €${requiredProfit.toFixed(2)}`,
            currentValue: metrics.totalProfit,
            limitValue: requiredProfit,
            violationTime: new Date().toISOString()
          })
        }
      }
    }

    // 4. Minimum Trading Days (Warning)
    if (rules.minTradingDays && metrics.tradingDays < rules.minTradingDays) {
      violations.push({
        ruleType: 'MIN_TRADING_DAYS',
        severity: 'WARNING',
        message: `Minimum trading days not met: ${metrics.tradingDays} < ${rules.minTradingDays} days`,
        currentValue: metrics.tradingDays,
        limitValue: rules.minTradingDays,
        violationTime: new Date().toISOString()
      })
    }

    return violations
  }

  //+------------------------------------------------------------------+
  //| Calculate Phase Progress                                        |
  //+------------------------------------------------------------------+
  private calculatePhaseProgress(rules: PhaseRules, metrics: any) {
    let profitProgress = 0
    let canAdvance = false
    let nextPhase: string | undefined

    // Calculate profit progress
    if (rules.profitTargetAmount && rules.profitTargetAmount > 0) {
      profitProgress = Math.max(0, (metrics.totalProfit / rules.profitTargetAmount) * 100)
      
      // Check if can advance to next phase
      const hasMetProfitTarget = metrics.totalProfit >= rules.profitTargetAmount
      const hasMetMinDays = !rules.minTradingDays || metrics.tradingDays >= rules.minTradingDays
      const hasNoCriticalViolations = this.checkAllRules(rules, metrics)
        .filter(v => v.severity === 'CRITICAL').length === 0

      canAdvance = hasMetProfitTarget && hasMetMinDays && hasNoCriticalViolations

      // Determine next phase
      if (canAdvance) {
        switch (this.account.currentPhase) {
          case 'PHASE_1':
            nextPhase = 'PHASE_2'
            break
          case 'PHASE_2':
            nextPhase = 'FUNDED'
            break
          case 'FUNDED':
            nextPhase = undefined // Already at final phase
            break
        }
      }
    }

    return {
      profitProgress,
      daysProgress: metrics.tradingDays,
      canAdvance,
      nextPhase
    }
  }

  //+------------------------------------------------------------------+
  //| Helper Methods                                                  |
  //+------------------------------------------------------------------+
  private calculateDailyProfits(): { [date: string]: number } {
    const dailyProfits: { [date: string]: number } = {}
    
    this.trades.forEach(trade => {
      const date = this.formatDate(new Date(trade.openTime))
      const profit = (trade.pnlGross || 0)
      
      if (!dailyProfits[date]) {
        dailyProfits[date] = 0
      }
      dailyProfits[date] += profit
    })

    return dailyProfits
  }

  private calculateDrawdown(): number {
    let highWaterMark = this.account.initialBalance
    let currentDrawdown = 0
    let runningBalance = this.account.initialBalance

    // Sort trades by time
    const sortedTrades = [...this.trades].sort((a, b) => 
      new Date(a.openTime).getTime() - new Date(b.openTime).getTime()
    )

    sortedTrades.forEach(trade => {
      const profit = (trade.pnlGross || 0)
      runningBalance += profit

      if (runningBalance > highWaterMark) {
        highWaterMark = runningBalance
      }

      const drawdown = ((highWaterMark - runningBalance) / this.account.initialBalance) * 100
      currentDrawdown = Math.max(currentDrawdown, drawdown)
    })

    return currentDrawdown
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }
}

//+------------------------------------------------------------------+
//| Utility Functions                                               |
//+------------------------------------------------------------------+
export function createRuleEngine(account: Account, trades: Trade[]): PropFirmRuleEngine {
  return new PropFirmRuleEngine(account, trades)
}

export function formatRuleViolation(violation: RuleViolation): string {
  const emoji = violation.severity === 'CRITICAL' ? '🚨' : '⚠️'
  return `${emoji} ${violation.message}`
}

export function getRuleStatusColor(violation: RuleViolation): string {
  return violation.severity === 'CRITICAL' ? 'red' : 'yellow'
}