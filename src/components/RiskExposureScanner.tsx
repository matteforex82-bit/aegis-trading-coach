'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Shield, ShieldAlert, TrendingUp, X, Settings, Eye } from 'lucide-react'

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

          {/* 🚨 MARGINE DI SICUREZZA GIORNALIERO - REDESIGN COMPLETO */}
          <div className={`p-6 rounded-xl border-2 ${
            riskMetrics.trueSafeCapacity.riskLevel === 'CRITICAL' 
              ? 'bg-red-50 border-red-500 animate-pulse' 
              : riskMetrics.trueSafeCapacity.riskLevel === 'DANGER'
              ? 'bg-orange-50 border-orange-400'
              : 'bg-green-50 border-green-300'
          }`}>
            
            {/* 🎯 LIVELLO 1: MESSAGGIO PRINCIPALE CHIARO */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-3">
                <div className={`p-3 rounded-full ${
                  riskMetrics.trueSafeCapacity.riskLevel === 'CRITICAL' ? 'bg-red-600' :
                  riskMetrics.trueSafeCapacity.riskLevel === 'DANGER' ? 'bg-orange-500' :
                  'bg-green-600'
                }`}>
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">💰 Margine di Sicurezza Giornaliero</h3>
              
              {/* IL NUMERO PIU' IMPORTANTE - GRANDISSIMO */}
              <div className={`text-6xl font-bold mb-2 ${
                riskMetrics.trueSafeCapacity.riskLevel === 'CRITICAL' ? 'text-red-600' :
                riskMetrics.trueSafeCapacity.riskLevel === 'DANGER' ? 'text-orange-600' :
                'text-green-600'
              }`}>
                ${Math.abs(riskMetrics.trueSafeCapacity.trueSafeCapacity).toFixed(0)}
              </div>
              
              <p className="text-lg text-gray-600 mb-4">
                {riskMetrics.trueSafeCapacity.trueSafeCapacity >= 0 
                  ? "puoi perdere ancora questo oggi"
                  : "ATTENZIONE: sei già oltre il limite!"}
              </p>

              {/* LIVELLO 2: SAFE/WARNING/DANGER BADGE */}
              <Badge className={`text-lg px-6 py-2 ${
                riskMetrics.trueSafeCapacity.riskLevel === 'CRITICAL' ? 'bg-red-600 text-white' :
                riskMetrics.trueSafeCapacity.riskLevel === 'DANGER' ? 'bg-orange-500 text-white' :
                'bg-green-600 text-white'
              }`}>
                {riskMetrics.trueSafeCapacity.riskLevel === 'CRITICAL' ? '🚨 CRITICO' :
                 riskMetrics.trueSafeCapacity.riskLevel === 'DANGER' ? '⚠️ ATTENZIONE' :
                 '✅ SICURO'}
              </Badge>
            </div>

            {/* LIVELLO 3: BARRA VISUALE POSIZIONE */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Posizione Corrente</span>
                <span className="text-sm text-gray-600">
                  ${riskMetrics.trueSafeCapacity.currentEquity.toFixed(0)} equity → ${(riskMetrics.trueSafeCapacity.startingBalance - riskMetrics.trueSafeCapacity.dailyLimitUSD).toFixed(0)} limite
                </span>
              </div>
              
              {/* BARRA ORIZZONTALE COLORATA */}
              <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                {/* Gradiente verde → giallo → rosso */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500"></div>
                
                {/* Indicatore posizione attuale */}
                <div 
                  className="absolute top-0 h-full w-1 bg-gray-900 border-2 border-white shadow-lg"
                  style={{ 
                    left: `${Math.min(Math.max(
                      ((riskMetrics.trueSafeCapacity.currentEquity - (riskMetrics.trueSafeCapacity.startingBalance - riskMetrics.trueSafeCapacity.dailyLimitUSD)) / riskMetrics.trueSafeCapacity.dailyLimitUSD) * 100, 
                      0
                    ), 100)}%`
                  }}
                ></div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Limite violazione</span>
                <span>75% safe</span>
                <span>Equity attuale</span>
              </div>
            </div>

            {/* LIVELLO 4: SIMULAZIONE WORST CASE SEMPLIFICATA */}
            <div className="mb-4">
              <div className="bg-white rounded-lg border p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  Cosa succede se tutti gli SL vengono colpiti?
                </h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-2xl font-bold ${
                      riskMetrics.trueSafeCapacity.scenarios.ifAllSLHit.wouldViolate ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {riskMetrics.trueSafeCapacity.scenarios.ifAllSLHit.wouldViolate ? '🚨 VIOLAZIONE' : '✅ SAFE'}
                    </div>
                    <div className="text-sm text-gray-600">
                      Equity minima toccata: ${riskMetrics.trueSafeCapacity.scenarios.ifAllSLHit.minEquityTouched.toFixed(0)}
                    </div>
                  </div>
                  
                  {riskMetrics.trueSafeCapacity.scenarios.ifAllSLHit.wouldViolate && (
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        Margine: ${Math.abs(riskMetrics.trueSafeCapacity.scenarios.ifAllSLHit.marginToViolation).toFixed(0)}
                      </div>
                      <div className="text-xs text-red-600">troppo vicino al limite!</div>
                    </div>
                  )}
                </div>

                {/* Dettagli espandibili nascosti per ora */}
                <details className="mt-3">
                  <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                    🔍 Mostra dettagli simulazione
                  </summary>
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {riskMetrics.trueSafeCapacity.scenarios.ifAllSLHit.sequence.slice(0, 5).map((step, i) => (
                      <div key={i} className={`text-xs p-2 rounded flex items-center justify-between ${
                        step.violatesHere ? 'bg-red-100 border border-red-200' : 'bg-gray-50'
                      }`}>
                        <span>{i + 1}. {step.trade}: {step.slLoss.toFixed(0)}</span>
                        <span className={`font-medium ${step.violatesHere ? 'text-red-600' : 'text-gray-600'}`}>
                          → ${step.runningEquity.toFixed(0)} {step.violatesHere ? '🚨' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </div>

            {/* LIVELLO 4: AZIONI UTILI */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={() => alert('Position size calculator coming soon!')}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Calcola size sicura per prossimo trade
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => alert('Detailed analysis coming soon!')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Vedi analisi dettagliata
              </Button>
            </div>
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