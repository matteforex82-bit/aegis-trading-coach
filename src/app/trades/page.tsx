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

  useEffect(() => {
    // In a real app, you would fetch this data from your API
    // For now, we'll use mock data
    const mockTrades: Trade[] = [
      {
        id: '1',
        ticket: 12345,
        symbol: 'EURUSD',
        side: 'buy',
        volume: 0.1,
        openPrice: 1.0850,
        closePrice: 1.0900,
        openTime: '2025-01-15T10:30:00Z',
        closeTime: '2025-01-15T15:45:00Z',
        pnl: 45.0,
        commission: 2.5,
        swap: 0.5,
        comment: 'Trade chiuso a profitto',
        status: 'closed'
      },
      {
        id: '2',
        ticket: 12346,
        symbol: 'GBPUSD',
        side: 'sell',
        volume: 0.2,
        openPrice: 1.2650,
        closePrice: 1.2600,
        openTime: '2025-01-15T11:15:00Z',
        closeTime: '2025-01-15T14:20:00Z',
        pnl: 85.0,
        commission: 3.0,
        swap: -1.2,
        comment: 'Trade chiuso a profitto',
        status: 'closed'
      },
      {
        id: '3',
        ticket: 12347,
        symbol: 'USDJPY',
        side: 'buy',
        volume: 0.05,
        openPrice: 149.50,
        openTime: '2025-01-15T14:00:00Z',
        pnl: -12.5,
        commission: 1.5,
        swap: 0.3,
        status: 'open'
      }
    ]

    const mockAccount: Account = {
      id: '1',
      name: 'Account Demo',
      login: '123456',
      broker: 'MetaQuotes',
      server: 'Demo Server',
      currency: 'USD'
    }

    setTrades(mockTrades)
    setAccount(mockAccount)
    setLoading(false)
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
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