'use client'

import React from 'react'
import { useProfitTargets } from '@/hooks/useProfitTargets'
import { Target, TrendingUp, AlertTriangle, Shield, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface SeparatedProfitTargetKPIsProps {
  accountId: string
  className?: string
}

export default function SeparatedProfitTargetKPIs({ 
  accountId, 
  className = "" 
}: SeparatedProfitTargetKPIsProps) {
  const { data, loading, error } = useProfitTargets(accountId)

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-4 border rounded-lg animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={`p-4 border rounded-lg bg-red-50 border-red-200 ${className}`}>
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">Errore nel caricamento dei dati</span>
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {/* Profit Target Chiuso */}
      <ProfitTargetClosedKPI data={data} />
      
      {/* Profit Target Flottante (Live) */}
      <ProfitTargetFloatingKPI data={data} />
      
      {/* Daily Loss */}
      <DailyLossKPI data={data} />
      
      {/* Overall Loss */}
      <OverallLossKPI data={data} />
    </div>
  )
}

// Componente per Profit Target Chiuso
function ProfitTargetClosedKPI({ data }: { data: any }) {
  const { closed, profitTargetAmount } = data
  const isPositive = closed.netPnL >= 0
  const progressColor = closed.progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
  
  return (
    <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
      <div className="flex items-center gap-2 mb-2">
        <Target className="h-4 w-4 text-blue-600" />
        <h3 className="font-semibold text-sm text-blue-800">PROFIT TARGET CHIUSO</h3>
      </div>
      <div className="space-y-2">
        <div className="text-xs text-gray-600">
          Solo trade chiusi • {closed.trades} operazioni
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? '+' : ''}${closed.netPnL.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500">/ ${profitTargetAmount.toLocaleString()}</span>
        </div>
        <div className="bg-gray-200 rounded-full h-2">
          <div 
            className={`${progressColor} h-2 rounded-full transition-all`}
            style={{ width: `${Math.min(Math.abs(closed.progress), 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium">{closed.progress.toFixed(1)}%</span>
          <span className="text-xs text-gray-500">
            Rimangono: ${closed.remainingAmount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}

// Componente per Profit Target Flottante (Live)
function ProfitTargetFloatingKPI({ data }: { data: any }) {
  const { floating, profitTargetAmount } = data
  const isPositive = floating.netPnL >= 0
  const progressColor = floating.progress >= 100 ? 'bg-green-500' : 'bg-orange-500'
  
  return (
    <div className="p-4 border rounded-lg bg-orange-50 border-orange-200">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-4 w-4 text-orange-600" />
        <h3 className="font-semibold text-sm text-orange-800">PROFIT TARGET LIVE</h3>
        <Badge variant="outline" className="text-xs px-1 py-0 h-4">
          LIVE
        </Badge>
      </div>
      <div className="space-y-2">
        <div className="text-xs text-gray-600">
          Include {floating.openPositions} posizioni aperte
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? '+' : ''}${floating.netPnL.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500">/ ${profitTargetAmount.toLocaleString()}</span>
        </div>
        <div className="bg-gray-200 rounded-full h-2">
          <div 
            className={`${progressColor} h-2 rounded-full transition-all`}
            style={{ width: `${Math.min(Math.abs(floating.progress), 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium">{floating.progress.toFixed(1)}%</span>
          <span className="text-xs text-gray-500">
            Flottante: ${floating.openNetPnL.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}

// Componente per Daily Loss
function DailyLossKPI({ data }: { data: any }) {
  const { dailyLoss } = data
  const isLoss = dailyLoss.amount < 0
  const progressColor = dailyLoss.progress >= 80 ? 'bg-red-500' : dailyLoss.progress >= 50 ? 'bg-yellow-500' : 'bg-green-500'
  
  return (
    <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-yellow-600" />
        <h3 className="font-semibold text-sm text-yellow-800">DAILY LOSS</h3>
        <Badge variant="outline" className="text-xs px-1 py-0 h-4">
          OGGI
        </Badge>
      </div>
      <div className="space-y-2">
        <div className="text-xs text-gray-600">
          Si azzera a mezzanotte
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${
            isLoss ? 'text-red-600' : 'text-green-600'
          }`}>
            {isLoss ? '' : '+'}${dailyLoss.amount.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500">/ -${dailyLoss.limit.toLocaleString()}</span>
        </div>
        <div className="bg-gray-200 rounded-full h-2">
          <div 
            className={`${progressColor} h-2 rounded-full transition-all`}
            style={{ width: `${Math.min(dailyLoss.progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium">{dailyLoss.progress.toFixed(1)}%</span>
          <span className="text-xs text-gray-500">
            Chiuso: ${dailyLoss.todayClosedPnL.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}

// Componente per Overall Loss
function OverallLossKPI({ data }: { data: any }) {
  const { overallLoss, currentBalance, accountSize } = data
  const progressColor = overallLoss.progress >= 80 ? 'bg-red-500' : overallLoss.progress >= 50 ? 'bg-yellow-500' : 'bg-green-500'
  
  return (
    <div className="p-4 border rounded-lg bg-red-50 border-red-200">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="h-4 w-4 text-red-600" />
        <h3 className="font-semibold text-sm text-red-800">OVERALL LOSS</h3>
      </div>
      <div className="space-y-2">
        <div className="text-xs text-gray-600">
          Balance corrente vs iniziale
        </div>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${
            overallLoss.isInProfit ? 'text-green-600' : 'text-red-600'
          }`}>
            ${currentBalance.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500">/ ${accountSize.toLocaleString()}</span>
        </div>
        
        {!overallLoss.isInProfit && (
          <>
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className={`${progressColor} h-2 rounded-full transition-all`}
                style={{ width: `${Math.min(overallLoss.progress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-red-600">
                -{overallLoss.percent.toFixed(1)}%
              </span>
              <span className="text-xs text-red-500">
                -${overallLoss.amount.toLocaleString()}
              </span>
            </div>
          </>
        )}
        
        {overallLoss.isInProfit && (
          <div className="text-center">
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
              ✅ In Profitto
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}