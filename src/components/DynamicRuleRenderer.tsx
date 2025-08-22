'use client'

import React from 'react'
import { PropFirmTemplate, PropFirm } from '@prisma/client'
import { TemplateBasedCalculator } from '@/lib/template-calculator'
import FintechKPIBar from '@/components/FintechKPIBar'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, Clock, Target, Shield, TrendingUp } from 'lucide-react'

interface AccountWithTemplate {
  startBalance: number
  currentBalance?: number  
  currentPhase: string
  propFirmTemplate?: (PropFirmTemplate & {
    propFirm?: PropFirm
  }) | null
}

interface TradeStats {
  totalPnL: number
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
  // Initialize calculator
  const calculator = new TemplateBasedCalculator(
    account.propFirmTemplate || null,
    account.startBalance || 50000,
    account.currentPhase
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

      <div className="grid gap-4">
        {/* Profit Target - Always show if exists */}
        {calculator.hasRule('profit') && (
          <ProfitTargetKPI 
            calculator={calculator} 
            stats={stats} 
          />
        )}

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
  )
}

// Individual KPI Components
function ProfitTargetKPI({ calculator, stats }: { 
  calculator: TemplateBasedCalculator
  stats: TradeStats 
}) {
  const profitTarget = calculator.getProfitTarget()
  if (!profitTarget) return null

  const targetAmount = calculator.getTargetAmount(stats.totalPnL)
  const progress = calculator.getProfitTargetProgress(stats.totalPnL)

  return (
    <FintechKPIBar
      title="PROFIT TARGET"
      requirement={calculator.getRequirementText('profit')}
      current={calculator.getTemplateInfo().accountSize + stats.totalPnL}
      target={targetAmount}
      percentage={Math.min(progress, 100)}
      type="profit"
      currency="USD"
    />
  )
}

function DailyLossKPI({ calculator, stats }: { 
  calculator: TemplateBasedCalculator
  stats: TradeStats 
}) {
  const dailyLimit = calculator.getDailyLossLimit()
  if (!dailyLimit) return null

  const currentDailyPnL = stats.dailyPnL || 0
  const safeCapacity = calculator.getSafeCapacity(stats.totalPnL)
  
  // Calculate percentage used (negative PnL means loss)
  const lossUsed = currentDailyPnL < 0 ? Math.abs(currentDailyPnL) : 0
  const percentage = dailyLimit.amount ? (lossUsed / dailyLimit.amount) * 100 : 0

  return (
    <FintechKPIBar
      title="DAILY LOSS LIMIT"
      requirement={calculator.getRequirementText('dailyLoss')}
      current={dailyLimit.amount! - lossUsed}
      target={dailyLimit.amount!}
      percentage={Math.min(percentage, 100)}
      type="loss"
      currency="USD"
    />
  )
}

function OverallLossKPI({ calculator, stats }: { 
  calculator: TemplateBasedCalculator
  stats: TradeStats 
}) {
  const overallLimit = calculator.getOverallLossLimit()
  if (!overallLimit) return null

  // Calculate total loss from starting balance
  const totalLoss = stats.totalPnL < 0 ? Math.abs(stats.totalPnL) : 0
  const percentage = overallLimit.amount ? (totalLoss / overallLimit.amount) * 100 : 0

  return (
    <FintechKPIBar
      title="OVERALL LOSS LIMIT"
      requirement={calculator.getRequirementText('overallLoss')}
      current={overallLimit.amount! - totalLoss}
      target={overallLimit.amount!}
      percentage={Math.min(percentage, 100)}
      type="loss"
      currency="USD"
    />
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
  const totalPnL = stats.totalPnL || 0

  // Check consistency requirements
  const meetsConsistency = totalPnL >= (bestDay * 2) && totalPnL >= (bestTrade * 2)

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
                    (index === 0 && totalPnL >= bestDay * 2) || 
                    (index === 1 && totalPnL >= bestTrade * 2) 
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