'use client'

/**
 * Account-Specific Dashboard Page - SPECTACULAR VISUAL DESIGN
 * Beautiful animated progress bars with vibrant colors
 * Real-time KPI monitoring with gradient backgrounds
 */

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  Eye,
  ArrowRight,
  Calendar,
  Shield,
  Zap,
  Award,
  Flame,
  Star
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { OpenPositionsSection } from '@/components/OpenPositionsSection'
import ConnectionStatus from '@/components/ConnectionStatus'
import DynamicRuleRenderer from '@/components/DynamicRuleRenderer'
import SimpleRiskWidget from '@/components/SimpleRiskWidget'
import AegisAssistant from '@/components/AegisAssistant'

interface Account {
  id: string
  name: string
  login: string
  broker: string
  server: string
  currency: string
  currentPhase: 'PHASE_1' | 'PHASE_2' | 'FUNDED'
  startBalance?: number
  currentBalance?: number
  propFirmTemplate?: {
    id: string
    name: string
    accountSize: number
    currency: string
    rulesJson: any
    propFirm?: {
      name: string
    }
  }
}

interface TradeStats {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  totalPnL: number
  winRate: number
  totalVolume: number
  openPositions: number
  closedTrades: number
}

interface RuleMetrics {
  profitTarget: {
    current: number
    target: number
    percentage: number
    amount: number
    targetAmount: number
  }
  maxDailyDrawdown: {
    current: number
    limit: number
    percentage: number
  }
  maxOverallDrawdown: {
    current: number
    limit: number
    percentage: number
  }
  tradingDays: number
  minTradingDays: number
  isCompliant: boolean
  
  // Enhanced Protection Rules System
  // Daily Protection
  bestDayActive: number           // Best day from closed trades only
  bestDayProjection: number       // Best day including open positions
  dailyProtectionActiveRequired: number     // Protection based on closed trades
  dailyProtectionProjectionRequired: number // Protection including projections
  dailyProtectionActivePassing: boolean
  dailyProtectionProjectionPassing: boolean
  dailyOptimalExit: number        // Max profit to close today without worsening protection
  
  // Trade Protection  
  bestTradeActive: number         // Best single trade from closed trades only
  bestTradeProjection: number     // Best single trade including open positions
  tradeProtectionActiveRequired: number     // Protection based on closed trades
  tradeProtectionProjectionRequired: number // Protection including projections  
  tradeProtectionActivePassing: boolean
  tradeProtectionProjectionPassing: boolean
  tradeOptimalExit: number        // Max profit to close single trade without worsening protection
  
  // Legacy compatibility (projection values)
  bestDay: number
  bestSingleTrade: number
  dailyProtectionRequired: number
  tradeProtectionRequired: number
  dailyProtectionPassing: boolean
  tradeProtectionPassing: boolean
  
  // 🔧 NEW: Corrected daily P&L (uses closeTime)
  dailyPnL: number
}

// 🏦 PROFESSIONAL FINTECH KPI PROGRESS BAR
function FintechKPIBar({ 
  title,
  requirement,
  current, 
  target, 
  percentage, 
  type = 'profit',
  currency = 'USD'
}: {
  title: string
  requirement: string
  current: number
  target: number
  percentage: number
  type?: 'profit' | 'daily_risk' | 'total_risk'
  currency?: string
}) {
  
  // 🎨 Professional Fintech Colors
  const getProgressColor = () => {
    if (type === 'profit') {
      if (percentage >= 90) return 'bg-green-600'
      if (percentage >= 70) return 'bg-green-500' 
      if (percentage >= 40) return 'bg-yellow-500'
      return 'bg-gray-400'
    } else { // risk types
      if (percentage <= 25) return 'bg-green-500'
      if (percentage <= 50) return 'bg-yellow-500'
      if (percentage <= 75) return 'bg-orange-500'
      return 'bg-red-500'
    }
  }

  const getStatusColor = () => {
    if (type === 'profit') {
      if (percentage >= 90) return 'text-green-600'
      if (percentage >= 70) return 'text-green-600' 
      if (percentage >= 40) return 'text-yellow-600'
      return 'text-gray-600'
    } else { // risk types
      if (percentage <= 25) return 'text-green-600'
      if (percentage <= 50) return 'text-yellow-600'
      if (percentage <= 75) return 'text-orange-600'
      return 'text-red-600'
    }
  }

  const getStatus = () => {
    if (type === 'profit') {
      if (percentage >= 100) return '✓ TARGET RAGGIUNTO'
      if (percentage >= 90) return 'QUASI COMPLETATO'
      if (percentage >= 70) return 'BUON PROGRESSO'
      if (percentage >= 40) return 'IN CORSO'
      return 'INIZIALE'
    } else { // risk types
      if (percentage <= 25) return '✓ SICURO'
      if (percentage <= 50) return '⚠ ATTENZIONE'
      if (percentage <= 75) return '⚠ ALTO RISCHIO'
      return '🚨 CRITICO'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatus()}
          </span>
        </div>
        <p className="text-sm text-gray-600">{requirement}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {formatCurrency(current)}
          </span>
          <span className="text-sm font-medium text-gray-700">
            {formatCurrency(target)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-1000 ease-out ${getProgressColor()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500">0%</span>
          <span className={`text-sm font-bold ${getStatusColor()}`}>
            {percentage.toFixed(1)}%
          </span>
          <span className="text-xs text-gray-500">100%</span>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Attuale</p>
          <p className={`text-lg font-semibold ${getStatusColor()}`}>
            {formatCurrency(current)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Rimanente</p>
          <p className="text-lg font-semibold text-gray-600">
            {formatCurrency(Math.max(0, target - current))}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AccountDashboard() {
  const params = useParams()
  const router = useRouter()
  const accountId = params?.accountId as string

  const [account, setAccount] = useState<Account | null>(null)
  const [stats, setStats] = useState<TradeStats | null>(null)
  const [rules, setRules] = useState<RuleMetrics | null>(null)
  const [openTrades, setOpenTrades] = useState<any[]>([])
  const [openPositionsTotal, setOpenPositionsTotal] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showAdvancedRules, setShowAdvancedRules] = useState(true)

  useEffect(() => {
    if (accountId) {
      loadDashboardData()
    }
  }, [accountId])

  // Auto-detect PropFirm and set default visibility for Advanced Protection Rules
  useEffect(() => {
    if (account?.propFirmTemplate?.propFirm?.name) {
      const propFirmName = account.propFirmTemplate.propFirm.name.toLowerCase()
      
      // Hide Advanced Protection Rules by default for PropFirms that don't use them
      if (propFirmName.includes('futura') || propFirmName.includes('funding')) {
        setShowAdvancedRules(false)
      }
      
      // Load user preference from localStorage
      const savedPreference = localStorage.getItem(`advancedRules_${accountId}`)
      if (savedPreference !== null) {
        setShowAdvancedRules(savedPreference === 'true')
      }
    }
  }, [account, accountId])

  // Save user preference when changed
  const toggleAdvancedRules = () => {
    const newValue = !showAdvancedRules
    setShowAdvancedRules(newValue)
    localStorage.setItem(`advancedRules_${accountId}`, newValue.toString())
  }

  // Auto-refresh for live updates from Expert Advisor
  useEffect(() => {
    if (!accountId) return

    const interval = setInterval(() => {
      // Only refresh if not currently refreshing to avoid conflicts
      if (!refreshing) {
        loadDashboardData()
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [accountId, refreshing])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // TEMPORARY SIMPLIFIED VERSION FOR BUILD TESTING
      // Load account details
      const accountResponse = await fetch(`/api/accounts`)
      const accounts = await accountResponse.json()
      const currentAccount = accounts.find((acc: any) => acc.id === accountId)
      
      if (currentAccount) {
        setAccount({
          id: currentAccount.id,
          name: currentAccount.name,
          login: currentAccount.login,
          broker: currentAccount.broker,
          server: currentAccount.server,
          currency: currentAccount.currency,
          currentPhase: currentAccount.currentPhase,
          initialBalance: currentAccount.initialBalance,
          propFirmTemplate: currentAccount.propFirmTemplate
        })

        // Load trading stats - aumentato il limite per includere tutte le posizioni
        const statsResponse = await fetch(`/api/accounts/${accountId}/trades?limit=5000`)
        const statsData = await statsResponse.json()
        
        if (statsData.trades) {
          const trades = statsData.trades
          const closedTrades = trades.filter((t: any) => t.closeTime)
          const openTradesData = trades.filter((t: any) => !t.closeTime)
          
          console.log('Open trades found:', openTradesData.length)
          console.log('Open trades data:', openTradesData)
          
          // Debug: controlla se XAGUSD.p #162527 è presente
          const xagusdPosition = openTradesData.find(t => t.ticketId === '162527')
          console.log('XAGUSD #162527 trovata:', xagusdPosition ? 'SÌ' : 'NO')
          
          // Debug: mostra tutti i ticketId delle posizioni aperte
          const ticketIds = openTradesData.map(t => `${t.symbol} #${t.ticketId}`)
          console.log('Posizioni trovate:', ticketIds)
          
          // Set open trades data for display
          setOpenTrades(openTradesData)
          
          // Calculate total P&L for open positions
          const openPositionsTotal = openTradesData.reduce((sum: number, t: any) => {
            return sum + t.pnlGross
          }, 0)
          setOpenPositionsTotal(openPositionsTotal)
          
          const winningTrades = closedTrades.filter((t: any) => t.pnlGross > 0).length
          const totalPnL = closedTrades.reduce((sum: number, t: any) => sum + t.pnlGross, 0)
          
          setStats({
            totalTrades: trades.length,
            closedTrades: closedTrades.length,
            openPositions: openTradesData.length,
            winningTrades,
            losingTrades: closedTrades.length - winningTrades,
            totalPnL,
            winRate: closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0,
            totalVolume: trades.reduce((sum: number, t: any) => sum + t.volume, 0)
          })

          // Calculate proper PropFirm metrics
          const accountSize = currentAccount.propFirmTemplate?.accountSize || currentAccount.initialBalance || 50000
          const profitTargetPercent = currentAccount.currentPhase === 'PHASE_1' ? 5 : 8
          const profitTargetAmount = accountSize * (profitTargetPercent / 100)

          // 🚀 ENHANCED PROTECTION RULES CALCULATION
          // Use existing closedTrades and openTradesData variables for accurate calculations
          
          // Calculate ACTIVE protection (closed trades only)
          const dailyProfitsActive: { [date: string]: number } = {}
          let bestTradeActive = 0

          closedTrades.forEach(trade => {
            // 🔧 FIX: Use closeTime instead of openTime for daily grouping
            if (!trade.closeTime) return // Skip if no close time
            
            const closeDate = new Date(trade.closeTime).toISOString().split('T')[0]
            const openDate = new Date(trade.openTime).toISOString().split('T')[0]
            const tradeProfit = trade.pnlGross
            
            // 🔍 DEBUG: Log trades with large profits
            if (Math.abs(tradeProfit) > 500) {
              console.log(`🔍 LARGE TRADE DEBUG:`, {
                ticket: trade.ticketId,
                profit: tradeProfit,
                openDate,
                closeDate,
                openTime: trade.openTime,
                closeTime: trade.closeTime,
                dateDiff: openDate !== closeDate ? 'DIFFERENT_DAYS' : 'SAME_DAY'
              })
            }
            
            // Track daily profits by CLOSE date (not open date)
            if (!dailyProfitsActive[closeDate]) dailyProfitsActive[closeDate] = 0
            dailyProfitsActive[closeDate] += tradeProfit
            
            // Track best single trade (closed only)
            if (tradeProfit > bestTradeActive) {
              bestTradeActive = tradeProfit
            }
          })

          const bestDayActive = Math.max(...Object.values(dailyProfitsActive), 0)
          
          // 🔍 DEBUG: Log daily profits breakdown
          console.log('🔍 DAILY PROFITS BREAKDOWN:', {
            dailyProfitsActive,
            bestDayActive,
            totalDays: Object.keys(dailyProfitsActive).length,
            sortedDays: Object.entries(dailyProfitsActive)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([date, profit]) => ({ date, profit: Math.round(profit * 100) / 100 }))
          })
          
          // Calculate PROJECTION protection (including open trades)
          const dailyProfitsProjection: { [date: string]: number } = { ...dailyProfitsActive }
          let bestTradeProjection = bestTradeActive
          const today = new Date().toISOString().split('T')[0]

          // Add today's open positions to projection
          let todayOpenPnL = 0
          openTradesData.forEach(trade => {
            const tradeProfit = trade.pnlGross
            todayOpenPnL += tradeProfit
            
            // Track best single trade including open positions
            if (tradeProfit > bestTradeProjection) {
              bestTradeProjection = tradeProfit
            }
          })
          
          // Add today's open P&L to daily projection
          if (todayOpenPnL !== 0) {
            if (!dailyProfitsProjection[today]) dailyProfitsProjection[today] = 0
            dailyProfitsProjection[today] += todayOpenPnL
          }

          const bestDayProjection = Math.max(...Object.values(dailyProfitsProjection), 0)
          
          // Calculate protection requirements
          const dailyProtectionActiveRequired = bestDayActive * 2
          const dailyProtectionProjectionRequired = bestDayProjection * 2
          const tradeProtectionActiveRequired = bestTradeActive * 2
          const tradeProtectionProjectionRequired = bestTradeProjection * 2
          
          // Calculate optimal exits (max profit without worsening protection)
          // For daily: how much profit can we make today without exceeding best closed day
          const todayClosedPnL = dailyProfitsActive[today] || 0
          const dailyOptimalExit = Math.max(0, bestDayActive - todayClosedPnL - 0.01)
          
          // For trade: what's the max single trade profit without exceeding best closed trade
          const tradeOptimalExit = Math.max(0, bestTradeActive - 0.01)
          
          // Legacy compatibility
          const bestDay = bestDayProjection
          const bestSingleTrade = bestTradeProjection
          const dailyProtectionRequired = dailyProtectionProjectionRequired
          const tradeProtectionRequired = tradeProtectionProjectionRequired
          
          // Calculate daily drawdown (resets at midnight)
          // Use existing today variable declared above
          const todayClosedTrades = closedTrades.filter(t => {
            if (!t.closeTime) return false
            const closeDate = new Date(t.closeTime).toISOString().split('T')[0]
            return closeDate === today
          })
          const dailyPnL = todayClosedTrades.reduce((sum, t) => sum + t.pnlGross, 0)
          const dailyDrawdownAmount = Math.min(0, dailyPnL) // Only negative values count as drawdown
          const dailyDrawdownLimit = accountSize * 0.05 // 5% limit
          
          // Calculate total drawdown (never resets)
          let runningBalance = accountSize
          let maxBalance = accountSize
          let maxDrawdownAmount = 0
          
          // Sort trades by time to calculate running drawdown
          const sortedTrades = [...trades].sort((a, b) => 
            new Date(a.openTime).getTime() - new Date(b.openTime).getTime()
          )
          
          sortedTrades.forEach(trade => {
            const pnl = trade.pnlGross
            runningBalance += pnl
            if (runningBalance > maxBalance) {
              maxBalance = runningBalance
            }
            const currentDrawdown = maxBalance - runningBalance
            if (currentDrawdown > maxDrawdownAmount) {
              maxDrawdownAmount = currentDrawdown
            }
          })
          
          const totalDrawdownLimit = accountSize * 0.10 // 10% limit
          
          setRules({
            profitTarget: {
              current: totalPnL,
              target: profitTargetAmount,
              percentage: Math.max(0, (totalPnL / profitTargetAmount) * 100),
              amount: totalPnL,
              targetAmount: profitTargetAmount
            },
            maxDailyDrawdown: {
              current: Math.abs(dailyDrawdownAmount),
              limit: dailyDrawdownLimit,
              percentage: Math.abs(dailyDrawdownAmount) / dailyDrawdownLimit * 100
            },
            maxOverallDrawdown: {
              current: maxDrawdownAmount,
              limit: totalDrawdownLimit,
              percentage: (maxDrawdownAmount / totalDrawdownLimit) * 100
            },
            tradingDays: Math.ceil(trades.length / 3),
            minTradingDays: currentAccount.currentPhase === 'PHASE_1' ? 4 : 5,
            isCompliant: totalPnL >= profitTargetAmount && 
                         Math.abs(dailyDrawdownAmount) <= dailyDrawdownLimit && 
                         maxDrawdownAmount <= totalDrawdownLimit,
            // Enhanced Protection Rules Data
            bestDayActive,
            bestDayProjection,
            dailyProtectionActiveRequired,
            dailyProtectionProjectionRequired,
            dailyProtectionActivePassing: totalPnL >= dailyProtectionActiveRequired,
            dailyProtectionProjectionPassing: totalPnL >= dailyProtectionProjectionRequired,
            dailyOptimalExit,
            
            bestTradeActive,
            bestTradeProjection,
            tradeProtectionActiveRequired,
            tradeProtectionProjectionRequired,
            tradeProtectionActivePassing: totalPnL >= tradeProtectionActiveRequired,
            tradeProtectionProjectionPassing: totalPnL >= tradeProtectionProjectionRequired,
            tradeOptimalExit,
            
            // Legacy compatibility (projection values)
            bestDay,
            bestSingleTrade,
            dailyProtectionRequired,
            tradeProtectionRequired,
            dailyProtectionPassing: totalPnL >= dailyProtectionRequired,
            tradeProtectionPassing: totalPnL >= tradeProtectionRequired,
            
            // 🔧 NEW: Add corrected daily P&L for compact cards
            dailyPnL: dailyPnL // Now uses closeTime, not openTime
          })
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento dashboard...</p>
        </div>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Account non trovato</h2>
          <p className="text-gray-600 mb-4">L'account specificato non esiste o non hai i permessi per visualizzarlo.</p>
          <Button onClick={() => router.push('/')}>
            Torna alla Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // 🚀 NEW: Compact Rules Cards Calculation  
  const calculateDailyMargin = () => {
    if (!account?.propFirmTemplate || !stats || !rules) return null

    const accountSize = account.propFirmTemplate.accountSize || 50000
    const currentPhase = account.currentPhase || 'PHASE_1'
    const template = account.propFirmTemplate
    
    // Get daily loss limit from template (default 5% for most PropFirms)
    const dailyLossPercent = template.rulesJson?.dailyLossLimits?.[currentPhase]?.percentage || 5
    const dailyLimit = accountSize * (dailyLossPercent / 100)
    
    // Get today's actual P&L from the corrected calculation (now uses closeTime)
    const dailyPnL = rules.dailyPnL || 0
    
    const currentLoss = Math.max(0, -dailyPnL) // Only negative counts as loss
    const marginRemaining = dailyLimit - currentLoss
    
    return {
      limit: dailyLimit,
      used: currentLoss,
      margin: marginRemaining,
      percentage: (currentLoss / dailyLimit) * 100,
      color: marginRemaining > dailyLimit * 0.5 ? 'green' : marginRemaining > dailyLimit * 0.2 ? 'orange' : 'red'
    }
  }

  const calculateOverallMargin = () => {
    if (!account?.propFirmTemplate || !stats) return null

    const accountSize = account.propFirmTemplate.accountSize || 50000
    const currentPhase = account.currentPhase || 'PHASE_1'
    const template = account.propFirmTemplate
    
    // Get overall loss limit from template (default 10% for most PropFirms)
    const maxLossPercent = template.rulesJson?.overallLossLimits?.[currentPhase]?.percentage || 10
    const maxLossLimit = accountSize * (maxLossPercent / 100)
    const minimumEquity = accountSize - maxLossLimit
    
    const currentBalance = account.currentBalance || accountSize
    const totalPnL = stats.totalPnL || 0
    const currentEquity = accountSize + totalPnL
    
    const marginFromLimit = currentEquity - minimumEquity
    const usedAmount = Math.max(0, accountSize - currentEquity)
    
    return {
      currentEquity,
      minimumAllowed: minimumEquity,
      limit: maxLossLimit,
      used: usedAmount,
      margin: marginFromLimit,
      percentage: (usedAmount / maxLossLimit) * 100,
      color: marginFromLimit > maxLossLimit * 0.5 ? 'green' : marginFromLimit > maxLossLimit * 0.2 ? 'orange' : 'red'
    }
  }

  const calculateProfitTarget = () => {
    if (!account?.propFirmTemplate || !stats) return null

    const accountSize = account.propFirmTemplate.accountSize || 50000
    const currentPhase = account.currentPhase || 'PHASE_1'
    const template = account.propFirmTemplate
    
    // Get profit target from template
    const profitTargetPercent = template.rulesJson?.profitTargets?.[currentPhase]?.percentage || 
                              (currentPhase === 'PHASE_1' ? 8 : 5)
    const targetAmount = accountSize * (profitTargetPercent / 100)
    
    const currentPnL = stats.totalPnL || 0
    const percentage = Math.min(100, Math.max(0, (currentPnL / targetAmount) * 100))
    const remaining = Math.max(0, targetAmount - currentPnL)
    
    return {
      target: targetAmount,
      current: currentPnL,
      percentage,
      remaining,
      color: percentage >= 90 ? 'green' : percentage >= 50 ? 'blue' : 'gray'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // TEMPORANEAMENTE COMMENTATA PER RISOLVERE BUILD ERROR
  // const getCompactRulesCards = () => {
  //   return <div>KPI Cards temporaneamente disabilitate</div>
  // }

  return (
    <DashboardLayout title="Dashboard" subtitle="Account Dashboard">
      <div className="p-6">
        {/* Professional Account Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          {/* First Row: Title and Connection Status */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-slate-800">{account.name || 'Unknown Account'}</h1>
              {/* Safely render ConnectionStatus */}
              <div className="flex items-center">
                <ConnectionStatus />
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Second Row: Account Details and PropFirm Template Badges */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-sm text-gray-600">
                Account: <span className="font-medium">{account.login || 'N/A'}</span> | 
                Broker: <span className="font-medium">{account.broker || 'N/A'}</span> | 
                Server: <span className="font-medium">{account.server || 'N/A'}</span>
              </div>
              
              {account.propFirmTemplate && (
                <div className="flex items-center gap-2">
                  {/* PropFirm Name Badge - only show if propFirm relation exists */}
                  {account.propFirmTemplate.propFirm && (
                    <Badge 
                      variant="secondary" 
                      className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 border-blue-200"
                    >
                      <Award className="h-3 w-3 mr-1" />
                      {account.propFirmTemplate.propFirm.name}
                    </Badge>
                  )}
                  
                  {/* Template Size Badge */}
                  <Badge 
                    variant="outline" 
                    className="px-3 py-1 text-xs font-medium border-green-300 text-green-700 bg-green-50"
                  >
                    <DollarSign className="h-3 w-3 mr-1" />
                    {new Intl.NumberFormat('en-US', { 
                      style: 'currency', 
                      currency: account.propFirmTemplate.currency || 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0 
                    }).format(account.propFirmTemplate.accountSize)}
                  </Badge>
                  
                  {/* Template Name Badge */}
                  <Badge 
                    variant="outline" 
                    className="px-3 py-1 text-xs font-medium border-gray-300 text-gray-700"
                  >
                    {account.propFirmTemplate.name}
                  </Badge>
                  
                  {/* Phase Badge */}
                  <Badge 
                    variant={account.currentPhase === 'FUNDED' ? 'default' : 'secondary'}
                    className={`px-3 py-1 text-xs font-medium ${
                      account.currentPhase === 'FUNDED' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : account.currentPhase === 'PHASE_2'
                        ? 'bg-orange-100 text-orange-800 border-orange-200'
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                    }`}
                  >
                    <Star className="h-3 w-3 mr-1" />
                    {account.currentPhase.replace('_', ' ')}
                  </Badge>
                  
                  {/* Compliance Status Badge */}
                  <Badge 
                    variant={rules?.isCompliant ? "default" : "destructive"} 
                    className={`px-3 py-1 text-xs font-medium ${
                      rules?.isCompliant 
                        ? 'bg-green-500 text-white animate-pulse' 
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {rules?.isCompliant ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 mr-1" />
                    )}
                    {rules?.isCompliant ? 'COMPLIANT' : 'VIOLATION'}
                  </Badge>
                </div>
              )}
              
              {/* Alert when no template is assigned */}
              {!account.propFirmTemplate && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>⚠️ Template non configurato</strong> - <Link href="/settings" className="ml-1 underline font-medium hover:text-red-900">Configura template in Settings</Link>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>

        {/* 🆕 Account Information Overview */}
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-slate-50">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-800 text-sm sm:text-base">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                  Account Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900 mb-2">
                  {(() => {
                    // BALANCE CORRETTO = Starting Balance + P&L di tutte le posizioni CHIUSE
                    const startingBalance = account.propFirmTemplate?.accountSize || account.initialBalance || 50000
                    const closedTradesP_L = stats?.totalPnL || 0
                    const currentBalance = startingBalance + closedTradesP_L
                    
                    return new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: account.currency || 'USD',
                      minimumFractionDigits: 2
                    }).format(currentBalance)
                  })()}
                </div>
                <div className="text-xs sm:text-sm text-blue-600">
                  Starting: {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: account.currency || 'USD',
                    minimumFractionDigits: 0
                  }).format(account.propFirmTemplate?.accountSize || account.initialBalance || 50000)}
                  {stats?.totalPnL && (
                    <span className={`ml-2 ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ({stats.totalPnL >= 0 ? '+' : ''}{new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: account.currency || 'USD',
                        minimumFractionDigits: 0
                      }).format(stats.totalPnL)})
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-slate-50">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-green-800 text-sm sm:text-base">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                  Current Equity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900 mb-2">
                  {(() => {
                    // EQUITY REAL-TIME = Balance corrente + P&L posizioni APERTE
                    const startingBalance = account.propFirmTemplate?.accountSize || account.initialBalance || 50000
                    const closedTradesP_L = stats?.totalPnL || 0
                    const currentBalance = startingBalance + closedTradesP_L
                    const equity = currentBalance + (openPositionsTotal || 0)
                    
                    return new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: account.currency || 'USD',
                      minimumFractionDigits: 2
                    }).format(equity)
                  })()}
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600">
                  <span>P&L Live:</span>
                  <span className={`font-semibold ${openPositionsTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {openPositionsTotal >= 0 ? '+' : ''}{new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: account.currency || 'USD',
                      minimumFractionDigits: 2
                    }).format(openPositionsTotal || 0)}
                  </span>
                  <Badge variant="outline" className="text-xs text-green-700">
                    Real-time
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-slate-50">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-orange-800 text-sm sm:text-base">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                  P&L Daily (Oggi)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-2 ${rules?.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(() => {
                    // P&L DAILY = Solo posizioni chiuse oggi (incluso commissioni + swap)
                    const dailyPnL = rules?.dailyPnL || 0
                    return new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: account.currency || 'USD',
                      minimumFractionDigits: 2
                    }).format(dailyPnL)
                  })()}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-orange-600">
                    <span>Solo trades chiusi oggi</span>
                    <Badge variant="outline" className="text-xs text-orange-700">
                      Reset @ 00:00
                    </Badge>
                  </div>
                  {(() => {
                    // CALCOLO DETTAGLIATO P&L DAILY con breakdown
                    const today = new Date().toISOString().split('T')[0]
                    const dailyPnL = rules?.dailyPnL || 0
                    
                    // TODO: Qui dovrei accedere ai trades per calcolare breakdown reale
                    // Per ora mostro info generale
                    return (
                      <div className="text-xs space-y-1">
                        <div className="text-orange-500">
                          Formula: P&L lordo + commissioni + swap
                        </div>
                        <div className="text-slate-400">
                          Valore attuale: {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: account.currency || 'USD',
                            minimumFractionDigits: 2
                          }).format(dailyPnL)} (se mancano fee, controlla EA sync)
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 🚀 PropFirm Rules Monitor - PRIORITY SECTION */}
        {account && (
          <div className="mb-8 p-6 bg-gradient-to-r from-purple-100 via-indigo-50 to-blue-100 border-2 border-purple-300 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-purple-800 flex items-center gap-3">
                <div className="p-2 bg-purple-600 rounded-lg text-white">
                  <Shield className="h-6 w-6" />
                </div>
                PropFirm Rules Monitor
                <Badge className="bg-purple-600 text-white text-xs">
                  METRICHE FONDAMENTALI
                </Badge>
              </h2>
              <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                Live Updates • {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </Badge>
            </div>
            
            {/* 3 CARD COMPATTE RESPONSIVE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
              
              {/* PROFIT TARGET CARD */}
              {(() => {
                const profitData = calculateProfitTarget()
                if (!profitData) return null
                
                return (
                  <Card className={`border-2 ${profitData.color === 'green' ? 'border-green-300 bg-green-50' : profitData.color === 'blue' ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${profitData.color === 'green' ? 'text-green-700' : profitData.color === 'blue' ? 'text-blue-700' : 'text-gray-700'}`}>
                        <Target className="h-4 w-4" />
                        Profit Target
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-lg font-bold mb-1 ${profitData.color === 'green' ? 'text-green-600' : profitData.color === 'blue' ? 'text-blue-600' : 'text-gray-600'}`}>
                        {profitData.percentage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatCurrency(profitData.current)} / {formatCurrency(profitData.target)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Rimanenti: {formatCurrency(profitData.remaining)}
                      </div>
                    </CardContent>
                  </Card>
                )
              })()}

              {/* DAILY MARGIN CARD */}
              {(() => {
                const dailyData = calculateDailyMargin()
                if (!dailyData) return null
                
                return (
                  <Card className={`border-2 ${dailyData.color === 'green' ? 'border-green-300 bg-green-50' : dailyData.color === 'orange' ? 'border-orange-300 bg-orange-50' : 'border-red-300 bg-red-50'}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${dailyData.color === 'green' ? 'text-green-700' : dailyData.color === 'orange' ? 'text-orange-700' : 'text-red-700'}`}>
                        <Calendar className="h-4 w-4" />
                        Daily Risk
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-lg font-bold mb-1 ${dailyData.color === 'green' ? 'text-green-600' : dailyData.color === 'orange' ? 'text-orange-600' : 'text-red-600'}`}>
                        {dailyData.percentage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">
                        Usato: {formatCurrency(dailyData.used)} / {formatCurrency(dailyData.limit)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Margine: {formatCurrency(dailyData.margin)}
                      </div>
                    </CardContent>
                  </Card>
                )
              })()}

              {/* OVERALL MARGIN CARD */}
              {(() => {
                const overallData = calculateOverallMargin()
                if (!overallData) return null
                
                return (
                  <Card className={`border-2 ${overallData.color === 'green' ? 'border-green-300 bg-green-50' : overallData.color === 'orange' ? 'border-orange-300 bg-orange-50' : 'border-red-300 bg-red-50'}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${overallData.color === 'green' ? 'text-green-700' : overallData.color === 'orange' ? 'text-orange-700' : 'text-red-700'}`}>
                        <Shield className="h-4 w-4" />
                        Overall Risk
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-lg font-bold mb-1 ${overallData.color === 'green' ? 'text-green-600' : overallData.color === 'orange' ? 'text-orange-600' : 'text-red-600'}`}>
                        {overallData.percentage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">
                        Equity: {formatCurrency(overallData.currentEquity)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Min: {formatCurrency(overallData.minimumAllowed)}
                      </div>
                    </CardContent>
                  </Card>
                )
              })()}

            </div>
            
          </div>
        )}

        {/* 🤖 AEGIS AI ASSISTANT */}
        <AegisAssistant 
          account={account}
          stats={stats}
          rules={rules}
          openTrades={openTrades}
        />

        {/* 📊 Trading Performance Summary */}
        {stats && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Trading Performance
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              
              {/* P&L Chiuse TOTALI */}
              <Card className="border border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">P&L Chiuse Totali</CardTitle>
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className={`text-sm sm:text-lg lg:text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: account.currency,
                      minimumFractionDigits: 2
                    }).format(stats.totalPnL)}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">
                    {stats.closedTrades} op.
                  </p>
                </CardContent>
              </Card>

              {/* P&L Aperte */}
              <Card className="border border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">P&L Aperte</CardTitle>
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className={`text-sm sm:text-lg lg:text-2xl font-bold ${openPositionsTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: account.currency,
                      minimumFractionDigits: 2
                    }).format(openPositionsTotal)}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">
                    {stats.openPositions} live
                  </p>
                </CardContent>
              </Card>

              {/* Win Rate */}
              <Card className="border border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">Win Rate</CardTitle>
                  <Target className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className={`text-sm sm:text-lg lg:text-2xl font-bold ${stats.winRate >= 50 ? 'text-green-600' : 'text-orange-600'}`}>
                    {stats.winRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">
                    {stats.winningTrades}W/{stats.losingTrades}L
                  </p>
                </CardContent>
              </Card>

              {/* Total Volume */}
              <Card className="border border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">Volume</CardTitle>
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm sm:text-lg lg:text-2xl font-bold text-blue-600">
                    {stats.totalVolume.toFixed(2)}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">
                    lots
                  </p>
                </CardContent>
              </Card>

              {/* Trading Days */}
              <Card className="border border-slate-200 hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-slate-600">Days</CardTitle>
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-slate-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm sm:text-lg lg:text-2xl font-bold text-purple-600">
                    {rules?.tradingDays || 0}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 sm:mt-1">
                    /{rules?.minTradingDays || 5}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* 🛡️ PropFirm Detailed Rules */}
        {account && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                <Zap className="h-5 w-5 text-slate-500" />
                Regole Dettagliate
              </h2>
              <Badge variant="outline" className="text-xs">
                Advanced
              </Badge>
            </div>

            {/* Toggle button for Advanced Protection Rules */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-slate-700">🛡️ Advanced Protection Rules</h3>
                {account?.propFirmTemplate?.propFirm?.name?.toLowerCase().includes('futura') && (
                  <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                    Non utilizzate da Futura Funding
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAdvancedRules}
                className={`${showAdvancedRules ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-600'}`}
              >
                {showAdvancedRules ? 'Nascondi' : 'Mostra'}
              </Button>
            </div>

            {showAdvancedRules ? (
              <details className="group">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                    <h3 className="text-md font-semibold text-slate-700">📊 Dettagli Calcoli (Phase 2)</h3>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">Optional Details</Badge>
                      <svg className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </summary>
              <div className="mt-4 p-4 bg-gray-50/50 rounded-lg border border-gray-200">
                
                {/* Simple 50% Daily Protection */}
                <div className="mb-8">
                  <h4 className="text-sm font-semibold text-slate-600 mb-4">Simple 50% Daily Protection</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    
                    {/* ACTIVE (Closed Trades) */}
                    <div className={`border rounded-lg p-4 ${
                      rules?.dailyProtectionActivePassing 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-blue-800">ACTIVE (Confirmed)</h5>
                        <Badge className="bg-blue-100 text-blue-800">
                          {rules?.dailyProtectionActivePassing ? 'PASSING' : 'ACTIVE'}
                        </Badge>
                      </div>
                      <div className="text-sm text-blue-700 space-y-1">
                        <div>Best Day (Closed): <span className="font-semibold">${(rules?.bestDayActive || 0).toFixed(2)}</span></div>
                        <div>Protection Required: <span className="font-semibold">${(rules?.dailyProtectionActiveRequired || 0).toFixed(2)}</span></div>
                        <div>Current Total: <span className="font-semibold">${(stats?.totalPnL || 0).toFixed(2)}</span> {rules?.dailyProtectionActivePassing ? '✅' : '⏳'}</div>
                        <div className="pt-2 border-t border-blue-200">
                          <div className="text-xs text-blue-600">💡 Optimal Exit Today: <span className="font-semibold">${rules?.dailyOptimalExit?.toFixed(2)}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* PROJECTION (Including Open Trades) */}
                    <div className={`border rounded-lg p-4 ${
                      rules?.dailyProtectionProjectionPassing 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-yellow-800">PROJECTION (Live Positions)</h5>
                        <Badge className={
                          rules?.dailyProtectionProjectionPassing 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }>
                          {rules?.dailyProtectionProjectionPassing ? 'PASSING' : 'PROJECTED'}
                        </Badge>
                      </div>
                      <div className="text-sm text-yellow-700 space-y-1">
                        <div>Best Day (Projected): <span className="font-semibold">${(rules?.bestDayProjection || 0).toFixed(2)}</span></div>
                        <div>Protection Required: <span className="font-semibold">${(rules?.dailyProtectionProjectionRequired || 0).toFixed(2)}</span></div>
                        <div>Current Total: <span className="font-semibold">${(stats?.totalPnL || 0).toFixed(2)}</span> {rules?.dailyProtectionProjectionPassing ? '✅' : '⚠️'}</div>
                        {(rules?.bestDayProjection || 0) > (rules?.bestDayActive || 0) && (
                          <div className="pt-2 border-t border-yellow-200">
                            <div className="text-xs text-orange-600">⚠️ Today's positions may worsen protection!</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simple 50% Trade Protection */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-600 mb-4">Simple 50% Trade Protection</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    
                    {/* ACTIVE (Closed Trades) */}
                    <div className={`border rounded-lg p-4 ${
                      rules?.tradeProtectionActivePassing 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-blue-800">ACTIVE (Confirmed)</h5>
                        <Badge className="bg-blue-100 text-blue-800">
                          {rules?.tradeProtectionActivePassing ? 'PASSING' : 'ACTIVE'}
                        </Badge>
                      </div>
                      <div className="text-sm text-blue-700 space-y-1">
                        <div>Best Trade (Closed): <span className="font-semibold">${(rules?.bestTradeActive || 0).toFixed(2)}</span></div>
                        <div>Protection Required: <span className="font-semibold">${(rules?.tradeProtectionActiveRequired || 0).toFixed(2)}</span></div>
                        <div>Current Total: <span className="font-semibold">${(stats?.totalPnL || 0).toFixed(2)}</span> {rules?.tradeProtectionActivePassing ? '✅' : '⏳'}</div>
                        <div className="pt-2 border-t border-blue-200">
                          <div className="text-xs text-blue-600">💡 Optimal Exit Per Trade: <span className="font-semibold">${rules?.tradeOptimalExit?.toFixed(2)}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* PROJECTION (Including Open Trades) */}
                    <div className={`border rounded-lg p-4 ${
                      rules?.tradeProtectionProjectionPassing 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-yellow-800">PROJECTION (Live Positions)</h5>
                        <Badge className={
                          rules?.tradeProtectionProjectionPassing 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }>
                          {rules?.tradeProtectionProjectionPassing ? 'PASSING' : 'PROJECTED'}
                        </Badge>
                      </div>
                      <div className="text-sm text-yellow-700 space-y-1">
                        <div>Best Trade (Projected): <span className="font-semibold">${(rules?.bestTradeProjection || 0).toFixed(2)}</span></div>
                        <div>Protection Required: <span className="font-semibold">${(rules?.tradeProtectionProjectionRequired || 0).toFixed(2)}</span></div>
                        <div>Current Total: <span className="font-semibold">${(stats?.totalPnL || 0).toFixed(2)}</span> {rules?.tradeProtectionProjectionPassing ? '✅' : '⚠️'}</div>
                        {(rules?.bestTradeProjection || 0) > (rules?.bestTradeActive || 0) && (
                          <div className="pt-2 border-t border-yellow-200">
                            <div className="text-xs text-orange-600">⚠️ Open position may worsen protection!</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </details>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
              <div className="text-gray-600 mb-2">
                <span className="text-sm">🛡️ Advanced Protection Rules nascoste</span>
              </div>
              <div className="text-xs text-gray-500">
                {account?.propFirmTemplate?.propFirm?.name?.toLowerCase().includes('futura') ? 
                  'Queste regole non si applicano a Futura Funding' : 
                  'Clicca "Mostra" per vedere i calcoli dettagliati'
                }
              </div>
            </div>
          )}

        {/* NEW: Open Positions Section - PRIORITY */}
        <OpenPositionsSection openTrades={openTrades} account={account} />

        {/* Complete Risk Widget - Include posizioni aperte - COLLAPSIBLE */}
        <details className="group">
          <summary className="cursor-pointer list-none">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors mb-4">
              <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                🛡️ Risk Manager Avanzato
              </h3>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">Sezione Avanzata</Badge>
                <svg className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </summary>
          <div className="mt-2">
            <SimpleRiskWidget 
              account={account} 
              rules={rules} 
              stats={stats}
              openTrades={openTrades} 
            />
          </div>
        </details>


        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-6">
          <Link href={`/account/${accountId}/trades`}>
            <Button size="lg" className="bg-slate-800 hover:bg-slate-700 text-white px-6 sm:px-8 py-3 w-full sm:w-auto touch-target">
              <Eye className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Vedi Operazioni
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
            </Button>
          </Link>
          
          <Button 
            size="lg" 
            variant="outline"
            className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 px-4 sm:px-6 py-3 w-full sm:w-auto touch-target"
            onClick={async () => {
              const confirmed = confirm('🧹 ATTENZIONE: Questa operazione cancellerà TUTTE le posizioni live dal database per preparare la sincronizzazione fresca con l\'EA. Procedere?')
              if (confirmed) {
                try {
                  const response = await fetch(`/api/accounts/${accountId}/cleanup-live`, {
                    method: 'POST'
                  })
                  const data = await response.json()
                  
                  if (data.success) {
                    alert(`✅ Pulizia completata! Cancellate ${data.deletedCount} posizioni live. Ora puoi avviare l'EA per la sincronizzazione fresca.`)
                    window.location.reload()
                  } else {
                    alert(`❌ Errore durante la pulizia: ${data.error}`)
                  }
                } catch (error) {
                  alert(`❌ Errore di rete durante la pulizia: ${error}`)
                }
              }
            }}
          >
            🧹 Pulisci Live
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}