'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Settings, CheckCircle, AlertCircle, DollarSign, Target, Shield } from 'lucide-react'
import Link from 'next/link'

interface PropFirmTemplate {
  id: string
  name: string
  accountSize: number
  currency: string
  isActive: boolean
  rulesJson: any
  createdAt: string
}

interface PropFirm {
  id: string
  name: string
  description: string
  website?: string
  logo?: string
  isActive: boolean
  templates: PropFirmTemplate[]
}

interface Account {
  id: string
  login: string
  name?: string
  propFirmTemplate?: {
    id: string
    name: string
    accountSize: number
    currency: string
    propFirm: {
      id: string
      name: string
    }
  }
  initialBalance?: number
  currentPhase?: string
}

export default function SettingsPage() {
  const [propFirms, setPropFirms] = useState<PropFirm[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [initialBalance, setInitialBalance] = useState<string>('')
  const [currentPhase, setCurrentPhase] = useState<string>('PHASE_1')
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch PropFirm templates
      const templatesResponse = await fetch('/api/propfirm-templates')
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json()
        setPropFirms(templatesData.propFirms || [])
      }

      // Fetch accounts
      const accountsResponse = await fetch('/api/accounts')
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json()
        const accountsArray = Array.isArray(accountsData) ? accountsData : []
        setAccounts(accountsArray)
        if (accountsArray.length > 0) {
          setSelectedAccount(accountsArray[0])
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignTemplate = async () => {
    if (!selectedAccount || !selectedTemplate || !initialBalance) {
      alert('Please fill in all required fields')
      return
    }

    setAssigning(true)
    try {
      const response = await fetch(`/api/accounts/${selectedAccount.id}/assign-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          propFirmTemplateId: selectedTemplate,
          initialBalance: parseFloat(initialBalance),
          currentPhase
        })
      })

      if (response.ok) {
        alert('Template assigned successfully!')
        await fetchData() // Refresh data
        setSelectedTemplate('')
        setInitialBalance('')
        setCurrentPhase('PHASE_1')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error assigning template:', error)
      alert('Failed to assign template')
    } finally {
      setAssigning(false)
    }
  }

  const getSelectedTemplateInfo = () => {
    if (!selectedTemplate) return null
    
    for (const firm of propFirms) {
      const template = firm.templates.find(t => t.id === selectedTemplate)
      if (template) {
        return { firm, template }
      }
    }
    return null
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  const templateInfo = getSelectedTemplateInfo()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Indietro
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Settings className="h-6 w-6 text-gray-600" />
              <h1 className="text-2xl font-bold text-gray-900">Impostazioni PropFirm</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Template Assignment Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🔧 Assegna Template PropFirm</CardTitle>
                <CardDescription>
                  Configura il template delle regole per il tuo account di trading
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Account Selection */}
                <div className="space-y-2">
                  <Label htmlFor="account">Account MT5</Label>
                  <Select
                    value={selectedAccount?.id || ''}
                    onValueChange={(value) => {
                      const account = accounts.find(a => a.id === value)
                      setSelectedAccount(account || null)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name || account.login} - {account.login}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* PropFirm Template Selection */}
                <div className="space-y-2">
                  <Label htmlFor="template">Template PropFirm</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona template" />
                    </SelectTrigger>
                    <SelectContent>
                      {propFirms.map(firm => (
                        <optgroup key={firm.id} label={firm.name}>
                          {firm.templates.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name} - {formatCurrency(template.accountSize, template.currency)}
                            </SelectItem>
                          ))}
                        </optgroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Initial Balance */}
                <div className="space-y-2">
                  <Label htmlFor="balance">Saldo Iniziale</Label>
                  <Input
                    id="balance"
                    type="number"
                    placeholder="50000"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Inserisci il saldo iniziale del tuo account challenge
                  </p>
                </div>

                {/* Current Phase */}
                <div className="space-y-2">
                  <Label htmlFor="phase">Fase Corrente</Label>
                  <Select value={currentPhase} onValueChange={setCurrentPhase}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PHASE_1">Fase 1 - Evaluation</SelectItem>
                      <SelectItem value="PHASE_2">Fase 2 - Verification</SelectItem>
                      <SelectItem value="FUNDED">Funded Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <Button 
                  onClick={handleAssignTemplate}
                  disabled={!selectedAccount || !selectedTemplate || !initialBalance || assigning}
                  className="w-full"
                >
                  {assigning ? 'Assegnando...' : 'Assegna Template'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Template Preview & Current Settings */}
          <div className="space-y-6">
            
            {/* Current Account Settings */}
            {selectedAccount?.propFirmTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Configurazione Corrente</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Account:</span>
                      <span className="font-medium">{selectedAccount.login}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">PropFirm:</span>
                      <Badge variant="default">{selectedAccount.propFirmTemplate.propFirm.name}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Template:</span>
                      <span className="text-sm">{selectedAccount.propFirmTemplate.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Account Size:</span>
                      <span className="font-medium">{formatCurrency(selectedAccount.propFirmTemplate.accountSize)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Saldo Iniziale:</span>
                      <span className="font-medium">{formatCurrency(selectedAccount.initialBalance || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Fase:</span>
                      <Badge variant="secondary">{selectedAccount.currentPhase}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Template Preview */}
            {templateInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    <span>Anteprima Template</span>
                  </CardTitle>
                  <CardDescription>
                    {templateInfo.firm.name} - {templateInfo.template.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <DollarSign className="h-6 w-6 mx-auto text-blue-500 mb-1" />
                        <div className="text-sm text-gray-600">Account Size</div>
                        <div className="font-bold text-blue-600">
                          {formatCurrency(templateInfo.template.accountSize, templateInfo.template.currency)}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <Target className="h-6 w-6 mx-auto text-green-500 mb-1" />
                        <div className="text-sm text-gray-600">Profit Target</div>
                        <div className="font-bold text-green-600">
                          {templateInfo.template.rulesJson?.phase1?.profitTarget || 0}%
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Max Daily Loss:</span>
                        <Badge variant="destructive">
                          {templateInfo.template.rulesJson?.phase1?.maxDailyLoss || 0}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Max Overall Loss:</span>
                        <Badge variant="destructive">
                          {templateInfo.template.rulesJson?.phase1?.maxOverallLoss || 0}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Min Trading Days:</span>
                        <Badge variant="secondary">
                          {templateInfo.template.rulesJson?.phase1?.minTradingDays || 0} giorni
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Consistency Rules:</span>
                        <Badge variant={templateInfo.template.rulesJson?.phase2?.consistencyRules ? "default" : "secondary"}>
                          {templateInfo.template.rulesJson?.phase2?.consistencyRules ? 'Attive in Fase 2' : 'Disattive'}
                        </Badge>
                      </div>
                    </div>

                    {templateInfo.template.rulesJson?.phase2?.consistencyRules && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Shield className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">Simple Protection Rules</span>
                        </div>
                        <div className="text-xs text-yellow-700 space-y-1">
                          <div>• 50% Daily Protection: Profitto ≥ 2x miglior giorno</div>
                          <div>• 50% Trade Protection: Profitto ≥ 2x miglior trade</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Available PropFirms */}
            <Card>
              <CardHeader>
                <CardTitle>📊 PropFirms Disponibili</CardTitle>
                <CardDescription>
                  Template disponibili per la configurazione
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {propFirms.map(firm => (
                    <div key={firm.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{firm.name}</h3>
                        <Badge variant={firm.isActive ? "default" : "secondary"}>
                          {firm.templates.length} templates
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{firm.description}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {firm.templates.slice(0, 4).map(template => (
                          <div key={template.id} className="text-xs bg-gray-50 p-2 rounded">
                            {formatCurrency(template.accountSize, template.currency)}
                          </div>
                        ))}
                        {firm.templates.length > 4 && (
                          <div className="text-xs text-gray-500 p-2">
                            +{firm.templates.length - 4} altri
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}