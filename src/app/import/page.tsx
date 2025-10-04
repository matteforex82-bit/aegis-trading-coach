'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Upload, FileText, RotateCcw, AlertCircle, DollarSign, CheckCircle, Trash2, Home, ChevronRight } from 'lucide-react'
import Link from 'next/link'

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

export default function ImportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)
  
  // MT5 Sync states
  const [reportFile, setReportFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<'html' | 'excel'>('html')
  const [syncMode, setSyncMode] = useState<'preview' | 'import'>('preview')
  const [clearBeforeSync, setClearBeforeSync] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)
  
  // Delete account states
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    fetchAccounts()
  }, [session, status, router])

  const fetchAccounts = async () => {
    if (!session?.user?.email) {
      setLoading(false)
      return
    }
    
    try {
      const accountsResponse = await fetch('/api/accounts')
      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json()
        const accountsArray = Array.isArray(accountsData) ? accountsData : []
        setAccounts(accountsArray)
        if (accountsArray.length > 0) {
          setSelectedAccount(accountsArray[0])
        }
      } else if (accountsResponse.status === 401) {
        router.push('/auth/signin')
        return
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
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

  // MT5 Sync functions
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
          await fetchAccounts() // Refresh data
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
        await fetchAccounts()
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Home className="h-4 w-4" />
            <Link href="/" className="hover:text-blue-600 transition-colors">Dashboard</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">Import & Management</span>
          </div>
          
          {/* Title & Description */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📊 Import & Account Management
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl">
              Importa dati di trading dai report MT5 e gestisci i tuoi account con parsing avanzato
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - MT5 Import */}
          <div className="space-y-6">
            {/* Account Selector */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Seleziona Account</span>
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Scegli l'account per l'importazione dati
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <Select
                  value={selectedAccount?.id || ''}
                  onValueChange={(value) => {
                    const account = accounts.find(a => a.id === value)
                    setSelectedAccount(account || null)
                  }}
                >
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="🎯 Seleziona account MT5" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts && accounts.length > 0 ? (
                      accounts.map(account => (
                        <SelectItem key={account.id} value={account.id} className="text-base p-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <DollarSign className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium">{account.name || account.login}</div>
                              <div className="text-sm text-gray-500">Login: {account.login}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-accounts" disabled>
                        Nessun account trovato
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* MT5 Sync Section */}
            {selectedAccount && (
              <Card className="shadow-lg border-blue-200">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <RotateCcw className="h-5 w-5" />
                    </div>
                    <div>
                      <span>📊 Sincronizzazione MT5</span>
                      <div className="text-sm text-blue-100 font-normal mt-1">
                        Account: {selectedAccount.login}
                      </div>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Importa i dati di trading dai report MT5 con parsing avanzato
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  
                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Report MT5 ({fileType === 'html' ? 'HTML' : 'Excel'})</Label>
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
                        <Label className="text-base font-medium">Modalità Sincronizzazione</Label>
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
                          className="w-full h-11"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          🔬 Test Parsing Excel
                        </Button>
                        
                        <Button
                          onClick={handleSyncReport}
                          disabled={syncing}
                          className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-semibold"
                        >
                          {syncing ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>🔄 Sincronizzando...</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <RotateCcw className="h-4 w-4" />
                              <span>{syncMode === 'preview' ? '👀 Anteprima Dati' : '💾 Importa Dati'}</span>
                            </div>
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
                          
                          {/* Advanced Debug Info */}
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
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Account Management */}
          <div className="space-y-6">
            
            {/* Current Account Info */}
            {selectedAccount && (
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5" />
                    <span>Account Selezionato</span>
                  </CardTitle>
                  <CardDescription className="text-green-100">
                    Informazioni account attualmente in uso
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <DollarSign className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                        <div className="text-sm text-gray-600">Account</div>
                        <div className="font-bold text-blue-600">{selectedAccount.login}</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                        <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                        <div className="text-sm text-gray-600">Stato</div>
                        <div className="font-bold text-green-600">
                          {selectedAccount.propFirmTemplate ? 'Configurato' : 'Non configurato'}
                        </div>
                      </div>
                    </div>
                    
                    {selectedAccount.propFirmTemplate && (
                      <div className="space-y-3">
                        <Separator />
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">PropFirm:</span>
                          <span className="font-medium">{selectedAccount.propFirmTemplate.propFirm.name}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Account Size:</span>
                          <span className="font-medium">{formatCurrency(selectedAccount.propFirmTemplate.accountSize)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Fase:</span>
                          <Badge variant="secondary" className="px-3 py-1">{selectedAccount.currentPhase}</Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delete Account Section */}
            {selectedAccount && (
              <Card className="shadow-lg border-2 border-red-200">
                <CardHeader className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Trash2 className="h-5 w-5" />
                    </div>
                    <div>
                      <span>⚠️ Zona Pericolosa</span>
                      <div className="text-sm text-red-100 font-normal mt-1">
                        Account: {selectedAccount.login}
                      </div>
                    </div>
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
                          setDeleteConfirmText('')
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
        </div>
      </div>
    </div>
  )
}