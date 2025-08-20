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
          <Card className="text-center py-12 bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-xl">
            <CardContent>
              <div className="mx-auto flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full mb-6 shadow-lg">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                🚀 Seleziona un Account
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                Scegli un account dalla sidebar per accedere alla dashboard spettacolare con KPI, regole PropFirm e operazioni.
              </p>
              
              {accounts.length === 0 ? (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-100 border-2 border-yellow-300 rounded-xl p-6 mb-6 shadow-lg">
                  <p className="text-yellow-800 font-bold text-lg">⚠️ Nessun account configurato</p>
                  <p className="text-yellow-700 mt-2">
                    Vai nelle impostazioni per aggiungere il tuo primo account MT5 e iniziare!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {accounts.slice(0, 4).map((account) => (
                    <Link
                      key={account.id}
                      href={`/account/${account.id}`}
                      className="group relative overflow-hidden p-6 border-2 border-blue-200 rounded-xl 
                               bg-gradient-to-br from-white to-blue-50 
                               hover:from-blue-50 hover:to-indigo-100 
                               hover:border-blue-400 shadow-lg hover:shadow-xl
                               transform hover:scale-105 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <div className="font-bold text-xl text-gray-900 group-hover:text-blue-700 mb-1">
                            📈 {account.name || account.broker}
                          </div>
                          <div className="text-sm text-blue-600 font-medium">
                            🏦 {account.login}
                          </div>
                          <div className="text-xs text-gray-500 mt-2 bg-gray-100 px-2 py-1 rounded-full inline-block">
                            💼 {account._count?.trades || 0} operazioni
                          </div>
                        </div>
                        <ArrowRight className="h-6 w-6 text-blue-400 group-hover:text-blue-600 group-hover:translate-x-2 transition-all" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-300/20 rounded-full group-hover:animate-ping"></div>
                    </Link>
                  ))}
                </div>
              )}

              <Link href="/settings">
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 
                                 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl
                                 transform hover:scale-105 transition-all duration-300">
                  ⚙️ Impostazioni
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}