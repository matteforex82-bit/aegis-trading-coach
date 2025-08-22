'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Shield, ShieldAlert, TrendingUp, Eye } from 'lucide-react'

interface ConservativeRiskAnalysis {
  currentEquity: number
  startingBalance: number
  dailyLossLimitUSD: number
  overallLossLimitUSD: number
  dailyLossesRealized: number
  dailyLossesFloating: number
  maxRiskFromSL: number
  maxRiskFromNoSL: number
  dailyMarginLeft: number
  overallMarginLeft: number
  controllingLimit: 'DAILY' | 'OVERALL'
  finalSafeCapacity: number
  riskLevel: 'SAFE' | 'CAUTION' | 'DANGER' | 'CRITICAL'
  alerts: string[]
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
    riskAnalysis: ConservativeRiskAnalysis
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

  useEffect(() => {
    fetchRiskAnalysis()
    const interval = setInterval(fetchRiskAnalysis, 30000)
    return () => clearInterval(interval)
  }, [accountId])

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
            Risk Exposure Scanner (CONSERVATIVE)
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

  const { riskAnalysis } = riskData
  const dailyLimitPercent = (riskAnalysis.dailyLossLimitUSD / riskAnalysis.startingBalance) * 100
  
  // Calculate exposure as percentage
  const totalRisk = riskAnalysis.maxRiskFromSL + riskAnalysis.maxRiskFromNoSL + riskAnalysis.dailyLossesFloating
  const exposurePercent = (totalRisk / riskAnalysis.startingBalance) * 100

  const getRiskColor = () => {
    switch (riskAnalysis.riskLevel) {
      case 'CRITICAL': return 'bg-red-600'
      case 'DANGER': return 'bg-red-500'
      case 'CAUTION': return 'bg-yellow-500' 
      case 'SAFE': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getRiskBorderClass = () => {
    if (riskAnalysis.riskLevel === 'CRITICAL' || riskAnalysis.riskLevel === 'DANGER') {
      return 'border-red-500 animate-pulse'
    }
    return 'border-gray-200'
  }

  return (
    <>
      {/* No Open Trades Info Banner */}
      {openTrades.length === 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-blue-800">
              Nessuna posizione aperta - Account completamente sicuro
            </span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Il pannello mostra la tua capacità di rischio disponibile per nuove operazioni.
          </p>
        </div>
      )}

      {/* Critical Alerts Banner */}
      {riskAnalysis.alerts.length > 0 && (
        <div className="mb-4 space-y-2">
          {riskAnalysis.alerts.map((alert, index) => (
            <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="font-semibold text-red-800">{alert}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Card className={`mb-6 border-2 ${getRiskBorderClass()}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {riskAnalysis.riskLevel === 'CRITICAL' || riskAnalysis.riskLevel === 'DANGER' ? (
                <ShieldAlert className="h-5 w-5 text-red-600" />
              ) : (
                <Shield className="h-5 w-5 text-green-600" />
              )}
              Risk Exposure Scanner (CONSERVATIVE)
              <Badge className={getRiskColor() + ' text-white'}>
                {riskAnalysis.riskLevel}
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
        
        <CardContent className="space-y-6">
          
          {/* 🎯 SPIEGAZIONE STEP-BY-STEP DETTAGLIATA */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
            <h4 className="font-semibold text-blue-800 mb-4">🧮 Calcolo Step-by-Step (Logica Semplice)</h4>
            
            {/* STEP 1: Drawdown Rimanenti */}
            <div className="mb-4 p-3 bg-white rounded border">
              <div className="font-medium text-blue-800 mb-2">STEP 1 - Drawdown Rimanenti (al netto perdite)</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Daily Drawdown Rimanente:</span>
                  <div className="font-bold text-blue-900">${riskAnalysis.dailyMarginLeft.toFixed(0)}</div>
                  <div className="text-xs text-gray-500">Limite: ${riskAnalysis.dailyLossLimitUSD.toFixed(0)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Overall Drawdown Rimanente:</span>
                  <div className="font-bold text-blue-900">${riskAnalysis.overallMarginLeft.toFixed(0)}</div>
                  <div className="text-xs text-gray-500">Limite: ${riskAnalysis.overallLossLimitUSD.toFixed(0)}</div>
                </div>
              </div>
            </div>

            {/* STEP 2: Controllo Intelligente - USA IL MINORE */}
            <div className="mb-4 p-3 bg-white rounded border">
              <div className="font-medium text-blue-800 mb-2">STEP 2 - Usa il MINORE (più restrittivo)</div>
              <div className="text-sm">
                <div className="mb-1">
                  <span className="text-gray-600">Confronto:</span> ${riskAnalysis.dailyMarginLeft.toFixed(0)} vs ${riskAnalysis.overallMarginLeft.toFixed(0)}
                </div>
                <div className="font-bold text-blue-900">
                  Il MINORE è: <strong>${Math.min(riskAnalysis.dailyMarginLeft, riskAnalysis.overallMarginLeft).toFixed(0)}</strong> → Usa <strong>{riskAnalysis.controllingLimit}</strong>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  Margine base disponibile: ${riskAnalysis.controllingLimit === 'OVERALL' ? riskAnalysis.overallMarginLeft.toFixed(0) : riskAnalysis.dailyMarginLeft.toFixed(0)}
                </div>
              </div>
            </div>

            {/* STEP 3: Posizioni */}
            <div className="mb-4 p-3 bg-white rounded border">
              <div className="font-medium text-blue-800 mb-2">STEP 3 - Controllo Posizioni</div>
              <div className="text-sm space-y-2">
                {riskAnalysis.maxRiskFromSL > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rischio da Stop Loss:</span>
                    <span className="font-bold text-orange-700">-${riskAnalysis.maxRiskFromSL.toFixed(0)}</span>
                  </div>
                )}
                {riskAnalysis.alerts.some(alert => alert.includes('NO STOP LOSS')) && (
                  <div className="text-red-700 font-bold">❌ POSIZIONI SENZA SL → MARGINE = 0</div>
                )}
              </div>
            </div>

            {/* RISULTATO FINALE */}
            <div className={`p-3 border rounded ${riskAnalysis.finalSafeCapacity < 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <div className={`font-medium mb-2 ${riskAnalysis.finalSafeCapacity < 0 ? 'text-red-800' : 'text-green-800'}`}>RISULTATO FINALE</div>
              <div className="text-sm">
                {riskAnalysis.alerts.some(alert => alert.includes('NO STOP LOSS')) ? (
                  <div className="font-bold text-red-700">MARGINE DISPONIBILE: $0 (Posizioni senza SL)</div>
                ) : (
                  <div>
                    <div className="text-gray-600 mb-1">
                      Base: ${Math.min(riskAnalysis.dailyMarginLeft, riskAnalysis.overallMarginLeft).toFixed(0)} - Stop Loss: ${riskAnalysis.maxRiskFromSL.toFixed(0)} = 
                    </div>
                    <div className={`font-bold text-lg ${
                      riskAnalysis.finalSafeCapacity < 0 ? 'text-red-700' : 
                      riskAnalysis.finalSafeCapacity < 500 ? 'text-orange-700' : 'text-green-800'
                    }`}>
                      ${riskAnalysis.finalSafeCapacity.toFixed(0)} {riskAnalysis.finalSafeCapacity < 0 ? 'RISCHIO CRITICO!' : 'DISPONIBILE'}
                    </div>
                    {riskAnalysis.finalSafeCapacity < 0 && (
                      <div className="text-xs text-red-600 mt-1">⚠️ Stai rischiando di perdere la challenge!</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 🎯 ESPOSIZIONE CONSERVATIVA ATTUALE */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Esposizione Conservativa: {exposurePercent.toFixed(1)}% / {dailyLimitPercent.toFixed(1)}% Daily Limit
              </span>
              <span className="text-sm text-gray-600">
                ${totalRisk.toFixed(0)} / ${riskAnalysis.dailyLossLimitUSD.toFixed(0)}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${getRiskColor()}`}
                style={{ width: `${Math.min(exposurePercent / dailyLimitPercent * 100, 100)}%` }}
              ></div>
              
              <div className="absolute top-0 left-0 h-full w-full">
                <div className="absolute top-0 h-full bg-yellow-300 w-0.5" style={{ left: '50%' }}></div>
                <div className="absolute top-0 h-full bg-red-300 w-0.5" style={{ left: '80%' }}></div>
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>{(dailyLimitPercent * 0.5).toFixed(1)}%</span>
              <span>{(dailyLimitPercent * 0.8).toFixed(1)}%</span>
              <span>{dailyLimitPercent.toFixed(1)}%</span>
            </div>
          </div>

          {/* 🎯 BREAKDOWN DEL RISCHIO */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">🔍 Analisi Conservativa del Rischio</h4>
            
            {/* Floating Losses */}
            {riskAnalysis.dailyLossesFloating > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-100 rounded border border-red-200">
                <span className="text-sm flex items-center gap-2">
                  📉 <strong>Perdite Flottanti Attuali</strong>
                </span>
                <span className="text-sm font-semibold text-red-700">
                  -${riskAnalysis.dailyLossesFloating.toFixed(0)}
                </span>
              </div>
            )}

            {/* SL Risk */}
            {riskAnalysis.maxRiskFromSL > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-100 rounded border border-orange-200">
                <span className="text-sm flex items-center gap-2">
                  🎯 <strong>Rischio da Stop Loss</strong> (conservativo: conta come perdite)
                </span>
                <span className="text-sm font-semibold text-orange-700">
                  -${riskAnalysis.maxRiskFromSL.toFixed(0)}
                </span>
              </div>
            )}

            {/* No SL Risk */}
            {riskAnalysis.maxRiskFromNoSL > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-100 rounded border border-red-200">
                <span className="text-sm flex items-center gap-2">
                  🚨 <strong>Rischio senza Stop Loss</strong>
                </span>
                <span className="text-sm font-semibold text-red-700">
                  -${riskAnalysis.maxRiskFromNoSL.toFixed(0)}
                </span>
              </div>
            )}
          </div>

          {/* 🎯 MARGINE DI SICUREZZA GIORNALIERO - LOGICA CONSERVATIVA */}
          <div className={`p-6 rounded-xl border-2 ${
            riskAnalysis.riskLevel === 'CRITICAL' 
              ? 'bg-red-50 border-red-500 animate-pulse' 
              : riskAnalysis.riskLevel === 'DANGER'
              ? 'bg-orange-50 border-orange-400'
              : riskAnalysis.riskLevel === 'CAUTION'
              ? 'bg-yellow-50 border-yellow-400'
              : 'bg-green-50 border-green-300'
          }`}>
            
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-3">
                <div className={`p-3 rounded-full ${
                  riskAnalysis.riskLevel === 'CRITICAL' ? 'bg-red-600' :
                  riskAnalysis.riskLevel === 'DANGER' ? 'bg-orange-500' :
                  riskAnalysis.riskLevel === 'CAUTION' ? 'bg-yellow-500' :
                  'bg-green-600'
                }`}>
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">💰 Margine di Sicurezza (CONSERVATIVO)</h3>
              
              <div className={`text-6xl font-bold mb-2 ${
                riskAnalysis.riskLevel === 'CRITICAL' ? 'text-red-600' :
                riskAnalysis.riskLevel === 'DANGER' ? 'text-orange-600' :
                riskAnalysis.riskLevel === 'CAUTION' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                ${riskAnalysis.finalSafeCapacity.toFixed(0)}
              </div>
              
              <p className="text-lg text-gray-600 mb-4">
                puoi perdere ancora questo oggi (CONSERVATIVO)
              </p>

              <Badge className={`text-lg px-6 py-2 ${
                riskAnalysis.riskLevel === 'CRITICAL' ? 'bg-red-600 text-white' :
                riskAnalysis.riskLevel === 'DANGER' ? 'bg-orange-500 text-white' :
                riskAnalysis.riskLevel === 'CAUTION' ? 'bg-yellow-500 text-white' :
                'bg-green-600 text-white'
              }`}>
                {riskAnalysis.riskLevel === 'CRITICAL' ? '🚨 CRITICO' :
                 riskAnalysis.riskLevel === 'DANGER' ? '⚠️ PERICOLO' :
                 riskAnalysis.riskLevel === 'CAUTION' ? '⚠️ ATTENZIONE' :
                 '✅ SICURO'}
              </Badge>
            </div>

            {/* Controllo Intelligente */}
            <div className="mb-4 p-4 bg-white rounded-lg border">
              <h4 className="font-semibold text-gray-800 mb-2">🧠 Controllo Intelligente</h4>
              <div className="text-sm">
                <div>Limite controllante: <strong>{riskAnalysis.controllingLimit === 'DAILY' ? 'DAILY LOSS' : 'OVERALL DRAWDOWN'}</strong></div>
                <div className="mt-2 space-y-1 text-xs text-gray-600">
                  <div>Daily margin left: ${riskAnalysis.dailyMarginLeft.toFixed(0)}</div>
                  <div>Overall margin left: ${riskAnalysis.overallMarginLeft.toFixed(0)}</div>
                  <div>Using: <strong>${riskAnalysis.finalSafeCapacity.toFixed(0)}</strong> (più restrittivo)</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={() => alert('Position size calculator coming soon!')}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Calcola size sicura
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => alert('Detailed analysis coming soon!')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Analisi dettagliata
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>
    </>
  )
}