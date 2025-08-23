'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Activity, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

interface Trade {
  id: string
  ticketId: string
  symbol: string
  side: string
  volume: number
  openPrice: number
  openTime: string
  pnlGross: number
  commission: number
  swap: number
  comment?: string
  sl?: number | null
  tp?: number | null
}

interface OpenPositionsSectionProps {
  openTrades: Trade[]
  account: { currency?: string }
}

export function OpenPositionsSection({ openTrades, account }: OpenPositionsSectionProps) {
  if (!openTrades || openTrades.length === 0) {
    return null
  }

  // Calcoli precisi
  const grossTotal = openTrades.reduce((sum, t) => sum + (t.pnlGross || 0), 0)
  const commissionTotal = openTrades.reduce((sum, t) => sum + (t.commission || 0), 0)  
  const swapTotal = openTrades.reduce((sum, t) => sum + (t.swap || 0), 0)
  const netTotal = grossTotal

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: account?.currency || 'USD',
      minimumFractionDigits: 2
    }).format(amount)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-0">
        <h2 className="text-lg font-semibold text-slate-800">🔴 Posizioni Aperte</h2>
        <Badge variant="outline">{openTrades.length} posizioni</Badge>
      </div>

      {/* Debug Panel */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm">
        <div className="font-medium text-yellow-800 mb-2">🔍 Debug Info:</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-yellow-700">
          <div>📊 Posizioni: {openTrades.length}</div>
          <div className="text-xs sm:text-sm break-all">🎯 Tickets: {openTrades.map(t => `#${t.ticketId}`).slice(0, 3).join(', ')}{openTrades.length > 3 ? '...' : ''}</div>
          <div>⏰ Aggiornato: {new Date().toLocaleTimeString('it-IT')}</div>
          <div>🧮 P&L: {formatCurrency(netTotal)}</div>
        </div>
      </div>

      {/* P&L Summary Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            <span className="text-sm sm:text-base font-semibold text-blue-800">P&L Totale Posizioni</span>
          </div>
          <div className={`text-xl sm:text-2xl font-bold ${netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(netTotal)}
          </div>
        </div>
        
        {/* Breakdown dettagliato */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="text-center p-2 bg-white rounded border">
            <div className="text-gray-600">P&L Lordo</div>
            <div className="font-bold text-green-700 text-xs sm:text-sm">{formatCurrency(grossTotal)}</div>
          </div>
          <div className="text-center p-2 bg-white rounded border">
            <div className="text-gray-600">Commissioni</div>
            <div className="font-bold text-orange-700 text-xs sm:text-sm">{formatCurrency(commissionTotal)}</div>
          </div>
          <div className="text-center p-2 bg-white rounded border">
            <div className="text-gray-600">Swap</div>
            <div className="font-bold text-red-700 text-xs sm:text-sm">{formatCurrency(swapTotal)}</div>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-blue-700 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-blue-200 text-center">
          {openTrades.length} posizioni attive • Real-time EA
        </div>
      </div>

      {/* Individual Position Cards */}
      <div className="space-y-4">
        {openTrades.map((trade, index) => {
          const tradePnL = trade.pnlGross || 0
          const isProfit = tradePnL >= 0
          
          return (
            <div key={trade.id || `position-${index}`} className="border rounded-lg p-3 sm:p-4 bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 items-center">
                
                {/* Symbol & Ticket */}
                <div className="text-center sm:text-left">
                  <div className="font-bold text-base sm:text-lg text-slate-800">{trade.symbol}</div>
                  <div className="text-xs sm:text-sm text-gray-500">#{trade.ticketId}</div>
                </div>

                {/* Direction & Volume */}
                <div className="text-center">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    trade.side?.toLowerCase() === 'buy' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {trade.side?.toLowerCase() === 'buy' ? (
                      <>📈 BUY</>
                    ) : (
                      <>📉 SELL</>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">
                    {trade.volume} lots
                  </div>
                </div>

                {/* Entry Price & Date */}
                <div className="text-center lg:block hidden">
                  <div className="text-xs sm:text-sm text-gray-600">Entry: {trade.openPrice}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(trade.openTime).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: '2-digit', 
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                {/* P&L */}
                <div className="text-center sm:col-span-2 lg:col-span-1">
                  <div className={`text-base sm:text-lg font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(tradePnL)}
                  </div>
                  <div className={`text-xs ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                    {isProfit ? '📈 Profitto' : '📉 Perdita'}
                  </div>
                </div>

                {/* Status */}
                <div className="text-center">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    LIVE
                  </Badge>
                </div>

              </div>

              {/* Details Row (se ci sono commissioni/swap) */}
              {(trade.commission !== 0 || trade.swap !== 0) && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
                    <div>
                      <span>P&L Lordo:</span>
                      <span className="font-medium ml-1">{formatCurrency(trade.pnlGross || 0)}</span>
                    </div>
                    {trade.commission !== 0 && (
                      <div>
                        <span>Commissioni:</span>
                        <span className="font-medium ml-1">{formatCurrency(trade.commission)}</span>
                      </div>
                    )}
                    {trade.swap !== 0 && (
                      <div>
                        <span>Swap:</span>
                        <span className="font-medium ml-1">{formatCurrency(trade.swap)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )
        })}
      </div>
    </div>
  )
}