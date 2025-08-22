'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SimpleRiskWidgetProps {
  account: any
  rules: any
  stats: any
}

export default function SimpleRiskWidget({ account, rules, stats }: SimpleRiskWidgetProps) {
  // 🎯 STEP 1: Calculate Daily Drawdown EFFETTIVO
  const calculateDailyDrawdownEffective = () => {
    if (!account?.propFirmTemplate || !rules) return null

    const accountSize = account.propFirmTemplate.accountSize || 50000
    const currentPhase = account.currentPhase || 'PHASE_1'
    
    // Get daily loss limit from template
    const dailyLossPercent = account.propFirmTemplate.rulesJson?.dailyLossLimits?.[currentPhase]?.percentage || 5
    const dailyLimit = accountSize * (dailyLossPercent / 100)
    
    // Get today's actual P&L (already calculated correctly with closeTime)
    const dailyPnL = rules.dailyPnL || 0
    const currentLoss = Math.max(0, -dailyPnL) // Only negative counts as loss
    
    // DAILY DRAWDOWN EFFETTIVO = Limit - Current Losses
    const effectiveDaily = dailyLimit - currentLoss
    
    return {
      limit: dailyLimit,
      currentLoss: currentLoss,
      effective: effectiveDaily,
      percentage: (currentLoss / dailyLimit) * 100
    }
  }

  // 🎯 STEP 2: Calculate Drawdown Massimo EFFETTIVO  
  const calculateMaxDrawdownEffective = () => {
    if (!account?.propFirmTemplate || !stats) return null

    const accountSize = account.propFirmTemplate.accountSize || 50000
    const currentPhase = account.currentPhase || 'PHASE_1'
    
    // Get overall loss limit from template
    const overallLossPercent = account.propFirmTemplate.rulesJson?.overallLossLimits?.[currentPhase]?.percentage || 10
    const overallLimit = accountSize * (overallLossPercent / 100)
    
    // Get current equity
    const currentEquity = accountSize + (stats.totalPnL || 0)
    
    // Calculate how much we can still lose before hitting the limit
    const minAllowedEquity = accountSize - overallLimit
    const effectiveOverall = Math.max(0, currentEquity - minAllowedEquity)
    
    return {
      limit: overallLimit,
      currentEquity: currentEquity,
      minAllowedEquity: minAllowedEquity,
      effective: effectiveOverall,
      totalLoss: Math.max(0, accountSize - currentEquity)
    }
  }

  const dailyData = calculateDailyDrawdownEffective()
  const overallData = calculateMaxDrawdownEffective()

  if (!dailyData || !overallData) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🔍 Simple Risk Widget</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500">Loading risk data...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Complete Risk Widget - Tutti i 3 Step + Calcolo Conservativo
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        
        {/* VALUE 1: Daily Drawdown EFFETTIVO */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-3">
            1️⃣ Daily Drawdown EFFETTIVO
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Daily Limit:</span>
              <span className="font-bold">${dailyData.limit.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Perdite Oggi:</span>
              <span className="font-bold text-red-600">-${dailyData.currentLoss.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Daily DD Effettivo:</span>
                <span className={`text-lg font-bold ${
                  dailyData.effective > dailyData.limit * 0.5 ? 'text-green-600' : 
                  dailyData.effective > 0 ? 'text-orange-600' : 'text-red-600'
                }`}>
                  ${dailyData.effective.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* VALUE 2: Drawdown Massimo EFFETTIVO */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-3">
            2️⃣ Drawdown Massimo EFFETTIVO
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Starting Balance:</span>
              <span className="font-bold">${account.propFirmTemplate.accountSize.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Current Equity:</span>
              <span className="font-bold">${overallData.currentEquity.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Min Allowed Equity:</span>
              <span className="font-bold text-red-600">${overallData.minAllowedEquity.toFixed(0)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Drawdown Max Effettivo:</span>
                <span className={`text-lg font-bold ${
                  overallData.effective > overallData.limit * 0.5 ? 'text-green-600' : 
                  overallData.effective > 0 ? 'text-orange-600' : 'text-red-600'
                }`}>
                  ${overallData.effective.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 2: Intelligent Comparison Logic */}
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="font-semibold text-purple-800 mb-3">
            3️⃣ ALGORITMO INTELLIGENTE - Limite più Restrittivo
          </h4>
          <div className="space-y-3">
            
            {/* Comparison Logic */}
            <div className="bg-white p-3 rounded border">
              <div className="text-sm font-medium mb-2">🧠 Logica di Confronto:</div>
              <div className="text-xs space-y-1 text-gray-700">
                <div>Daily DD: <span className="font-mono">${dailyData.effective.toFixed(2)}</span></div>
                <div>Overall DD: <span className="font-mono">${overallData.effective.toFixed(2)}</span></div>
                <div className="border-t pt-1 mt-2">
                  {dailyData.effective <= overallData.effective ? (
                    <div className="text-orange-700">
                      ⚠️ <strong>Daily è più restrittivo</strong> → Usa Daily
                    </div>
                  ) : (
                    <div className="text-blue-700">
                      ℹ️ <strong>Overall è più restrittivo</strong> → Usa Overall
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Final Result */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg">
              <div className="text-center">
                <div className="text-sm opacity-90 mb-1">🎯 MASSIMO RISCHIABILE</div>
                <div className="text-2xl font-bold">
                  ${Math.min(dailyData.effective, overallData.effective).toFixed(2)}
                </div>
                <div className="text-xs opacity-75 mt-1">
                  ({dailyData.effective <= overallData.effective ? 'Limitato da Daily' : 'Limitato da Overall'})
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* STEP 3: Conservative Risk Calculation with Stop Loss */}
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h4 className="font-semibold text-orange-800 mb-3">
            4️⃣ CALCOLO CONSERVATIVO - Stop Loss Protection
          </h4>
          <div className="space-y-3">
            
            {/* Conservative Factors */}
            <div className="bg-white p-3 rounded border">
              <div className="text-sm font-medium mb-2">🛡️ Fattori di Sicurezza:</div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-gray-600">Buffer di Sicurezza:</div>
                  <div className="font-mono text-orange-700">15%</div>
                </div>
                <div>
                  <div className="text-gray-600">Stop Loss Slippage:</div>
                  <div className="font-mono text-orange-700">5%</div>
                </div>
              </div>
            </div>

            {/* Conservative Calculations */}
            <div className="bg-white p-3 rounded border">
              <div className="text-sm font-medium mb-2">📊 Calcoli Conservativi:</div>
              <div className="space-y-2 text-xs">
                {(() => {
                  const maxRisk = Math.min(dailyData.effective, overallData.effective)
                  const safetyBuffer = maxRisk * 0.15 // 15% safety buffer
                  const slippageBuffer = maxRisk * 0.05 // 5% for slippage
                  const totalBuffer = safetyBuffer + slippageBuffer
                  const conservativeRisk = Math.max(0, maxRisk - totalBuffer)
                  
                  return (
                    <>
                      <div className="flex justify-between">
                        <span>Massimo Teorico:</span>
                        <span className="font-mono">${maxRisk.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-orange-600">
                        <span>- Buffer Sicurezza (15%):</span>
                        <span className="font-mono">-${safetyBuffer.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-orange-600">
                        <span>- Stop Loss Slippage (5%):</span>
                        <span className="font-mono">-${slippageBuffer.toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Rischio Conservativo:</span>
                        <span className="font-mono text-green-700">${conservativeRisk.toFixed(2)}</span>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Position Sizing Suggestions */}
            <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-4 rounded-lg">
              <div className="text-center">
                <div className="text-sm opacity-90 mb-1">🎯 RISCHIO CONSIGLIATO</div>
                <div className="text-2xl font-bold">
                  ${(() => {
                    const maxRisk = Math.min(dailyData.effective, overallData.effective)
                    const conservativeRisk = Math.max(0, maxRisk - (maxRisk * 0.20))
                    return conservativeRisk.toFixed(2)
                  })()}
                </div>
                <div className="text-xs opacity-75 mt-1">
                  (Con 20% buffer totale per sicurezza)
                </div>
              </div>
            </div>

            {/* Position Size Examples */}
            <div className="bg-white p-3 rounded border">
              <div className="text-sm font-medium mb-2">📈 Esempi Position Size:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(() => {
                  const maxRisk = Math.min(dailyData.effective, overallData.effective)
                  const conservativeRisk = Math.max(0, maxRisk - (maxRisk * 0.20))
                  
                  // Example position sizes for different pip values
                  const examples = [
                    { pair: 'EUR/USD', stopPips: 20, pipValue: 10 },
                    { pair: 'GBP/JPY', stopPips: 30, pipValue: 6.5 },
                    { pair: 'XAU/USD', stopPips: 15, pipValue: 1 }
                  ]
                  
                  return examples.map((ex, idx) => {
                    const lots = conservativeRisk / (ex.stopPips * ex.pipValue)
                    return (
                      <div key={idx} className="p-2 bg-gray-50 rounded">
                        <div className="font-medium">{ex.pair}</div>
                        <div>Stop: {ex.stopPips} pips</div>
                        <div>Lots: <span className="font-mono text-green-700">{lots.toFixed(2)}</span></div>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
            
          </div>
        </div>

        {/* Final Summary */}
        <div className="p-4 bg-gradient-to-r from-slate-100 to-gray-100 border border-gray-300 rounded-lg">
          <div className="text-sm text-gray-700 font-medium mb-3">📊 RIEPILOGO COMPLETO:</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="text-center p-3 bg-blue-100 rounded">
              <div className="text-blue-800 font-medium">Daily DD Effettivo</div>
              <div className="text-lg font-bold text-blue-900">${dailyData.effective.toFixed(2)}</div>
            </div>
            <div className="text-center p-3 bg-green-100 rounded">
              <div className="text-green-800 font-medium">Overall DD Effettivo</div>
              <div className="text-lg font-bold text-green-900">${overallData.effective.toFixed(2)}</div>
            </div>
            <div className="text-center p-3 bg-purple-100 rounded">
              <div className="text-purple-800 font-medium">Massimo Teorico</div>
              <div className="text-lg font-bold text-purple-900">${Math.min(dailyData.effective, overallData.effective).toFixed(2)}</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gradient-to-r from-green-200 to-teal-200 rounded text-center">
            <div className="text-green-800 font-medium">🎯 RISCHIO CONSIGLIATO FINALE</div>
            <div className="text-2xl font-bold text-green-900">
              ${(() => {
                const maxRisk = Math.min(dailyData.effective, overallData.effective)
                const conservativeRisk = Math.max(0, maxRisk - (maxRisk * 0.20))
                return conservativeRisk.toFixed(2)
              })()}
            </div>
            <div className="text-xs text-green-700 mt-1">
              (Calcolo conservativo con buffer di sicurezza del 20%)
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}