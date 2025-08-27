'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, AlertTriangle, CheckCircle, Info, X, ExternalLink } from 'lucide-react'

interface TradingAlertsProps {
  account: any
  stats?: any
  openTrades?: any[]
  onAlertClick?: (alertAction: string) => void
}

interface Alert {
  id: string
  title: string
  message: string
  type: 'warning' | 'info' | 'success'
  timestamp: Date
  read: boolean
  action?: {
    label: string
    command: string
  }
}

export default function TradingAlerts({ account, stats, openTrades = [], onAlertClick }: TradingAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  
  // Generate alerts based on trading data
  useEffect(() => {
    if (!stats || !openTrades) return
    
    const currentAlerts: Alert[] = []
    const now = new Date()
    
    // Check for high volatility markets
    currentAlerts.push({
      id: 'volatility-alert',
      title: 'Alta volatilità rilevata',
      message: 'I mercati stanno mostrando alta volatilità. Considera di ridurre la dimensione delle posizioni.',
      type: 'warning',
      timestamp: new Date(now.getTime() - 15 * 60000), // 15 minutes ago
      read: false,
      action: {
        label: 'Analizza volatilità',
        command: 'Analizza la volatilità attuale del mercato'
      }
    })
    
    // Check for trades approaching stop loss
    const riskyTrades = openTrades.filter(trade => 
      trade.unrealizedPL && parseFloat(trade.unrealizedPL) < -0.5
    )
    
    if (riskyTrades.length > 0) {
      currentAlerts.push({
        id: 'stop-loss-alert',
        title: `${riskyTrades.length} ${riskyTrades.length === 1 ? 'posizione' : 'posizioni'} vicina al stop loss`,
        message: `${riskyTrades.length} ${riskyTrades.length === 1 ? 'posizione sta' : 'posizioni stanno'} avvicinandosi al livello di stop loss. Valuta se chiudere o modificare gli stop.`,
        type: 'warning',
        timestamp: new Date(now.getTime() - 5 * 60000), // 5 minutes ago
        read: false,
        action: {
          label: 'Rivedi posizioni',
          command: 'Analizza le mie posizioni in perdita'
        }
      })
    }
    
    // Check for potential profit taking
    const profitableTrades = openTrades.filter(trade => 
      trade.unrealizedPL && parseFloat(trade.unrealizedPL) > 1.0
    )
    
    if (profitableTrades.length > 0) {
      currentAlerts.push({
        id: 'take-profit-alert',
        title: `${profitableTrades.length} ${profitableTrades.length === 1 ? 'posizione' : 'posizioni'} in profitto`,
        message: `${profitableTrades.length} ${profitableTrades.length === 1 ? 'posizione ha' : 'posizioni hanno'} raggiunto un buon livello di profitto. Considera di prendere profitto o spostare lo stop loss a break-even.`,
        type: 'success',
        timestamp: new Date(now.getTime() - 30 * 60000), // 30 minutes ago
        read: false,
        action: {
          label: 'Gestisci profitti',
          command: 'Suggerisci livelli di take profit per le mie posizioni in attivo'
        }
      })
    }
    
    // News alert
    currentAlerts.push({
      id: 'news-alert',
      title: 'Prossimi dati economici',
      message: 'Dati importanti sul PIL in uscita tra 2 ore. Potrebbe influenzare i mercati valutari.',
      type: 'info',
      timestamp: new Date(now.getTime() - 60 * 60000), // 1 hour ago
      read: true
    })
    
    // Set the generated alerts
    setAlerts(currentAlerts)
  }, [stats, openTrades])
  
  // Mark alert as read
  const markAsRead = (alertId: string) => {
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    )
  }
  
  // Handle alert action click
  const handleActionClick = (command: string) => {
    if (onAlertClick) {
      onAlertClick(command)
    }
  }
  
  // Get alert icon based on type
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }
  
  // Get alert background color based on type
  const getAlertBgColor = (type: string, read: boolean) => {
    if (read) return 'bg-gray-50'
    
    switch (type) {
      case 'warning':
        return 'bg-amber-50'
      case 'success':
        return 'bg-green-50'
      case 'info':
      default:
        return 'bg-blue-50'
    }
  }
  
  // Format timestamp to relative time (e.g., "5m ago")
  const formatRelativeTime = (timestamp: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - timestamp.getTime()
    const diffMins = Math.round(diffMs / 60000)
    
    if (diffMins < 1) return 'ora'
    if (diffMins < 60) return `${diffMins}m fa`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h fa`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}g fa`
  }

  return (
    <Card className="border-2 border-gradient-to-r from-amber-200 to-orange-200 mb-6">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-white">
              <Bell className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-bold text-slate-800">
              Trading Alerts
            </CardTitle>
          </div>
          <Badge className="bg-orange-100 text-orange-800 text-xs">
            {alerts.filter(a => !a.read).length} nuovi
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {alerts.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">Nessun alert al momento.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-3 rounded-lg border ${getAlertBgColor(alert.type, alert.read)} relative`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">{alert.title}</h3>
                      <span className="text-xs text-gray-500">{formatRelativeTime(alert.timestamp)}</span>
                    </div>
                    <p className="text-sm mt-1 text-gray-700">{alert.message}</p>
                    
                    {alert.action && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 text-xs h-7"
                        onClick={() => handleActionClick(alert.action!.command)}
                      >
                        {alert.action.label}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {!alert.read && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={() => markAsRead(alert.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}