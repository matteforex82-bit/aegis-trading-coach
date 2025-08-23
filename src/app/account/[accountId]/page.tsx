'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/dashboard-layout'
import AegisAssistant from '@/components/AegisAssistant'

interface Account {
  id: string
  name: string
  login: string
  broker: string
  server: string
  currency: string
  currentPhase: 'PHASE_1' | 'PHASE_2' | 'FUNDED'
  initialBalance: number
  propFirmTemplate: any
}

interface TradeStats {
  totalPnL: number
  totalTrades: number
  winRate: number
  totalVolume: number
  winningTrades: number
  losingTrades: number
  totalCommission: number
  totalSwap: number
}

interface RuleMetrics {
  dailyPnL: number
  isCompliant: boolean
}

export default function AccountDashboard() {
  const params = useParams()
  const router = useRouter()
  const accountId = params?.accountId as string

  const [account, setAccount] = useState<Account | null>(null)
  const [stats, setStats] = useState<TradeStats | null>(null)
  const [rules, setRules] = useState<RuleMetrics | null>(null)
  const [openTrades, setOpenTrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (accountId) {
      loadDashboardData()
    }
  }, [accountId])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Set dummy data for build testing
      setAccount({
        id: accountId,
        name: 'Test Account',
        login: '12345',
        broker: 'Test Broker',
        server: 'Test Server',
        currency: 'USD',
        currentPhase: 'PHASE_1',
        initialBalance: 50000,
        propFirmTemplate: null
      })
      
      setStats({
        totalPnL: 1000,
        totalTrades: 100,
        winRate: 60,
        totalVolume: 10,
        winningTrades: 60,
        losingTrades: 40,
        totalCommission: 50,
        totalSwap: 25
      })
      
      setRules({
        dailyPnL: 100,
        isCompliant: true
      })
      
      setOpenTrades([])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento dashboard...</p>
        </div>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Account non trovato</h2>
          <p className="text-gray-600 mb-4">L'account specificato non esiste.</p>
          <Button onClick={() => router.push('/')}>
            Torna alla Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout title="Dashboard" subtitle="Account Dashboard">
      <div className="p-6 space-y-6">
        {/* Account Header */}
        <Card>
          <CardHeader>
            <CardTitle>Account: {account.name}</CardTitle>
            <CardDescription>Login: {account.login} | Broker: {account.broker}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold">Balance</h3>
                <p className="text-2xl font-bold text-green-600">
                  ${(account.initialBalance + (stats?.totalPnL || 0)).toLocaleString()}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Total P&L</h3>
                <p className={`text-2xl font-bold ${(stats?.totalPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${stats?.totalPnL?.toLocaleString() || '0'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Win Rate</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.winRate?.toFixed(1) || '0'}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trading Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Trading Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Trades</p>
                <p className="text-xl font-bold">{stats?.totalTrades || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Winning Trades</p>
                <p className="text-xl font-bold text-green-600">{stats?.winningTrades || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Losing Trades</p>
                <p className="text-xl font-bold text-red-600">{stats?.losingTrades || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Volume</p>
                <p className="text-xl font-bold">{stats?.totalVolume || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AEGIS AI Assistant */}
        <AegisAssistant 
          account={account}
          stats={stats}
          rules={rules}
          openTrades={openTrades}
        />

        {/* Compliance Status */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${rules?.isCompliant ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`font-semibold ${rules?.isCompliant ? 'text-green-600' : 'text-red-600'}`}>
                {rules?.isCompliant ? 'COMPLIANT' : 'VIOLATION'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Daily P&L: ${rules?.dailyPnL?.toLocaleString() || '0'}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}