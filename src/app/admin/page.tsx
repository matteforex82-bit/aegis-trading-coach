'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// Temporarily disabled Tabs due to Radix UI React 18 compatibility issues
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Building2, CreditCard, TrendingUp, DollarSign, Activity, Shield, Settings, UserCheck, AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

interface AdminStats {
  overview: {
    totalUsers: number
    totalOrganizations: number
    totalTradingAccounts: number
    recentUsers: number
    recentOrganizations: number
  }
  subscriptions: Record<string, number>
  userGrowth: Array<{ month: string; users: number }>
  revenue: {
    totalRevenue: number
    totalTransactions: number
  } | null
  topOrganizations: Array<{
    id: string
    name: string
    slug: string
    subscriptionStatus: string
    tradingAccountsCount: number
    usersCount: number
    createdAt: string
  }>
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchStats()
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'canceled': return 'bg-red-500'
      case 'past_due': return 'bg-yellow-500'
      case 'incomplete': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Errore nel caricamento delle statistiche: {error}</p>
              <Button onClick={fetchStats} className="mt-4">
                Riprova
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!stats) return null

  const subscriptionData = Object.entries(stats.subscriptions).map(([status, count]) => ({
    name: status,
    value: count
  }))

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-red-600" />
            Dashboard Admin
          </h1>
          <p className="text-muted-foreground">Controllo completo del sistema - Accesso amministratore</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/admin/users')} variant="outline" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Gestisci Utenti
          </Button>
          <Button onClick={() => router.push('/admin/subscriptions')} variant="outline" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Gestisci Abbonamenti
          </Button>
          <Button onClick={() => router.push('/admin/system')} variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Sistema
          </Button>
        </div>
      </div>

      {/* Admin Status Alert */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-800">Modalità Amministratore Attiva</h3>
              <p className="text-sm text-red-700">
                Hai accesso completo a tutte le funzionalità del sistema. Le limitazioni di abbonamento sono disabilitate per il tuo account.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utenti Totali</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.overview.recentUsers} negli ultimi 30 giorni
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizzazioni</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalOrganizations}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.overview.recentOrganizations} negli ultimi 30 giorni
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Trading</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalTradingAccounts}</div>
            <p className="text-xs text-muted-foreground">
              Account configurati
            </p>
          </CardContent>
        </Card>

        {stats.revenue && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ricavi (30gg)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.revenue.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.revenue.totalTransactions} transazioni
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Temporarily removed Tabs - showing all sections */}
      <div className="space-y-6">
        {/* Crescita Utenti Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crescita Utenti (Ultimi 12 Mesi)</CardTitle>
              <CardDescription>
                Numero di nuovi utenti registrati per mese
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Abbonamenti Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuzione Abbonamenti</CardTitle>
                <CardDescription>
                  Stato degli abbonamenti attivi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={subscriptionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {subscriptionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistiche Abbonamenti</CardTitle>
                <CardDescription>
                  Dettaglio numerico per stato
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.subscriptions).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                        <span className="capitalize">{status}</span>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Top Organizzazioni Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Organizzazioni</CardTitle>
              <CardDescription>
                Organizzazioni con più account trading
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topOrganizations.map((org, index) => (
                  <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                        <span className="text-sm font-bold">#{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{org.name}</h3>
                        <p className="text-sm text-muted-foreground">@{org.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-sm font-medium">{org.tradingAccountsCount}</div>
                        <div className="text-xs text-muted-foreground">Account</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">{org.usersCount}</div>
                        <div className="text-xs text-muted-foreground">Utenti</div>
                      </div>
                      <Badge 
                        variant={org.subscriptionStatus === 'active' ? 'default' : 'secondary'}
                        className={org.subscriptionStatus === 'active' ? 'bg-green-500' : ''}
                      >
                        {org.subscriptionStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}