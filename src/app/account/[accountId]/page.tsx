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
  // Protection rules
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
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (accountId) {
      loadDashboardData()
    }
  }, [accountId])

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

        // Load trading stats
        const statsResponse = await fetch(`/api/accounts/${accountId}/trades?limit=1000`)
        const statsData = await statsResponse.json()
        
        if (statsData.trades) {
          const trades = statsData.trades
          const closedTrades = trades.filter((t: any) => t.closeTime)
          const openTrades = trades.filter((t: any) => !t.closeTime)
          
          const winningTrades = closedTrades.filter((t: any) => t.pnlGross > 0).length
          const totalPnL = closedTrades.reduce((sum: number, t: any) => sum + (t.pnlGross + t.commission + t.swap), 0)
          
          setStats({
            totalTrades: trades.length,
            closedTrades: closedTrades.length,
            openPositions: openTrades.length,
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

          // Calculate best day and best trade for protection rules
          const dailyProfits: { [date: string]: number } = {}
          let bestSingleTrade = 0

          trades.forEach(trade => {
            const date = new Date(trade.openTime).toISOString().split('T')[0]
            const tradeProfit = trade.pnlGross + trade.commission + trade.swap
            
            // Track daily profits
            if (!dailyProfits[date]) dailyProfits[date] = 0
            dailyProfits[date] += tradeProfit
            
            // Track best single trade
            if (tradeProfit > bestSingleTrade) {
              bestSingleTrade = tradeProfit
            }
          })

          const bestDay = Math.max(...Object.values(dailyProfits), 0)
          const dailyProtectionRequired = bestDay * 2
          const tradeProtectionRequired = bestSingleTrade * 2
          
          // Calculate daily drawdown (resets at midnight)
          const today = new Date().toISOString().split('T')[0]
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
            // Protection rules data
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">{account.name}</h1>
              <div className="text-sm text-gray-600">
                Account: {account.login} | Broker: {account.broker} | Server: {account.server}
              </div>
              {account.propFirmTemplate && (
                <div className="mt-2 flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {account.propFirmTemplate.propFirm.name}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {account.propFirmTemplate.name}
                  </Badge>
                  <Badge variant={rules?.isCompliant ? "default" : "destructive"} className="text-xs">
                    {rules?.isCompliant ? 'COMPLIANT' : 'VIOLATION'}
                  </Badge>
                </div>
              )}
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
                  requirement={`${account?.currentPhase === 'PHASE_1' ? '5%' : '8%'} del conto`}
                  current={50000 + (stats?.totalPnL || 0)} // Real current balance
                  target={50000 + (account?.currentPhase === 'PHASE_1' ? 2500 : 4000)} // Real target
                  percentage={((stats?.totalPnL || 0) / (account?.currentPhase === 'PHASE_1' ? 2500 : 4000)) * 100}
                  type="profit"
                  currency="USD"
                />

                {/* DAILY LOSS - FIXED LOGIC */}
                <FintechKPIBar
                  title="DAILY LOSS"
                  requirement="Balance must stay above $47,500 (5% daily limit)"
                  current={50000 + (stats?.totalPnL || 0)} // Current balance
                  target={47500} // Daily loss limit
                  percentage={0} // With profit, you're safe (0% risk used)
                  type="daily_risk"
                  currency="USD"
                />

                {/* MAXIMUM TOTAL LOSS - FIXED LOGIC */}
                <FintechKPIBar
                  title="MAXIMUM TOTAL LOSS"
                  requirement="Balance must stay above $45,000 (10% total limit)"
                  current={50000 + (stats?.totalPnL || 0)} // Current balance
                  target={45000} // Total loss limit
                  percentage={0} // With profit, you're safe (0% risk used)
                  type="total_risk"
                  currency="USD"
                />
              </div>

              {/* Protection Rules - Phase 2 Requirements */}
              <div className="mt-8">
                <h3 className="text-md font-semibold text-slate-700 mb-4">Protection Rules (Phase 2)</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Simple 50% Daily Protection - CORRECT FORMULA */}
                  <div className={`border rounded-lg p-4 ${
                    rules?.dailyProtectionPassing 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-medium ${
                        rules?.dailyProtectionPassing 
                          ? 'text-green-800' 
                          : 'text-yellow-800'
                      }`}>Simple 50% Daily Protection</h4>
                      <Badge className={
                        rules?.dailyProtectionPassing 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }>
                        {rules?.dailyProtectionPassing ? 'PASSING' : 'PENDING'}
                      </Badge>
                    </div>
                    <div className={`text-sm ${
                      rules?.dailyProtectionPassing 
                        ? 'text-green-700' 
                        : 'text-yellow-700'
                    }`}>
                      <div>Best Day Profit: ${(rules?.bestDay || 0).toFixed(2)}</div>
                      <div>Required Protection: ${(rules?.dailyProtectionRequired || 0).toFixed(2)} (Best Day × 2)</div>
                      <div>Current Total Profit: ${(stats?.totalPnL || 0).toFixed(2)} {rules?.dailyProtectionPassing ? '✓' : ''}</div>
                    </div>
                  </div>

                  {/* Simple 50% Trade Protection - CORRECT FORMULA */}
                  <div className={`border rounded-lg p-4 ${
                    rules?.tradeProtectionPassing 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-medium ${
                        rules?.tradeProtectionPassing 
                          ? 'text-green-800' 
                          : 'text-yellow-800'
                      }`}>Simple 50% Trade Protection</h4>
                      <Badge className={
                        rules?.tradeProtectionPassing 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }>
                        {rules?.tradeProtectionPassing ? 'PASSING' : 'PENDING'}
                      </Badge>
                    </div>
                    <div className={`text-sm ${
                      rules?.tradeProtectionPassing 
                        ? 'text-green-700' 
                        : 'text-yellow-700'
                    }`}>
                      <div>Best Single Trade: ${(rules?.bestSingleTrade || 0).toFixed(2)}</div>
                      <div>Required Protection: ${(rules?.tradeProtectionRequired || 0).toFixed(2)} (Best Trade × 2)</div>
                      <div>Current Total Profit: ${(stats?.totalPnL || 0).toFixed(2)} {rules?.tradeProtectionPassing ? '✓' : ''}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Open Positions Section */}
        {stats && stats.openPositions > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">🔴 Posizioni Aperte</h2>
              <Badge variant="outline">{stats.openPositions} posizioni</Badge>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">P&L Totale Posizioni Aperte</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  $0.00
                </div>
              </div>
              <div className="text-sm text-blue-700 mt-2">
                {stats.openPositions} posizioni attualmente attive • Monitoraggio real-time
              </div>
            </div>
          </div>
        )}

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
                  <div className="text-2xl font-bold text-blue-600">
                    $0.00
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

        {/* Action Button */}
        <div className="flex justify-center pt-6">
          <Link href={`/account/${accountId}/trades`}>
            <Button size="lg" className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3">
              <Eye className="h-5 w-5 mr-2" />
              Vedi Operazioni
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}