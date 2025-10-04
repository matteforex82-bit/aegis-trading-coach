'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, BarChart3, Users, ArrowRight } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { AccountList } from '@/components/account-list'
import DashboardLayout from '@/components/dashboard-layout'
import { SubscriptionUsageWidget } from '@/components/SubscriptionUsageWidget'
import { UpgradePrompt } from '@/components/UpgradePrompt'
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits'
import Link from 'next/link'
// Removed Image import - using native img for compatibility

interface Account {
  id: string
  name: string
  login: string
  broker: string
  server: string
  currency: string
  timezone: string
  _count: { trades: number }
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const { subscriptionStatus, loading: subscriptionLoading } = useSubscriptionLimits()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    fetchAccounts()
  }, [session, status, router])

  const fetchAccounts = async () => {
    if (!session?.user?.email) {
      setLoading(false)
      return
    }
    
    try {
      // Fetch accounts - API now automatically filters for current user
      const response = await fetch('/api/accounts')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/signin')
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      const accountsArray = Array.isArray(data) ? data : []
      setAccounts(accountsArray)
    } catch (error) {
      console.error('Error fetching accounts:', error)
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout subtitle="Seleziona un account per visualizzare la dashboard">
      {loading ? (
        <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Caricamento account...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Subscription Usage Widget */}
          <SubscriptionUsageWidget className="mx-4 sm:mx-0" />
          
          {/* Upgrade Prompt */}
          {!subscriptionLoading && subscriptionStatus && (
            <UpgradePrompt 
              currentPlan={subscriptionStatus.plan}
              usage={subscriptionStatus.usage}
              limits={subscriptionStatus.limits}
            />
          )}
          
          <Card className="text-center py-8 sm:py-12 shadow-sm mx-4 sm:mx-0">
             <CardContent className="px-4 sm:px-6">
               <div className="mx-auto flex items-center justify-center mb-4 sm:mb-6">
                 <img
                   src="/logo.svg"
                   alt="PROP CONTROL"
                   className="h-15 w-auto object-contain logo-enhanced"
                 />
               </div>
               <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3 sm:mb-4">
                 Seleziona un Account
               </h2>
               <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed">
                 Scegli un account dalla sidebar per accedere alla dashboard con KPI PropFirm e analisi delle operazioni.
               </p>
               {accounts.length === 0 ? (
                 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 mx-2 sm:mx-0">
                   <p className="text-yellow-800 font-medium text-sm sm:text-base">Nessun account configurato</p>
                   <p className="text-yellow-700 mt-2 text-sm">
                     Vai nelle impostazioni per aggiungere il tuo primo account MT5.
                   </p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 px-2 sm:px-0">
                   {accounts.slice(0, 4).map((account) => (
                     <Link
                       key={account.id}
                       href={`/account/${account.id}`}
                       className="group p-4 border border-gray-200 rounded-lg 
                                bg-white hover:bg-gray-50 hover:border-gray-300
                                shadow-sm hover:shadow-md transition-all duration-200
                                touch-target no-select active:scale-98"
                     >
                       <div className="flex items-center justify-between">
                         <div className="text-left min-w-0 flex-1">
                           <div className="font-semibold text-slate-800 mb-1 text-sm sm:text-base truncate">
                             {account.name || account.broker}
                           </div>
                           <div className="text-xs sm:text-sm text-gray-600 truncate">
                             {account.login}
                           </div>
                           <div className="text-xs text-gray-500 mt-1 sm:mt-2">
                             {account._count?.trades || 0} operazioni
                           </div>
                         </div>
                         <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 ml-2" />
                       </div>
                     </Link>
                   ))}
                 </div>
               )}

               <Link href="/settings">
                 <Button variant="outline" className="px-4 sm:px-6 py-2 text-sm sm:text-base touch-target">
                   Impostazioni
                 </Button>
               </Link>
             </CardContent>
           </Card>
        </div>
      )}
    </DashboardLayout>
   )
}