'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RefreshCw, AlertCircle, CheckCircle, Info, Activity, Wifi, WifiOff } from 'lucide-react'

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'error' | 'success' | 'warning'
  source: 'mt5' | 'api' | 'database' | 'system'
  message: string
  data?: any
}

interface SystemStatus {
  apiConnected: boolean
  databaseConnected: boolean
  lastSyncTime: string | null
  pendingTrades: number
  totalTradesToday: number
}

export function Terminal() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    apiConnected: false,
    databaseConnected: false,
    lastSyncTime: null,
    pendingTrades: 0,
    totalTradesToday: 0
  })
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-refresh logs
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(async () => {
      await fetchLogs()
      await fetchSystemStatus()
    }, 3000) // Refresh ogni 3 secondi

    return () => clearInterval(interval)
  }, [autoRefresh])

  // Initial load
  useEffect(() => {
    fetchLogs()
    fetchSystemStatus()
    // Simulate WebSocket connection
    setIsConnected(true)
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [logs])

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/debug/logs')
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
      // Add error log
      addLogEntry('error', 'system', 'Failed to fetch logs')
    }
  }

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/debug/status')
      if (response.ok) {
        const data = await response.json()
        setSystemStatus(data.status || systemStatus)
      }
    } catch (error) {
      console.error('Error fetching system status:', error)
    }
  }

  const addLogEntry = (level: LogEntry['level'], source: LogEntry['source'], message: string, data?: any) => {
    const newEntry: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      data
    }
    setLogs(prev => [newEntry, ...prev].slice(0, 100)) // Keep last 100 entries
  }

  const clearLogs = () => {
    setLogs([])
  }

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getSourceColor = (source: LogEntry['source']) => {
    switch (source) {
      case 'mt5':
        return 'bg-purple-100 text-purple-800'
      case 'api':
        return 'bg-blue-100 text-blue-800'
      case 'database':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('it-IT', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <CardTitle>Debug Terminal</CardTitle>
              {isConnected ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Wifi className="h-3 w-3 mr-1" />
                  Connesso
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Disconnesso
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Auto' : 'Manuale'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchLogs}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Aggiorna
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearLogs}
              >
                Pulisci
              </Button>
            </div>
          </div>
          <CardDescription>
            Monitoraggio in tempo reale del sistema e dati da MT5
          </CardDescription>
        </CardHeader>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">API Status</p>
                <p className={`text-lg font-semibold ${
                  systemStatus.apiConnected ? 'text-green-600' : 'text-red-600'
                }`}>
                  {systemStatus.apiConnected ? 'Online' : 'Offline'}
                </p>
              </div>
              {systemStatus.apiConnected ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <AlertCircle className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Database</p>
                <p className={`text-lg font-semibold ${
                  systemStatus.databaseConnected ? 'text-green-600' : 'text-red-600'
                }`}>
                  {systemStatus.databaseConnected ? 'Online' : 'Offline'}
                </p>
              </div>
              {systemStatus.databaseConnected ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <AlertCircle className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">Ultima Sync</p>
              <p className="text-lg font-semibold text-blue-600">
                {systemStatus.lastSyncTime 
                  ? formatTimestamp(systemStatus.lastSyncTime)
                  : 'N/A'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">Operazioni in attesa</p>
              <p className="text-lg font-semibold text-orange-600">
                {systemStatus.pendingTrades}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">Operazioni oggi</p>
              <p className="text-lg font-semibold text-purple-600">
                {systemStatus.totalTradesToday}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Log Live</CardTitle>
          <CardDescription>
            Ultimi 100 log entries ({logs.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full" ref={scrollAreaRef}>
            <div className="space-y-2">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nessun log disponibile
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start space-x-3 p-3 rounded-lg border bg-gray-50"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getLevelIcon(log.level)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="outline" className={getSourceColor(log.source)}>
                          {log.source.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900">{log.message}</p>
                      {log.data && (
                        <pre className="mt-1 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}