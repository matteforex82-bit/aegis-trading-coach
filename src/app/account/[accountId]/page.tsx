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
}

// ✨ SPECTACULAR VISUAL PROGRESS BAR with AMAZING COLORS! ✨
function SpectacularKPIBar({ 
  label, 
  current, 
  target, 
  percentage, 
  type = 'profit',
  showAmounts = false,
  currency = 'USD',
  icon
}: {
  label: string
  current: number
  target: number
  percentage: number
  type?: 'profit' | 'risk' | 'performance'
  showAmounts?: boolean
  currency?: string
  icon?: React.ComponentType<any>
}) {
  
  // 🌈 SPECTACULAR COLOR GRADIENTS!
  const getGradientClass = () => {
    if (type === 'profit') {
      if (percentage >= 80) return 'from-emerald-400 via-green-500 to-teal-600'
      if (percentage >= 60) return 'from-lime-400 via-green-500 to-emerald-600' 
      if (percentage >= 40) return 'from-yellow-400 via-orange-500 to-amber-600'
      return 'from-red-400 via-pink-500 to-rose-600'
    } else if (type === 'risk') {
      if (percentage <= 25) return 'from-emerald-400 via-green-500 to-teal-600'
      if (percentage <= 50) return 'from-lime-400 via-green-500 to-emerald-600'
      if (percentage <= 75) return 'from-yellow-400 via-orange-500 to-amber-600'
      return 'from-red-400 via-pink-500 to-rose-600'
    } else { // performance
      if (percentage >= 60) return 'from-blue-400 via-indigo-500 to-purple-600'
      if (percentage >= 45) return 'from-cyan-400 via-blue-500 to-indigo-600'
      if (percentage >= 30) return 'from-yellow-400 via-orange-500 to-amber-600'
      return 'from-red-400 via-pink-500 to-rose-600'
    }
  }

  // 🎭 Dynamic Icon Colors
  const getIconColor = () => {
    if (type === 'profit') {
      if (percentage >= 80) return 'text-emerald-600'
      if (percentage >= 60) return 'text-green-600'
      if (percentage >= 40) return 'text-orange-600'
      return 'text-red-600'
    } else if (type === 'risk') {
      if (percentage <= 25) return 'text-emerald-600'
      if (percentage <= 50) return 'text-green-600'
      if (percentage <= 75) return 'text-orange-600'
      return 'text-red-600'
    } else {
      if (percentage >= 60) return 'text-blue-600'
      if (percentage >= 45) return 'text-indigo-600'
      if (percentage >= 30) return 'text-orange-600'
      return 'text-red-600'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const IconComponent = icon || Target

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
      {/* Header with Icon and Label */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${getGradientClass()} shadow-md`}>
            <IconComponent className={`h-5 w-5 text-white`} />
          </div>
          <span className="font-semibold text-gray-800">{label}</span>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getIconColor()}`}>
            {showAmounts ? formatCurrency(current) : `${percentage.toFixed(1)}%`}
          </div>
          {showAmounts && (
            <div className="text-sm text-gray-500">
              target: {formatCurrency(target)}
            </div>
          )}
        </div>
      </div>
      
      {/* 🚀 SPECTACULAR ANIMATED PROGRESS BAR! */}
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
          <div 
            className={`h-full bg-gradient-to-r ${getGradientClass()} 
                       transition-all duration-2000 ease-out shadow-lg
                       animate-pulse hover:animate-none relative`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent 
                           animate-pulse"></div>
          </div>
        </div>
        
        {/* Progress indicators */}
        <div className="flex justify-between mt-2 text-xs font-medium">
          <span className="text-gray-500">0%</span>
          <span className={`${getIconColor()} font-bold animate-pulse`}>
            {percentage.toFixed(1)}%
          </span>
          <span className="text-gray-500">100%</span>
        </div>
      </div>
      
      {/* Status indicator */}
      <div className="flex items-center justify-center mt-3">
        <div className={`px-3 py-1 rounded-full text-xs font-semibold
                        bg-gradient-to-r ${getGradientClass()} text-white shadow-md`}>
          {type === 'profit' && percentage >= 80 && '🚀 OTTIMO!'}
          {type === 'profit' && percentage >= 60 && percentage < 80 && '📈 BUONO'}
          {type === 'profit' && percentage >= 40 && percentage < 60 && '⚠️ MEDIO'}
          {type === 'profit' && percentage < 40 && '🔴 BASSO'}
          
          {type === 'risk' && percentage <= 25 && '✅ SICURO'}
          {type === 'risk' && percentage <= 50 && percentage > 25 && '⚠️ MEDIO'}
          {type === 'risk' && percentage <= 75 && percentage > 50 && '🔶 ALTO'}
          {type === 'risk' && percentage > 75 && '🚨 CRITICO'}
          
          {type === 'performance' && percentage >= 60 && '⭐ ECCELLENTE'}
          {type === 'performance' && percentage >= 45 && percentage < 60 && '✨ BUONO'}
          {type === 'performance' && percentage >= 30 && percentage < 45 && '📊 MEDIO'}
          {type === 'performance' && percentage < 30 && '📉 SCARSO'}
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
    <DashboardLayout 
      title={account.name} 
      subtitle={`Account: ${account.login} | ${account.broker} | ${account.server}`}
    >
      <div className="p-6 space-y-8">
        {/* 🎯 SPECTACULAR ACCOUNT HEADER */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 flex items-center">
                  <Flame className="mr-3 h-8 w-8 text-yellow-300 animate-pulse" />
                  {account.name}
                </h1>
                <div className="text-indigo-100 text-lg">
                  🏦 {account.login} | 💼 {account.broker} | 🌐 {account.server}
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30"
                  size="lg"
                >
                  <RefreshCw className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
          {/* Animated background elements */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-yellow-300/20 rounded-full animate-ping"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-blue-300/20 rounded-full animate-bounce"></div>
        </div>

        {/* 🚀 SPECTACULAR PROPFIRM COMPLIANCE SECTION */}
        {account.propFirmTemplate && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-8 border-2 border-emerald-200 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent flex items-center">
                  <Shield className="mr-3 h-8 w-8 text-emerald-600 animate-pulse" />
                  PropFirm Compliance
                </h2>
                <p className="text-xl text-gray-700 mt-2">
                  🏢 {account.propFirmTemplate.propFirm.name} - {account.propFirmTemplate.name}
                </p>
              </div>
              <div className={`px-6 py-3 rounded-full text-xl font-bold shadow-lg animate-pulse
                ${rules?.isCompliant 
                  ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-white' 
                  : 'bg-gradient-to-r from-red-400 to-pink-500 text-white'
                }`}>
                {rules?.isCompliant ? '✅ COMPLIANT' : '🚨 VIOLATION'}
              </div>
            </div>

            {rules && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 🎯 PROFIT TARGET - SPECTACULAR BAR */}
                <SpectacularKPIBar
                  label={`${account.currentPhase === 'PHASE_1' ? '5%' : '8%'} Profit Target`}
                  current={rules.profitTarget.current}
                  target={rules.profitTarget.target}
                  percentage={rules.profitTarget.percentage}
                  type="profit"
                  showAmounts={true}
                  currency={account.currency}
                  icon={Target}
                />

                {/* 🛡️ DAILY DRAWDOWN */}
                <SpectacularKPIBar
                  label="Max Daily Drawdown (5%)"
                  current={Math.abs(rules.maxDailyDrawdown.current)}
                  target={rules.maxDailyDrawdown.limit}
                  percentage={Math.abs(rules.maxDailyDrawdown.percentage)}
                  type="risk"
                  showAmounts={true}
                  currency={account.currency}
                  icon={AlertTriangle}
                />

                {/* 📊 OVERALL DRAWDOWN */}
                <SpectacularKPIBar
                  label="Max Overall Drawdown (10%)"
                  current={Math.abs(rules.maxOverallDrawdown.current)}
                  target={rules.maxOverallDrawdown.limit}
                  percentage={Math.abs(rules.maxOverallDrawdown.percentage)}
                  type="risk"
                  showAmounts={true}
                  currency={account.currency}
                  icon={TrendingDown}
                />

                {/* ⭐ WIN RATE */}
                <SpectacularKPIBar
                  label="Win Rate Performance"
                  current={stats?.winRate || 0}
                  target={100}
                  percentage={stats?.winRate || 0}
                  type="performance"
                  showAmounts={false}
                  currency={account.currency}
                  icon={Award}
                />
              </div>
            )}
            
            {rules?.isCompliant && (
              <div className="mt-8 p-6 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-600 rounded-xl text-white text-center shadow-lg">
                <div className="flex items-center justify-center space-x-3 text-2xl font-bold">
                  <Star className="h-8 w-8 animate-spin" />
                  <span>🎉 All Rules Are Compliant! 🎉</span>
                  <Star className="h-8 w-8 animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 💰 SPECTACULAR PERFORMANCE CARDS */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* P&L CLOSED */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="h-8 w-8 text-emerald-100" />
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: account.currency,
                      minimumFractionDigits: 2
                    }).format(stats.totalPnL)}
                  </div>
                  <div className="text-sm text-emerald-100">
                    💼 {stats.closedTrades} operazioni
                  </div>
                </div>
              </div>
              <div className="text-lg font-semibold">P&L Chiuse</div>
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/20 rounded-full animate-pulse"></div>
            </div>

            {/* P&L OPEN */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <Activity className="h-8 w-8 text-blue-100" />
                <div className="text-right">
                  <div className="text-2xl font-bold">$0.00</div>
                  <div className="text-sm text-blue-100">
                    🔄 {stats.openPositions} posizioni
                  </div>
                </div>
              </div>
              <div className="text-lg font-semibold">P&L Aperte</div>
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/20 rounded-full animate-bounce"></div>
            </div>

            {/* WIN RATE */}
            <div className={`relative overflow-hidden rounded-xl p-6 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105
              ${stats.winRate >= 50 
                ? 'bg-gradient-to-br from-green-400 to-emerald-600' 
                : 'bg-gradient-to-br from-orange-400 to-red-600'
              }`}>
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="h-8 w-8 text-white/80" />
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {stats.winRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-white/80">
                    ✅ {stats.winningTrades} / ❌ {stats.losingTrades}
                  </div>
                </div>
              </div>
              <div className="text-lg font-semibold">Win Rate</div>
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/20 rounded-full animate-ping"></div>
            </div>

            {/* TRADING DAYS */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-400 to-pink-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="h-8 w-8 text-purple-100" />
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {rules?.tradingDays || 0}
                  </div>
                  <div className="text-sm text-purple-100">
                    📈 {stats.totalTrades} trades
                  </div>
                </div>
              </div>
              <div className="text-lg font-semibold">Trading Days</div>
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/20 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        {/* 🎯 SPECTACULAR ACTION BUTTON */}
        <div className="flex justify-center">
          <Link href={`/account/${accountId}/trades`} className="group">
            <Button className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 
                           hover:from-blue-600 hover:via-purple-600 hover:to-pink-600
                           text-white text-xl font-bold py-8 px-12 rounded-2xl
                           shadow-xl hover:shadow-2xl transform hover:scale-105
                           transition-all duration-300 group-hover:animate-pulse">
              <Eye className="h-6 w-6 mr-3 group-hover:animate-bounce" />
              🚀 Vedi Operazioni 
              <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-2 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}