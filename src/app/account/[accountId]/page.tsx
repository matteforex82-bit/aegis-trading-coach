'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Target, 
  BarChart3, 
  Calendar, 
  Shield, 
  Zap,
  Home,
  Settings,
  TrendingDown,
  Brain,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { OpenPositionsSection } from '@/components/OpenPositionsSection'
import ConnectionStatus from '@/components/ConnectionStatus'
import DynamicRuleRenderer from '@/components/DynamicRuleRenderer'
import SimpleRiskWidget from '@/components/SimpleRiskWidget'
import AegisCoach from '@/components/AegisCoach'
import TradingInsights from '@/components/TradingInsights'
import TradingPerformanceMetrics from '@/components/TradingPerformanceMetrics'
import TradingAlerts from '@/components/TradingAlerts'
import LearningResources from '@/components/LearningResources'
import TradingGoals from '@/components/TradingGoals'

interface Account {
  id: string
  name: string
  broker: string
  accountNumber: string
  currency: string
  initialBalance: number
  startBalance: number
  currentBalance?: number
  currentPhase: string
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

      if (accountRes.ok) {
        const accountData = await accountRes.json()
        setAccount(accountData)
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-slate-800">{account.name}</h1>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>{account.broker}</span>
                <span>•</span>
                <span>{account.accountNumber}</span>
                <ConnectionStatus accountId={accountId} />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {account.propFirmTemplate && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {account.propFirmTemplate.name}
                </Badge>
                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                  {account.propFirmTemplate.phase}
                </Badge>
              </div>
            )}
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="ai-insights" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI & Insights
            </TabsTrigger>
            <TabsTrigger value="positions" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Positions & Risk
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Account Balance */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Balance</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(() => {
                      // Balance = somma algebrica di tutte le posizioni CHIUSE (include commissioni e swap)
                      const currentBalance = account.initialBalance + (stats?.netPnL || 0)
                      
                      return new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: account.currency || 'USD',
                        minimumFractionDigits: 2
                      }).format(currentBalance)
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Current Equity */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Equity</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(() => {
                      // Balance = somma algebrica di tutte le posizioni CHIUSE (netPnL include commissioni e swap)
                      const currentBalance = account.initialBalance + (stats?.netPnL || 0)
                      // Equity = balance + posizioni aperte flottanti
                      const equity = currentBalance + openPositionsTotal
                      
                      return new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: account.currency || 'USD',
                        minimumFractionDigits: 2
                      }).format(equity)
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Daily P&L */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Daily P&L</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold mb-2 ${rules?.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: account.currency || 'USD',
                      minimumFractionDigits: 2
                    }).format(rules?.dailyPnL || 0)}
                  </div>
                </CardContent>
              </Card>

              {/* Win Rate */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold mb-2 ${stats?.winRate >= 50 ? 'text-green-600' : 'text-orange-600'}`}>
                    {stats?.winRate.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* PropFirm Rules Section - Integrazione Position & Risk */}
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
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <TradingPerformanceMetrics 
              account={account}
              stats={stats}
              rules={rules}
            />
          </TabsContent>

          {/* AI & Insights Tab */}
          <TabsContent value="ai-insights" className="space-y-6">
            <AegisCoach 
              account={account}
              stats={stats}
              rules={rules}
              openTrades={openTrades}
            />
            
            <TradingInsights 
              account={account}
              stats={stats}
              openTrades={openTrades}
              onInsightClick={(insight) => {
                const aegisElement = document.getElementById('aegis-coach')
                if (aegisElement) {
                  aegisElement.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            />
            
            <TradingAlerts 
              account={account}
              stats={stats}
              openTrades={openTrades}
              onAlertClick={(alertAction) => {
                const aegisElement = document.getElementById('aegis-coach')
                if (aegisElement) {
                  aegisElement.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            />
            
            <LearningResources 
              account={account}
              stats={stats}
            />
            
            <TradingGoals 
              account={account}
              stats={stats}
            />
          </TabsContent>

          {/* Positions & Risk Tab */}
          <TabsContent value="positions" className="space-y-6">
            <OpenPositionsSection 
              accountId={accountId}
              openTrades={openTrades}
              onTradesUpdate={(trades) => {
                setOpenTrades(trades)
                const total = trades.reduce((sum: number, trade: any) => {
                  return sum + (trade.profit || 0)
                }, 0)
                setOpenPositionsTotal(total)
              }}
            />
            
            <SimpleRiskWidget 
              account={account}
              stats={stats}
              rules={rules}
              openTrades={openTrades}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-start gap-2"
                onClick={() => window.open(`/account/${accountId}/trades`, '_blank')}
              >
                <Calendar className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">View All Trades</div>
                  <div className="text-sm text-muted-foreground">Complete trading history</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto p-4 flex flex-col items-start gap-2"
                onClick={() => {
                  if (confirm('Sei sicuro di voler pulire le posizioni live? Questa azione non può essere annullata.')) {
                    // Handle cleanup
                  }
                }}
              >
                <Zap className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Clean Live Positions</div>
                  <div className="text-sm text-muted-foreground">Reset live trading data</div>
                </div>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}