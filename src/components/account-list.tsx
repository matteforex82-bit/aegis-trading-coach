'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts')
      if (!response.ok) {
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
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="space-y-2">
            <div className="h-16 bg-gray-100 rounded"></div>
            <div className="h-16 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">Nessun account disponibile</p>
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
              'block w-full text-left p-3 rounded-lg border transition-colors',
              isActive
                ? 'bg-blue-50 border-blue-200 text-blue-900'
                : 'hover:bg-gray-50 border-gray-200 text-gray-700'
            )}
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  isActive 
                    ? "bg-blue-100 text-blue-600" 
                    : "bg-gray-100 text-gray-600"
                )}>
                  <BarChart3 className="h-4 w-4" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {account.name || account.broker || 'Account senza nome'}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {account.login || 'N/A'}
                </div>
                <div className="text-xs text-gray-400 mt-1">
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