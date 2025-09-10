'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Search, CreditCard, Building2, Users, ChevronLeft, ChevronRight, XCircle, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Organization {
  id: string
  name: string
  slug: string
  subscriptionStatus: string | null
  subscriptionPlan: string | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  createdAt: string
  users: Array<{
    id: string
    name: string | null
    email: string
    role: string
  }>
  _count: {
    tradingAccounts: number
    users: number
  }
  stripeSubscription?: {
    id: string
    status: string
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    items: Array<{
      priceId: string
      productId: string
      quantity: number
    }>
  } | null
}

interface SubscriptionsResponse {
  organizations: Organization[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function AdminSubscriptionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchSubscriptions()
  }, [session, status, router, pagination.page, search, statusFilter])

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      })
      
      const response = await fetch(`/api/admin/subscriptions?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions')
      }
      
      const data: SubscriptionsResponse = await response.json()
      setOrganizations(data.organizations)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleSubscriptionAction = async (organizationId: string, action: string, orgName: string) => {
    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ organizationId, action })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to perform action')
      }
      
      const actionText = action === 'cancel_subscription' ? 'cancellato' : 'riattivato'
      toast.success(`Abbonamento di ${orgName} ${actionText} con successo`)
      fetchSubscriptions()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore durante l\'operazione')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'canceled': return <XCircle className="h-4 w-4 text-red-500" />
      case 'past_due': return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'incomplete': return <Clock className="h-4 w-4 text-orange-500" />
      default: return <XCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white'
      case 'canceled': return 'bg-red-500 text-white'
      case 'past_due': return 'bg-yellow-500 text-black'
      case 'incomplete': return 'bg-orange-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  if (loading && organizations.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  const statusCounts = organizations.reduce((acc, org) => {
    const status = org.subscriptionStatus || 'none'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestione Abbonamenti</h1>
          <p className="text-muted-foreground">Visualizza e gestisci tutti gli abbonamenti del sistema</p>
        </div>
        <Button onClick={() => router.push('/admin')} variant="outline">
          Torna al Dashboard
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abbonamenti Attivi</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.active || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancellati</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.canceled || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Ritardo</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.past_due || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Senza Abbonamento</CardTitle>
            <Building2 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.none || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Ricerca e Filtri</CardTitle>
          <CardDescription>
            Cerca per nome organizzazione o filtra per stato abbonamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca organizzazioni..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtra per stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="active">Attivi</SelectItem>
                <SelectItem value="canceled">Cancellati</SelectItem>
                <SelectItem value="past_due">In ritardo</SelectItem>
                <SelectItem value="incomplete">Incompleti</SelectItem>
                <SelectItem value="none">Senza abbonamento</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Abbonamenti ({pagination.total})</CardTitle>
          <CardDescription>
            Lista completa delle organizzazioni e relativi abbonamenti
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-center text-red-600 mb-4">
              <p>Errore: {error}</p>
              <Button onClick={fetchSubscriptions} className="mt-2">
                Riprova
              </Button>
            </div>
          )}
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organizzazione</TableHead>
                  <TableHead>Stato Abbonamento</TableHead>
                  <TableHead>Piano</TableHead>
                  <TableHead>Utenti</TableHead>
                  <TableHead>Account Trading</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{org.name}</div>
                        <div className="text-sm text-muted-foreground">@{org.slug}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Creata il {formatDate(org.createdAt)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(org.subscriptionStatus)}
                        <Badge className={getStatusColor(org.subscriptionStatus)}>
                          {org.subscriptionStatus || 'none'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {org.subscriptionPlan || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{org._count.users}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span>{org._count.tradingAccounts}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {org.stripeSubscription ? (
                        <div className="text-sm">
                          <div>Fino al {formatDate(org.stripeSubscription.currentPeriodEnd)}</div>
                          {org.stripeSubscription.cancelAtPeriodEnd && (
                            <div className="text-red-600 text-xs">Cancellazione programmata</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {org.subscriptionStatus === 'active' && org.stripeSubscriptionId && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                Cancella
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancella Abbonamento</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sei sicuro di voler cancellare l'abbonamento di <strong>{org.name}</strong>?
                                  L'abbonamento rimarrà attivo fino alla fine del periodo corrente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleSubscriptionAction(org.id, 'cancel_subscription', org.name)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Cancella Abbonamento
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        
                        {org.subscriptionStatus === 'canceled' && org.stripeSubscriptionId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleSubscriptionAction(org.id, 'reactivate_subscription', org.name)}
                          >
                            Riattiva
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Pagina {pagination.page} di {pagination.pages} ({pagination.total} organizzazioni totali)
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Precedente
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.pages || loading}
                >
                  Successiva
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}