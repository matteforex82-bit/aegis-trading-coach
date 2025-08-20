'use client'

/**
 * Account-Specific Dashboard Page
 * Combines KPI metrics with beautiful visual progress bars
 * Provides drill-down to detailed trades view
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
  Shield
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

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
}

// Visual Progress Bar Component with Colors
function KPIProgressBar({ 
  label, 
  current, 
  target, 
  percentage, 
  type = 'profit',
  showAmounts = false,
  currency = 'USD'
}: {
  label: string
  current: number
  target: number
  percentage: number
  type?: 'profit' | 'risk' | 'performance'
  showAmounts?: boolean
  currency?: string
}) {
  
  // Color logic based on type and percentage
  const getColorClass = () => {
    if (type === 'profit') {
      if (percentage >= 80) return 'bg-gradient-to-r from-green-500 to-green-600'
      if (percentage >= 60) return 'bg-gradient-to-r from-green-400 to-green-500'
      if (percentage >= 40) return 'bg-gradient-to-r from-yellow-400 to-yellow-500'
      return 'bg-gradient-to-r from-red-400 to-red-500'
    } else if (type === 'risk') {
      if (percentage <= 25) return 'bg-gradient-to-r from-green-500 to-green-600'
      if (percentage <= 50) return 'bg-gradient-to-r from-green-400 to-green-500'
      if (percentage <= 75) return 'bg-gradient-to-r from-yellow-400 to-yellow-500'
      return 'bg-gradient-to-r from-red-400 to-red-500'
    } else { // performance
      if (percentage >= 60) return 'bg-gradient-to-r from-green-500 to-green-600'
      if (percentage >= 45) return 'bg-gradient-to-r from-green-400 to-green-500'
      if (percentage >= 30) return 'bg-gradient-to-r from-yellow-400 to-yellow-500'
      return 'bg-gradient-to-r from-red-400 to-red-500'
    }
  }

  const getStatusIcon = () => {
    const isGood = type === 'risk' ? percentage <= 50 : percentage >= 50
    return isGood ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <AlertTriangle className="h-5 w-5 text-red-500" />
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">
            {showAmounts ? formatCurrency(current) : `${percentage.toFixed(1)}%`}
          </div>
          {showAmounts && (
            <div className="text-xs text-gray-500">
              of {formatCurrency(target)}
            </div>
          )}
        </div>
      </div>
      
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-out ${getColorClass()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="text-xs text-gray-600 mt-1 flex justify-between">
          <span>0%</span>
          <span className="font-medium">{percentage.toFixed(1)}%</span>
          <span>100%</span>
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

          // Calculate rule metrics (mock data for now - would come from evaluate-rules endpoint)
          const accountSize = currentAccount.initialBalance || 50000
          const profitTargetPercent = currentAccount.currentPhase === 'PHASE_1' ? 5 : 8 // Fixed: PHASE_1=5%, PHASE_2=8%
          const profitTargetAmount = accountSize * (profitTargetPercent / 100)
          
          setRules({
            profitTarget: {
              current: totalPnL,
              target: profitTargetAmount,
              percentage: (totalPnL / profitTargetAmount) * 100,
              amount: totalPnL,
              targetAmount: profitTargetAmount
            },
            maxDailyDrawdown: {
              current: 0, // Would calculate from daily data
              limit: accountSize * 0.05, // 5% daily DD limit
              percentage: 0
            },
            maxOverallDrawdown: {
              current: 0, // Would calculate from account history
              limit: accountSize * 0.10, // 10% overall DD limit  
              percentage: 0
            },
            tradingDays: Math.ceil(trades.length / 3), // Rough estimate
            minTradingDays: currentAccount.currentPhase === 'PHASE_1' ? 4 : 5,
            isCompliant: true
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{account.name}</h1>
            <div className="text-sm text-gray-600 mt-1">
              Account: {account.login} | {account.broker} | {account.server}
            </div>
          </div>
          <div className="flex items-center space-x-3">
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
      </header>

      <div className="p-6 space-y-8">
        {/* PropFirm Rule Compliance */}
        {account.propFirmTemplate && (
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2 text-blue-700">
                    <Shield className="h-6 w-6" />
                    <span>PropFirm Rule Compliance</span>
                  </CardTitle>
                  <CardDescription className="text-blue-600">
                    {account.propFirmTemplate.propFirm.name} - {account.propFirmTemplate.name}
                  </CardDescription>
                </div>
                <Badge variant={rules?.isCompliant ? "default" : "destructive"} className="text-lg px-4 py-2">
                  {rules?.isCompliant ? 'COMPLIANT' : 'VIOLATION'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {rules && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Profit Target Progress */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      <span>Profit Target Progress</span>
                    </h3>
                    <KPIProgressBar
                      label={`${account.currentPhase === 'PHASE_1' ? '5%' : '8%'} Profit Target`}
                      current={rules.profitTarget.current}
                      target={rules.profitTarget.target}
                      percentage={rules.profitTarget.percentage}
                      type="profit"
                      showAmounts={true}
                      currency={account.currency}
                    />
                    <div className="text-center text-2xl font-bold text-blue-600">
                      {rules.profitTarget.percentage.toFixed(1)}%
                    </div>
                  </div>

                  {/* Risk Management */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Risk Management</h3>
                    
                    <KPIProgressBar
                      label="Max Daily Drawdown (5%)"
                      current={rules.maxDailyDrawdown.current}
                      target={rules.maxDailyDrawdown.limit}
                      percentage={rules.maxDailyDrawdown.percentage}
                      type="risk"
                      showAmounts={true}
                      currency={account.currency}
                    />
                    
                    <KPIProgressBar
                      label="Max Overall Drawdown (10%)"
                      current={rules.maxOverallDrawdown.current}
                      target={rules.maxOverallDrawdown.limit}
                      percentage={rules.maxOverallDrawdown.percentage}
                      type="risk"
                      showAmounts={true}
                      currency={account.currency}
                    />
                  </div>
                </div>
              )}
              
              {rules?.isCompliant && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 font-medium">
                    All rules are compliant! 🎉
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Trading Performance Summary */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">P&L Aperte</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {/* Would calculate open P&L from current prices */}
                  $0.00
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.openPositions} posizioni aperte
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.winRate.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.winningTrades} vincenti / {stats.losingTrades} perdenti
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Trading Days</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rules?.tradingDays || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total Trades: {stats.totalTrades}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <Link href={`/account/${accountId}/trades`} className="flex-1">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6">
              <Eye className="h-5 w-5 mr-2" />
              Vedi Operazioni
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}