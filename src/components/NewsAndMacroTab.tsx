'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import WebhookStatus from '@/components/WebhookStatus'
import { 
  Calendar, 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  RefreshCw,
  Filter,
  AlertCircle,
  Activity
} from 'lucide-react'

interface EconomicEvent {
  country: string
  event: string
  impact: string
  date: string
  time: string
  actual: string | null
  estimate: string | null
  previous: string | null
}

interface NewsAndMacroTabProps {
  accountId?: string
}

export function NewsAndMacroTab({ accountId }: NewsAndMacroTabProps) {
  const [events, setEvents] = useState<EconomicEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  
  // Filtri
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [selectedImpact, setSelectedImpact] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<string>('week')

  // Fetch economic calendar data
  const fetchEconomicData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const today = new Date()
      const from = today.toISOString().split('T')[0]
      
      let to: string
      switch (timeRange) {
        case 'today':
          to = from
          break
        case 'week':
          const weekLater = new Date(today)
          weekLater.setDate(weekLater.getDate() + 7)
          to = weekLater.toISOString().split('T')[0]
          break
        case 'month':
          const monthLater = new Date(today)
          monthLater.setMonth(monthLater.getMonth() + 1)
          to = monthLater.toISOString().split('T')[0]
          break
        default:
          to = from
      }
      
      // Simuliamo alcuni eventi economici di esempio per la demo
      // In produzione, questo richiederebbe un piano Finnhub a pagamento
      const mockEvents: EconomicEvent[] = [
        {
          country: 'US',
          event: 'Non-Farm Payrolls',
          impact: 'high',
          date: new Date().toISOString().split('T')[0],
          time: '14:30',
          actual: null,
          estimate: '200K',
          previous: '187K'
        },
        {
          country: 'EU',
          event: 'ECB Interest Rate Decision',
          impact: 'high',
          date: new Date().toISOString().split('T')[0],
          time: '13:45',
          actual: null,
          estimate: '4.25%',
          previous: '4.25%'
        },
        {
          country: 'GB',
          event: 'GDP Growth Rate',
          impact: 'medium',
          date: new Date().toISOString().split('T')[0],
          time: '09:30',
          actual: null,
          estimate: '0.2%',
          previous: '0.1%'
        }
      ]
      
      setEvents(mockEvents)
      setLastUpdate(new Date())
      setError('Nota: Stai visualizzando dati di esempio. Il calendario economico completo richiede un piano Finnhub a pagamento.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      console.error('Error fetching economic data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh effect
  useEffect(() => {
    fetchEconomicData()
    
    if (autoRefresh) {
      const interval = setInterval(fetchEconomicData, 30000) // 30 seconds
      return () => clearInterval(interval)
    }
  }, [timeRange, autoRefresh])

  // Filter events
  const filteredEvents = events.filter(event => {
    const countryMatch = selectedCountry === 'all' || event.country === selectedCountry
    const impactMatch = selectedImpact === 'all' || event.impact === selectedImpact
    return countryMatch && impactMatch
  })

  // Get unique countries for filter
  const countries = Array.from(new Set(events.map(event => event.country))).sort()

  // Get impact color
  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-orange-500'
      case 'low': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  // Get impact text color
  const getImpactTextColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-orange-600'
      case 'low': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  // Format date and time
  const formatDateTime = (date: string, time: string) => {
    try {
      const dateTime = new Date(`${date} ${time}`)
      return {
        date: dateTime.toLocaleDateString('it-IT', { 
          weekday: 'short', 
          day: '2-digit', 
          month: 'short' 
        }),
        time: dateTime.toLocaleTimeString('it-IT', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }
    } catch {
      return { date: date, time: time }
    }
  }

  // Get country flag emoji
  const getCountryFlag = (country: string) => {
    const flags: { [key: string]: string } = {
      'US': '🇺🇸',
      'EUR': '🇪🇺',
      'GB': '🇬🇧',
      'JP': '🇯🇵',
      'CA': '🇨🇦',
      'AU': '🇦🇺',
      'CH': '🇨🇭',
      'CN': '🇨🇳',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'IT': '🇮🇹'
    }
    return flags[country] || '🌍'
  }

  return (
    <div className="space-y-6">
      {/* Webhook Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Header with filters */}
          <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-xl">NEWS & MACRO</CardTitle>
              <Badge variant="outline" className="text-xs">
                {filteredEvents.length} EVENTI
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchEconomicData}
                disabled={loading}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Aggiorna
              </Button>
              
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="flex items-center gap-1"
              >
                <Activity className="h-4 w-4" />
                Auto
              </Button>
            </div>
          </div>
          
          {lastUpdate && (
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Ultimo aggiornamento: {lastUpdate.toLocaleTimeString('it-IT')}
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent>
          {/* Filtri */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Filtri:</span>
            </div>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Oggi</SelectItem>
                <SelectItem value="week">Settimana</SelectItem>
                <SelectItem value="month">Mese</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Paese" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>
                    {getCountryFlag(country)} {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedImpact} onValueChange={setSelectedImpact}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Impatto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="high">🔴 Alto</SelectItem>
                <SelectItem value="medium">🟠 Medio</SelectItem>
                <SelectItem value="low">🟡 Basso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
        </div>
        
        {/* Webhook Status Column */}
         <div className="lg:col-span-1">
           <WebhookStatus />
         </div>
      </div>

      {/* Events List */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Caricamento eventi economici...</span>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2 text-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h3 className="font-medium text-red-600">Errore nel caricamento</h3>
              <p className="text-sm text-gray-500">{error}</p>
              <Button onClick={fetchEconomicData} variant="outline" size="sm">
                Riprova
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2 text-center">
              <Calendar className="h-8 w-8 text-gray-400" />
              <h3 className="font-medium text-gray-600">Nessun evento trovato</h3>
              <p className="text-sm text-gray-500">
                Non ci sono eventi economici per i filtri selezionati.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event, index) => {
            const { date, time } = formatDateTime(event.date, event.time)
            
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    {/* Time and Country */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-center">
                        <div className="text-xs text-gray-500">{date}</div>
                        <div className="text-sm font-medium">{time}</div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCountryFlag(event.country)}</span>
                        <span className="text-xs font-medium text-gray-600">{event.country}</span>
                      </div>
                    </div>
                    
                    {/* Event Name and Impact */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{event.event}</h4>
                        <div className={`w-2 h-2 rounded-full ${getImpactColor(event.impact)}`} />
                        <span className={`text-xs font-medium ${getImpactTextColor(event.impact)}`}>
                          {event.impact.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Values */}
                    <div className="flex items-center gap-4 text-xs">
                      {event.previous && (
                        <div className="text-center">
                          <div className="text-gray-500">Prec.</div>
                          <div className="font-medium">{event.previous}</div>
                        </div>
                      )}
                      
                      {event.estimate && (
                        <div className="text-center">
                          <div className="text-gray-500">Stima</div>
                          <div className="font-medium">{event.estimate}</div>
                        </div>
                      )}
                      
                      {event.actual && (
                        <div className="text-center">
                          <div className="text-gray-500">Attuale</div>
                          <div className="font-medium text-blue-600">{event.actual}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}