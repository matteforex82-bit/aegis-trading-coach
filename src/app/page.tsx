'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, BarChart3, Users, ArrowRight } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { AccountList } from '@/components/account-list'
import Link from 'next/link'

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">PROP CONTROL</h1>
            <p className="text-gray-600 mt-1">Seleziona un account per visualizzare la dashboard</p>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen sticky top-0">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
            <div className="mb-6">
              <AccountList />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Navigazione</h3>
              <Navigation />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <Card className="text-center py-12">
              <CardContent>
                <div className="mx-auto flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Seleziona un Account
                </h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Scegli un account dalla sidebar per accedere alla dashboard dedicata con KPI, regole PropFirm e operazioni.
                </p>
                
                {accounts.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p className="text-yellow-800 font-medium">Nessun account configurato</p>
                    <p className="text-yellow-600 text-sm mt-1">
                      Vai nelle impostazioni per aggiungere il tuo primo account MT5.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {accounts.slice(0, 4).map((account) => (
                      <Link
                        key={account.id}
                        href={`/account/${account.id}`}
                        className="group p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <div className="font-semibold text-gray-900 group-hover:text-blue-700">
                              {account.name || account.broker}
                            </div>
                            <div className="text-sm text-gray-500">
                              {account.login}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {account._count?.trades || 0} operazioni
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                <Link href="/settings">
                  <Button variant="outline" className="mr-3">
                    Impostazioni
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}