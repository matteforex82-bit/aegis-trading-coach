'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { User, BarChart3 } from 'lucide-react'
import { useEffect, useState } from 'react'

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

export function AccountList() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      setLoading(false)
      return
    }
    
    fetchAccounts()
  }, [session, status])

  const fetchAccounts = async () => {
    if (status === 'loading') {
      return
    }
    
    if (!session?.user?.email) {
      setLoading(false)
      return
    }
    
    try {
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

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded mb-2"></div>
          <div className="space-y-2">
            <div className="h-14 sm:h-16 bg-muted/50 rounded"></div>
            <div className="h-14 sm:h-16 bg-muted/50 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <User className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-muted-foreground/60" />
        <p className="text-xs sm:text-sm text-responsive">Nessun account disponibile</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {accounts.map((account) => {
        const accountPath = `/account/${account.id}`
        const isActive = pathname === accountPath || pathname.startsWith(`${accountPath}/`)
        
        return (
          <Link
            key={account.id}
            href={accountPath}
            className={cn(
              'block w-full text-left p-3 sm:p-4 rounded-lg border transition-all duration-300 touch-target no-select',
              'active:scale-98 transition-transform', // Mobile tap feedback
              isActive
                ? 'bg-sidebar-accent border-sidebar-border text-sidebar-primary shadow-sm'
                : 'hover:bg-sidebar-accent/50 border-border text-sidebar-foreground active:bg-sidebar-accent/80'
            )}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className={cn(
                  "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-300",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "bg-muted text-muted-foreground"
                )}>
                  <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate text-sm sm:text-base">
                  {account.name || account.broker || 'Account senza nome'}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground truncate">
                  {account.login || 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground/70 mt-0.5 sm:mt-1">
                  {account._count?.trades || 0} operazioni
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}