'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Shield, ShieldAlert, TrendingUp, X, Settings } from 'lucide-react'

interface WorstCaseScenario {
  totalPotentialLoss: number
  totalPotentialLossPercent: number
  breakdown: {
    tradesWithSL: {
      count: number
      potentialLoss: number
    }
    tradesWithoutSL: {
      count: number
      estimatedLoss: number
    }
    tradesInProfit: {
      count: number
      protectedProfit: number
    }
  }
  wouldViolateDailyLimit: boolean
  marginToViolation: number
}

// 🚨 CRITICAL: TRUE Safe Capacity interface
interface TrueSafeCapacity {
  trueSafeCapacity: number
  theoreticalCapacity: number
  floatingPL: number
  startingBalance: number
  currentEquity: number
  dailyLimitUSD: number
  scenarios: {
    ifAllSLHit: {
      minEquityTouched: number
      wouldViolate: boolean
      marginToViolation: number
      sequence: {
        trade: string
        slLoss: number
        runningEquity: number
        violatesHere: boolean
      }[]
    }
    ifWorstFirst: {
      sequence: string[]
      minEquityReached: number
      wouldViolate: boolean
    }
  }
  warning: string | null
  riskLevel: 'SAFE' | 'DANGER' | 'CRITICAL'
}

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
  worstCaseScenario: WorstCaseScenario
  trueSafeCapacity: TrueSafeCapacity
  alerts: {
    severity: 'CRITICAL' | 'WARNING' | 'INFO'
    message: string
    action?: string
  }[]
}

interface RiskExposureScannerProps {
  accountId: string
  balance: number
  openTrades: any[]
}

export default function RiskExposureScanner({ 
  accountId, 
  balance, 
  openTrades 
}: RiskExposureScannerProps) {
  const [riskData, setRiskData] = useState<{
    riskMetrics: RiskMetrics
    balance: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchRiskAnalysis = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/accounts/${accountId}/risk-analysis`)
      if (response.ok) {
        const data = await response.json()
        setRiskData(data)
      } else {
        console.error('Failed to fetch risk analysis')
      }
    } catch (error) {
      console.error('Risk analysis error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchRiskAnalysis()
    const interval = setInterval(fetchRiskAnalysis, 30000)
    return () => clearInterval(interval)
  }, [accountId])

  // Manual refresh when trades change
  useEffect(() => {
    if (!loading) {
      fetchRiskAnalysis()
    }
  }, [openTrades.length])

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Exposure Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!riskData) return null

  const { riskMetrics } = riskData
  const exposurePercent = riskMetrics.totalExposurePercent
  const maxDailyLimit = 5 // 5% daily limit

  // Get main color based on risk level
  const getRiskColor = () => {
    switch (riskMetrics.riskLevel) {
      case 'DANGER': return 'bg-red-500'
      case 'CAUTION': return 'bg-yellow-500' 
      case 'SAFE': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getRiskBorderClass = () => {
    if (riskMetrics.riskLevel === 'DANGER') {
      return 'border-red-500 animate-pulse'
    }
    return 'border-gray-200'
  }

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
      case 'WARNING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'INFO': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <>
      {/* Critical Banner for No Stop Loss */}
      {riskMetrics.tradesWithoutSL.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-semibold text-red-800">
                CRITICAL: {riskMetrics.tradesWithoutSL.length} trades without Stop Loss!
              </span>
            </div>
            <Button 
              size="sm" 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                // TODO: Open modal to set stop losses
                alert('Stop Loss setting modal coming soon!')
              }}
            >
              <Settings className="h-4 w-4 mr-1" />
              Set All SL
            </Button>
          </div>
        </div>
      )}

      <Card className={`mb-6 border-2 ${getRiskBorderClass()}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {riskMetrics.riskLevel === 'DANGER' ? (
                <ShieldAlert className="h-5 w-5 text-red-600" />
              ) : (
                <Shield className="h-5 w-5 text-green-600" />
              )}
              Risk Exposure Scanner
              <Badge className={getRiskColor() + ' text-white'}>
                {riskMetrics.riskLevel}
              </Badge>
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchRiskAnalysis}
              disabled={refreshing}
            >
              {refreshing ? '🔄' : '↻'} Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Current Exposure Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Current Exposure: {exposurePercent.toFixed(1)}% / {maxDailyLimit}% Daily Limit
              </span>
              <span className="text-sm text-gray-600">
                ${riskMetrics.totalExposureUSD.toFixed(0)} / ${(balance * 0.05).toFixed(0)}
              </span>
            </div>
            
            {/* Visual Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${getRiskColor()}`}
                style={{ width: `${Math.min(exposurePercent / maxDailyLimit * 100, 100)}%` }}
              ></div>
              
              {/* Markers */}
              <div className="absolute top-0 left-0 h-full w-full">
                <div className="absolute top-0 h-full bg-yellow-300 w-0.5" style={{ left: '40%' }}></div>
                <div className="absolute top-0 h-full bg-red-300 w-0.5" style={{ left: '80%' }}></div>
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>2%</span>
              <span>4%</span>
              <span>5%</span>
            </div>
          </div>

          {/* Worst Case Scenario */}
          <div className={`p-4 rounded-lg border-2 ${
            riskMetrics.worstCaseScenario.wouldViolateDailyLimit 
              ? 'bg-red-50 border-red-300' 
              : riskMetrics.worstCaseScenario.totalPotentialLossPercent > 4
              ? 'bg-yellow-50 border-yellow-300'
              : 'bg-blue-50 border-blue-300'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                ⚠️ Worst Case Scenario
                {riskMetrics.worstCaseScenario.wouldViolateDailyLimit && (
                  <Badge className="bg-red-600 text-white">DANGER</Badge>
                )}
              </h4>
            </div>

            {/* Worst Case Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  If all SL hit: -{riskMetrics.worstCaseScenario.totalPotentialLossPercent.toFixed(1)}% / {maxDailyLimit}% Daily Limit
                </span>
                <span className="text-sm font-semibold text-red-600">
                  -${Math.abs(riskMetrics.worstCaseScenario.totalPotentialLoss).toFixed(0)} / ${(balance * 0.05).toFixed(0)}
                </span>
              </div>
              
              {/* Worst Case Visual Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    riskMetrics.worstCaseScenario.wouldViolateDailyLimit 
                      ? 'bg-red-600' 
                      : riskMetrics.worstCaseScenario.totalPotentialLossPercent > 4
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(riskMetrics.worstCaseScenario.totalPotentialLossPercent / maxDailyLimit * 100, 100)}%` }}
                ></div>
                
                {/* Markers */}
                <div className="absolute top-0 left-0 h-full w-full">
                  <div className="absolute top-0 h-full bg-yellow-300 w-0.5" style={{ left: '40%' }}></div>
                  <div className="absolute top-0 h-full bg-red-300 w-0.5" style={{ left: '80%' }}></div>
                </div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>2%</span>
                <span>4%</span>
                <span>5%</span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="mt-4 space-y-2">
              {riskMetrics.worstCaseScenario.breakdown.tradesWithoutSL.count > 0 && (
                <div className="flex items-center justify-between p-2 bg-red-100 rounded border border-red-200">
                  <span className="text-sm flex items-center gap-1">
                    🔴 <strong>{riskMetrics.worstCaseScenario.breakdown.tradesWithoutSL.count}</strong> trades without SL
                  </span>
                  <span className="text-sm font-semibold text-red-700">
                    Est: -${riskMetrics.worstCaseScenario.breakdown.tradesWithoutSL.estimatedLoss.toFixed(0)}
                  </span>
                </div>
              )}

              {riskMetrics.worstCaseScenario.breakdown.tradesWithSL.count > 0 && (
                <div className="flex items-center justify-between p-2 bg-yellow-100 rounded border border-yellow-200">
                  <span className="text-sm flex items-center gap-1">
                    📊 <strong>{riskMetrics.worstCaseScenario.breakdown.tradesWithSL.count}</strong> trades with SL
                  </span>
                  <span className="text-sm font-semibold text-yellow-700">
                    Risk: -${riskMetrics.worstCaseScenario.breakdown.tradesWithSL.potentialLoss.toFixed(0)}
                  </span>
                </div>
              )}

              {riskMetrics.worstCaseScenario.breakdown.tradesInProfit.count > 0 && (
                <div className="flex items-center justify-between p-2 bg-green-100 rounded border border-green-200">
                  <span className="text-sm flex items-center gap-1">
                    ✅ <strong>{riskMetrics.worstCaseScenario.breakdown.tradesInProfit.count}</strong> protected trades
                  </span>
                  <span className="text-sm font-semibold text-green-700">
                    Profit: +${riskMetrics.worstCaseScenario.breakdown.tradesInProfit.protectedProfit.toFixed(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Violation Warning */}
            {riskMetrics.worstCaseScenario.wouldViolateDailyLimit && (
              <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-semibold">DANGER: Would violate 5% daily limit!</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  Margin: only ${riskMetrics.worstCaseScenario.marginToViolation.toFixed(0)} away from violation
                </p>
              </div>
            )}
          </div>

          {/* 🚨 TRUE SAFE CAPACITY - CRITICAL SAFETY SECTION */}
          <div className={`p-4 rounded-lg border-2 ${
            riskMetrics.trueSafeCapacity.riskLevel === 'CRITICAL' 
              ? 'bg-red-50 border-red-500 animate-pulse' 
              : riskMetrics.trueSafeCapacity.riskLevel === 'DANGER'
              ? 'bg-orange-50 border-orange-400'
              : 'bg-green-50 border-green-300'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                {riskMetrics.trueSafeCapacity.riskLevel === 'CRITICAL' ? (
                  <><AlertTriangle className="h-5 w-5 text-red-600" />🚨 TRUE SAFE CAPACITY</>
                ) : riskMetrics.trueSafeCapacity.riskLevel === 'DANGER' ? (
                  <><ShieldAlert className="h-5 w-5 text-orange-600" />⚠️ TRUE SAFE CAPACITY</>
                ) : (
                  <><Shield className="h-5 w-5 text-green-600" />✅ TRUE SAFE CAPACITY</>
                )}
                <Badge className={`${
                  riskMetrics.trueSafeCapacity.riskLevel === 'CRITICAL' ? 'bg-red-600' :
                  riskMetrics.trueSafeCapacity.riskLevel === 'DANGER' ? 'bg-orange-500' :
                  'bg-green-600'
                } text-white`}>
                  {riskMetrics.trueSafeCapacity.riskLevel}
                </Badge>
              </h4>
            </div>

            {/* Critical Warning if exists */}
            {riskMetrics.trueSafeCapacity.warning && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-800 font-medium">
                    {riskMetrics.trueSafeCapacity.warning}
                  </span>
                </div>
              </div>
            )}

            {/* Main Capacity Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* TRUE Safe Capacity */}
              <div className="p-3 bg-white rounded-lg border">
                <div className="text-sm font-medium text-gray-600 mb-1">REAL Safe Capacity</div>
                <div className={`text-2xl font-bold ${
                  riskMetrics.trueSafeCapacity.riskLevel === 'CRITICAL' ? 'text-red-600' :
                  riskMetrics.trueSafeCapacity.riskLevel === 'DANGER' ? 'text-orange-600' :
                  'text-green-600'
                }`}>
                  ${riskMetrics.trueSafeCapacity.trueSafeCapacity.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">
                  Considers minimum equity risk
                </div>
              </div>
              
              {/* Theoretical (Old) Capacity - Grayed out */}
              <div className="p-3 bg-gray-100 rounded-lg border border-gray-300 opacity-75">
                <div className="text-sm font-medium text-gray-500 mb-1 line-through">Theoretical (OLD)</div>
                <div className="text-xl font-bold text-gray-500">
                  ${riskMetrics.trueSafeCapacity.theoreticalCapacity.toFixed(0)}
                </div>
                <div className="text-xs text-red-500 font-medium">
                  ⚠️ MISLEADING - Ignores SL risk
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-4">
              <div className="text-center">
                <div className="font-medium text-gray-600">Current Equity</div>
                <div className="font-bold text-blue-600">${riskMetrics.trueSafeCapacity.currentEquity.toFixed(0)}</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-600">Floating P&L</div>
                <div className={`font-bold ${
                  riskMetrics.trueSafeCapacity.floatingPL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {riskMetrics.trueSafeCapacity.floatingPL >= 0 ? '+' : ''}${riskMetrics.trueSafeCapacity.floatingPL.toFixed(0)}
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-600">Daily Limit</div>
                <div className="font-bold text-red-600">-${riskMetrics.trueSafeCapacity.dailyLimitUSD.toFixed(0)}</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-600">Starting Balance</div>
                <div className="font-bold text-gray-600">${riskMetrics.trueSafeCapacity.startingBalance.toFixed(0)}</div>
              </div>
            </div>

            {/* Sequential SL Simulation */}
            <div className="mb-4">
              <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-lg">🎯</span> Sequential SL Hit Simulation
              </h5>
              
              <div className="bg-white rounded-lg border p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    If all SL hit (worst order): Min equity ${riskMetrics.trueSafeCapacity.scenarios.ifAllSLHit.minEquityTouched.toFixed(0)}
                  </span>
                  <Badge className={`${
                    riskMetrics.trueSafeCapacity.scenarios.ifAllSLHit.wouldViolate 
                      ? 'bg-red-100 text-red-800 border-red-200' 
                      : 'bg-green-100 text-green-800 border-green-200'
                  }`}>
                    {riskMetrics.trueSafeCapacity.scenarios.ifAllSLHit.wouldViolate ? 'WOULD VIOLATE' : 'SAFE'}
                  </Badge>
                </div>
                
                {riskMetrics.trueSafeCapacity.scenarios.ifAllSLHit.wouldViolate && (
                  <div className="text-sm text-red-700 font-medium mb-2">
                    ⚠️ Margin to violation: only ${Math.abs(riskMetrics.trueSafeCapacity.scenarios.ifAllSLHit.marginToViolation).toFixed(0)}
                  </div>
                )}
                
                {/* Step-by-step sequence */}
                <div className="space-y-1">
                  {riskMetrics.trueSafeCapacity.scenarios.ifAllSLHit.sequence.slice(0, 3).map((step, i) => (
                    <div key={i} className={`text-xs p-2 rounded flex items-center justify-between ${
                      step.violatesHere ? 'bg-red-100 border border-red-200' : 'bg-gray-50'
                    }`}>
                      <span>
                        {i + 1}. {step.trade}: {step.slLoss.toFixed(0)}
                      </span>
                      <span className={`font-medium ${
                        step.violatesHere ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        → ${step.runningEquity.toFixed(0)} {step.violatesHere ? '🚨 VIOLATION' : ''}
                      </span>
                    </div>
                  ))}
                  {riskMetrics.trueSafeCapacity.scenarios.ifAllSLHit.sequence.length > 3 && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      ... +{riskMetrics.trueSafeCapacity.scenarios.ifAllSLHit.sequence.length - 3} more steps
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Critical Difference Warning */}
            {Math.abs(riskMetrics.trueSafeCapacity.trueSafeCapacity - riskMetrics.trueSafeCapacity.theoreticalCapacity) > 100 && (
              <div className="p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-yellow-800">
                      HUGE DIFFERENCE DETECTED!
                    </div>
                    <div className="text-xs text-yellow-700">
                      OLD calculation would show ${Math.abs(riskMetrics.trueSafeCapacity.trueSafeCapacity - riskMetrics.trueSafeCapacity.theoreticalCapacity).toFixed(0)} more capacity than reality.
                      This could cause PropFirm violations!
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Risk Alerts */}
          {riskMetrics.alerts.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">Active Alerts</h4>
              {riskMetrics.alerts.map((alert, index) => (
                <div key={index} className={`p-3 rounded-lg border ${
                  alert.severity === 'CRITICAL' ? 'bg-red-50 border-red-200' :
                  alert.severity === 'WARNING' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getSeverityBadgeColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <span className="text-sm font-medium">{alert.message}</span>
                      </div>
                      {alert.action && (
                        <p className="text-xs text-gray-600 ml-0">
                          💡 {alert.action}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Correlation Analysis */}
          {riskMetrics.correlatedPairs.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">Currency Correlation</h4>
              {riskMetrics.correlatedPairs.map((pair, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
                  <span className="text-sm">
                    <span className="font-semibold">{pair.currency}</span> pairs: {pair.trades.length} positions
                  </span>
                  <span className="text-sm text-orange-800">
                    ${pair.exposure.toFixed(0)} exposure
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => alert('Position size calculator coming soon!')}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Safe Position Size
            </Button>
            
            {riskMetrics.riskLevel !== 'SAFE' && (
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                onClick={() => alert('Risk reduction suggestions coming soon!')}
              >
                <ShieldAlert className="h-4 w-4 mr-1" />
                Reduce Exposure
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}