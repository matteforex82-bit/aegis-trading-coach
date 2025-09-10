'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  CreditCard, 
  Crown, 
  Check, 
  X, 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Zap,
  AlertTriangle,
  Download,
  ExternalLink
} from 'lucide-react'
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits'
import { SubscriptionUsageWidget } from '@/components/SubscriptionUsageWidget'
import { PaymentMethodCard } from '@/components/PaymentMethodCard'
import { AddPaymentMethodModal } from '@/components/AddPaymentMethodModal'
import { toast } from 'sonner'

interface PlanFeature {
  name: string
  included: boolean
  description?: string
}

interface Plan {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  description: string
  features: PlanFeature[]
  popular?: boolean
  stripePriceId: string
}

interface Invoice {
  id: string
  number: string
  status: string
  amount: number
  currency: string
  created: number
  dueDate: number
  paidAt?: number
  hostedInvoiceUrl: string
  invoicePdf: string
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    interval: 'month',
    description: 'Perfect for individual traders getting started',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || '',
    features: [
      { name: 'Up to 3 trading accounts', included: true },
      { name: '1 team member', included: true },
      { name: 'Basic analytics', included: true },
      { name: '30 days data retention', included: true },
      { name: 'Email support', included: true },
      { name: 'Advanced analytics', included: false },
      { name: 'Custom rules', included: false },
      { name: 'API access', included: false },
      { name: 'Priority support', included: false }
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    interval: 'month',
    description: 'Ideal for growing teams and prop firms',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID || '',
    popular: true,
    features: [
      { name: 'Up to 10 trading accounts', included: true },
      { name: 'Up to 5 team members', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Custom rules', included: true },
      { name: 'API access', included: true },
      { name: '90 days data retention', included: true },
      { name: 'Email support', included: true },
      { name: 'Priority support', included: false }
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    interval: 'month',
    description: 'For large organizations with advanced needs',
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || '',
    features: [
      { name: 'Unlimited trading accounts', included: true },
      { name: 'Unlimited team members', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'Custom rules', included: true },
      { name: 'API access', included: true },
      { name: '365 days data retention', included: true },
      { name: 'Priority support', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Custom integrations', included: true }
    ]
  }
]

export default function BillingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { subscriptionStatus, loading: subscriptionLoading, refreshData } = useSubscriptionLimits()
  const [loading, setLoading] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false)
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false)

  useEffect(() => {
    if (session?.user) {
      refreshData()
      fetchInvoices()
      fetchPaymentMethods()
    }
  }, [session, refreshData])

  const fetchInvoices = async () => {
    setLoadingInvoices(true)
    try {
      const response = await fetch('/api/billing/invoices')
      const data = await response.json()
      
      if (response.ok) {
        setInvoices(data.invoices || [])
      } else {
        console.error('Failed to fetch invoices:', data.error)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoadingInvoices(false)
    }
  }

  const fetchPaymentMethods = async () => {
    setLoadingPaymentMethods(true)
    try {
      const response = await fetch('/api/billing/payment-methods')
      const data = await response.json()
      
      if (response.ok) {
        setPaymentMethods(data.paymentMethods || [])
      } else {
        console.error('Failed to fetch payment methods:', data.error)
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    } finally {
      setLoadingPaymentMethods(false)
    }
  }

  const handlePlanChange = async (planId: string) => {
    if (!session?.user) {
      router.push('/login')
      return
    }

    setLoading(true)
    try {
      const plan = PLANS.find(p => p.id === planId)
      if (!plan) throw new Error('Plan not found')

      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          planId: plan.id
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (error) {
      console.error('Error changing plan:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to change plan')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPaymentMethod = async () => {
    // Redirect to Stripe setup intent for adding payment method
    try {
      const response = await fetch('/api/billing/setup-intent', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create setup intent')
      }
      
      // Redirect to Stripe hosted page or implement Stripe Elements
      toast.info('Payment method setup coming soon')
    } catch (error) {
      console.error('Error adding payment method:', error)
      toast.error('Failed to add payment method')
    }
  }

  const handleDeletePaymentMethod = async (id: string) => {
    try {
      const response = await fetch(`/api/billing/payment-methods?id=${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete payment method')
      }
      
      // Refresh payment methods
      fetchPaymentMethods()
    } catch (error) {
      console.error('Error deleting payment method:', error)
      throw error
    }
  }

  const handleSetDefaultPaymentMethod = async (id: string) => {
    try {
      const response = await fetch('/api/billing/payment-methods', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: id })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to set default payment method')
      }
      
      // Refresh payment methods
      fetchPaymentMethods()
    } catch (error) {
      console.error('Error setting default payment method:', error)
      throw error
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/billing/cancel-subscription', {
        method: 'POST'
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      toast.success('Subscription cancelled successfully')
      refreshData()
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to cancel subscription')
    } finally {
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/billing/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const { url } = await response.json()
        window.open(url, '_blank')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to open billing portal')
      }
    } catch (error) {
      console.error('Error opening billing portal:', error)
      toast.error('Failed to open billing portal')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentMethodAdded = () => {
    fetchPaymentMethods()
  }

  const handleReactivateSubscription = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/billing/reactivate-subscription', {
        method: 'POST'
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate subscription')
      }

      toast.success('Subscription reactivated successfully')
      refreshData()
    } catch (error) {
      console.error('Error reactivating subscription:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to reactivate subscription')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'canceled':
      case 'unpaid':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (subscriptionLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const currentPlan = subscriptionStatus?.plan || 'starter'
  const subscriptionActive = subscriptionStatus?.status === 'active'

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-gray-600 mt-2">Manage your subscription and billing information</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Current Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="text-xl font-semibold capitalize">{currentPlan}</h3>
                    <p className="text-gray-600">
                      {PLANS.find(p => p.id === currentPlan)?.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    ${PLANS.find(p => p.id === currentPlan)?.price || 0}/mo
                  </div>
                  <Badge className={getStatusColor(subscriptionStatus?.status || 'inactive')}>
                    {subscriptionStatus?.status || 'Inactive'}
                  </Badge>
                </div>
              </div>

              {subscriptionStatus?.status === 'canceled' && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    Your subscription is cancelled and will end on {subscriptionStatus.currentPeriodEnd ? formatDate(subscriptionStatus.currentPeriodEnd) : 'N/A'}
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                {subscriptionStatus?.status === 'canceled' ? (
                  <Button onClick={handleReactivateSubscription} disabled={loading}>
                    Reactivate Subscription
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={handleCancelSubscription} 
                    disabled={loading}
                  >
                    Cancel Subscription
                  </Button>
                )}
                <Button 
                  onClick={handleManageBilling}
                  variant="outline"
                  disabled={loading}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Billing
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage Widget */}
          <SubscriptionUsageWidget />
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="w-full">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold mb-2">Scegli il tuo piano</h2>
              <p className="text-gray-600">Seleziona il piano più adatto alle tue esigenze di trading</p>
            </div>
            
            {/* Stripe Pricing Table */}
            {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? (
              <div className="w-full flex justify-center">
                <stripe-pricing-table 
                  pricing-table-id="prctbl_1S5qp18M0mPli7QKWH0Y5BWk"
                  publishable-key={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
                >
                </stripe-pricing-table>
              </div>
            ) : (
              <div className="w-full p-8 text-center bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Configurazione Stripe Richiesta</h3>
                <p className="text-yellow-700 mb-4">
                  Per visualizzare i piani di abbonamento, è necessario configurare le chiavi Stripe nel file .env
                </p>
                <div className="text-sm text-yellow-600 bg-yellow-100 p-3 rounded border">
                  <p className="font-mono">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...</p>
                </div>
              </div>
            )}
            
            {/* Fallback: Show current plan info */}
            {subscriptionActive && (
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Crown className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="font-semibold capitalize">Piano Attuale: {currentPlan}</h3>
                      <p className="text-sm text-gray-600">Gestisci il tuo abbonamento dal Customer Portal</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleManageBilling}
                    variant="outline"
                    disabled={loading}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Gestisci Abbonamento
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <PaymentMethodCard 
            paymentMethods={paymentMethods}
            loading={loadingPaymentMethods}
            onAddPaymentMethod={handleAddPaymentMethod}
            onDeletePaymentMethod={handleDeletePaymentMethod}
            onSetDefaultPaymentMethod={handleSetDefaultPaymentMethod}
          />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>
                Download and view your past invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingInvoices ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No invoices found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">Invoice #{invoice.number}</div>
                        <div className="text-sm text-gray-600">
                          {formatDate(invoice.created)} • {formatCurrency(invoice.amount, invoice.currency)}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`mt-1 ${invoice.status === 'paid' ? 'border-green-200 text-green-800' : 'border-yellow-200 text-yellow-800'}`}
                        >
                          {invoice.status}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(invoice.hostedInvoiceUrl, '_blank')}
                        >
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(invoice.invoicePdf, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddPaymentMethodModal 
        open={showAddPaymentModal}
        onOpenChange={setShowAddPaymentModal}
        onSuccess={handlePaymentMethodAdded}
      />
    </div>
  )
}