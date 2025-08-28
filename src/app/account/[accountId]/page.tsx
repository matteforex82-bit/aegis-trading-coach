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
          return sum + (trade.unrealizedPnL || 0)
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
          
          <div className="flex items-center gap-3">
            {account.propFirmTemplate && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {account.propFirmTemplate.name}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {account.propFirmTemplate.phase}
                </Badge>
              </div>
            )}
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Dashboard & Rules
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
              <AlertTriangle className="h-4 w-4" />
              Positions & Risk
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Account Balance */}
              <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-slate-50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-blue-800 text-sm">
                    <DollarSign className="h-4 w-4" />
                    Account Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900 mb-2">
                    {(() => {
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
                </CardContent>
              </Card>

              {/* Current Equity */}
              <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-slate-50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-green-800 text-sm">
                    <Activity className="h-4 w-4" />
                    Current Equity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900 mb-2">
                    {(() => {
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
                </CardContent>
              </Card>

              {/* Daily P&L */}
              <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-slate-50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-orange-800 text-sm">
                    <Target className="h-4 w-4" />
                    Daily P&L
                  </CardTitle>
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
              <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-slate-50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-purple-800 text-sm">
                    <Target className="h-4 w-4" />
                    Win Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold mb-2 ${stats?.winRate >= 50 ? 'text-green-600' : 'text-orange-600'}`}>
                    {stats?.winRate.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* PropFirm Rules Section */}
            {account?.propFirmTemplate && (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-6">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">PropFirm Rules & Compliance</h3>
                  <Badge variant="outline" className="text-xs">
                    {account.propFirmTemplate.templateName || account.propFirmTemplate.name}
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  {/* Main PropFirm Rules - 3 grandi */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Profit Target */}
                    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-slate-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-green-800 text-sm">
                          <Target className="h-4 w-4" />
                          Profit Target
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-lg font-bold text-green-900">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: account.currency || 'USD'
                            }).format(account.propFirmTemplate.profitTarget || 0)}
                          </div>
                          <Progress 
                            value={Math.min(100, Math.max(0, ((stats?.totalPnL || 0) / (account.propFirmTemplate.profitTarget || 1)) * 100))} 
                            className="h-2" 
                          />
                          <div className="text-xs text-gray-600">
                            Progress: {((stats?.totalPnL || 0) / (account.propFirmTemplate.profitTarget || 1) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Max Daily Loss */}
                    <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-slate-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-red-800 text-sm">
                          <AlertTriangle className="h-4 w-4" />
                          Daily Loss Limit
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-lg font-bold text-red-900">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: account.currency || 'USD'
                            }).format(account.propFirmTemplate.maxDailyLoss || 0)}
                          </div>
                          <Progress 
                            value={Math.min(100, Math.max(0, Math.abs((rules?.dailyPnL || 0) / (account.propFirmTemplate.maxDailyLoss || 1)) * 100))} 
                            className="h-2" 
                          />
                          <div className="text-xs text-gray-600">
                            Today: {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: account.currency || 'USD'
                            }).format(rules?.dailyPnL || 0)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Max Overall Loss */}
                    <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-slate-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-orange-800 text-sm">
                          <TrendingDown className="h-4 w-4" />
                          Max Drawdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-lg font-bold text-orange-900">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: account.currency || 'USD'
                            }).format(account.propFirmTemplate.maxOverallLoss || 0)}
                          </div>
                          <Progress 
                            value={Math.min(100, Math.max(0, Math.abs((rules?.maxOverallDrawdown || 0) / (account.propFirmTemplate.maxOverallLoss || 1)) * 100))} 
                            className="h-2" 
                          />
                          <div className="text-xs text-gray-600">
                            Current: {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: account.currency || 'USD'
                            }).format(rules?.maxOverallDrawdown || 0)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Secondary Info - Più piccoli */}
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-800 font-medium">
                        Trading Days: {rules?.tradingDays || 0}/{account.propFirmTemplate.minTradingDays || 0}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                      rules?.isCompliant 
                        ? 'bg-green-50 border-green-200 text-green-800' 
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                      {rules?.isCompliant ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                      <span className="font-medium">
                        {rules?.isCompliant ? 'Compliant' : 'Non-Compliant'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <Shield className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-800 font-medium">
                        Phase: {account.propFirmTemplate.phase || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Live Operations Section */}
             {openTrades && openTrades.length > 0 && (
               <div className="mt-6">
                 <OpenPositionsSection
                   openTrades={openTrades}
                   account={account}
                 />
               </div>
             )}
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <TradingPerformanceMetrics
              account={account}
              stats={stats}
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
                const aegisElement = document.querySelector('.aegis-coach-container');
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
                const aegisElement = document.querySelector('.aegis-coach-container');
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
                  return sum + (trade.unrealizedPnL || 0)
                }, 0)
                setOpenPositionsTotal(total)
              }}
            />
            
            <details className="group">
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                  <h3 className="text-md font-semibold text-slate-700">🛡️ Advanced Risk Manager</h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">Collapsible</Badge>
                  </div>
                </div>
              </summary>
              <div className="mt-4">
                <SimpleRiskWidget
                  account={account}
                  stats={stats}
                  rules={rules}
                  openTrades={openTrades}
                />
              </div>
            </details>
            
            <div className="flex gap-4">
              <Button
                onClick={() => window.open(`/account/${accountId}/trades`, '_blank')}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Vedi Operazioni
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm('Sei sicuro di voler pulire le posizioni live? Questa azione non può essere annullata.')) {
                    // Implement clean live positions logic
                  }
                }}
              >
                🧹 Pulisci Live
              </Button>
</div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}