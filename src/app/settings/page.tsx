'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Settings, CheckCircle, AlertCircle, DollarSign, Target, Shield, Trash2, Upload, FileText, RotateCcw, Zap, Star, Award, TrendingUp } from 'lucide-react'
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
  
  // 🚀 NEW: Smart template selection system
  const [selectedPropFirm, setSelectedPropFirm] = useState<string>('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [initialBalance, setInitialBalance] = useState<string>('')
  const [currentPhase, setCurrentPhase] = useState<string>('PHASE_1')
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  
  // MT5 Sync states
  const [reportFile, setReportFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<'html' | 'excel'>('html')
  const [syncMode, setSyncMode] = useState<'preview' | 'import'>('preview')
  const [clearBeforeSync, setClearBeforeSync] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  // 🚀 Auto-configure balance when template changes
  useEffect(() => {
    if (selectedTemplate) {
      const template = getTemplateById(selectedTemplate)
      if (template && !initialBalance) {
        setInitialBalance(template.accountSize.toString())
      }
    }
  }, [selectedTemplate])

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
        alert('✅ Template assegnato con successo!')
        await fetchData() // Refresh data
        setSelectedTemplate('')
        setSelectedPropFirm('')
        setInitialBalance('')
        setCurrentPhase('PHASE_1')
      } else {
        const error = await response.json()
        alert(`❌ Errore: ${error.error}`)
      }
    } catch (error) {
      console.error('Error assigning template:', error)
      alert('❌ Errore durante l\'assegnazione del template')
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
        alert(`✅ Account eliminato con successo!\n\n• Account: ${result.deletedData.accountLogin}\n• Trades: ${result.deletedData.tradesDeleted}\n• Challenges: ${result.deletedData.challengesDeleted}\n• Metrics: ${result.deletedData.metricsDeleted}`)
        
        // Refresh data and reset selection
        await fetchData()
        setSelectedAccount(null)
        setShowDeleteConfirm(false)
      } else {
        const error = await response.json()
        alert(`❌ Errore: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('❌ Errore durante l\'eliminazione')
    } finally {
      setDeleting(false)
    }
  }

  // 🚀 NEW: Helper functions for smart template selection
  const getTemplateById = (templateId: string): PropFirmTemplate | null => {
    for (const firm of propFirms) {
      const template = firm.templates.find(t => t.id === templateId)
      if (template) return template
    }
    return null
  }

  const getSelectedPropFirmData = (): PropFirm | null => {
    return propFirms.find(f => f.id === selectedPropFirm) || null
  }

  const getSelectedTemplateData = (): { firm: PropFirm; template: PropFirmTemplate } | null => {
    if (!selectedTemplate) return null
    
    for (const firm of propFirms) {
      const template = firm.templates.find(t => t.id === selectedTemplate)
      if (template) {
        return { firm, template }
      }
    }
    return null
  }

  // 🚀 NEW: Validation helpers
  const isFormValid = (): boolean => {
    return !!(selectedAccount && selectedTemplate && initialBalance && parseFloat(initialBalance) > 0)
  }

  const getValidationErrors = (): string[] => {
    const errors: string[] = []
    if (!selectedAccount) errors.push('Seleziona un account')
    if (!selectedTemplate) errors.push('Seleziona un template PropFirm')
    if (!initialBalance || parseFloat(initialBalance) <= 0) errors.push('Inserisci un saldo iniziale valido')
    return errors
  }

  // MT5 Sync functions (unchanged from original)
  const handleFileUpload = (file: File) => {
    const isHtml = file.type === 'text/html' || file.name.endsWith('.html')
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.name.endsWith('.xlsx')
    
    if (isHtml || isExcel) {
      setReportFile(file)
      setFileType(isHtml ? 'html' : 'excel')
      setSyncResult(null)
      console.log(`📄 File uploaded: ${file.name} (${isHtml ? 'HTML' : 'Excel'})`)
    } else {
      alert('Please select an HTML (.html) or Excel (.xlsx) file')
    }
  }

  const handleTestExcel = async () => {
    if (!selectedAccount || !reportFile || fileType !== 'excel') {
      alert('Please select an Excel file first')
      return
    }

    setSyncing(true)
    try {
      const formData = new FormData()
      formData.append('excelFile', reportFile)

      const response = await fetch(`/api/accounts/${selectedAccount.id}/test-excel`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        console.log('🔬 EXCEL TEST RESULTS:', result.debug)
        
        alert(`Excel Test Results:

File: ${result.debug.fileName}
Total Rows: ${result.debug.totalRows}
Account Found: ${result.debug.accountFound ? 'YES' : 'NO'} (${result.debug.accountLogin})
Positions Section: ${result.debug.positionsFound ? 'YES' : 'NO'} (row ${result.debug.positionsRowIndex})
Trade Rows Found: ${result.debug.tradeRowsFound}

Check console for detailed data structure`)
      } else {
        const error = await response.json()
        alert(`Test failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Error testing Excel:', error)
      alert('Test failed')
    } finally {
      setSyncing(false)
    }
  }

  const handleSyncReport = async () => {
    if (!selectedAccount || !reportFile) {
      alert('Please select an account and report file')
      return
    }

    setSyncing(true)
    try {
      const formData = new FormData()
      const fileKey = fileType === 'html' ? 'htmlFile' : 'excelFile'
      formData.append(fileKey, reportFile)
      formData.append('options', JSON.stringify({
        clearExisting: clearBeforeSync,
        mode: syncMode
      }))

      const endpoint = fileType === 'html' ? 'sync-html' : 'sync-excel'
      const response = await fetch(`/api/accounts/${selectedAccount.id}/${endpoint}`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setSyncResult(result)
        
        if (syncMode === 'import') {
          alert('✅ Sincronizzazione completata con successo!')
          await fetchData() // Refresh data
        }
      } else {
        const error = await response.json()
        console.error('❌ Detailed error from API:', error)
        
        let errorMessage = `❌ Errore: ${error.error}`
        
        if (error.details) {
          errorMessage += `\n\n🔍 Dettagli: ${error.details}`
        }
        
        if (error.errorType) {
          errorMessage += `\n\n🏷️ Tipo: ${error.errorType}`
        }
        
        if (error.stack) {
          errorMessage += `\n\n📋 Stack: ${error.stack}`
        }
        
        if (error.partialResult) {
          errorMessage += `\n\n📊 Risultati parziali:`
          errorMessage += `\n• Importati: ${error.partialResult.imported?.closedTrades || 0} trades`
          errorMessage += `\n• Errori: ${error.partialResult.errors?.length || 0}`
          if (error.partialResult.errors?.length > 0) {
            errorMessage += `\n• Primi errori: ${error.partialResult.errors.slice(0, 3).join('; ')}`
          }
        }
        
        if (error.debug) {
          errorMessage += `\n\n🐛 Debug: ${JSON.stringify(error.debug, null, 2)}`
        }
        
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Error syncing report:', error)
      alert('❌ Errore durante la sincronizzazione')
    } finally {
      setSyncing(false)
    }
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

  const selectedTemplateData = getSelectedTemplateData()
  const validationErrors = getValidationErrors()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* 🎨 Enhanced Header with Gradient */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="hover:bg-blue-50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  PropFirm Settings
                </h1>
                <p className="text-sm text-gray-500">Configure templates e gestisci i tuoi account</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 🎯 Account Info Header - NEW */}
      {selectedAccount && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 rounded-full">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {selectedAccount.name || `Account ${selectedAccount.login}`}
                    </h2>
                    <div className="flex items-center space-x-4 text-blue-100 text-sm">
                      <span>🆔 Login: {selectedAccount.login}</span>
                      {selectedAccount.propFirmTemplate && (
                        <>
                          <span>•</span>
                          <span>🏢 {selectedAccount.propFirmTemplate.propFirm.name}</span>
                          <span>•</span>
                          <span>💰 {formatCurrency(selectedAccount.propFirmTemplate.accountSize)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-100">Account attivo per le configurazioni</div>
                <div className="text-xs text-blue-200">Tutte le impostazioni si applicano a questo account</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 🚀 NEW: Smart Template Assignment Section */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-1 bg-white/20 rounded-lg">
                    <Zap className="h-4 w-4" />
                  </div>
                  <span className="text-base font-semibold truncate">🚀 Smart Template Assignment</span>
                </CardTitle>
                <CardDescription className="text-blue-100 text-sm line-clamp-2">
                  Sistema intelligente per configurare il tuo account PropFirm
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                
                {/* Step 1: Account Selection */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <Label className="text-base font-medium text-gray-800 truncate">Seleziona Account MT5</Label>
                  </div>
                  <Select
                    value={selectedAccount?.id || ''}
                    onValueChange={(value) => {
                      const account = accounts.find(a => a.id === value)
                      setSelectedAccount(account || null)
                    }}
                  >
                    <SelectTrigger className="h-10 text-base border-2 hover:border-blue-300">
                      <SelectValue placeholder="🎯 Seleziona account MT5" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts && accounts.length > 0 ? (
                        accounts.map(account => (
                          <SelectItem key={account.id} value={account.id} className="text-base p-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <DollarSign className="h-3 w-3 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium truncate">{account.name || account.login}</div>
                                <div className="text-xs text-gray-500 truncate">Login: {account.login}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          Nessun account trovato
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Step 2: PropFirm Selection */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <Label className="text-base font-medium text-gray-800 truncate">Seleziona PropFirm</Label>
                  </div>
                  <Select 
                    value={selectedPropFirm} 
                    onValueChange={(value) => {
                      setSelectedPropFirm(value)
                      setSelectedTemplate('') // Reset template when propfirm changes
                    }}
                  >
                    <SelectTrigger className="h-10 text-base border-2 hover:border-indigo-300">
                      <SelectValue placeholder="🏢 Scegli PropFirm" />
                    </SelectTrigger>
                    <SelectContent>
                      {propFirms && propFirms.length > 0 ? (
                        propFirms.filter(firm => firm.templates && firm.templates.length > 0).map(firm => (
                          <SelectItem key={firm.id} value={firm.id} className="text-base p-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                                <Award className="h-3 w-3 text-indigo-600" />
                              </div>
                              <div>
                                <div className="font-medium truncate">{firm.name}</div>
                                <div className="text-xs text-gray-500 truncate">{firm.templates?.length || 0} templates</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          Nessuna PropFirm trovata
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Step 3: Template Selection (Only show if PropFirm selected) */}
                {selectedPropFirm && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                      <Label className="text-base font-medium text-gray-800 truncate">Seleziona Account Size</Label>
                    </div>
                    <Select 
                      value={selectedTemplate} 
                      onValueChange={setSelectedTemplate}
                    >
                      <SelectTrigger className="h-10 text-base border-2 hover:border-green-300">
                        <SelectValue placeholder="💰 Scegli size challenge" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSelectedPropFirmData()?.templates.map(template => (
                          <SelectItem key={template.id} value={template.id} className="text-base p-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <Target className="h-3 w-3 text-green-600" />
                              </div>
                              <div>
                                <div className="font-medium truncate">{formatCurrency(template.accountSize, template.currency)}</div>
                                <div className="text-xs text-gray-500 truncate">{template.name}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Step 4: Initial Balance (Auto-filled but editable) */}
                {selectedTemplate && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                      <Label className="text-base font-medium text-gray-800 truncate">Conferma Saldo Iniziale</Label>
                    </div>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="number"
                        placeholder="50000"
                        value={initialBalance}
                        onChange={(e) => setInitialBalance(e.target.value)}
                        className="h-10 text-base pl-10 border-2 hover:border-amber-300"
                      />
                    </div>
                    <p className="text-xs text-gray-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      💡 <strong>Auto-suggerito:</strong> Saldo pre-compilato dalla template size. Modificabile.
                    </p>
                  </div>
                )}

                {/* Step 5: Phase Selection */}
                {selectedTemplate && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">5</div>
                      <Label className="text-base font-medium text-gray-800 truncate">Fase Challenge</Label>
                    </div>
                    <Select value={currentPhase} onValueChange={setCurrentPhase}>
                      <SelectTrigger className="h-10 text-base border-2 hover:border-purple-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PHASE_1" className="text-base p-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                            <span className="truncate">Phase 1 - Evaluation</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="PHASE_2" className="text-base p-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                            <span className="truncate">Phase 2 - Verification</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="FUNDED" className="text-base p-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">✓</div>
                            <span className="truncate">Funded Account</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator className="my-6" />

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-red-800">Completa la configurazione:</span>
                    </div>
                    <ul className="space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index} className="text-sm text-red-700 flex items-center space-x-2">
                          <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Success Button */}
                <Button 
                  onClick={handleAssignTemplate}
                  disabled={!isFormValid() || assigning}
                  className={`w-full h-12 text-base font-semibold transition-all duration-200 ${
                    isFormValid() 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5' 
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {assigning ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="truncate">Assegnando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span className="truncate">🚀 Assegna Template</span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* MT5 Sync Section (Unchanged from original but with better styling) */}
            {selectedAccount && (
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur border-blue-200">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <RotateCcw className="h-5 w-5" />
                    </div>
                    <span>📊 Sincronizzazione MT5</span>
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Importa i dati di trading dai report MT5
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  
                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label>Report MT5 ({fileType === 'html' ? 'HTML' : 'Excel'})</Label>
                    <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center bg-blue-50 hover:bg-blue-100 transition-colors">
                      <input
                        type="file"
                        accept=".html,.xlsx"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file)
                        }}
                        className="hidden"
                        id="report-upload"
                      />
                      <label htmlFor="report-upload" className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                        <p className="text-blue-600 font-medium">
                          {reportFile ? reportFile.name : 'Clicca per selezionare il file'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Carica report HTML o Excel esportato da MT5
                        </p>
                        <div className="mt-3 flex justify-center space-x-4 text-xs text-gray-600">
                          <span className="bg-white px-2 py-1 rounded">.html</span>
                          <span className="bg-white px-2 py-1 rounded">.xlsx</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Sync Options */}
                  {reportFile && (
                    <div className="space-y-4 p-4 bg-white rounded-lg border">
                      <div className="flex items-center justify-between">
                        <Label>Modalità Sincronizzazione</Label>
                        <Select value={syncMode} onValueChange={(value: 'preview' | 'import') => setSyncMode(value)}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="preview">📋 Anteprima</SelectItem>
                            <SelectItem value="import">💾 Importa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="clear-before-sync"
                          checked={clearBeforeSync}
                          onChange={(e) => setClearBeforeSync(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="clear-before-sync" className="text-sm">
                          Pulisci dati esistenti prima della sincronizzazione
                        </Label>
                      </div>

                      <div className="space-y-2">
                        <Button
                          onClick={handleTestExcel}
                          disabled={syncing || fileType !== 'excel'}
                          variant="outline"
                          className="w-full"
                        >
                          🔬 Test Parsing Excel
                        </Button>
                        
                        <Button
                          onClick={handleSyncReport}
                          disabled={syncing}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          {syncing ? (
                            <>🔄 Sincronizzando...</>
                          ) : (
                            <>{syncMode === 'preview' ? '👀 Anteprima Dati' : '💾 Importa Dati'}</>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Sync Results */}
                  {syncResult && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">✅ Risultati Sincronizzazione</h4>
                      
                      {syncResult.data && (
                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="font-medium text-green-700">Account:</span>
                              <span className="ml-2">{syncResult.data.accountInfo.login}</span>
                            </div>
                            <div>
                              <span className="font-medium text-green-700">Report:</span>
                              <span className="ml-2">{syncResult.data.accountInfo.reportDate}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 mt-3">
                            <div className="text-center p-2 bg-white rounded">
                              <div className="font-semibold text-blue-600">{syncResult.data.summary.closedTrades}</div>
                              <div className="text-xs text-gray-600">Operazioni Chiuse</div>
                            </div>
                            <div className="text-center p-2 bg-white rounded">
                              <div className="font-semibold text-orange-600">{syncResult.data.summary.openPositions}</div>
                              <div className="text-xs text-gray-600">Posizioni Aperte</div>
                            </div>
                            <div className="text-center p-2 bg-white rounded">
                              <div className={`font-semibold ${syncResult.data.summary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${syncResult.data.summary.totalPnL.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-600">P&L Totale</div>
                            </div>
                          </div>
                          
                          {syncResult.data.debug && (
                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                              <div className="text-sm text-yellow-800">
                                <div className="font-semibold mb-2">🔍 Debug P&L Analysis:</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>Trade processati: {syncResult.data.debug.tradeCount}</div>
                                  <div>Swap totale dai trade: {syncResult.data.debug.totalSwapFromTrades?.toFixed(2)}€</div>
                                  <div>Commission totali: {syncResult.data.debug.totalCommissionFromTrades?.toFixed(2)}€</div>
                                  <div>Profit totale (lordo): {syncResult.data.debug.totalProfitFromTrades?.toFixed(2)}€</div>
                                  <div>P&L calcolato: {syncResult.data.debug.calculatedTotal?.toFixed(2)}€</div>
                                  <div>P&L dal report: {syncResult.data.debug.totalFromReport?.toFixed(2)}€</div>
                                  <div className="col-span-2 font-semibold text-red-600">
                                    🎯 Differenza: {syncResult.data.debug.difference?.toFixed(2)}€
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {syncResult.result && (
                        <div className="mt-3 space-y-3">
                          <div className="p-3 bg-green-100 rounded">
                            <div className="text-sm text-green-800">
                              <div>✅ Importate: {syncResult.result.imported.closedTrades} operazioni, {syncResult.result.imported.openPositions} posizioni</div>
                              {syncResult.result.cleared.trades > 0 && (
                                <div>🧹 Puliti: {syncResult.result.cleared.trades} operazioni precedenti</div>
                              )}
                            </div>
                          </div>
                          
                          {syncResult.preview?.debug && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                              <div className="text-sm text-yellow-800">
                                <div className="font-semibold mb-2">🔍 Debug P&L Analysis:</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>Trade processati: {syncResult.preview.debug.tradeCount}</div>
                                  <div>Swap totale dai trade: {syncResult.preview.debug.totalSwapFromTrades?.toFixed(2)}€</div>
                                  <div>Commission totali: {syncResult.preview.debug.totalCommissionFromTrades?.toFixed(2)}€</div>
                                  <div>Profit totale (lordo): {syncResult.preview.debug.totalProfitFromTrades?.toFixed(2)}€</div>
                                  <div>P&L calcolato: {syncResult.preview.debug.calculatedTotal?.toFixed(2)}€</div>
                                  <div>P&L dal report: {syncResult.preview.debug.totalFromReport?.toFixed(2)}€</div>
                                  <div className="col-span-2 font-semibold text-red-600">
                                    🎯 Differenza: {syncResult.preview.debug.difference?.toFixed(2)}€
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Delete Account Section (unchanged but with better styling) */}
            {selectedAccount && (
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur border-red-200">
                <CardHeader className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Trash2 className="h-5 w-5" />
                    </div>
                    <span>⚠️ Zona Pericolosa</span>
                  </CardTitle>
                  <CardDescription className="text-red-100">
                    Elimina completamente l'account e tutti i suoi dati
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {!showDeleteConfirm ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-red-800 text-sm mb-1">Eliminazione Permanente</h4>
                            <p className="text-red-600 text-xs">
                              Questa azione eliminerà l'account <strong>{selectedAccount.login}</strong> e tutti i suoi dati permanentemente.
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setShowDeleteConfirm(true)
                          setDeleteConfirmText('') // Reset text
                        }}
                        variant="destructive"
                        className="w-full h-11 text-base hover:bg-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Elimina Account
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Enhanced warning section */}
                      <div className="p-5 bg-red-100 rounded-lg border-2 border-red-300">
                        <div className="flex items-center space-x-2 mb-3">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <h4 className="font-bold text-red-800 text-base">
                            ⚠️ ATTENZIONE: Eliminazione Permanente
                          </h4>
                        </div>
                        
                        <div className="bg-white p-4 rounded border border-red-200 mb-4">
                          <div className="text-center mb-2">
                            <div className="text-lg font-bold text-red-700">
                              Account: {selectedAccount.login}
                            </div>
                            {selectedAccount.name && (
                              <div className="text-sm text-red-600">{selectedAccount.name}</div>
                            )}
                          </div>
                        </div>

                        <p className="text-red-700 text-sm font-medium mb-3">
                          Questi dati verranno eliminati PERMANENTEMENTE:
                        </p>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <div className="flex items-center space-x-2 text-red-700 text-xs">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Tutte le operazioni di trading</span>
                          </div>
                          <div className="flex items-center space-x-2 text-red-700 text-xs">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Storico performance</span>
                          </div>
                          <div className="flex items-center space-x-2 text-red-700 text-xs">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Configurazioni PropFirm</span>
                          </div>
                          <div className="flex items-center space-x-2 text-red-700 text-xs">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Challenge e metriche</span>
                          </div>
                        </div>
                        
                        <div className="bg-red-200 p-3 rounded border border-red-300">
                          <p className="text-red-800 font-bold text-sm text-center">
                            🚨 QUESTA AZIONE NON PUÒ ESSERE ANNULLATA! 🚨
                          </p>
                        </div>
                      </div>

                      {/* Type "delete" confirmation */}
                      <div className="space-y-3">
                        <Label className="text-red-800 font-semibold text-sm">
                          Per confermare, digita esattamente: <code className="bg-red-100 px-1 rounded text-red-700">delete</code>
                        </Label>
                        <Input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="Digita 'delete' per confermare..."
                          className="border-red-300 focus:border-red-500 focus:ring-red-200"
                          autoComplete="off"
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="flex space-x-3">
                        <Button
                          onClick={handleDeleteAccount}
                          disabled={deleting || deleteConfirmText !== 'delete'}
                          variant="destructive"
                          className="flex-1 h-11 text-base font-semibold"
                        >
                          {deleting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Eliminando...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              ELIMINA DEFINITIVAMENTE
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            setShowDeleteConfirm(false)
                            setDeleteConfirmText('')
                          }}
                          variant="outline"
                          className="px-6 h-11 text-base"
                          disabled={deleting}
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

          {/* 🚀 NEW: Enhanced Template Preview & Current Settings */}
          <div className="space-y-6">
            
            {/* Current Account Settings */}
            {selectedAccount?.propFirmTemplate && (
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur">
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <span>✅ Configurazione Attuale</span>
                  </CardTitle>
                  <CardDescription className="text-green-100">
                    Template attualmente assegnato all'account {selectedAccount.login}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                        <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
                        <div className="text-sm text-gray-600">PropFirm</div>
                        <div className="font-bold text-green-600">{selectedAccount.propFirmTemplate.propFirm.name}</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <Target className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                        <div className="text-sm text-gray-600">Account Size</div>
                        <div className="font-bold text-blue-600">{formatCurrency(selectedAccount.propFirmTemplate.accountSize)}</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Template:</span>
                        <span className="font-medium">{selectedAccount.propFirmTemplate.name}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Saldo Iniziale:</span>
                        <span className="font-medium">{formatCurrency(selectedAccount.initialBalance || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Fase Corrente:</span>
                        <Badge variant="secondary" className="text-lg px-3 py-1">{selectedAccount.currentPhase}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 🚀 NEW: Enhanced Template Preview */}
            {selectedTemplateData && (
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="p-1 bg-white/20 rounded-lg">
                      <Star className="h-4 w-4" />
                    </div>
                    <span className="text-base font-semibold truncate">🔮 Preview Template</span>
                  </CardTitle>
                  <CardDescription className="text-indigo-100 text-sm line-clamp-2">
                    {selectedTemplateData.firm.name} - {selectedTemplateData.template.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    
                    {/* Main Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <DollarSign className="h-6 w-6 mx-auto text-blue-500 mb-1" />
                        <div className="text-xs text-gray-600">Account Size</div>
                        <div className="font-bold text-blue-600 text-base truncate">
                          {formatCurrency(selectedTemplateData.template.accountSize, selectedTemplateData.template.currency)}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <Target className="h-6 w-6 mx-auto text-green-500 mb-1" />
                        <div className="text-xs text-gray-600">Profit Target</div>
                        <div className="font-bold text-green-600 text-base">
                          {selectedTemplateData.template.rulesJson?.profitTargets?.[currentPhase]?.percentage || 
                           selectedTemplateData.template.rulesJson?.profitTargets?.PHASE_1?.percentage || 0}%
                        </div>
                      </div>
                    </div>

                    {/* Rules Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center space-x-1 mb-1">
                          <Shield className="h-3 w-3 text-red-600" />
                          <span className="text-xs font-medium text-red-800 truncate">Daily Loss</span>
                        </div>
                        <div className="text-sm font-bold text-red-600">
                          {selectedTemplateData.template.rulesJson?.dailyLossLimits?.[currentPhase]?.percentage || 
                           selectedTemplateData.template.rulesJson?.dailyLossLimits?.PHASE_1?.percentage || 0}%
                        </div>
                      </div>
                      <div className="p-2 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center space-x-1 mb-1">
                          <AlertCircle className="h-3 w-3 text-orange-600" />
                          <span className="text-xs font-medium text-orange-800 truncate">Overall Loss</span>
                        </div>
                        <div className="text-sm font-bold text-orange-600">
                          {selectedTemplateData.template.rulesJson?.overallLossLimits?.[currentPhase]?.percentage || 
                           selectedTemplateData.template.rulesJson?.overallLossLimits?.PHASE_1?.percentage || 0}%
                        </div>
                      </div>
                    </div>

                    {/* Special Features */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-xs text-gray-600 truncate">Min Trading Days:</span>
                        <Badge variant="secondary" className="text-xs">
                          {selectedTemplateData.template.rulesJson?.minimumTradingDays?.[currentPhase]?.days || 
                           selectedTemplateData.template.rulesJson?.minimumTradingDays?.PHASE_1?.days || 0} giorni
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-xs text-gray-600 truncate">Consistency Rules:</span>
                        <Badge variant={selectedTemplateData.template.rulesJson?.consistencyRules?.PHASE_2?.enabled ? "default" : "secondary"} className="text-xs">
                          {selectedTemplateData.template.rulesJson?.consistencyRules?.PHASE_2?.enabled ? '✅ Fase 2' : '❌ Disattive'}
                        </Badge>
                      </div>
                    </div>

                    {/* Phase 2 Protection Rules Preview */}
                    {selectedTemplateData.template.rulesJson?.consistencyRules?.PHASE_2?.enabled && (
                      <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="p-1 bg-yellow-500 rounded-full">
                            <Shield className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm font-bold text-yellow-800">🛡️ Protection Rules (Phase 2)</span>
                        </div>
                        <div className="text-xs text-yellow-700 space-y-1">
                          <div className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                            <span>Daily Protection: Profit ≥ 2x Best Day</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                            <span>Trade Protection: Profit ≥ 2x Best Trade</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Available PropFirms Overview (Enhanced) */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <span>📊 PropFirms Disponibili</span>
                </CardTitle>
                <CardDescription className="text-gray-200">
                  {propFirms.length} PropFirms con {propFirms.reduce((sum, firm) => sum + (firm.templates?.length || 0), 0)} templates
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {propFirms && propFirms.length > 0 ? (
                    propFirms.map(firm => (
                      <div key={firm.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                              <Award className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{firm.name}</h3>
                              <p className="text-sm text-gray-600">{firm.description}</p>
                            </div>
                          </div>
                          <Badge variant={firm.isActive ? "default" : "secondary"} className="text-lg px-3 py-1">
                            {firm.templates?.length || 0} sizes
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {firm.templates && firm.templates.slice(0, 6).map(template => (
                            <div key={template.id} className="text-xs bg-gradient-to-r from-gray-50 to-gray-100 p-2 rounded-lg text-center font-medium">
                              {formatCurrency(template.accountSize, template.currency)}
                            </div>
                          ))}
                          {firm.templates && firm.templates.length > 6 && (
                            <div className="text-xs text-gray-500 p-2 text-center">
                              +{firm.templates.length - 6} altri
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium">Nessun PropFirm disponibile</p>
                      <p className="text-sm">I template PropFirm potrebbero non essere stati caricati</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}