'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  TrendingUp,
  Calendar,
  Target,
  Zap
} from 'lucide-react'
import { useRuleEngine } from '@/hooks/useRuleEngine'

interface RuleCompliancePanelProps {
  accountId: string
  compact?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export function RuleCompliancePanel({ 
  accountId, 
  compact = false,
  autoRefresh = false,
  refreshInterval = 30000 // 30 seconds
}: RuleCompliancePanelProps) {
  
  const {
    result,
    loading,
    error,
    evaluateRules,
    refresh,
    getCriticalViolations,
    getWarningViolations,
    getComplianceStatus,
    getComplianceColor,
    formatViolationMessage,
    canAdvanceToNextPhase,
    getNextPhase,
    getProfitProgress,
    isCompliant,
    hasViolations,
    violationCount,
    criticalCount,
    warningCount,
    metrics,
    account
  } = useRuleEngine(accountId)

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !accountId) return

    const interval = setInterval(() => {
      refresh()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, accountId, refresh])

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Rule Engine Error</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 text-sm">{error}</p>
          <Button 
            onClick={() => evaluateRules()} 
            size="sm" 
            className="mt-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (loading && !result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Evaluating Rules...</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!result?.evaluation) {
    return (
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-gray-700 flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>No Rules Configured</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm">
            No PropFirm template assigned to this account.
          </p>
        </CardContent>
      </Card>
    )
  }

  const complianceStatus = getComplianceStatus()
  const complianceColor = getComplianceColor()
  const criticalViolations = getCriticalViolations()
  const warningViolations = getWarningViolations()

  if (compact) {
    return (
      <Card className={`border-${complianceColor}-200 bg-${complianceColor}-50`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isCompliant ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium text-sm">
                {isCompliant ? 'Compliant' : `${criticalCount} Critical Issues`}
              </span>
            </div>
            <Button 
              onClick={refresh} 
              size="sm" 
              variant="ghost"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Compliance Overview */}
      <Card className={`border-${complianceColor}-200`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isCompliant ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-red-600" />
              )}
              <div>
                <CardTitle className="text-lg">
                  PropFirm Rule Compliance
                </CardTitle>
                <CardDescription>
                  {account?.propFirm} - {account?.template}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={isCompliant ? "default" : "destructive"}
                className="font-medium"
              >
                {isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
              </Badge>
              <Button 
                onClick={refresh} 
                size="sm" 
                variant="outline"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Phase Progress */}
          {result.evaluation.phaseProgress.profitProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center space-x-1">
                  <Target className="h-4 w-4" />
                  <span>Profit Target Progress</span>
                </span>
                <span className="font-medium">
                  {getProfitProgress().toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(getProfitProgress(), 100)} 
                className="h-2"
              />
              {canAdvanceToNextPhase() && (
                <div className="flex items-center space-x-1 text-green-600 text-sm">
                  <Zap className="h-4 w-4" />
                  <span>Ready to advance to {getNextPhase()}</span>
                </div>
              )}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                €{metrics?.totalProfit?.toFixed(2) || '0.00'}
              </div>
              <div className="text-xs text-blue-500">Total P&L</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {metrics?.tradingDays || 0}
              </div>
              <div className="text-xs text-green-500">Trading Days</div>
            </div>
            <div className="text-center p-2 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {metrics?.winRate?.toFixed(0) || 0}%
              </div>
              <div className="text-xs text-purple-500">Win Rate</div>
            </div>
            <div className="text-center p-2 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">
                {metrics?.totalTrades || 0}
              </div>
              <div className="text-xs text-orange-500">Total Trades</div>
            </div>
          </div>

          {/* Violations Summary */}
          {hasViolations && (
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">
                  {criticalCount} Critical
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">
                  {warningCount} Warning
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Critical Violations */}
      {criticalViolations.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Critical Rule Violations</span>
            </CardTitle>
            <CardDescription className="text-red-600">
              These violations require immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalViolations.map((violation, index) => (
                <Alert key={index} className="border-red-300 bg-red-100">
                  <AlertDescription className="text-red-800">
                    {formatViolationMessage(violation)}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning Violations */}
      {warningViolations.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-700 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Warnings</span>
            </CardTitle>
            <CardDescription className="text-yellow-600">
              Areas that need attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {warningViolations.map((violation, index) => (
                <Alert key={index} className="border-yellow-300 bg-yellow-100">
                  <AlertDescription className="text-yellow-800">
                    {formatViolationMessage(violation)}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {isCompliant && !hasViolations && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">
                All rules are compliant! 🎉
              </span>
            </div>
            {canAdvanceToNextPhase() && (
              <div className="mt-2 text-green-700 text-sm">
                You're ready to advance to {getNextPhase()}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}