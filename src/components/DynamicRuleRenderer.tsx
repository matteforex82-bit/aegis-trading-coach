'use client'

import React from 'react'
import { PropFirmTemplate, PropFirm } from '@prisma/client'
import { TemplateBasedCalculator } from '@/lib/template-calculator'
import SeparatedProfitTargetKPIs from '@/components/SeparatedProfitTargetKPIs'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, Clock, Target, Shield, TrendingUp } from 'lucide-react'

interface AccountWithTemplate {
  id: string
  startBalance: number
  currentBalance?: number  
  currentPhase: string
  propFirmTemplate?: (PropFirmTemplate & {
    propFirm?: PropFirm
  }) | null
}

interface TradeStats {
  totalPnL: number
  netPnL?: number
  dailyPnL?: number
  bestDay?: number
  bestTrade?: number
  tradingDaysCount?: number
}

interface DynamicRuleRendererProps {
  account: AccountWithTemplate
  stats: TradeStats
  className?: string
}

export default function DynamicRuleRenderer({ 
  account, 
  stats, 
  className = "" 
}: DynamicRuleRendererProps) {
  // Initialize calculator with current balance (startBalance + netPnL)
  // Use initialBalance or default to 50000 if startBalance is not available
  const startBalance = account.startBalance || account.initialBalance || 50000
  const currentBalance = startBalance + (stats.netPnL || stats.totalPnL || 0)
  const calculator = new TemplateBasedCalculator(
    account.propFirmTemplate || null,
    currentBalance,
    account.currentPhase,
    startBalance
  )

  // Get template info
  const templateInfo = calculator.getTemplateInfo()

  // If no template, show fallback message
  if (!account.propFirmTemplate) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <p className="text-amber-800">No template assigned to this account</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Template Header */}
      <div className="flex items-center gap-3 mb-6">
        <Badge variant="outline" className="text-sm px-3 py-1">
          {templateInfo.propFirm} - {templateInfo.name}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          {account.currentPhase}
        </Badge>
      </div>

      <div className="space-y-6">
        {/* Profit Targets Separati - Sempre mostrati */}
        <SeparatedProfitTargetKPIs accountId={account.id} />
        
        <div className="grid gap-4">

        {/* Daily Loss Limit */}
        {calculator.hasRule('dailyLoss') && (
          <DailyLossKPI 
            calculator={calculator} 
            stats={stats} 
          />
        )}

        {/* Overall Loss Limit */}
        {calculator.hasRule('overallLoss') && (
          <OverallLossKPI 
            calculator={calculator} 
            stats={stats} 
          />
        )}

        {/* Consistency Rules - Only if enabled */}
        {calculator.hasConsistencyRules() && (
          <ConsistencyRulesKPI 
            calculator={calculator} 
            stats={stats} 
          />
        )}

        {/* Minimum Trading Days */}
        {calculator.getMinimumTradingDays() && (
          <TradingDaysKPI 
            calculator={calculator} 
            stats={stats} 
          />
        )}

        {/* Special Features */}
        {calculator.getSpecialFeatures().length > 0 && (
          <SpecialFeaturesInfo calculator={calculator} />
        )}
        </div>
      </div>
    </div>
  )
}

// Individual KPI Components
// Componente ProfitTargetKPI rimosso - sostituito da SeparatedProfitTargetKPIs

function DailyLossKPI({ calculator, stats }: { 
  calculator: TemplateBasedCalculator
  stats: TradeStats 
}) {
  const dailyLimit = calculator.getDailyLossLimit()
  if (!dailyLimit) return null

  const currentDailyPnL = stats.dailyPnL || 0
  
  // Calculate percentage used (negative PnL means loss)
  const lossUsed = currentDailyPnL < 0 ? Math.abs(currentDailyPnL) : 0
  const percentage = dailyLimit.amount ? (lossUsed / dailyLimit.amount) * 100 : 0

  return (
    <div className="p-4 border rounded-lg bg-amber-50 border-amber-200">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="h-4 w-4 text-amber-600" />
        <h3 className="font-semibold text-sm">DAILY LOSS LIMIT</h3>
      </div>
      <div className="space-y-2">
        <div className="text-xs text-gray-600">{calculator.getRequirementText('dailyLoss')}</div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">${(dailyLimit.amount! - lossUsed).toLocaleString()}</span>
          <span className="text-sm text-gray-500">/ ${dailyLimit.amount!.toLocaleString()}</span>
        </div>
        <div className="bg-gray-200 rounded-full h-2">
          <div 
            className="bg-amber-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="text-xs text-center font-medium">{Math.min(percentage, 100).toFixed(1)}%</div>
      </div>
    </div>
  )
}

function OverallLossKPI({ calculator, stats }: { 
  calculator: TemplateBasedCalculator
  stats: TradeStats 
}) {
  const overallLimit = calculator.getOverallLossLimit()
  if (!overallLimit) return null

  // Calculate total loss from starting balance (negative netPnL means loss)
  const totalLoss = (stats.netPnL || 0) < 0 ? Math.abs(stats.netPnL || 0) : 0
  const percentage = overallLimit.amount ? (totalLoss / overallLimit.amount) * 100 : 0

  return (
    <div className="p-4 border rounded-lg bg-red-50 border-red-200">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <h3 className="font-semibold text-sm">OVERALL LOSS LIMIT</h3>
      </div>
      <div className="space-y-2">
        <div className="text-xs text-gray-600">{calculator.getRequirementText('overallLoss')}</div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">${(overallLimit.amount! - totalLoss).toLocaleString()}</span>
          <span className="text-sm text-gray-500">/ ${overallLimit.amount!.toLocaleString()}</span>
        </div>
        <div className="bg-gray-200 rounded-full h-2">
          <div 
            className="bg-red-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="text-xs text-center font-medium">{Math.min(percentage, 100).toFixed(1)}%</div>
      </div>
    </div>
  )
}

function ConsistencyRulesKPI({ calculator, stats }: { 
  calculator: TemplateBasedCalculator
  stats: TradeStats 
}) {
  const consistency = calculator.getConsistencyRules()
  if (!consistency?.enabled) return null

  const bestDay = stats.bestDay || 0
  const bestTrade = stats.bestTrade || 0
  const netPnL = stats.netPnL || 0

  // Check consistency requirements
  const meetsConsistency = netPnL >= (bestDay * 2) && netPnL >= (bestTrade * 2)

  return (
    <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${meetsConsistency ? 'bg-green-100' : 'bg-amber-100'}`}>
          {meetsConsistency ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <Clock className="h-4 w-4 text-amber-600" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">CONSISTENCY RULES</h3>
          <p className="text-xs text-gray-600 mb-2">{consistency.description}</p>
          
          {consistency.rules && (
            <ul className="space-y-1 text-xs">
              {consistency.rules.map((rule, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    (index === 0 && netPnL >= bestDay * 2) || 
                    (index === 1 && netPnL >= bestTrade * 2) 
                      ? 'bg-green-500' : 'bg-amber-500'
                  }`} />
                  {rule}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function TradingDaysKPI({ calculator, stats }: { 
  calculator: TemplateBasedCalculator
  stats: TradeStats 
}) {
  const minDays = calculator.getMinimumTradingDays()
  if (!minDays) return null

  const currentDays = stats.tradingDaysCount || 0
  const percentage = (currentDays / minDays.days) * 100

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Target className="h-4 w-4 text-blue-600" />
        <h3 className="font-semibold text-sm">MINIMUM TRADING DAYS</h3>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{minDays.description}</span>
        <Badge variant={currentDays >= minDays.days ? "default" : "secondary"}>
          {currentDays}/{minDays.days} days
        </Badge>
      </div>
      {percentage < 100 && (
        <div className="mt-2 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

function SpecialFeaturesInfo({ calculator }: { 
  calculator: TemplateBasedCalculator 
}) {
  const features = calculator.getSpecialFeatures()
  
  return (
    <div className="p-4 border rounded-lg bg-green-50 border-green-200">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-4 w-4 text-green-600" />
        <h3 className="font-semibold text-sm text-green-800">SPECIAL FEATURES</h3>
      </div>
      <ul className="space-y-1">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-xs text-green-700">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}