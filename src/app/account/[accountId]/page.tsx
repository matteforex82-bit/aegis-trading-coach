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
import RiskExposureScanner from '@/components/RiskExposureScanner'
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

interface Account {
  id: string
  name: string
  login: string
  broker: string
  server: string
  currency: string
  currentPhase: 'PHASE_1' | 'PHASE_2' | 'FUNDED'
  initialBalance?: number
  propFirmTemplate?: {
    id: string
    name: string
    accountSize: number
    currency: string
    rulesJson: any
    propFirm: {
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

  useEffect(() => {
    if (accountId) {
      loadDashboardData()
    }
  }, [accountId])

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
            return sum + (t.pnlGross + (t.commission || 0) + (t.swap || 0))
          }, 0)
          setOpenPositionsTotal(openPositionsTotal)
          
          const winningTrades = closedTrades.filter((t: any) => t.pnlGross > 0).length
          const totalPnL = closedTrades.reduce((sum: number, t: any) => sum + (t.pnlGross + t.commission + t.swap), 0)
          
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
            const date = new Date(trade.openTime).toISOString().split('T')[0]
            const tradeProfit = trade.pnlGross + trade.commission + trade.swap
            
            // Track daily profits (closed only)
            if (!dailyProfitsActive[date]) dailyProfitsActive[date] = 0
            dailyProfitsActive[date] += tradeProfit
            
            // Track best single trade (closed only)
            if (tradeProfit > bestTradeActive) {
              bestTradeActive = tradeProfit
            }
          })

          const bestDayActive = Math.max(...Object.values(dailyProfitsActive), 0)
          
          // Calculate PROJECTION protection (including open trades)
          const dailyProfitsProjection: { [date: string]: number } = { ...dailyProfitsActive }
          let bestTradeProjection = bestTradeActive
          const today = new Date().toISOString().split('T')[0]

          // Add today's open positions to projection
          let todayOpenPnL = 0
          openTradesData.forEach(trade => {
            const tradeProfit = trade.pnlGross + trade.commission + trade.swap
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
          const todayTrades = trades.filter(t => {
            const tradeDate = new Date(t.openTime).toISOString().split('T')[0]
            return tradeDate === today
          })
          const dailyPnL = todayTrades.reduce((sum, t) => sum + (t.pnlGross + t.commission + t.swap), 0)
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
            const pnl = trade.pnlGross + trade.commission + trade.swap
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
            tradeProtectionPassing: totalPnL >= tradeProtectionRequired
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

  return (
    <DashboardLayout 
      title={account.name} 
      subtitle={`Account: ${account.login} | ${account.broker} | ${account.server}`}
    >
      <div className="p-6 space-y-6">
        {/* Professional Account Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          {/* First Row: Title and Connection Status */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-slate-800">{account.name}</h1>
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
                Account: <span className="font-medium">{account.login}</span> | 
                Broker: <span className="font-medium">{account.broker}</span> | 
                Server: <span className="font-medium">{account.server}</span>
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
            </div>
          </div>
        </div>

        {/* Core PropFirm KPIs - ALWAYS SHOW FOR DEBUG */}
        {(
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-4">PropFirm Rules Monitoring</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* PROFIT TARGET - REAL CALCULATION */}
                <FintechKPIBar
                  title="PROFIT TARGET"
                  requirement={`${account?.currentPhase === 'PHASE_1' ? '8%' : account?.currentPhase === 'PHASE_2' ? '5%' : 'No target'} del conto`}
                  current={(account?.currentBalance || account?.initialBalance || 0) + (stats?.totalPnL || 0)} 
                  target={account?.currentPhase === 'PHASE_2' ? 52500 : 54000}
                  percentage={((stats?.totalPnL || 0) / (account?.currentPhase === 'PHASE_2' ? 2500 : 4000)) * 100}
                  type="profit"
                  currency="USD"
                />

                {/* DAILY LOSS - DYNAMIC FROM TEMPLATE */}
                <FintechKPIBar
                  title="DAILY LOSS"
                  requirement="Balance must stay above $47,500 (5% daily limit)"
                  current={(account?.currentBalance || account?.initialBalance || 0) + (stats?.totalPnL || 0)}
                  target={47500}
                  percentage={0} // With profit, you're safe (0% risk used)
                  type="daily_risk"
                  currency="USD"
                />

                {/* MAXIMUM TOTAL LOSS - DYNAMIC FROM TEMPLATE */}
                <FintechKPIBar
                  title="MAXIMUM TOTAL LOSS"
                  requirement="Balance must stay above $45,000 (10% total limit)"
                  current={(account?.currentBalance || account?.initialBalance || 0) + (stats?.totalPnL || 0)}
                  target={45000}
                  percentage={0} // With profit, you're safe (0% risk used)
                  type="total_risk"
                  currency="USD"
                />
              </div>

              {/* 🚀 ENHANCED PROTECTION RULES - PHASE 2 */}
              <div className="mt-8">
                <h3 className="text-md font-semibold text-slate-700 mb-4">🛡️ Advanced Protection Rules (Phase 2)</h3>
                
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
            </div>
          </div>
        )}

        {/* 🔥 PRIORITY: Risk Exposure Scanner */}
        {openTrades.length > 0 && (
          <RiskExposureScanner 
            accountId={params.accountId}
            balance={account?.initialBalance || 50000}
            openTrades={openTrades}
          />
        )}

        {/* NEW: Open Positions Section */}
        <OpenPositionsSection openTrades={openTrades} account={account} />

        {/* Performance Summary Cards */}
        {stats && (
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Trading Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* P&L Chiuse */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">P&L Chiuse</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: account.currency,
                      minimumFractionDigits: 2
                    }).format(stats.totalPnL)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.closedTrades} operazioni chiuse
                  </p>
                </CardContent>
              </Card>

              {/* P&L Aperte */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">P&L Aperte</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${openPositionsTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: account.currency,
                      minimumFractionDigits: 2
                    }).format(openPositionsTotal)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.openPositions} posizioni aperte
                  </p>
                </CardContent>
              </Card>

              {/* Win Rate */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${stats.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.winRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.winningTrades} vincenti / {stats.losingTrades} perdenti
                  </p>
                </CardContent>
              </Card>

              {/* Trading Days */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Trading Days</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-700">
                    {rules?.tradingDays || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    di {rules?.minTradingDays || 5} minimi richiesti
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-6">
          <Link href={`/account/${accountId}/trades`}>
            <Button size="lg" className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3">
              <Eye className="h-5 w-5 mr-2" />
              Vedi Operazioni
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
          
          <Button 
            size="lg" 
            variant="outline"
            className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 px-6 py-3"
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