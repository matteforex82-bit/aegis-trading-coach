'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, CheckCircle, AlertCircle, DollarSign, Target, Shield, Trash2, Upload, RotateCcw, ChevronRight, Home, Award, ArrowRight, Check } from 'lucide-react'
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
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1)
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

  const steps = [
    { number: 1, title: 'Seleziona Account', description: 'Scegli l\'account MT5 da configurare' },
    { number: 2, title: 'PropFirm Challenge', description: 'Seleziona la tua PropFirm' },
    { number: 3, title: 'Account Size', description: 'Definisci la size del challenge' },
    { number: 4, title: 'Conferma', description: 'Rivedi e conferma la configurazione' }
  ]

  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account)
    setCurrentStep(2)
  }

  const handlePropFirmSelect = (propFirmId: string) => {
    setSelectedPropFirm(propFirmId)
    setSelectedTemplate('') // Reset template
    setCurrentStep(3)
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = getTemplateById(templateId)
    if (template) {
      setInitialBalance(template.accountSize.toString())
    }
    setCurrentStep(4)
  }

  const canGoToStep = (step: number): boolean => {
    switch (step) {
      case 1: return true
      case 2: return !!selectedAccount
      case 3: return !!selectedAccount && !!selectedPropFirm
      case 4: return !!selectedAccount && !!selectedPropFirm && !!selectedTemplate
      default: return false
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Home className="h-4 w-4" />
            <Link href="/" className="hover:text-blue-600 transition-colors">Dashboard</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">Template Configuration</span>
          </div>
          
          {/* Title & Description */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Configurazione Account Trading
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Collega il tuo account MT5 a un template PropFirm per monitorare le regole
            </p>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                    ${currentStep > step.number 
                      ? 'bg-green-500 text-white' 
                      : currentStep === step.number 
                        ? 'bg-blue-600 text-white' 
                        : canGoToStep(step.number) 
                          ? 'bg-gray-200 text-gray-600 hover:bg-blue-100 cursor-pointer' 
                          : 'bg-gray-100 text-gray-400'
                    }
                  `}
                  onClick={() => canGoToStep(step.number) && setCurrentStep(step.number)}
                  >
                    {currentStep > step.number ? <Check className="h-5 w-5" /> : step.number}
                  </div>
                  <div className="hidden sm:block">
                    <div className={`text-sm font-medium ${
                      currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block w-16 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Step 1: Account Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Seleziona il tuo Account Trading</h2>
              <p className="text-gray-600">Scegli l'account MT5 che vuoi configurare con un template PropFirm</p>
            </div>

            {/* Account Cards */}
            {accounts && accounts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accounts.map(account => (
                  <div
                    key={account.id}
                    onClick={() => handleAccountSelect(account)}
                    className={`
                      relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg
                      ${selectedAccount?.id === account.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                      }
                    `}
                  >
                    {/* Selected indicator */}
                    {selectedAccount?.id === account.id && (
                      <div className="absolute top-4 right-4">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Account info */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-xl font-bold text-gray-900">
                            Account {account.login}
                          </div>
                          {account.name && (
                            <div className="text-sm text-gray-600">{account.name}</div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Login:</span>
                          <span className="font-medium">{account.login}</span>
                        </div>
                        
                        {account.initialBalance && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Balance:</span>
                            <span className="font-medium">{formatCurrency(account.initialBalance)}</span>
                          </div>
                        )}

                        {account.propFirmTemplate ? (
                          <div className="pt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Template:</span>
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                Configurato ✓
                              </Badge>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {account.propFirmTemplate.propFirm.name} - {formatCurrency(account.propFirmTemplate.accountSize)}
                            </div>
                          </div>
                        ) : (
                          <div className="pt-2">
                            <Badge variant="outline" className="text-gray-600">
                              Non configurato
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nessun account trovato</h3>
                <p className="text-gray-600 mb-6">Sincronizza prima con MT5 per vedere i tuoi account</p>
                <Button variant="outline" className="inline-flex items-center">
                  <Upload className="h-4 w-4 mr-2" />
                  Sincronizza MT5
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: PropFirm Selection - TODO: Will be updated next */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Scegli la PropFirm Challenge</h2>
              <p className="text-gray-600">Seleziona la PropFirm per l'account {selectedAccount?.login}</p>
            </div>
            <div className="text-center py-8">
              <p className="text-gray-600">Implementazione PropFirm selector - Coming next...</p>
              <Button 
                onClick={() => setCurrentStep(1)}
                variant="outline" 
                className="mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna indietro
              </Button>
          </div>
        )}

        {/* Step 3: Account Size Selection - TODO */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Seleziona Account Size</h2>
              <p className="text-gray-600">Definisci la size del challenge</p>
            </div>
            <div className="text-center py-8">
              <p className="text-gray-600">Implementazione Account Size selector - Coming next...</p>
              <Button 
                onClick={() => setCurrentStep(2)}
                variant="outline" 
                className="mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna indietro
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation - TODO */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Conferma Configurazione</h2>
              <p className="text-gray-600">Rivedi e conferma la tua configurazione</p>
            </div>
            <div className="text-center py-8">
              <p className="text-gray-600">Implementazione Confirmation step - Coming next...</p>
              <Button 
                onClick={() => setCurrentStep(3)}
                variant="outline" 
                className="mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna indietro
              </Button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}