'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface Trade {
  id: string
  ticket: number
  symbol: string
  side: 'buy' | 'sell'
  volume: number
  openPrice: number
  closePrice?: number
  openTime: string
  closeTime?: string
  pnl: number
  commission: number
  swap: number
  comment?: string
  status: 'open' | 'closed'
}

interface Account {
  id: string
  name: string
  login: string
  broker: string
  server: string
  currency: string
}

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      const accountsArray = Array.isArray(data) ? data : []
      setAccounts(accountsArray)
      
      // Use the first (and likely only) real account
      if (accountsArray.length > 0) {
        return accountsArray[0]
      }
      return null
    } catch (error) {
      console.error('Error fetching accounts:', error)
      return null
    }
  }

  const fetchTrades = async (accountId: string) => {
    try {
      const response = await fetch(`/api/accounts/${accountId}/trades?limit=100`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      
      // Filter only CLOSED trades for trades page
      const closedTrades = data.trades?.filter((trade: any) => trade.closeTime) || []
      
      // Transform API data to match our Trade interface
      const transformedTrades = closedTrades.map((trade: any) => ({
        id: trade.id,
        ticket: parseInt(trade.ticketId) || 0,
        symbol: trade.symbol,
        side: trade.side as 'buy' | 'sell',
        volume: trade.volume,
        openPrice: trade.openPrice,
        closePrice: trade.closePrice || undefined,
        openTime: trade.openTime,
        closeTime: trade.closeTime || undefined,
        pnl: (trade.pnlGross || 0) + (trade.swap || 0) + (trade.commission || 0), // Net P&L like MT5
        commission: trade.commission || 0,
        swap: trade.swap || 0,
        comment: trade.comment,
        status: trade.closeTime ? 'closed' : 'open' as 'open' | 'closed'
      })) || []
      
      return transformedTrades
    } catch (error) {
      console.error('Error fetching trades:', error)
      return []
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Fetch accounts first
        const selectedAccount = await fetchAccounts()
        if (selectedAccount) {
          setAccount({
            id: selectedAccount.id,
            name: selectedAccount.name || selectedAccount.broker || 'Trading Account',
            login: selectedAccount.login,
            broker: selectedAccount.broker,
            server: selectedAccount.server,
            currency: selectedAccount.currency
          })
          
          // Fetch trades for this account
          const tradesData = await fetchTrades(selectedAccount.id)
          setTrades(tradesData)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      if (account?.id) {
        const tradesData = await fetchTrades(account.id)
        setTrades(tradesData)
      }
    } catch (error) {
      console.error('Error refreshing trades:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleDebug = async () => {
    if (!account?.id) return
    
    try {
      const response = await fetch(`/api/accounts/${account.id}/debug-trades`)
      const data = await response.json()
      
      if (data.success) {
        console.log('🔍 DEBUG TRADES:', data.debug)
        alert(`Debug Info:\n\nAccount: ${data.debug.account.login} (${data.debug.account.name})\n\nTrade Counts:\n- Total: ${data.debug.tradeCounts.total}\n- Closed: ${data.debug.tradeCounts.closed}\n- Open: ${data.debug.tradeCounts.open}\n\nRecent trades: ${data.debug.recentTrades.length}\n\nCheck console for full details`)
      } else {
        alert('Debug failed: ' + data.error)
      }
    } catch (error) {
      console.error('Debug error:', error)
      alert('Debug request failed')
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
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
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Indietro
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Operazioni</h1>
              <p className="text-sm text-gray-600">
                {account?.name || 'Account'} - {account?.login}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Aggiorna</span>
            </Button>
            <Button
              onClick={handleDebug}
              variant="outline"
              className="flex items-center space-x-2"
            >
              🔍 Debug
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Totale Operazioni</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trades.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Vincenti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {trades.filter(t => t.pnl > 0).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Aperte</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {trades.filter(t => t.status === 'open').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">P&L Netto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                trades.reduce((sum, t) => sum + t.pnl, 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(trades.reduce((sum, t) => sum + t.pnl, 0))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trades Table */}
        <Card>
          <CardHeader>
            <CardTitle>Elenco Operazioni</CardTitle>
            <CardDescription>
              Tutte le operazioni eseguite sul conto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Ticket</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Simbolo</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Lato</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Volume</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Prezzo Apertura</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Prezzo Chiusura</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">P&L</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => (
                    <tr key={trade.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">{trade.ticket}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{trade.symbol}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={trade.side === 'buy' ? 'default' : 'secondary'}>
                          {trade.side === 'buy' ? 'Compra' : 'Vendi'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{trade.volume.toFixed(2)} lots</td>
                      <td className="py-3 px-4 font-mono text-sm">{trade.openPrice.toFixed(5)}</td>
                      <td className="py-3 px-4 font-mono text-sm">
                        {trade.closePrice ? trade.closePrice.toFixed(5) : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${
                          trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(trade.pnl)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={trade.status === 'open' ? 'default' : 'secondary'}>
                          {trade.status === 'open' ? 'Aperta' : 'Chiusa'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}