'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  RefreshCw, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter,
  Calendar,
  BarChart3,
  DollarSign,
  Activity,
  Eye,
  Download
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'

interface Trade {
  id: string
  ticketId: string
  symbol: string
  side: 'BUY' | 'SELL'
  volume: number
  openPrice: number
  closePrice: number
  openTime: string
  closeTime: string
  pnlGross: number
  commission: number
  swap: number
  comment?: string
}

interface Account {
  id: string
  name: string
  login: string
  broker: string
  currency: string
}

interface TradeStats {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  totalPnL: number
  totalVolume: number
  totalCommission: number
  totalSwap: number
}

export default function AccountTrades() {
  const params = useParams()
  const router = useRouter()
  const accountId = params?.accountId as string

  const [account, setAccount] = useState<Account | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [stats, setStats] = useState<TradeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filtering and search
  const [searchQuery, setSearchQuery] = useState('')
  const [sideFilter, setSideFilter] = useState<string>('all')
  const [symbolFilter, setSymbolFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)

  useEffect(() => {
    if (accountId) {
      loadAccountData()
    }
  }, [accountId])

  const loadAccountData = async () => {
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
          currency: currentAccount.currency
        })

        // Load trades for this account
        const tradesResponse = await fetch(`/api/accounts/${accountId}/trades?limit=1000`)
        const tradesData = await tradesResponse.json()
        
        if (tradesData.trades) {
          const closedTrades = tradesData.trades
            .filter((t: any) => t.closeTime)
            .sort((a: any, b: any) => new Date(b.closeTime).getTime() - new Date(a.closeTime).getTime()) // Più recenti prima
          setTrades(closedTrades)
          
          // Calculate stats
          const winningTrades = closedTrades.filter((t: any) => t.pnlGross > 0).length
          const totalPnL = closedTrades.reduce((sum: number, t: any) => sum + t.pnlGross, 0)
          
          setStats({
            totalTrades: closedTrades.length,
            winningTrades,
            losingTrades: closedTrades.length - winningTrades,
            totalPnL,
            totalVolume: closedTrades.reduce((sum: number, t: any) => sum + t.volume, 0),
            totalCommission: closedTrades.reduce((sum: number, t: any) => sum + (t.commission || 0), 0),
            totalSwap: closedTrades.reduce((sum: number, t: any) => sum + (t.swap || 0), 0)
          })
        }
      }
    } catch (error) {
      console.error('Error loading account data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAccountData()
    setRefreshing(false)
  }

  // Filter and search logic
  const filteredTrades = trades.filter(trade => {
    const matchesSearch = searchQuery === '' || 
      trade.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.ticketId.includes(searchQuery) ||
      trade.comment?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesSide = sideFilter === '' || sideFilter === 'all' || trade.side === sideFilter
    const matchesSymbol = symbolFilter === '' || symbolFilter === 'all' || trade.symbol === symbolFilter
    
    let matchesDate = true
    if (dateFilter) {
      const tradeDate = new Date(trade.openTime).toISOString().split('T')[0]
      matchesDate = tradeDate === dateFilter
    }
    
    return matchesSearch && matchesSide && matchesSymbol && matchesDate
  })

  // Pagination
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage)
  const paginatedTrades = filteredTrades.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Get unique symbols for filter
  const uniqueSymbols = [...new Set(trades.map(t => t.symbol))].sort()

  const formatCurrency = (value: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(value)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT')
  }

  const getTotalPnL = (trade: Trade) => {
    return trade.pnlGross
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento operazioni...</p>
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
      title={`Operazioni - ${account.name}`} 
      subtitle={`Account: ${account.login} | ${account.broker}`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Link href={`/account/${accountId}`}>
            <Button 
              variant="outline" 
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0
                         hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl
                         transform hover:scale-105 transition-all duration-300"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              🏠 Dashboard Account
            </Button>
          </Link>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white
                       hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl
                       transform hover:scale-105 transition-all duration-300"
            size="lg"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            🔄 Refresh
          </Button>
        </div>

        {/* Content continues */}
        <div className="space-y-6">
        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totale Operazioni</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTrades}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.winningTrades} vincenti, {stats.losingTrades} perdenti
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">P&L Totale</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(stats.totalPnL + (stats.totalCommission || 0) + (stats.totalSwap || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.totalPnL + (stats.totalCommission || 0) + (stats.totalSwap || 0), account.currency)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(stats.winningTrades / stats.totalTrades * 100) >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                  {((stats.winningTrades / stats.totalTrades) * 100).toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Volume Totale</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalVolume.toFixed(2)} lots
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtri</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cerca</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Symbol, Ticket, Comment..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select value={sideFilter} onValueChange={setSideFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="BUY">Compra</SelectItem>
                    <SelectItem value="SELL">Vendi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Symbol</label>
                <Select value={symbolFilter} onValueChange={setSymbolFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    {uniqueSymbols.map(symbol => (
                      <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data</label>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Azioni</label>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('')
                    setSideFilter('all')
                    setSymbolFilter('all')
                    setDateFilter('')
                    setCurrentPage(1)
                  }}
                  className="w-full"
                >
                  Reset Filtri
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trades Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span>Operazioni ({filteredTrades.length} di {trades.length})</span>
                <Badge variant="outline" className="text-xs">
                  ⏰ Ordinate per chiusura (più recenti prima)
                </Badge>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  Pagina {currentPage} di {totalPages}
                </span>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    ←
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    →
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paginatedTrades.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna operazione trovata</h3>
                  <p>Prova a modificare i filtri o controlla che ci siano dati nel sistema.</p>
                </div>
              ) : (
                paginatedTrades.map((trade) => {
                  const totalPnL = getTotalPnL(trade)
                  const isProfit = totalPnL >= 0
                  
                  return (
                    <div key={trade.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                        
                        {/* Symbol & Ticket */}
                        <div>
                          <div className="font-semibold text-lg">{trade.symbol}</div>
                          <div className="text-sm text-gray-500">#{trade.ticketId}</div>
                        </div>

                        {/* Side & Volume */}
                        <div>
                          <Badge variant={trade.side === 'BUY' ? 'default' : 'secondary'} className="mb-1">
                            {trade.side === 'BUY' ? 'Compra' : 'Vendi'}
                          </Badge>
                          <div className="text-sm text-gray-600">{trade.volume.toFixed(2)} lots</div>
                        </div>

                        {/* Prices */}
                        <div>
                          <div className="text-sm">
                            <span className="text-gray-500">Open:</span> {trade.openPrice.toFixed(5)}
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">Close:</span> {trade.closePrice.toFixed(5)}
                          </div>
                        </div>

                        {/* P&L Breakdown - ENHANCED */}
                        <div>
                          <div className={`font-bold text-lg ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(totalPnL, account.currency)}
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-gray-600 font-medium">
                              Gross: {formatCurrency(trade.pnlGross, account.currency)}
                            </div>
                            <div className="text-xs text-gray-600 flex justify-between">
                              <span>Comm: {formatCurrency(trade.commission || 0, account.currency)}</span>
                              <span>Swap: {formatCurrency(trade.swap || 0, account.currency)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Timing - CLOSE TIME PROMINENT */}
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center mb-1">
                            <Calendar className="h-4 w-4 mr-1 text-blue-600" />
                            <div>
                              <div className="font-semibold text-slate-700">Chiuso:</div>
                              <div className="text-xs">{formatDateTime(trade.closeTime)}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Aperto: {formatDateTime(trade.openTime)}
                          </div>
                        </div>

                        {/* Comment */}
                        <div className="text-sm text-gray-500">
                          {trade.comment && (
                            <div className="truncate max-w-[150px]" title={trade.comment}>
                              {trade.comment}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}