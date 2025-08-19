'use client'

import { useState, useEffect } from 'react'

interface RuleViolation {
  ruleType: string
  severity: 'WARNING' | 'CRITICAL'
  message: string
  currentValue: number
  limitValue: number
  violationTime: string
}

interface RuleMetrics {
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

interface PhaseProgress {
  profitProgress: number
  daysProgress: number
  canAdvance: boolean
  nextPhase?: string
}

interface RuleEvaluation {
  isCompliant: boolean
  violations: RuleViolation[]
  metrics: RuleMetrics
  phaseProgress: PhaseProgress
}

interface RuleEngineResult {
  success: boolean
  account?: {
    id: string
    login: string
    propFirm: string
    template: string
    currentPhase: string
  }
  evaluation?: RuleEvaluation
  evaluatedAt?: string
  error?: string
}

//+------------------------------------------------------------------+
//| Hook for Rule Engine Operations                                |
//+------------------------------------------------------------------+
export function useRuleEngine(accountId: string) {
  const [result, setResult] = useState<RuleEngineResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  //+------------------------------------------------------------------+
  //| Evaluate Rules                                                  |
  //+------------------------------------------------------------------+
  const evaluateRules = async (forceRefresh = false) => {
    if (!accountId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/accounts/${accountId}/evaluate-rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // Add cache-busting if force refresh
        cache: forceRefresh ? 'no-cache' : 'default'
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
        setError(null)
      } else {
        setError(data.error || 'Failed to evaluate rules')
        setResult(null)
      }
    } catch (err) {
      console.error('Rule evaluation error:', err)
      setError('Network error during rule evaluation')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  //+------------------------------------------------------------------+
  //| Quick Rule Check                                                |
  //+------------------------------------------------------------------+
  const quickCheck = async () => {
    if (!accountId) return null

    try {
      const response = await fetch(`/api/accounts/${accountId}/evaluate-rules`)
      const data = await response.json()
      return data
    } catch (err) {
      console.error('Quick rule check error:', err)
      return null
    }
  }

  //+------------------------------------------------------------------+
  //| Auto Evaluation on Mount                                       |
  //+------------------------------------------------------------------+
  useEffect(() => {
    if (accountId) {
      evaluateRules()
    }
  }, [accountId])

  //+------------------------------------------------------------------+
  //| Helper Functions                                               |
  //+------------------------------------------------------------------+
  const getCriticalViolations = () => {
    return result?.evaluation?.violations?.filter(v => v.severity === 'CRITICAL') || []
  }

  const getWarningViolations = () => {
    return result?.evaluation?.violations?.filter(v => v.severity === 'WARNING') || []
  }

  const getComplianceStatus = () => {
    if (!result?.evaluation) return 'UNKNOWN'
    return result.evaluation.isCompliant ? 'COMPLIANT' : 'NON_COMPLIANT'
  }

  const getComplianceColor = () => {
    const status = getComplianceStatus()
    switch (status) {
      case 'COMPLIANT': return 'green'
      case 'NON_COMPLIANT': return 'red'
      default: return 'gray'
    }
  }

  const getRuleTypeEmoji = (ruleType: string) => {
    switch (ruleType) {
      case 'DAILY_LOSS': return '📅'
      case 'OVERALL_LOSS': return '📊'
      case 'DAILY_PROTECTION': return '🛡️'
      case 'TRADE_PROTECTION': return '🔒'
      case 'MIN_TRADING_DAYS': return '⏰'
      default: return '⚠️'
    }
  }

  const formatViolationMessage = (violation: RuleViolation) => {
    const emoji = violation.severity === 'CRITICAL' ? '🚨' : '⚠️'
    const typeEmoji = getRuleTypeEmoji(violation.ruleType)
    return `${emoji} ${typeEmoji} ${violation.message}`
  }

  const canAdvanceToNextPhase = () => {
    return result?.evaluation?.phaseProgress?.canAdvance || false
  }

  const getNextPhase = () => {
    return result?.evaluation?.phaseProgress?.nextPhase
  }

  const getProfitProgress = () => {
    return result?.evaluation?.phaseProgress?.profitProgress || 0
  }

  //+------------------------------------------------------------------+
  //| Return Hook Interface                                           |
  //+------------------------------------------------------------------+
  return {
    // State
    result,
    loading,
    error,

    // Actions
    evaluateRules,
    quickCheck,
    refresh: () => evaluateRules(true),

    // Helpers
    getCriticalViolations,
    getWarningViolations,
    getComplianceStatus,
    getComplianceColor,
    formatViolationMessage,
    canAdvanceToNextPhase,
    getNextPhase,
    getProfitProgress,

    // Computed values
    isCompliant: result?.evaluation?.isCompliant || false,
    hasViolations: (result?.evaluation?.violations?.length || 0) > 0,
    violationCount: result?.evaluation?.violations?.length || 0,
    criticalCount: getCriticalViolations().length,
    warningCount: getWarningViolations().length,
    metrics: result?.evaluation?.metrics,
    account: result?.account,
    evaluatedAt: result?.evaluatedAt
  }
}

//+------------------------------------------------------------------+
//| Hook for Multiple Accounts Rule Status                         |
//+------------------------------------------------------------------+
export function useMultiAccountRules(accountIds: string[]) {
  const [statuses, setStatuses] = useState<{ [key: string]: any }>({})
  const [loading, setLoading] = useState(false)

  const checkAllAccounts = async () => {
    setLoading(true)
    const results: { [key: string]: any } = {}

    try {
      const promises = accountIds.map(async (accountId) => {
        const response = await fetch(`/api/accounts/${accountId}/evaluate-rules`)
        const data = await response.json()
        results[accountId] = data
      })

      await Promise.all(promises)
      setStatuses(results)
    } catch (err) {
      console.error('Multi-account rule check error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (accountIds.length > 0) {
      checkAllAccounts()
    }
  }, [accountIds])

  return {
    statuses,
    loading,
    refresh: checkAllAccounts,
    getAccountStatus: (accountId: string) => statuses[accountId],
    hasRules: (accountId: string) => statuses[accountId]?.hasRules || false
  }
}