'use client'

/**
 * AUTOPILOT GENERATED - Excel Import Test Interface
 * Complete test interface for validating Excel import functionality
 * Provides comprehensive testing without manual navigation
 */

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileSpreadsheet,
  Database,
  Activity,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface TestResult {
  step: string
  status: 'pending' | 'running' | 'success' | 'error'
  message: string
  data?: any
}

interface Account {
  id: string
  name: string
  login: string
}

export default function TestExcelPage() {
  const [account, setAccount] = useState<Account | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  
  // Initialize test results
  const initializeTests = () => [
    { step: 'Account Verification', status: 'pending' as const, message: 'Checking account availability' },
    { step: 'File Upload', status: 'pending' as const, message: 'Waiting for Excel file' },
    { step: 'Excel Parsing Test', status: 'pending' as const, message: 'Testing Excel structure parsing' },
    { step: 'Database State Check', status: 'pending' as const, message: 'Checking current trade count' },
    { step: 'Excel Import', status: 'pending' as const, message: 'Importing trades to database' },
    { step: 'Import Verification', status: 'pending' as const, message: 'Verifying imported data' },
    { step: 'API Integration Test', status: 'pending' as const, message: 'Testing trades API response' }
  ]

  useEffect(() => {
    setTestResults(initializeTests())
    loadAccount()
  }, [])

  const loadAccount = async () => {
    try {
      updateTestResult(0, 'running', 'Loading account data...')
      
      const response = await fetch('/api/accounts')
      const accounts = await response.json()
      
      if (!Array.isArray(accounts) || accounts.length === 0) {
        updateTestResult(0, 'error', 'No accounts found in system')
        return
      }
      
      const selectedAccount = accounts[0]
      setAccount({
        id: selectedAccount.id,
        name: selectedAccount.name || selectedAccount.login,
        login: selectedAccount.login
      })
      
      updateTestResult(0, 'success', `Account loaded: ${selectedAccount.login} (${selectedAccount.name || 'No name'})`)
    } catch (error) {
      updateTestResult(0, 'error', `Account load failed: ${error}`)
    }
  }

  const updateTestResult = (index: number, status: TestResult['status'], message: string, data?: any) => {
    setTestResults(prev => prev.map((result, i) => 
      i === index ? { ...result, status, message, data } : result
    ))
  }

  const handleFileUpload = (file: File) => {
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.name.endsWith('.xlsx')
    
    if (!isExcel) {
      updateTestResult(1, 'error', 'Please select a valid Excel (.xlsx) file')
      return
    }
    
    setSelectedFile(file)
    updateTestResult(1, 'success', `Excel file selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`)
  }

  const runCompleteTest = async () => {
    if (!account || !selectedFile) {
      alert('Please ensure account is loaded and Excel file is selected')
      return
    }

    setIsRunning(true)
    
    try {
      // Step 3: Test Excel parsing
      updateTestResult(2, 'running', 'Testing Excel structure...')
      
      const testFormData = new FormData()
      testFormData.append('excelFile', selectedFile)
      
      const testResponse = await fetch(`/api/accounts/${account.id}/test-excel`, {
        method: 'POST',
        body: testFormData
      })
      
      const testResult = await testResponse.json()
      
      if (!testResponse.ok) {
        updateTestResult(2, 'error', `Parsing test failed: ${testResult.error}`)
        return
      }
      
      updateTestResult(2, 'success', 
        `Excel parsed successfully: ${testResult.debug.tradeRowsFound} trades found in ${testResult.debug.totalRows} rows`,
        testResult.debug
      )

      // Step 4: Check database state
      updateTestResult(3, 'running', 'Checking database state...')
      
      const debugResponse = await fetch(`/api/accounts/${account.id}/debug-trades`)
      const debugResult = await debugResponse.json()
      
      if (!debugResponse.ok) {
        updateTestResult(3, 'error', `Database check failed: ${debugResult.error}`)
        return
      }
      
      updateTestResult(3, 'success', 
        `Database state: ${debugResult.debug.tradeCounts.total} total trades (${debugResult.debug.tradeCounts.closed} closed, ${debugResult.debug.tradeCounts.open} open)`,
        debugResult.debug
      )

      // Step 5: Import Excel data
      updateTestResult(4, 'running', 'Importing Excel data...')
      
      const importFormData = new FormData()
      importFormData.append('excelFile', selectedFile)
      importFormData.append('options', JSON.stringify({
        clearExisting: true,
        mode: 'import'
      }))
      
      const importResponse = await fetch(`/api/accounts/${account.id}/sync-excel`, {
        method: 'POST',
        body: importFormData
      })
      
      const importResult = await importResponse.json()
      
      if (!importResponse.ok) {
        updateTestResult(4, 'error', `Import failed: ${importResult.error}`)
        if (importResult.debug) {
          console.error('Import debug info:', importResult.debug)
        }
        return
      }
      
      updateTestResult(4, 'success', 
        `Import completed: ${importResult.result.imported.closedTrades} trades imported, ${importResult.result.errors.length} errors`,
        importResult.result
      )

      // Step 6: Verify import
      updateTestResult(5, 'running', 'Verifying import results...')
      
      const postImportDebug = await fetch(`/api/accounts/${account.id}/debug-trades`)
      const postImportResult = await postImportDebug.json()
      
      updateTestResult(5, 'success', 
        `Import verified: ${postImportResult.debug.tradeCounts.total} total trades in database`,
        postImportResult.debug
      )

      // Step 7: Test API integration
      updateTestResult(6, 'running', 'Testing trades API...')
      
      const tradesResponse = await fetch(`/api/accounts/${account.id}/trades?limit=1000`)
      const tradesResult = await tradesResponse.json()
      
      if (!tradesResponse.ok) {
        updateTestResult(6, 'error', `Trades API failed: ${tradesResult.error}`)
        return
      }
      
      updateTestResult(6, 'success', 
        `API test successful: ${tradesResult.trades?.length || 0} trades accessible via API`,
        { sampleTrade: tradesResult.trades?.[0] }
      )

    } catch (error) {
      const runningStep = testResults.findIndex(r => r.status === 'running')
      if (runningStep >= 0) {
        updateTestResult(runningStep, 'error', `Unexpected error: ${error}`)
      }
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-gray-400" />
      case 'running': return <Activity className="h-4 w-4 text-blue-500 animate-spin" />
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-50 border-gray-200'
      case 'running': return 'bg-blue-50 border-blue-200'
      case 'success': return 'bg-green-50 border-green-200'
      case 'error': return 'bg-red-50 border-red-200'
    }
  }

  const allTestsPassed = testResults.every(r => r.status === 'success')
  const hasErrors = testResults.some(r => r.status === 'error')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Settings
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Excel Import Test Suite</h1>
            </div>
          </div>
          {allTestsPassed && (
            <Badge variant="default" className="bg-green-600">
              All Tests Passed ✅
            </Badge>
          )}
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Test Environment</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {account ? (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Account ID:</span>
                  <span className="ml-2 font-mono">{account.id.slice(0, 12)}...</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Login:</span>
                  <span className="ml-2">{account.login}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Name:</span>
                  <span className="ml-2">{account.name}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Loading account information...</p>
            )}
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Excel File Upload</span>
            </CardTitle>
            <CardDescription>
              Upload the MT5 Excel report file for testing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
                className="hidden"
                id="excel-upload"
              />
              <label htmlFor="excel-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 font-medium">
                  {selectedFile ? selectedFile.name : 'Click to select Excel file'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  .xlsx format only
                </p>
              </label>
            </div>
            
            <div className="mt-4 flex space-x-4">
              <Button
                onClick={runCompleteTest}
                disabled={!account || !selectedFile || isRunning}
                className="flex-1"
                size="lg"
              >
                <Play className="h-4 w-4 mr-2" />
                {isRunning ? 'Running Tests...' : 'Run Complete Test Suite'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Comprehensive Excel import functionality testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <h4 className="font-medium">{result.step}</h4>
                      <p className="text-sm text-gray-600">{result.message}</p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    Step {index + 1}
                  </Badge>
                </div>
                
                {result.data && result.status === 'success' && (
                  <div className="mt-3 p-3 bg-white rounded border">
                    <details>
                      <summary className="cursor-pointer text-sm font-medium text-blue-600">
                        View Details
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Summary */}
        {(allTestsPassed || hasErrors) && (
          <Alert>
            <AlertDescription className="text-center">
              {allTestsPassed ? (
                <span className="text-green-700 font-medium">
                  🎉 All tests passed! Excel import functionality is working correctly.
                </span>
              ) : hasErrors ? (
                <span className="text-red-700 font-medium">
                  ❌ Some tests failed. Check the results above for details.
                </span>
              ) : null}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}