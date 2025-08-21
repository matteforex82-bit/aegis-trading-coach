'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Wifi, WifiOff, Clock, Database } from 'lucide-react'

interface StatusData {
  status: 'online' | 'offline' | 'connecting'
  lastSync: string | null
  database: boolean
  responseTime?: number
  error?: string
  message?: string
}

export default function ConnectionStatus() {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const checkStatus = async () => {
    if (!mounted) return
    
    try {
      setStatus(prev => prev ? { ...prev, status: 'connecting' } : null)
      
      const response = await fetch('/api/status', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setStatus({
          status: 'online',
          lastSync: data.lastSync,
          database: data.database,
          responseTime: data.responseTime
        })
      } else {
        setStatus({
          status: 'offline',
          lastSync: data.lastSync,
          database: data.database || false,
          error: data.error,
          message: data.message
        })
      }
    } catch (error) {
      console.error('Status check failed:', error)
      // Gracefully handle errors without breaking the UI
      setStatus({
        status: 'offline',
        lastSync: null,
        database: false,
        error: 'NETWORK_ERROR',
        message: 'Unable to reach server'
      })
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!mounted) return
    
    checkStatus() // Initial check
    
    const interval = setInterval(checkStatus, 30000) // Check every 30 seconds
    
    return () => clearInterval(interval)
  }, [mounted])

  const getStatusColor = () => {
    if (loading || status?.status === 'connecting') return 'bg-yellow-500'
    if (status?.status === 'online') return 'bg-green-500'
    return 'bg-red-500'
  }

  const getStatusText = () => {
    if (loading) return 'Checking...'
    if (status?.status === 'connecting') return 'Connecting...'
    if (status?.status === 'online') return 'Online'
    return 'Offline'
  }

  const getStatusIcon = () => {
    if (loading || status?.status === 'connecting') {
      return <Clock className="h-3 w-3" />
    }
    if (status?.status === 'online') {
      return <Wifi className="h-3 w-3" />
    }
    return <WifiOff className="h-3 w-3" />
  }

  const formatLastSync = (lastSyncStr: string | null) => {
    if (!lastSyncStr) return 'Never'
    
    const lastSync = new Date(lastSyncStr)
    const now = new Date()
    const diffMs = now.getTime() - lastSync.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    
    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else {
      return lastSync.toLocaleDateString()
    }
  }

  // Don't render anything on server-side to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <Badge variant="secondary" className="text-xs px-2 py-1">
            <Clock className="h-3 w-3 mr-1" />
            Loading...
          </Badge>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <div 
            className={`w-3 h-3 rounded-full ${getStatusColor()} ${
              status?.status === 'online' ? 'animate-pulse' : ''
            }`}
          />
          {status?.status === 'connecting' && (
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-yellow-400 animate-ping opacity-75" />
          )}
        </div>
        
        <Badge 
          variant={status?.status === 'online' ? 'default' : status?.status === 'connecting' ? 'secondary' : 'destructive'}
          className="text-xs px-2 py-1"
        >
          <div className="flex items-center gap-1">
            {getStatusIcon()}
            {getStatusText()}
          </div>
        </Badge>
        
        {/* Response Time */}
        {status?.responseTime && status.status === 'online' && (
          <span className="text-xs text-muted-foreground">
            {status.responseTime}ms
          </span>
        )}
      </div>

      {/* Database Status */}
      <div className="flex items-center gap-1">
        <Database className={`h-3 w-3 ${status?.database ? 'text-green-600' : 'text-red-600'}`} />
        <span className="text-xs text-muted-foreground">DB</span>
      </div>

      {/* Last Sync */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>Last sync: {formatLastSync(status?.lastSync)}</span>
      </div>

      {/* Error Indicator */}
      {status?.error === 'DATABASE_PLAN_LIMIT' && (
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">
            Plan Limit
          </Badge>
        </div>
      )}
    </div>
  )
}