'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, BarChart3, Users, ArrowRight } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { AccountList } from '@/components/account-list'
import { DashboardLayout } from '@/components/dashboard-layout'
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
    <DashboardLayout subtitle="Seleziona un account per visualizzare la dashboard">
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center py-12 shadow-sm">
            <CardContent>
              <div className="mx-auto flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-6">
                <Users className="h-8 w-8 text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                Seleziona un Account
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Scegli un account dalla sidebar per accedere alla dashboard con KPI PropFirm e analisi delle operazioni.
              </p>
              
              {accounts.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                  <p className="text-yellow-800 font-medium">Nessun account configurato</p>
                  <p className="text-yellow-700 mt-2">
                    Vai nelle impostazioni per aggiungere il tuo primo account MT5.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {accounts.slice(0, 4).map((account) => (
                    <Link
                      key={account.id}
                      href={`/account/${account.id}`}
                      className="group p-4 border border-gray-200 rounded-lg 
                               bg-white hover:bg-gray-50 hover:border-gray-300
                               shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <div className="font-semibold text-slate-800 mb-1">
                            {account.name || account.broker}
                          </div>
                          <div className="text-sm text-gray-600">
                            {account.login}
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            {account._count?.trades || 0} operazioni
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <Link href="/settings">
                <Button variant="outline" className="px-6 py-2">
                  Impostazioni
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}