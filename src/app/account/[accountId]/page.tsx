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
import DashboardLayout from '@/components/dashboard-layout'
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
  initialBalance: number
  startBalance: number
  currentBalance?: number
  propFirmTemplate?: {
    id: string
    name: string
    accountSize: number
    maxDailyLoss: number
    maxOverallLoss: number
    profitTarget: number
    minTradingDays: number
    maxTradingDays: number
    phase: string
    templateName: string
  }
}

interface TradeStats {
  totalPnL: number
  totalVolume: number
  winRate: number
  winningTrades: number
  losingTrades: number
  closedTrades: number
  openPositions: number
  totalCommission: number
  totalSwap: number
  netPnL: number
}

interface RuleMetrics {
  maxOverallDrawdown: number
  maxDailyLoss: number
  profitTarget: number
  tradingDays: number
  minTradingDays: number
  dailyPnL: number
  isCompliant: boolean
  bestDayActive?: number
  bestDayProjection?: number
  dailyProtectionActiveRequired?: number
  dailyProtectionProjectionRequired?: number
  dailyProtectionActivePassing?: boolean
  dailyProtectionProjectionPassing?: boolean
  dailyOptimalExit?: number
}

export default function AccountDashboard() {
  const params = useParams()
  const router = useRouter()
  const accountId = params.accountId as string
  
  const [account, setAccount] = useState<Account | null>(null)
  const [stats, setStats] = useState<TradeStats | null>(null)
  const [rules, setRules] = useState<RuleMetrics | null>(null)
  const [openTrades, setOpenTrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [openPositionsTotal, setOpenPositionsTotal] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchAccountData = async () => {
    try {
      const [accountRes, statsRes, rulesRes, tradesRes] = await Promise.all([
        fetch(`/api/accounts/${accountId}`),
        fetch(`/api/accounts/${accountId}/stats`),
        fetch(`/api/accounts/${accountId}/rules`),
        fetch(`/api/accounts/${accountId}/trades/open`)
      ])

      // Handle account not found case
      if (accountRes.status === 404) {
        console.log('Account not found:', accountId)
        setAccount(null)
        setLoading(false)
        setRefreshing(false)
        return
      }

      if (accountRes.ok) {
        const accountData = await accountRes.json()
        setAccount(accountData)
      } else {
        console.error('Failed to fetch account:', accountRes.status, accountRes.statusText)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (rulesRes.ok) {
        const rulesData = await rulesRes.json()
        setRules(rulesData)
      }

      if (tradesRes.ok) {
        const tradesData = await tradesRes.json()
        setOpenTrades(tradesData)
        
        const total = tradesData.reduce((sum: number, trade: any) => {
          return sum + (trade.profit || 0)
        }, 0)
        setOpenPositionsTotal(total)
      }

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error fetching account data:', error)
      setAccount(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAccountData()
    
    const interval = setInterval(() => {
      fetchAccountData()
    }, 30000)

    return () => clearInterval(interval)
  }, [accountId])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAccountData()
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-slate-600">Caricamento dati account...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!account) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Account non trovato</h1>
          <p className="text-slate-600">L'account richiesto non esiste o non è accessibile.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Account Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">{account.name}</h1>
            <p className="text-sm text-gray-400">
              {account.broker} ({account.login}) - Live 
              <span className="text-green-400 font-semibold mx-2">• Checking...</span>
              <ConnectionStatus accountId={accountId} />
              <span className="ml-2 text-gray-500">Last sync: {new Date().toLocaleDateString()}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            {account.propFirmTemplate && (
              <Button variant="outline" className="py-2 px-4 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700">
                {account.propFirmTemplate.name}
              </Button>
            )}
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-accent py-2 px-4 rounded-md text-sm font-medium text-white hover:bg-blue-500"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
          </div>
        </header>

        {/* Account Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card border border-card rounded-lg p-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-400">Balance</h3>
              <DollarSign className="h-5 w-5 text-gray-500" />
            </div>
            <p className="text-3xl font-semibold text-white">
              {(() => {
                const currentBalance = account.initialBalance + (stats?.netPnL || 0)
                
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: account.currency || 'USD',
                  minimumFractionDigits: 2
                }).format(currentBalance)
              })()}
            </p>
          </div>

          <div className="bg-card border border-card rounded-lg p-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-400">Equity</h3>
              <TrendingUp className="h-5 w-5 text-gray-500" />
            </div>
            <p className="text-3xl font-semibold text-white">
              {(() => {
                const currentBalance = account.initialBalance + (stats?.netPnL || 0)
                const equity = currentBalance + openPositionsTotal
                
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: account.currency || 'USD',
                  minimumFractionDigits: 2
                }).format(equity)
              })()}
            </p>
          </div>

          <div className="bg-card border border-card rounded-lg p-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-400">Daily P&L</h3>
              <Activity className="h-5 w-5 text-gray-500" />
            </div>
            <p className={`text-3xl font-semibold ${rules?.dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: account.currency || 'USD',
                minimumFractionDigits: 2
              }).format(rules?.dailyPnL || 0)}
            </p>
          </div>

          <div className="bg-card border border-card rounded-lg p-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-400">Win Rate</h3>
              <Target className="h-5 w-5 text-gray-500" />
            </div>
            <p className={`text-3xl font-semibold ${(stats?.winRate || 0) >= 50 ? 'text-green-400' : 'text-orange-400'}`}>
              {stats?.winRate ? stats.winRate.toFixed(1) : '0.0'}%
            </p>
          </div>
        </div>

        {/* PropFirm Rules Section */}
        {account?.propFirmTemplate && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {account.propFirmTemplate.templateName || account.propFirmTemplate.name} - KPI Live
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <DynamicRuleRenderer account={account} stats={stats} />
                )}
              </CardContent>
            </Card>
            
            <SimpleRiskWidget accountId={account.id} />
          </div>
        )}

        {/* Live Operations Section */}
        {openTrades && openTrades.length > 0 && (
          <OpenPositionsSection 
            accountId={accountId}
            openTrades={openTrades}
            account={account}
            onTradesUpdate={() => fetchAccountData()}
          />
        )}

        {/* AI Assistant */}
        <AegisAssistant 
          account={account}
          stats={stats}
          rules={rules}
          openTrades={openTrades}
        />
      </div>
    </DashboardLayout>
  )
}