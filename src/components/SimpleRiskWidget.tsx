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
          🔍 Simple Risk Widget - Primi 2 Valori Base
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

        {/* Quick Summary */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">📊 Summary:</div>
          <div className="text-xs space-y-1">
            <div>Daily DD Effettivo: <strong>${dailyData.effective.toFixed(2)}</strong></div>
            <div>Overall DD Effettivo: <strong>${overallData.effective.toFixed(2)}</strong></div>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}