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
  winRate: number
  totalVolume: number
  avgWin: number
  avgLoss: number
}

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [account, setAccount] = useState<Account | null>(null)
  const [stats, setStats] = useState<TradeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [sideFilter, setSideFilter] = useState<string>('')
  const [symbolFilter, setSymbolFilter] = useState('')
  const [sortBy, setSortBy] = useState<'openTime' | 'pnl' | 'volume'>('openTime')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Fetch account
      const accountsResponse = await fetch('/api/accounts')
      const accountsData = await accountsResponse.json()
      const selectedAccount = Array.isArray(accountsData) ? accountsData[0] : null
      
      if (selectedAccount) {
        setAccount({
          id: selectedAccount.id,
          name: selectedAccount.name || selectedAccount.broker || 'Trading Account',
          login: selectedAccount.login,
          broker: selectedAccount.broker,
          currency: selectedAccount.currency || 'USD'
        })
        
        // Fetch ALL trades (both open and closed)
        await fetchTrades(selectedAccount.id)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTrades = async (accountId: string) => {
    try {
      const response = await fetch(`/api/accounts/${accountId}/trades?limit=1000`)
      const data = await response.json()
      
      console.log('🔍 RAW TRADES DATA:', data.trades?.length || 0)
      
      // Transform and include ALL trades - both open and closed
      const allTrades = (data.trades || []).map((trade: any) => ({
        id: trade.id,
        ticketId: trade.ticketId,
        symbol: trade.symbol,
        side: trade.side,
        volume: trade.volume,
        openPrice: trade.openPrice,
        closePrice: trade.closePrice || 0,
        openTime: trade.openTime,
        closeTime: trade.closeTime,
        pnlGross: trade.pnlGross || 0,
        commission: trade.commission || 0,
        swap: trade.swap || 0,
        comment: trade.comment || ''
      }))

      console.log('🔍 PROCESSED TRADES:', allTrades.length)
      console.log('🔍 Sample trade:', allTrades[0])

      setTrades(allTrades)
      calculateStats(allTrades)

    } catch (error) {
      console.error('Error fetching trades:', error)
      setTrades([])
      setStats(null)
    }
  }

  const calculateStats = (tradesData: Trade[]) => {
    if (tradesData.length === 0) {
      setStats(null)
      return
    }

    // Separate closed and open trades
    const closedTrades = tradesData.filter(t => t.closeTime)
    const openTrades = tradesData.filter(t => !t.closeTime)

    console.log(`📊 STATS: Total: ${tradesData.length}, Closed: ${closedTrades.length}, Open: ${openTrades.length}`)

    const winningTrades = closedTrades.filter(t => t.pnlGross > 0).length
    const losingTrades = closedTrades.filter(t => t.pnlGross < 0).length
    const totalPnL = closedTrades.reduce((sum, t) => sum + t.pnlGross + t.commission + t.swap, 0)
    const totalVolume = tradesData.reduce((sum, t) => sum + t.volume, 0)

    const wins = closedTrades.filter(t => t.pnlGross > 0)
    const losses = closedTrades.filter(t => t.pnlGross < 0)
    
    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnlGross, 0) / wins.length : 0
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.pnlGross, 0) / losses.length) : 0

    setStats({
      totalTrades: tradesData.length,
      winningTrades,
      losingTrades,
      totalPnL,
      winRate: closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0,
      totalVolume,
      avgWin,
      avgLoss
    })
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    if (account?.id) {
      await fetchTrades(account.id)
    }
    setRefreshing(false)
  }

  const handleDebug = async () => {
    if (!account?.id) return
    
    try {
      const response = await fetch(`/api/accounts/${account.id}/debug-trades`)
      const data = await response.json()
      
      if (data.success) {
        console.log('🔍 DEBUG TRADES:', data.debug)
        alert(`Debug Info:\n\nAccount: ${data.debug.account.login} (${data.debug.account.name})\n\nDatabase Counts:\n- Total: ${data.debug.tradeCounts.total}\n- Closed: ${data.debug.tradeCounts.closed}\n- Open: ${data.debug.tradeCounts.open}\n\nRecent trades: ${data.debug.recentTrades.length}\n\nCheck console for details`)
      } else {
        alert('Debug failed: ' + data.error)
      }
    } catch (error) {
      console.error('Debug error:', error)
      alert('Debug request failed')
    }
  }

  // Filter and sort trades
  const filteredTrades = trades
    .filter(trade => {
      const matchesSearch = 
        trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (trade.comment || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesSide = !sideFilter || trade.side === sideFilter
      const matchesSymbol = !symbolFilter || trade.symbol === symbolFilter

      return matchesSearch && matchesSide && matchesSymbol
    })
    .sort((a, b) => {
      const aVal = sortBy === 'openTime' ? new Date(a.openTime).getTime() :
                   sortBy === 'pnl' ? a.pnlGross :
                   a.volume
      const bVal = sortBy === 'openTime' ? new Date(b.openTime).getTime() :
                   sortBy === 'pnl' ? b.pnlGross :
                   b.volume
      
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })

  const formatCurrency = (value: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUniqueSymbols = () => {
    const symbols = [...new Set(trades.map(t => t.symbol))].sort()
    return symbols
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trading History</h1>
              <p className="text-gray-600">
                {account?.name} - {account?.login}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
            <Button
              onClick={handleDebug}
              variant="outline"
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              Debug
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Operazioni Totali</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTrades}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.winningTrades}W / {stats.losingTrades}L
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Tasso di successo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">P&L Totale</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.totalPnL, account?.currency)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Profitto netto
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Volume Totale</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVolume.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Lotti scambiati
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtri e Ricerca</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cerca simbolo, ticket..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={sideFilter} onValueChange={setSideFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tutti i lati" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tutti i lati</SelectItem>
                  <SelectItem value="BUY">Buy</SelectItem>
                  <SelectItem value="SELL">Sell</SelectItem>
                </SelectContent>
              </Select>

              <Select value={symbolFilter} onValueChange={setSymbolFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tutti i simboli" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tutti i simboli</SelectItem>
                  {getUniqueSymbols().map(symbol => (
                    <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordina per" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openTime">Data</SelectItem>
                  <SelectItem value="pnl">P&L</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Decrescente</SelectItem>
                  <SelectItem value="asc">Crescente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Mostrando {filteredTrades.length} di {trades.length} operazioni</span>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Esporta CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trades Table */}
        <Card>
          <CardHeader>
            <CardTitle>Elenco Operazioni</CardTitle>
            <CardDescription>
              Tutte le operazioni eseguite sul conto
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-900">Ticket</th>
                    <th className="text-left p-4 font-medium text-gray-900">Simbolo</th>
                    <th className="text-left p-4 font-medium text-gray-900">Lato</th>
                    <th className="text-right p-4 font-medium text-gray-900">Volume</th>
                    <th className="text-right p-4 font-medium text-gray-900">Prezzo Apertura</th>
                    <th className="text-right p-4 font-medium text-gray-900">Prezzo Chiusura</th>
                    <th className="text-left p-4 font-medium text-gray-900">Data Apertura</th>
                    <th className="text-left p-4 font-medium text-gray-900">Data Chiusura</th>
                    <th className="text-right p-4 font-medium text-gray-900">P&L</th>
                    <th className="text-center p-4 font-medium text-gray-900">Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrades.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center p-8 text-gray-500">
                        Nessuna operazione trovata
                      </td>
                    </tr>
                  ) : (
                    filteredTrades.map((trade) => (
                      <tr key={trade.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="font-medium text-gray-900">{trade.ticketId}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-blue-600">{trade.symbol}</div>
                        </td>
                        <td className="p-4">
                          <Badge variant={trade.side === 'BUY' ? 'default' : 'secondary'}>
                            {trade.side === 'BUY' ? (
                              <>
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Buy
                              </>
                            ) : (
                              <>
                                <TrendingDown className="h-3 w-3 mr-1" />
                                Sell
                              </>
                            )}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-medium">{trade.volume.toFixed(2)}</span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-mono text-sm">{trade.openPrice.toFixed(5)}</span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-mono text-sm">
                            {trade.closePrice > 0 ? trade.closePrice.toFixed(5) : '-'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-gray-600">
                            {formatDateTime(trade.openTime)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-gray-600">
                            {trade.closeTime ? formatDateTime(trade.closeTime) : '-'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className={`font-semibold ${
                            trade.pnlGross >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(trade.pnlGross + trade.commission + trade.swap, account?.currency)}
                          </span>
                          {(trade.commission !== 0 || trade.swap !== 0) && (
                            <div className="text-xs text-gray-400">
                              C: {formatCurrency(trade.commission)} | S: {formatCurrency(trade.swap)}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant={trade.closeTime ? 'outline' : 'default'}>
                            {trade.closeTime ? 'Chiusa' : 'Aperta'}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}