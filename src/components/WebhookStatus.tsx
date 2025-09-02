'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Wifi, WifiOff, Activity } from 'lucide-react'

interface WebhookEvent {
  id: string
  timestamp: string
  symbol?: string
  price?: number
  event?: string
  data?: any
}

interface WebhookStatusProps {
  className?: string
}

export default function WebhookStatus({ className }: WebhookStatusProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<WebhookEvent | null>(null)
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Verifica lo stato del webhook
  const checkWebhookStatus = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/finnhub-webhook')
      const data = await response.json()
      
      setIsConnected(response.ok)
      console.log('📡 Webhook status:', data)
    } catch (error) {
      console.error('❌ Errore nel verificare webhook:', error)
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Simula eventi webhook per testing (da rimuovere in produzione)
  const simulateWebhookEvent = () => {
    const mockEvent: WebhookEvent = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      symbol: ['AAPL', 'GOOGL', 'MSFT', 'TSLA'][Math.floor(Math.random() * 4)],
      price: Math.random() * 1000 + 100,
      event: 'price_update'
    }

    setLastEvent(mockEvent)
    setEvents(prev => [mockEvent, ...prev.slice(0, 9)]) // Mantieni solo gli ultimi 10 eventi
  }

  useEffect(() => {
    checkWebhookStatus()
    
    // Verifica periodicamente lo stato
    const interval = setInterval(checkWebhookStatus, 30000) // ogni 30 secondi
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={className}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Webhook Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={isConnected ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              {isConnected ? (
                <><Wifi className="h-3 w-3" /> Connesso</>
              ) : (
                <><WifiOff className="h-3 w-3" /> Disconnesso</>
              )}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={checkWebhookStatus}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Ultimo evento */}
            {lastEvent && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium">Ultimo evento</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(lastEvent.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  {lastEvent.symbol && (
                    <div>Symbol: <span className="font-mono">{lastEvent.symbol}</span></div>
                  )}
                  {lastEvent.price && (
                    <div>Price: <span className="font-mono">${lastEvent.price.toFixed(2)}</span></div>
                  )}
                  {lastEvent.event && (
                    <div>Event: <span className="font-mono">{lastEvent.event}</span></div>
                  )}
                </div>
              </div>
            )}

            {/* Lista eventi recenti */}
            {events.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Eventi recenti</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {events.map((event) => (
                    <div key={event.id} className="flex justify-between items-center text-xs p-2 bg-muted/50 rounded">
                      <span className="font-mono">
                        {event.symbol || event.event || 'Unknown'}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pulsante di test */}
            <Button
              variant="outline"
              size="sm"
              onClick={simulateWebhookEvent}
              className="w-full"
            >
              🧪 Simula evento (test)
            </Button>

            {/* Informazioni webhook */}
            <div className="text-xs text-muted-foreground space-y-1">
              <div>URL: <span className="font-mono">/api/finnhub-webhook</span></div>
              <div>Secret: <span className="font-mono">d2r7o31r01qlk22s2hcg</span></div>
              <div>Status: {isConnected ? '✅ Attivo' : '❌ Non attivo'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}