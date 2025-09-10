'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Database, Server, Clock } from 'lucide-react'

interface SystemStatus {
  timestamp: string
  database: {
    status: 'healthy' | 'unhealthy' | 'limited'
    message: string
    error?: string
    responseTime?: number
  }
  server: {
    status: 'operational' | 'degraded' | 'down'
    uptime: number
    message: string
  }
  endpoints: {
    name: string
    url: string
    status: 'ok' | 'error' | 'slow'
    responseTime?: number
    error?: string
  }[]
}

export default function StatusPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkSystemStatus = async () => {
    setLoading(true)
    const startTime = Date.now()
    
    try {
      // Check main health endpoint
      const healthResponse = await fetch('/api/health')
      const healthData = await healthResponse.json()
      const healthTime = Date.now() - startTime
      
      // Check ping endpoint
      const pingStart = Date.now()
      const pingResponse = await fetch('/api/ping')
      const pingData = await pingResponse.json()
      const pingTime = Date.now() - pingStart
      
      // Check MT5 endpoint (health check)
      const mt5Start = Date.now()
      const mt5Response = await fetch('/api/ingest/mt5', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Health-Check': 'true'
        },
        body: JSON.stringify({ health: true })
      })
      const mt5Data = await mt5Response.json()
      const mt5Time = Date.now() - mt5Start

      // Check accounts endpoint
      const accountsStart = Date.now()
      const accountsResponse = await fetch('/api/accounts')
      const accountsTime = Date.now() - accountsStart
      let accountsStatus = 'ok'
      let accountsError = ''
      
      if (!accountsResponse.ok) {
        if (accountsResponse.status === 401) {
          router.push('/auth/signin')
          return
        }
        const accountsData = await accountsResponse.json()
        accountsStatus = accountsData.code === 'PRISMA_PLAN_LIMIT' ? 'error' : 'error'
        accountsError = accountsData.message || 'Unknown error'
      }

      const systemStatus: SystemStatus = {
        timestamp: new Date().toISOString(),
        database: {
          status: healthResponse.ok ? 'healthy' : (healthData.code === 'PRISMA_PLAN_LIMIT' ? 'limited' : 'unhealthy'),
          message: healthData.message,
          error: healthData.error,
          responseTime: healthTime
        },
        server: {
          status: pingResponse.ok ? 'operational' : 'degraded',
          uptime: pingData.uptime || 0,
          message: pingData.message
        },
        endpoints: [
          {
            name: 'Health Check',
            url: '/api/health',
            status: healthResponse.ok ? 'ok' : 'error',
            responseTime: healthTime,
            error: !healthResponse.ok ? healthData.error : undefined
          },
          {
            name: 'Ping',
            url: '/api/ping', 
            status: pingResponse.ok ? 'ok' : 'error',
            responseTime: pingTime
          },
          {
            name: 'MT5 Ingest',
            url: '/api/ingest/mt5',
            status: mt5Response.ok ? 'ok' : 'error',
            responseTime: mt5Time,
            error: !mt5Response.ok ? 'MT5 endpoint error' : undefined
          },
          {
            name: 'Accounts API',
            url: '/api/accounts',
            status: accountsStatus as 'ok' | 'error',
            responseTime: accountsTime,
            error: accountsError || undefined
          }
        ]
      }
      
      setStatus(systemStatus)
      setLastCheck(new Date())
    } catch (error: any) {
      console.error('Status check failed:', error)
      setStatus({
        timestamp: new Date().toISOString(),
        database: {
          status: 'unhealthy',
          message: '❌ Unable to reach database'
        },
        server: {
          status: 'down',
          uptime: 0,
          message: '❌ Server communication failed'
        },
        endpoints: []
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (sessionStatus === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    checkSystemStatus()
    
    // Auto refresh every 30 seconds
    const interval = setInterval(checkSystemStatus, 30000)
    return () => clearInterval(interval)
  }, [session, sessionStatus, router])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
      case 'ok':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'limited':
      case 'degraded':
      case 'slow':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'unhealthy':
      case 'down':
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'operational':
      case 'ok':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'limited':
      case 'degraded':
      case 'slow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'unhealthy':
      case 'down':
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">System Status</h1>
          <p className="text-gray-600 mt-1">PropControl Dashboard Health Monitor</p>
        </div>
        
        <div className="flex items-center gap-3">
          {lastCheck && (
            <span className="text-sm text-gray-500">
              Last check: {lastCheck.toLocaleTimeString()}
            </span>
          )}
          <Button 
            onClick={checkSystemStatus} 
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Checking...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      {status && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Overall System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Database Status */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className="h-6 w-6 text-gray-500" />
                  <div>
                    <div className="font-medium">Database</div>
                    <div className="text-sm text-gray-600">{status.database.message}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(status.database.status)}
                  <Badge className={getStatusColor(status.database.status)}>
                    {status.database.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              {/* Server Status */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Server className="h-6 w-6 text-gray-500" />
                  <div>
                    <div className="font-medium">Server</div>
                    <div className="text-sm text-gray-600">
                      Uptime: {Math.floor(status.server.uptime / 3600)}h {Math.floor((status.server.uptime % 3600) / 60)}m
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(status.server.status)}
                  <Badge className={getStatusColor(status.server.status)}>
                    {status.server.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical Alerts */}
      {status?.database.status === 'limited' && (
        <Card className="mb-6 border-yellow-300 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">⚠️ DATABASE PLAN LIMIT REACHED</h3>
                <p className="text-yellow-700 text-sm mb-3">
                  Your Prisma database plan has reached its limits. This affects data storage and retrieval.
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-yellow-800">Immediate Actions Required:</p>
                  <ul className="text-sm text-yellow-700 space-y-1 ml-4">
                    <li>• Visit <a href="https://cloud.prisma.io/" target="_blank" className="underline">Prisma Cloud Console</a></li>
                    <li>• Check your current usage and billing</li>
                    <li>• Upgrade to Pro plan ($25/month) if needed</li>
                    <li>• EA will continue retrying automatically</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Endpoints Status */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle>API Endpoints Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {status.endpoints.map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{endpoint.name}</div>
                    <div className="text-sm text-gray-600">{endpoint.url}</div>
                    {endpoint.error && (
                      <div className="text-sm text-red-600 mt-1">{endpoint.error}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {endpoint.responseTime && (
                      <span className="text-sm text-gray-500">
                        {endpoint.responseTime}ms
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      {getStatusIcon(endpoint.status)}
                      <Badge className={getStatusColor(endpoint.status)}>
                        {endpoint.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loading && !status && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Checking system status...</span>
        </div>
      )}
    </div>
  )
}