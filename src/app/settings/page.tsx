'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle, AlertCircle, DollarSign, Upload, ChevronRight, Home, Check, Trash2 } from 'lucide-react'
import Link from 'next/link'
import ThemeToggle from '@/components/ThemeToggle'

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
  const [deletingAccount, setDeletingAccount] = useState<string | null>(null)
  const [deletedAccounts, setDeletedAccounts] = useState<any[]>([])
  const [showDeletedAccounts, setShowDeletedAccounts] = useState(false)
  const [loadingDeleted, setLoadingDeleted] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  // Auto-configure balance when template changes
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
        setCurrentStep(1)
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

  const handleSoftDeleteAccount = async (accountId: string) => {
     if (!confirm('Sei sicuro di voler eliminare questo account? Verrà mantenuto nello storico.')) {
       return
     }
 
     setDeletingAccount(accountId)
     try {
        const response = await fetch(`/api/accounts/${accountId}/soft-delete`, {
          method: 'PUT'
        })
 
       if (response.ok) {
         alert('✅ Account eliminato con successo!')
         await fetchData() // Refresh data
         // Reset selected account if it was deleted
         if (selectedAccount?.id === accountId) {
           setSelectedAccount(null)
           setCurrentStep(1)
         }
       } else {
         const error = await response.json()
         alert(`❌ Errore: ${error.error}`)
       }
     } catch (error) {
       console.error('Error deleting account:', error)
       alert('❌ Errore durante l\'eliminazione dell\'account')
     } finally {
       setDeletingAccount(null)
     }
   }

   const fetchDeletedAccounts = async () => {
     setLoadingDeleted(true)
     try {
       const response = await fetch('/api/accounts/deleted')
       if (response.ok) {
         const data = await response.json()
         setDeletedAccounts(data.accounts || [])
       } else {
         console.error('Error fetching deleted accounts')
       }
     } catch (error) {
       console.error('Error fetching deleted accounts:', error)
     } finally {
       setLoadingDeleted(false)
     }
   }

   const handleRestoreAccount = async (accountId: string) => {
     if (!confirm('Sei sicuro di voler ripristinare questo account?')) {
       return
     }

     try {
       const response = await fetch(`/api/accounts/${accountId}/soft-delete`, {
         method: 'DELETE'
       })

       if (response.ok) {
         alert('✅ Account ripristinato con successo!')
         await fetchDeletedAccounts() // Refresh deleted accounts
         await fetchData() // Refresh active accounts
       } else {
         const error = await response.json()
         alert(`❌ Errore: ${error.error}`)
       }
     } catch (error) {
       console.error('Error restoring account:', error)
       alert('❌ Errore durante il ripristino dell\'account')
     }
   }

  // Helper functions for smart template selection
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

  // Validation helpers
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
        
        {/* Theme Settings Section */}
        <div className="mb-8">
          <ThemeToggle />
        </div>

        {/* Account Management Section */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gestione Account</h3>
            <p className="text-sm text-gray-600 mb-6">
              Elimina gli account dai quali sei stato escluso dalle challenge. Gli account eliminati verranno mantenuti nello storico.
            </p>
            
            {accounts && accounts.length > 0 ? (
              <div className="space-y-3">
                {accounts.map(account => (
                  <div key={account.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Account {account.login}</div>
                        <div className="text-sm text-gray-500">
                          {account.propFirmTemplate ? 
                            `${account.propFirmTemplate.propFirm.name} - ${formatCurrency(account.propFirmTemplate.accountSize)}` : 
                            'Non configurato'
                          }
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleSoftDeleteAccount(account.id)}
                      disabled={deletingAccount === account.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingAccount === account.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Elimina
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nessun account disponibile
              </div>
            )}
          </div>
         </div>

         {/* Deleted Accounts History Section */}
         <div className="mb-8">
           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-gray-900">Storico Account Eliminati</h3>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => {
                   setShowDeletedAccounts(!showDeletedAccounts)
                   if (!showDeletedAccounts && deletedAccounts.length === 0) {
                     fetchDeletedAccounts()
                   }
                 }}
               >
                 {showDeletedAccounts ? 'Nascondi' : 'Mostra'} Storico
               </Button>
             </div>
             
             {showDeletedAccounts && (
               <div className="space-y-3">
                 {loadingDeleted ? (
                   <div className="text-center py-8">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                     <div className="text-gray-500">Caricamento storico...</div>
                   </div>
                 ) : deletedAccounts.length > 0 ? (
                   deletedAccounts.map(account => (
                     <div key={account.id} className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                       <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                           <DollarSign className="h-5 w-5 text-red-600" />
                         </div>
                         <div>
                           <div className="font-medium text-gray-900">Account {account.login}</div>
                           <div className="text-sm text-gray-500">
                             Eliminato il {new Date(account.deletedAt).toLocaleDateString('it-IT')}
                           </div>
                           {account.propFirmTemplate && (
                             <div className="text-xs text-gray-400">
                               {account.propFirmTemplate.propFirm.name} - {formatCurrency(account.propFirmTemplate.accountSize)}
                             </div>
                           )}
                         </div>
                       </div>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleRestoreAccount(account.id)}
                         className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-300"
                       >
                         Ripristina
                       </Button>
                     </div>
                   ))
                 ) : (
                   <div className="text-center py-8 text-gray-500">
                     Nessun account eliminato trovato
                   </div>
                 )}
               </div>
             )}
           </div>
         </div>
        
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

        {/* Step 2: PropFirm Selection */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Scegli la PropFirm Challenge</h2>
              <p className="text-gray-600">Seleziona la PropFirm per l'account {selectedAccount?.login}</p>
            </div>

            {propFirms && propFirms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {propFirms.filter(firm => firm.templates && firm.templates.length > 0).map(firm => (
                  <div
                    key={firm.id}
                    onClick={() => handlePropFirmSelect(firm.id)}
                    className={`
                      relative cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg
                      ${selectedPropFirm === firm.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                      }
                    `}
                  >
                    {selectedPropFirm === firm.id && (
                      <div className="absolute top-4 right-4">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl">🏢</span>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-900">{firm.name}</div>
                          <div className="text-sm text-gray-600">{firm.templates?.length || 0} sizes disponibili</div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600">{firm.description}</p>

                      <div className="flex flex-wrap gap-2">
                        {firm.name === 'FUTURA FUNDING' && (
                          <Badge variant="outline" className="text-green-700 border-green-300">
                            No Consistency
                          </Badge>
                        )}
                        {firm.name === 'PROP NUMBER ONE' && (
                          <Badge variant="outline" className="text-blue-700 border-blue-300">
                            50/50 Rules
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-600">Nessuna PropFirm disponibile</div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Account Size Selection */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Seleziona Account Size</h2>
              <p className="text-gray-600">Scegli la size per {propFirms.find(f => f.id === selectedPropFirm)?.name}</p>
            </div>

            {(() => {
              const selectedFirm = propFirms.find(f => f.id === selectedPropFirm)
              return selectedFirm?.templates ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {selectedFirm.templates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`
                        p-4 rounded-xl text-center transition-all duration-200 hover:shadow-lg
                        ${selectedTemplate === template.id
                          ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                          : 'bg-white border-2 border-gray-200 text-gray-900 hover:border-blue-300'
                        }
                      `}
                    >
                      <div className="text-lg font-bold">
                        {formatCurrency(template.accountSize, template.currency)}
                      </div>
                      <div className="text-xs mt-1 opacity-75">
                        {template.name}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-600">Nessun template disponibile</div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Step 4: Phase Selection & Confirmation */}
        {currentStep === 4 && (
          <div className="space-y-8">
            {/* Phase Selection */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Seleziona la Fase</h2>
              <p className="text-gray-600">In quale fase ti trovi attualmente?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: 'PHASE_1', title: 'Phase 1', icon: '🎯', description: 'Valutazione iniziale' },
                { value: 'PHASE_2', title: 'Phase 2', icon: '🚀', description: 'Verifica avanzata' },
                { value: 'FUNDED', title: 'Funded', icon: '🏆', description: 'Account finanziato' }
              ].map(phase => (
                <div
                  key={phase.value}
                  onClick={() => setCurrentPhase(phase.value)}
                  className={`
                    cursor-pointer rounded-xl border-2 p-6 text-center transition-all duration-200 hover:shadow-lg
                    ${currentPhase === phase.value
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }
                  `}
                >
                  <div className="text-4xl mb-2">{phase.icon}</div>
                  <div className="text-lg font-bold text-gray-900">{phase.title}</div>
                  <div className="text-sm text-gray-600 mt-1">{phase.description}</div>
                  {currentPhase === phase.value && (
                    <div className="mt-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Confirmation Summary */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900 text-center">Riepilogo Configurazione</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600">Account</div>
                  <div className="font-bold">{selectedAccount?.login}</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600">PropFirm</div>
                  <div className="font-bold">{propFirms.find(f => f.id === selectedPropFirm)?.name}</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600">Size</div>
                  <div className="font-bold">
                    {(() => {
                      const firm = propFirms.find(f => f.id === selectedPropFirm)
                      const template = firm?.templates.find(t => t.id === selectedTemplate)
                      return template ? formatCurrency(template.accountSize, template.currency) : 'N/A'
                    })()}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600">Fase</div>
                  <div className="font-bold">{currentPhase}</div>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <Button 
                  onClick={() => setCurrentStep(3)}
                  variant="outline" 
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Indietro
                </Button>
                <Button 
                  onClick={handleAssignTemplate}
                  disabled={assigning}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {assigning ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Configurando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Conferma Configurazione</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  )
}