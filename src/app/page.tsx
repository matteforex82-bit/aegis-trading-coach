'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, List } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Terminal } from '@/components/terminal'
import { RuleCompliancePanel } from '@/components/RuleCompliancePanel'
import Link from 'next/link'

interface Account {
  id: string
  name: string
  login: string
  broker: string
  server: string
  currency: string
  timezone: string
  _count: { trades: number }
}

interface OpenTrade {
  id: string
  ticketId: string
  symbol: string
  side: 'buy' | 'sell'
  volume: number
  openPrice: number
  openTime: string
  currentPnL: number
  comment?: string
}

interface Metrics {
  summary: {
    totalTrades: number
    winningTrades: number
    losingTrades: number
    winRate: number
    totalVolume: number
    totalCommission: number
    totalSwap: number
    totalPnL: number
    accountBalance: number
    currentDrawdown: number
    maxDrawdown: number
    maxDailyLoss: number
    totalMaxLoss: number
  }
  account: {
    id: string
    name: string
    login: string
    broker: string
    server: string
    currency: string
    timezone: string
  }
  openTrades: OpenTrade[]
}

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAccounts()
  }, [])

  useEffect(() => {
    if (selectedAccount) {
      fetchMetrics(selectedAccount.id)
    }
  }, [selectedAccount])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (selectedAccount) {
      const interval = setInterval(() => {
        fetchMetrics(selectedAccount.id)
      }, 30000) // 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [selectedAccount])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      // Ensure data is an array
      const accountsArray = Array.isArray(data) ? data : []
      setAccounts(accountsArray)
      if (accountsArray.length > 0 && !selectedAccount) {
        setSelectedAccount(accountsArray[0])
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
      // Set empty array to avoid map errors
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchMetrics = async (accountId: string) => {
    try {
      const response = await fetch(`/api/accounts/${accountId}/metrics`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      console.error('Error fetching metrics:', error)
      setMetrics(null)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchAccounts()
    if (selectedAccount) {
      await fetchMetrics(selectedAccount.id)
    }
    setRefreshing(false)
  }

  const formatCurrency = (value: number, currency = '$') => {
    return `${currency}${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">PROP CONTROL</h1>
            <Badge variant="secondary">Dashboard</Badge>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Aggiorna</span>
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
            <div className="space-y-2 mb-6">
              {accounts && accounts.length > 0 ? (
                accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => setSelectedAccount(account)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedAccount?.id === account.id
                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                        : 'hover:bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    <div className="font-medium">{account.name || account.broker || 'Account senza nome'}</div>
                    <div className="text-sm text-gray-500">{account.login || 'N/A'}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {account._count?.trades || 0} operazioni
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Nessun account disponibile
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Navigazione</h3>
              <Navigation />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {selectedAccount && metrics ? (
            <>
              {/* Account Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                      {metrics.account?.name || metrics.account?.broker || 'Account'}
                    </h2>
                    <p className="text-gray-600">
                      Account: {selectedAccount.login || 'N/A'} | Broker: {selectedAccount.broker || 'N/A'} | 
                      Server: {selectedAccount.server || 'N/A'}
                    </p>
                  </div>
                  <Link href="/trades">
                    <Button variant="outline">
                      <List className="h-4 w-4 mr-2" />
                      Vedi Operazioni
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Rule Compliance Panel */}
              <div className="mb-8">
                <RuleCompliancePanel 
                  accountId={selectedAccount.id} 
                  autoRefresh={true}
                  refreshInterval={30000}
                />
              </div>

              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">P&L Totale</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${metrics.summary?.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(metrics.summary?.totalPnL || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {metrics.summary?.totalTrades || 0} operazioni
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${(metrics.summary?.winRate || 0) >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(metrics.summary?.winRate || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {metrics.summary?.winningTrades || 0} vincenti / {metrics.summary?.losingTrades || 0} perdenti
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Drawdown Corrente</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${(metrics.summary?.currentDrawdown || 0) <= 5 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(metrics.summary?.currentDrawdown || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Max: {formatPercentage(metrics.summary?.maxDrawdown || 0)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Volume Totale</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {(metrics.summary?.totalVolume || 0).toFixed(2)} lots
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Commission: {formatCurrency(metrics.summary?.totalCommission || 0)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Open Positions Section */}
              {metrics.openTrades && metrics.openTrades.length > 0 && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>🔴 Posizioni Aperte</CardTitle>
                    <CardDescription>
                      Posizioni attualmente attive sul conto
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metrics.openTrades.map((trade) => (
                        <div key={trade.id} className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                          <div className="flex items-center space-x-4">
                            <div>
                              <div className="font-semibold">{trade.symbol}</div>
                              <div className="text-sm text-gray-600">#{trade.ticketId}</div>
                            </div>
                            <Badge variant={trade.side === 'buy' ? 'default' : 'secondary'}>
                              {trade.side === 'buy' ? 'Compra' : 'Vendi'}
                            </Badge>
                            <div className="text-sm">
                              <div>Volume: {trade.volume.toFixed(2)} lots</div>
                              <div>Prezzo: {trade.openPrice.toFixed(5)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              trade.currentPnL >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(trade.currentPnL)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(trade.openTime).toLocaleString('it-IT')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Detailed Metrics */}
              <Tabs defaultValue="rules" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="rules">Regole PropFirm</TabsTrigger>
                  <TabsTrigger value="drawdown">Drawdown</TabsTrigger>
                  <TabsTrigger value="losses">Perdite</TabsTrigger>
                  <TabsTrigger value="volume">Volume</TabsTrigger>
                  <TabsTrigger value="debug">Debug</TabsTrigger>
                </TabsList>

                <TabsContent value="rules" className="space-y-4">
                  <RuleCompliancePanel 
                    accountId={selectedAccount.id} 
                    autoRefresh={false}
                  />
                </TabsContent>

                <TabsContent value="drawdown" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Analisi Drawdown</CardTitle>
                      <CardDescription>
                        Monitoraggio del drawdown e rischio di conto
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Drawdown Corrente</div>
                          <div className={`text-2xl font-bold ${(metrics.summary?.currentDrawdown || 0) <= 5 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(metrics.summary?.currentDrawdown || 0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Max Drawdown</div>
                          <div className="text-2xl font-bold text-red-600">
                            {formatPercentage(metrics.summary?.maxDrawdown || 0)}
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-2">Livello di Rischio</div>
                        <Progress 
                          value={Math.min((metrics.summary?.currentDrawdown || 0) * 10, 100)} 
                          className="h-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="losses" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Analisi Perdite</CardTitle>
                      <CardDescription>
                        Monitoraggio delle perdite giornaliere e massime
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Max Per Giorno</div>
                          <div className={`text-2xl font-bold ${(metrics.summary?.maxDailyLoss || 0) >= -1000 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(metrics.summary?.maxDailyLoss || 0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Max Totale</div>
                          <div className={`text-2xl font-bold ${(metrics.summary?.totalMaxLoss || 0) >= -5000 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(metrics.summary?.totalMaxLoss || 0)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="volume" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Analisi Volume</CardTitle>
                      <CardDescription>
                        Statistiche sul volume di trading e costi
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Volume Totale</div>
                          <div className="text-xl font-bold text-blue-600">
                            {(metrics.summary?.totalVolume || 0).toFixed(2)} lots
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Commissioni</div>
                          <div className="text-xl font-bold text-orange-600">
                            {formatCurrency(metrics.summary?.totalCommission || 0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Swap</div>
                          <div className="text-xl font-bold text-purple-600">
                            {formatCurrency(metrics.summary?.totalSwap || 0)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="debug" className="space-y-4">
                  <Terminal />
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {accounts.length === 0 ? 'Nessun account trovato' : 'Seleziona un account per vedere le metriche'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {accounts.length === 0 ? 'Aggiungi un account MT5 per iniziare a monitorare le performance.' : 'Scegli un account dalla sidebar per visualizzare i dati di trading.'}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}