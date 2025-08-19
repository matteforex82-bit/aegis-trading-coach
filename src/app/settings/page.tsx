'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Settings, CheckCircle, AlertCircle, DollarSign, Target, Shield, Trash2, Upload, FileText, Sync } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
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
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // HTML Sync states
  const [htmlFile, setHtmlFile] = useState<File | null>(null)
  const [syncMode, setSyncMode] = useState<'preview' | 'import'>('preview')
  const [clearBeforeSync, setClearBeforeSync] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch PropFirm templates
      const templatesResponse = await fetch('/api/propfirm-templates')
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json()
        console.log('📊 PropFirm data loaded:', templatesData.propFirms?.length || 0, 'firms')
        setPropFirms(templatesData.propFirms || [])
      } else {
        console.error('❌ Failed to fetch PropFirm templates:', templatesResponse.status)
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

  const handleDeleteAccount = async () => {
    if (!selectedAccount) {
      alert('Please select an account to delete')
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/accounts/${selectedAccount.id}/delete`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Account deleted successfully!\n\nDeleted data:\n• Account: ${result.deletedData.accountLogin}\n• Trades: ${result.deletedData.tradesDeleted}\n• Challenges: ${result.deletedData.challengesDeleted}\n• Metrics: ${result.deletedData.metricsDeleted}`)
        
        // Refresh data and reset selection
        await fetchData()
        setSelectedAccount(null)
        setShowDeleteConfirm(false)
      } else {
        const error = await response.json()
        alert(`Error deleting account: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  // HTML Sync functions
  const handleFileUpload = (file: File) => {
    if (file.type === 'text/html' || file.name.endsWith('.html')) {
      setHtmlFile(file)
      setSyncResult(null)
    } else {
      alert('Please select an HTML file')
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleSyncHtml = async () => {
    if (!selectedAccount || !htmlFile) {
      alert('Please select an account and HTML file')
      return
    }

    setSyncing(true)
    try {
      const formData = new FormData()
      formData.append('htmlFile', htmlFile)
      formData.append('options', JSON.stringify({
        clearExisting: clearBeforeSync,
        mode: syncMode
      }))

      const response = await fetch(`/api/accounts/${selectedAccount.id}/sync-html`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setSyncResult(result)
        
        if (syncMode === 'import') {
          alert('Sincronizzazione completata con successo!')
          await fetchData() // Refresh data
        }
      } else {
        const error = await response.json()
        alert(`Errore: ${error.error}`)
      }
    } catch (error) {
      console.error('Error syncing HTML:', error)
      alert('Errore durante la sincronizzazione')
    } finally {
      setSyncing(false)
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
                      {propFirms.length === 0 ? (
                        <SelectItem value="" disabled>
                          Nessun template disponibile
                        </SelectItem>
                      ) : (
                        propFirms.flatMap(firm => 
                          firm.templates.map(template => (
                            <SelectItem key={template.id} value={template.id}>
                              {firm.name} - {template.name} ({formatCurrency(template.accountSize, template.currency)})
                            </SelectItem>
                          ))
                        )
                      )}
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

            {/* MT5 HTML Sync Section */}
            {selectedAccount && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-700 flex items-center space-x-2">
                    <Sync className="h-5 w-5" />
                    <span>📊 Sincronizzazione MT5</span>
                  </CardTitle>
                  <CardDescription className="text-blue-600">
                    Carica un report HTML di MT5 per sincronizzare i dati dell'account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* File Upload Area */}
                  <div className="space-y-2">
                    <Label>Report HTML MT5</Label>
                    <div 
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActive 
                          ? 'border-blue-400 bg-blue-100' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      {htmlFile ? (
                        <div className="space-y-2">
                          <FileText className="h-12 w-12 mx-auto text-green-500" />
                          <div className="text-sm font-medium text-green-700">
                            {htmlFile.name}
                          </div>
                          <div className="text-xs text-green-600">
                            {(htmlFile.size / 1024).toFixed(1)} KB
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setHtmlFile(null)}
                          >
                            Rimuovi
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Upload className="h-12 w-12 mx-auto text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600 mb-2">
                              Trascina il file HTML qui o clicca per selezionare
                            </p>
                            <Button
                              variant="outline"
                              onClick={() => document.getElementById('htmlFileInput')?.click()}
                            >
                              Seleziona File HTML
                            </Button>
                            <input
                              id="htmlFileInput"
                              type="file"
                              accept=".html"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileUpload(file)
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            Carica il report "Trade History Report" esportato da MT5
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sync Options */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="clearBeforeSync"
                        checked={clearBeforeSync}
                        onCheckedChange={(checked) => setClearBeforeSync(checked as boolean)}
                      />
                      <Label htmlFor="clearBeforeSync" className="text-sm">
                        Pulisci dati esistenti prima di importare (raccomandato)
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label>Modalità di sincronizzazione</Label>
                      <Select 
                        value={syncMode} 
                        onValueChange={(value: 'preview' | 'import') => setSyncMode(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="preview">Anteprima - Solo visualizza i dati</SelectItem>
                          <SelectItem value="import">Importa - Sincronizza nel database</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Sync Button */}
                  <Button
                    onClick={handleSyncHtml}
                    disabled={!htmlFile || syncing}
                    className="w-full"
                  >
                    {syncing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {syncMode === 'preview' ? 'Analizzando...' : 'Sincronizzando...'}
                      </>
                    ) : (
                      <>
                        <Sync className="h-4 w-4 mr-2" />
                        {syncMode === 'preview' ? 'Anteprima Dati' : 'Sincronizza Dati'}
                      </>
                    )}
                  </Button>

                  {/* Sync Results */}
                  {syncResult && (
                    <div className="mt-6 p-4 bg-white rounded-lg border">
                      <h4 className="font-semibold mb-3 flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Risultati {syncMode === 'preview' ? 'Anteprima' : 'Sincronizzazione'}
                      </h4>
                      
                      {syncResult.data && (
                        <div className="space-y-3 text-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-gray-600">Account:</span>
                              <div className="font-medium">{syncResult.data.accountInfo?.name}</div>
                              <div className="text-xs text-gray-500">{syncResult.data.accountInfo?.login}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Report:</span>
                              <div className="font-medium">{syncResult.data.accountInfo?.reportDate}</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                            <div>
                              <div className="font-medium text-blue-600">{syncResult.data.summary?.closedTrades}</div>
                              <div className="text-xs text-gray-600">Operazioni chiuse</div>
                            </div>
                            <div>
                              <div className="font-medium text-green-600">{syncResult.data.summary?.openPositions}</div>
                              <div className="text-xs text-gray-600">Posizioni aperte</div>
                            </div>
                            <div>
                              <div className="font-medium text-purple-600">${syncResult.data.summary?.balance?.toFixed(2)}</div>
                              <div className="text-xs text-gray-600">Balance finale</div>
                            </div>
                          </div>

                          {syncResult.result && (
                            <div className="pt-2 border-t">
                              <div className="text-green-700 font-medium">
                                ✅ Importati: {syncResult.result.imported?.closedTrades} operazioni, {syncResult.result.imported?.openPositions} posizioni
                              </div>
                              {syncResult.result.cleared && clearBeforeSync && (
                                <div className="text-orange-600 text-xs mt-1">
                                  🧹 Rimossi: {syncResult.result.cleared.trades} dati precedenti
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                </CardContent>
              </Card>
            )}

            {/* Delete Account Section */}
            {selectedAccount && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-700 flex items-center space-x-2">
                    <Trash2 className="h-5 w-5" />
                    <span>⚠️ Zona Pericolosa</span>
                  </CardTitle>
                  <CardDescription className="text-red-600">
                    Elimina completamente l'account e tutti i suoi dati
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!showDeleteConfirm ? (
                    <Button
                      onClick={() => setShowDeleteConfirm(true)}
                      variant="destructive"
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Elimina Account
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-red-100 rounded-lg border border-red-300">
                        <h4 className="font-semibold text-red-800 mb-2">
                          ⚠️ Conferma Eliminazione
                        </h4>
                        <p className="text-red-700 text-sm mb-2">
                          Stai per eliminare l'account <strong>{selectedAccount.login}</strong> 
                          e tutti i suoi dati:
                        </p>
                        <ul className="text-red-700 text-sm list-disc list-inside space-y-1">
                          <li>Tutte le operazioni di trading</li>
                          <li>Storico delle performance</li>
                          <li>Configurazioni PropFirm</li>
                          <li>Challenge e metriche</li>
                        </ul>
                        <p className="text-red-800 font-semibold text-sm mt-2">
                          ⚠️ Questa azione NON può essere annullata!
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleDeleteAccount}
                          disabled={deleting}
                          variant="destructive"
                          className="flex-1"
                        >
                          {deleting ? 'Eliminando...' : 'SÌ, ELIMINA'}
                        </Button>
                        <Button
                          onClick={() => setShowDeleteConfirm(false)}
                          variant="outline"
                          className="flex-1"
                        >
                          Annulla
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
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