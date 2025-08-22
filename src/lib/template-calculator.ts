import { PropFirmTemplate } from '@prisma/client'

export interface TemplateRule {
  percentage?: number | null
  amount?: number | null
  description: string
}

export interface ProfitTarget extends TemplateRule {
  isRequired: boolean
}

export interface LossLimit extends TemplateRule {
  isBreachable: boolean
  breachConsequence: string
}

export interface ConsistencyRule {
  enabled: boolean
  description: string
  rules?: string[]
}

export interface TemplateRules {
  profitTargets: {
    PHASE_1?: TemplateRule
    PHASE_2?: TemplateRule
    FUNDED?: TemplateRule
  }
  dailyLossLimits: {
    PHASE_1?: TemplateRule
    PHASE_2?: TemplateRule
    FUNDED?: TemplateRule
  }
  overallLossLimits: {
    PHASE_1?: TemplateRule
    PHASE_2?: TemplateRule
    FUNDED?: TemplateRule
  }
  minimumTradingDays: {
    PHASE_1?: { days: number; description: string }
    PHASE_2?: { days: number; description: string }
    FUNDED?: { days: number; description: string }
  }
  consistencyRules: {
    PHASE_1?: ConsistencyRule
    PHASE_2?: ConsistencyRule
    FUNDED?: ConsistencyRule
  }
  payoutInfo?: {
    profitSplit?: {
      trader: number
      propFirm: number
      description: string
    }
    minimumAmount?: number
    frequency?: string
    processingTime?: string
  }
  tradingRestrictions?: {
    newsTrading?: boolean
    expertAdvisors?: boolean
    copyTrading?: boolean
    weekendTrading?: boolean
    prohibitedPractices?: string[]
  }
  specialFeatures?: string[]
}

export class TemplateBasedCalculator {
  private template: PropFirmTemplate | null
  private rules: TemplateRules | null
  private accountBalance: number
  private currentPhase: string

  constructor(
    template: PropFirmTemplate | null,
    accountBalance: number,
    currentPhase: string = 'PHASE_1'
  ) {
    this.template = template
    this.rules = (template?.rulesJson as unknown as TemplateRules) || null
    this.accountBalance = accountBalance
    this.currentPhase = currentPhase
  }

  /**
   * Get profit target for current phase
   */
  getProfitTarget(): ProfitTarget | null {
    if (!this.rules?.profitTargets) return null

    const phaseTarget = this.rules.profitTargets[this.currentPhase as keyof typeof this.rules.profitTargets]
    if (!phaseTarget) return null

    return {
      percentage: phaseTarget.percentage,
      amount: phaseTarget.amount,
      description: phaseTarget.description,
      isRequired: this.currentPhase !== 'FUNDED'
    }
  }

  /**
   * Calculate target amount based on current balance and profit target
   */
  getTargetAmount(currentPnL: number = 0): number {
    const profitTarget = this.getProfitTarget()
    if (!profitTarget?.amount) return 0

    return this.accountBalance + profitTarget.amount
  }

  /**
   * Calculate profit target percentage progress
   */
  getProfitTargetProgress(currentPnL: number = 0): number {
    const profitTarget = this.getProfitTarget()
    if (!profitTarget?.amount || profitTarget.amount === 0) return 0

    return (currentPnL / profitTarget.amount) * 100
  }

  /**
   * Get daily loss limit for current phase
   */
  getDailyLossLimit(): LossLimit | null {
    if (!this.rules?.dailyLossLimits) return null

    const phaseLimit = this.rules.dailyLossLimits[this.currentPhase as keyof typeof this.rules.dailyLossLimits]
    if (!phaseLimit) return null

    return {
      percentage: phaseLimit.percentage,
      amount: phaseLimit.amount,
      description: phaseLimit.description,
      isBreachable: true,
      breachConsequence: "Account violation - immediate termination"
    }
  }

  /**
   * Get overall loss limit for current phase  
   */
  getOverallLossLimit(): LossLimit | null {
    if (!this.rules?.overallLossLimits) return null

    const phaseLimit = this.rules.overallLossLimits[this.currentPhase as keyof typeof this.rules.overallLossLimits]
    if (!phaseLimit) return null

    return {
      percentage: phaseLimit.percentage,
      amount: phaseLimit.amount,
      description: phaseLimit.description,
      isBreachable: true,
      breachConsequence: "Account violation - immediate termination"
    }
  }

  /**
   * Calculate remaining safe capacity (how much can be lost before violation)
   */
  getSafeCapacity(currentPnL: number = 0): { daily: number; overall: number } {
    const dailyLimit = this.getDailyLossLimit()
    const overallLimit = this.getOverallLossLimit()

    const currentEquity = this.accountBalance + currentPnL

    return {
      daily: dailyLimit?.amount ? dailyLimit.amount : 0,
      overall: overallLimit?.amount ? Math.max(0, overallLimit.amount + currentPnL) : 0
    }
  }

  /**
   * Get consistency rules for current phase
   */
  getConsistencyRules(): ConsistencyRule | null {
    if (!this.rules?.consistencyRules) return null

    return this.rules.consistencyRules[this.currentPhase as keyof typeof this.rules.consistencyRules] || null
  }

  /**
   * Check if consistency rules apply to current phase
   */
  hasConsistencyRules(): boolean {
    const consistency = this.getConsistencyRules()
    return consistency?.enabled === true
  }

  /**
   * Get minimum trading days for current phase
   */
  getMinimumTradingDays(): { days: number; description: string } | null {
    if (!this.rules?.minimumTradingDays) return null

    return this.rules.minimumTradingDays[this.currentPhase as keyof typeof this.rules.minimumTradingDays] || null
  }

  /**
   * Get payout information
   */
  getPayoutInfo() {
    return this.rules?.payoutInfo || null
  }

  /**
   * Get trading restrictions
   */
  getTradingRestrictions() {
    return this.rules?.tradingRestrictions || null
  }

  /**
   * Get special features of this template
   */
  getSpecialFeatures(): string[] {
    return this.rules?.specialFeatures || []
  }

  /**
   * Generate requirement text for UI display
   */
  getRequirementText(type: 'profit' | 'dailyLoss' | 'overallLoss'): string {
    switch (type) {
      case 'profit':
        const profitTarget = this.getProfitTarget()
        if (!profitTarget?.percentage) return 'No target'
        return `${profitTarget.percentage}% del conto`
      
      case 'dailyLoss':
        const dailyLimit = this.getDailyLossLimit()
        if (!dailyLimit?.percentage) return 'No limit'
        return `Max ${dailyLimit.percentage}% giornaliero`
      
      case 'overallLoss':
        const overallLimit = this.getOverallLossLimit()
        if (!overallLimit?.percentage) return 'No limit'
        return `Max ${overallLimit.percentage}% totale`
      
      default:
        return 'Unknown'
    }
  }

  /**
   * Check if a rule exists for current phase
   */
  hasRule(ruleType: 'profit' | 'dailyLoss' | 'overallLoss' | 'consistency'): boolean {
    switch (ruleType) {
      case 'profit':
        return this.getProfitTarget() !== null
      case 'dailyLoss':
        return this.getDailyLossLimit() !== null
      case 'overallLoss':
        return this.getOverallLossLimit() !== null
      case 'consistency':
        return this.hasConsistencyRules()
      default:
        return false
    }
  }

  /**
   * Get template info for display
   */
  getTemplateInfo() {
    return {
      name: this.template?.name || 'Unknown Template',
      propFirm: 'Unknown PropFirm', // Will be provided by parent component
      accountSize: this.template?.accountSize || 0,
      currency: this.template?.currency || 'USD',
      currentPhase: this.currentPhase
    }
  }
}