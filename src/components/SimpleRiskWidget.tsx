'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Bug, Shield, Target, Zap } from 'lucide-react'

interface SimpleRiskWidgetProps {
  account: any
  rules: any
  stats: any
  openTrades?: any[]
}

export default function SimpleRiskWidget({ account, rules, stats, openTrades = [] }: SimpleRiskWidgetProps) {
  const [showDebug, setShowDebug] = useState(false)
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
    const currentEquity = accountSize + (stats.netPnL || 0)
    
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

  // 🎯 STEP 2.5: Calculate Open Positions Risk - FIXED VERSION
  const calculateOpenPositionsRisk = () => {
    if (!openTrades || openTrades.length === 0) return { totalRisk: 0, positions: [] }
    
    let totalRisk = 0
    const positionsWithSL = []
    
    // Helper function to get correct contract size/pip value
    const getInstrumentSpecs = (symbol: string) => {
      const sym = symbol.toUpperCase()
      
      // ✅ GOLD - Oro
      if (sym.includes('XAU') || sym.includes('GOLD')) {
        return { contractSize: 100, pipSize: 0.01, type: 'GOLD' } // 1 pip = $1 per 0.01 lot
      }
      
      // ✅ SILVER - Argento  
      if (sym.includes('XAG') || sym.includes('SILVER')) {
        return { contractSize: 5000, pipSize: 0.001, type: 'SILVER' } // 1 pip = $5 per 1 lot
      }
      
      // ✅ OIL - Petrolio
      if (sym.includes('OIL') || sym.includes('WTI') || sym.includes('CRUDE')) {
        return { contractSize: 1000, pipSize: 0.01, type: 'OIL' } // 1 pip = $10 per 1 lot
      }
      
      // ✅ INDICES - Indici
      if (sym.includes('US30') || sym.includes('DOW')) {
        return { contractSize: 1, pipSize: 1, type: 'US30' } // 1 point = $1 per 1 lot
      }
      if (sym.includes('NAS100') || sym.includes('NDX')) {
        return { contractSize: 1, pipSize: 1, type: 'NAS100' } // 1 point = $1 per 1 lot
      }
      if (sym.includes('SPX500') || sym.includes('SP500')) {
        return { contractSize: 1, pipSize: 1, type: 'SPX500' } // 1 point = $1 per 1 lot
      }
      if (sym.includes('DAX') || sym.includes('GER40')) {
        return { contractSize: 1, pipSize: 1, type: 'DAX' } // 1 point = €1 per 1 lot
      }
      
      // ✅ FOREX - Valute
      if (sym.includes('JPY')) {
        return { contractSize: 100000, pipSize: 0.01, type: 'JPY' } // Coppie JPY
      } else {
        return { contractSize: 100000, pipSize: 0.0001, type: 'FOREX' } // Coppie major
      }
    }
    
    for (const trade of openTrades) {
      const hasStopLoss = trade.sl && trade.sl !== 0
      if (hasStopLoss) {
        const volume = trade.volume || 0
        const specs = getInstrumentSpecs(trade.symbol)
        
        // ✅ Calculate actual distance to stop loss
        let stopDistance = 0
        if (trade.side?.toLowerCase() === 'buy') {
          stopDistance = Math.abs(trade.openPrice - trade.sl) // BUY: Open price should be > SL
        } else {
          stopDistance = Math.abs(trade.sl - trade.openPrice) // SELL: SL should be > Open price
        }
        
        // ✅ Calculate risk in USD using proper formula
        let potentialLoss = 0
        
        if (specs.type === 'GOLD') {
          // Gold: 1 lot = 100 oz, 1 pip (0.01) = $1 per 0.01 lot
          potentialLoss = (stopDistance / specs.pipSize) * 1 * volume
        } else if (specs.type === 'SILVER') {
          // Silver: 1 lot = 5000 oz, 1 pip (0.001) = $5 per 1 lot  
          potentialLoss = (stopDistance / specs.pipSize) * 5 * volume
        } else if (specs.type === 'OIL') {
          // Oil: 1 lot = 1000 barrels, 1 pip (0.01) = $10 per 1 lot
          potentialLoss = (stopDistance / specs.pipSize) * 10 * volume
        } else if (specs.type.includes('US30') || specs.type.includes('NAS100') || specs.type.includes('SPX500')) {
          // US Indices: 1 point = $1 per 1 lot
          potentialLoss = stopDistance * 1 * volume
        } else if (specs.type === 'DAX') {
          // DAX: 1 point = €1 per 1 lot (assume EUR/USD = 1.10)
          potentialLoss = stopDistance * 1.10 * volume
        } else if (specs.type === 'FOREX' || specs.type === 'JPY') {
          // Forex: Standard calculation
          potentialLoss = (stopDistance / specs.pipSize) * 10 * volume // $10 per pip for standard lots
        }
        
        // Add commission and swap as additional risk
        potentialLoss += Math.abs(trade.commission || 0) + Math.abs(trade.swap || 0)
        
        totalRisk += potentialLoss
        positionsWithSL.push({
          symbol: trade.symbol,
          ticketId: trade.ticketId,
          side: trade.side,
          volume: trade.volume,
          sl: trade.sl,
          openPrice: trade.openPrice,
          stopDistance: stopDistance,
          instrumentType: specs.type,
          potentialLoss: potentialLoss
        })
      }
    }
    
    return {
      totalRisk: totalRisk,
      positions: positionsWithSL,
      totalPositions: openTrades.length,
      positionsWithSL: positionsWithSL.length
    }
  }

  const dailyData = calculateDailyDrawdownEffective()
  const overallData = calculateMaxDrawdownEffective()
  const openPositionsRisk = calculateOpenPositionsRisk()

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
    <Card className="mb-6 border-2 border-gradient-to-r from-purple-200 via-blue-200 to-green-200">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Risk Manager</h3>
              <p className="text-sm text-slate-600">Calcolo Rischio Intelligente e Conservativo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs"
            >
              <Bug className="h-4 w-4 mr-1" />
              Debug {showDebug ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        
        {/* COMPACT: Quick Risk Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              <span className="text-xs sm:text-sm font-medium text-blue-700">Daily Risk</span>
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900">
              ${dailyData.effective.toFixed(0)}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Perdite oggi: ${dailyData.currentLoss.toFixed(0)}
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              <span className="text-xs sm:text-sm font-medium text-green-700">Overall Risk</span>
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-900">
              ${overallData.effective.toFixed(0)}
            </div>
            <div className="text-xs text-green-600 mt-1">
              Equity: ${overallData.currentEquity.toFixed(0)}
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              <span className="text-xs sm:text-sm font-medium text-purple-700">Limite Attivo</span>
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-900">
              ${Math.min(dailyData.effective, overallData.effective).toFixed(0)}
            </div>
            <div className="text-xs text-purple-600 mt-1">
              {dailyData.effective <= overallData.effective ? 'Daily restrittivo' : 'Overall restrittivo'}
            </div>
          </div>
        </div>

        {/* COMPACT: Open Positions Alert */}
        {openPositionsRisk.totalPositions > 0 && (
          <div className="p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-dashed border-orange-300 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-full text-white flex-shrink-0">
                  <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm sm:text-base font-semibold text-orange-800">{openPositionsRisk.totalPositions} Posizioni Live</div>
                  <div className="text-xs sm:text-sm text-orange-600">{openPositionsRisk.positionsWithSL} con Stop Loss</div>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-xs sm:text-sm text-orange-600">Rischio impegnato:</div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-700">-${openPositionsRisk.totalRisk.toFixed(0)}</div>
              </div>
            </div>
          </div>
        )}

        {/* BIG RESULT: Final Risk Recommendation */}
        <div className="p-4 sm:p-6 bg-gradient-to-br from-green-100 via-teal-50 to-blue-100 border-2 border-green-300 rounded-2xl shadow-lg">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4">
              <Target className="h-4 w-4 sm:h-5 sm:w-5" />
              RISCHIO CONSIGLIATO FINALE
            </div>
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-800 mb-2">
              ${(() => {
                const maxTheorical = Math.min(dailyData.effective, overallData.effective)
                const availableAfterPositions = Math.max(0, maxTheorical - openPositionsRisk.totalRisk)
                const conservativeRisk = Math.max(0, availableAfterPositions - (availableAfterPositions * 0.20))
                return conservativeRisk.toFixed(0)
              })()}
            </div>
            <div className="text-lg text-green-700 font-medium mb-4">
              {openPositionsRisk.totalRisk > 0 
                ? `Include ${openPositionsRisk.positionsWithSL} posizioni SL + buffer 20%`
                : 'Con buffer di sicurezza del 20%'
              }
            </div>
            <div className="flex justify-center items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border">
                <Shield className="h-4 w-4 text-blue-500" />
                <span>Calcolo Intelligente</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border">
                <Zap className="h-4 w-4 text-orange-500" />
                <span>Protezione SL</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border">
                <Target className="h-4 w-4 text-green-500" />
                <span>Buffer Sicurezza</span>
              </div>
            </div>
          </div>
        </div>

        {/* DEBUG SECTION - Collapsible */}
        {showDebug && (
          <div className="space-y-4 p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Bug className="h-5 w-5 text-slate-600" />
              <span className="font-semibold text-slate-700">Debug Mode - Calcoli Dettagliati</span>
            </div>
            
            {/* Debug: Step by step calculations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              <div className="bg-white p-3 rounded border">
                <div className="font-semibold mb-2 text-blue-700">1️⃣ Daily DD Calculation</div>
                <div className="space-y-1">
                  <div className="flex justify-between"><span>Daily Limit:</span><span className="font-mono">${dailyData.limit.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Perdite Oggi:</span><span className="font-mono text-red-600">-${dailyData.currentLoss.toFixed(2)}</span></div>
                  <div className="flex justify-between font-semibold border-t pt-1"><span>Daily Effective:</span><span className="font-mono">${dailyData.effective.toFixed(2)}</span></div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <div className="font-semibold mb-2 text-green-700">2️⃣ Overall DD Calculation</div>
                <div className="space-y-1">
                  <div className="flex justify-between"><span>Start Balance:</span><span className="font-mono">${account.propFirmTemplate.accountSize.toFixed(0)}</span></div>
                  <div className="flex justify-between"><span>Current Equity:</span><span className="font-mono">${overallData.currentEquity.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Min Allowed:</span><span className="font-mono text-red-600">${overallData.minAllowedEquity.toFixed(0)}</span></div>
                  <div className="flex justify-between font-semibold border-t pt-1"><span>Overall Effective:</span><span className="font-mono">${overallData.effective.toFixed(2)}</span></div>
                </div>
              </div>
              
              {openPositionsRisk.positionsWithSL > 0 && (
                <div className="bg-white p-3 rounded border lg:col-span-2">
                  <div className="font-semibold mb-2 text-orange-700">2️⃣.5 Open Positions SL Risk - FIXED CALCULATION</div>
                  <div className="space-y-2 text-xs">
                    {openPositionsRisk.positions.map((pos, idx) => (
                      <div key={idx} className="border-b pb-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{pos.symbol} #{pos.ticketId} ({pos.instrumentType})</span>
                          <span className="font-mono text-red-600 font-bold">-${pos.potentialLoss.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 mt-1">
                          <span>{pos.side} {pos.volume} lot</span>
                          <span>SL Distance: {pos.stopDistance.toFixed(4)}</span>
                        </div>
                        <div className="text-gray-500 text-xs">
                          Open: {pos.openPrice} → SL: {pos.sl} ({pos.instrumentType} calculation)
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold border-t pt-2 text-sm">
                      <span>Total SL Risk (Corretto):</span>
                      <span className="font-mono text-red-700">-${openPositionsRisk.totalRisk.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-white p-3 rounded border">
                <div className="font-semibold mb-2 text-purple-700">3️⃣ Conservative Calculation</div>
                <div className="space-y-1">
                  {(() => {
                    const maxTheorical = Math.min(dailyData.effective, overallData.effective)
                    const availableAfterPositions = Math.max(0, maxTheorical - openPositionsRisk.totalRisk)
                    const safetyBuffer = availableAfterPositions * 0.15
                    const slippageBuffer = availableAfterPositions * 0.05
                    const conservativeRisk = Math.max(0, availableAfterPositions - (safetyBuffer + slippageBuffer))
                    
                    return (
                      <>
                        <div className="flex justify-between"><span>Max Theorical:</span><span className="font-mono">${maxTheorical.toFixed(2)}</span></div>
                        {openPositionsRisk.totalRisk > 0 && <div className="flex justify-between"><span>- Open Positions:</span><span className="font-mono text-red-600">-${openPositionsRisk.totalRisk.toFixed(2)}</span></div>}
                        <div className="flex justify-between"><span>= Available:</span><span className="font-mono">${availableAfterPositions.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>- Safety Buffer (15%):</span><span className="font-mono text-orange-600">-${safetyBuffer.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>- Slippage Buffer (5%):</span><span className="font-mono text-orange-600">-${slippageBuffer.toFixed(2)}</span></div>
                        <div className="flex justify-between font-semibold border-t pt-1"><span>Conservative:</span><span className="font-mono text-green-700">${conservativeRisk.toFixed(2)}</span></div>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUMMARY: Beautiful Summary Cards */}
        <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200 rounded-xl">
          <div className="text-center mb-4">
            <h4 className="text-lg font-semibold text-slate-700 mb-1">📊 Riepilogo Completo</h4>
            <div className="text-sm text-slate-500">Tutti i valori calcolati dal Risk Manager</div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="text-center p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg border border-blue-300">
              <div className="text-blue-800 font-medium mb-1">Daily DD</div>
              <div className="text-xl font-bold text-blue-900">${dailyData.effective.toFixed(0)}</div>
              <div className="text-blue-600 mt-1">🔄 Effettivo</div>
            </div>
            
            <div className="text-center p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-lg border border-green-300">
              <div className="text-green-800 font-medium mb-1">Overall DD</div>
              <div className="text-xl font-bold text-green-900">${overallData.effective.toFixed(0)}</div>
              <div className="text-green-600 mt-1">🔄 Effettivo</div>
            </div>
            
            <div className="text-center p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg border border-purple-300">
              <div className="text-purple-800 font-medium mb-1">Max Teorico</div>
              <div className="text-xl font-bold text-purple-900">${Math.min(dailyData.effective, overallData.effective).toFixed(0)}</div>
              <div className="text-purple-600 mt-1">🧠 Intelligente</div>
            </div>
            
            <div className="text-center p-3 bg-gradient-to-br from-green-200 to-teal-200 rounded-lg border-2 border-green-400">
              <div className="text-green-800 font-medium mb-1">Consigliato</div>
              <div className="text-xl font-bold text-green-900">
                ${(() => {
                  const maxTheorical = Math.min(dailyData.effective, overallData.effective)
                  const availableAfterPositions = Math.max(0, maxTheorical - openPositionsRisk.totalRisk)
                  const conservativeRisk = Math.max(0, availableAfterPositions - (availableAfterPositions * 0.20))
                  return conservativeRisk.toFixed(0)
                })()}
              </div>
              <div className="text-green-600 mt-1">🛡️ Sicuro</div>
            </div>
          </div>
          
          {/* Flow Visualization */}
          <div className="mt-6 p-3 bg-white rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-center mb-3 text-slate-600">🧮 Flusso di Calcolo Automatico</div>
            <div className="flex items-center justify-center space-x-2 text-xs flex-wrap gap-2">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">Limite Intelligente</span>
              {openPositionsRisk.totalRisk > 0 && (
                <>
                  <span className="text-slate-400">−</span>
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-medium">Posizioni SL (${openPositionsRisk.totalRisk.toFixed(0)})</span>
                </>
              )}
              <span className="text-slate-400">−</span>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full font-medium">Buffer 20%</span>
              <span className="text-slate-400">=</span>
              <span className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full font-bold text-sm">✨ RISULTATO FINALE</span>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}