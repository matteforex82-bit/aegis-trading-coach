import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'

interface ParsedTrade {
  ticketId: string
  symbol: string
  side: 'buy' | 'sell'
  volume: number
  openPrice: number
  closePrice?: number
  openTime: string
  closeTime?: string
  pnlGross: number
  swap: number
  commission: number
  comment?: string
}

interface ParsedOpenPosition {
  ticketId: string
  symbol: string
  side: 'buy' | 'sell'
  volume: number
  openPrice: number
  openTime: string
  currentPnL: number
  swap: number
  comment?: string
}

interface SyncOptions {
  clearExisting: boolean
  mode: 'import' | 'verify' | 'preview'
}

//+------------------------------------------------------------------+
//| POST /api/accounts/[id]/sync-excel - Sync MT5 Excel Report     |\n//+------------------------------------------------------------------+
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: accountId } = params
    const formData = await request.formData()
    const excelFile = formData.get('excelFile') as File
    const options = JSON.parse(formData.get('options') as string) as SyncOptions

    if (!excelFile) {
      return NextResponse.json({ error: 'No Excel file provided' }, { status: 400 })
    }

    // Verify account exists
    const account = await db.account.findUnique({
      where: { id: accountId },
      select: { id: true, login: true, name: true }
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Read and parse Excel content
    const arrayBuffer = await excelFile.arrayBuffer()
    console.log('📄 Parsing MT5 Excel report...')

    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const parsedData = parseExcelReport(workbook)

    // Validate parsed data
    if (!parsedData.accountLogin) {
      console.error('❌ Account login not found in Excel')
      console.error('📋 Debug info:', {
        accountName: parsedData.accountName,
        reportDate: parsedData.reportDate,
        sheets: workbook.SheetNames
      })
      
      return NextResponse.json({ 
        error: 'Invalid MT5 report: Account login not found',
        debug: {
          parsedName: parsedData.accountName,
          parsedDate: parsedData.reportDate,
          availableSheets: workbook.SheetNames,
          help: 'Check if your Excel report contains the account number in the Account Summary sheet'
        }
      }, { status: 400 })
    }

    // Verify account login matches
    if (parsedData.accountLogin !== account.login) {
      return NextResponse.json({ 
        error: `Account mismatch: Report is for ${parsedData.accountLogin}, but selected account is ${account.login}` 
      }, { status: 400 })
    }

    console.log(`✅ Parsed ${parsedData.closedTrades.length} closed trades and ${parsedData.openPositions.length} open positions`)

    // Handle different modes
    switch (options.mode) {
      case 'preview':
        return NextResponse.json({
          success: true,
          data: {
            accountInfo: {
              login: parsedData.accountLogin,
              name: parsedData.accountName,
              reportDate: parsedData.reportDate
            },
            summary: {
              closedTrades: parsedData.closedTrades.length,
              openPositions: parsedData.openPositions.length,
              totalPnL: parsedData.summary.totalNetProfit,
              balance: parsedData.summary.balance,
              equity: parsedData.summary.equity,
              floatingPnL: parsedData.summary.floatingPnL
            },
            trades: parsedData.closedTrades.slice(0, 5), // First 5 for preview
            positions: parsedData.openPositions
          }
        })

      case 'verify':
        const verification = await verifyDataConsistency(accountId, parsedData)
        return NextResponse.json({
          success: true,
          verification
        })

      case 'import':
        const importResult = await importDataToDatabase(accountId, parsedData, options.clearExisting)
        return NextResponse.json({
          success: true,
          result: importResult
        })

      default:
        return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('❌ Error syncing Excel:', error)
    return NextResponse.json({ 
      error: 'Failed to sync Excel report',
      details: error.message 
    }, { status: 500 })
  }
}

function parseExcelReport(workbook: XLSX.WorkBook) {
  console.log('🔍 Excel Parser - Available sheets:', workbook.SheetNames)
  
  let accountLogin = ''
  let accountName = ''
  let reportDate = ''
  
  // Try to find account info from different possible sheet names
  const summarySheetNames = ['Account Summary', 'Summary', 'Account', 'Info', 'Report']
  let summarySheet: XLSX.WorkSheet | null = null
  
  for (const sheetName of summarySheetNames) {
    const exactMatch = workbook.SheetNames.find(s => s.toLowerCase() === sheetName.toLowerCase())
    if (exactMatch) {
      summarySheet = workbook.Sheets[exactMatch]
      console.log(`✅ Found summary sheet: ${exactMatch}`)
      break
    }
  }
  
  // If no exact match, try partial match
  if (!summarySheet) {
    const partialMatch = workbook.SheetNames.find(s => 
      s.toLowerCase().includes('summary') || 
      s.toLowerCase().includes('account') ||
      s.toLowerCase().includes('info')
    )
    if (partialMatch) {
      summarySheet = workbook.Sheets[partialMatch]
      console.log(`✅ Found summary sheet (partial): ${partialMatch}`)
    }
  }
  
  // Use first sheet as fallback
  if (!summarySheet && workbook.SheetNames.length > 0) {
    summarySheet = workbook.Sheets[workbook.SheetNames[0]]
    console.log(`⚠️ Using first sheet as fallback: ${workbook.SheetNames[0]}`)
  }
  
  if (summarySheet) {
    const summaryData = XLSX.utils.sheet_to_json(summarySheet, { header: 1 }) as any[][]
    
    // Search for account info in the summary data
    for (let i = 0; i < summaryData.length; i++) {
      const row = summaryData[i] || []
      
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').toLowerCase()
        const nextCell = String(row[j + 1] || '')
        
        // Look for Account field
        if (cell.includes('account') && !cell.includes('type')) {
          const accountMatch = nextCell.match(/(\d{4,})/)?.[1]
          if (accountMatch) {
            accountLogin = accountMatch
            console.log('✅ Found account login:', accountLogin)
          }
        }
        
        // Look for Name field
        if (cell.includes('name') && !accountLogin) {
          accountName = nextCell.trim()
          console.log('✅ Found account name:', accountName)
        }
        
        // Look for date
        if (cell.includes('date') || cell.includes('report')) {
          reportDate = nextCell
          console.log('✅ Found report date:', reportDate)
        }
      }
    }
  }

  // Parse closed trades
  const closedTrades: ParsedTrade[] = []
  const tradesSheetNames = ['Closed Trades', 'Trades', 'History', 'Positions']
  let tradesSheet: XLSX.WorkSheet | null = null
  
  for (const sheetName of tradesSheetNames) {
    const exactMatch = workbook.SheetNames.find(s => s.toLowerCase() === sheetName.toLowerCase())
    if (exactMatch) {
      tradesSheet = workbook.Sheets[exactMatch]
      console.log(`✅ Found trades sheet: ${exactMatch}`)
      break
    }
  }
  
  if (tradesSheet) {
    const tradesData = XLSX.utils.sheet_to_json(tradesSheet, { header: 1 }) as any[][]
    
    // Find header row
    let headerRowIndex = -1
    for (let i = 0; i < tradesData.length; i++) {
      const row = tradesData[i] || []
      const rowStr = row.join('').toLowerCase()
      if (rowStr.includes('ticket') || rowStr.includes('position') || rowStr.includes('symbol')) {
        headerRowIndex = i
        break
      }
    }
    
    if (headerRowIndex >= 0) {
      const headers = tradesData[headerRowIndex].map((h: any) => String(h || '').toLowerCase())
      console.log('📋 Trade headers:', headers)
      
      // Map column indices
      const ticketCol = headers.findIndex(h => h.includes('ticket') || h.includes('position'))
      const symbolCol = headers.findIndex(h => h.includes('symbol'))
      const sideCol = headers.findIndex(h => h.includes('type') || h.includes('side'))
      const volumeCol = headers.findIndex(h => h.includes('volume') || h.includes('lots'))
      const openPriceCol = headers.findIndex(h => h.includes('open') && h.includes('price'))
      const closePriceCol = headers.findIndex(h => h.includes('close') && h.includes('price'))
      const openTimeCol = headers.findIndex(h => h.includes('open') && h.includes('time'))
      const closeTimeCol = headers.findIndex(h => h.includes('close') && h.includes('time'))
      const pnlCol = headers.findIndex(h => h.includes('profit') || h.includes('pnl'))
      const swapCol = headers.findIndex(h => h.includes('swap'))
      const commissionCol = headers.findIndex(h => h.includes('commission'))
      
      // Parse trade rows
      for (let i = headerRowIndex + 1; i < tradesData.length; i++) {
        const row = tradesData[i] || []
        
        if (row.length === 0) continue
        
        const ticketId = String(row[ticketCol] || '')
        const symbol = String(row[symbolCol] || '')
        
        if (!ticketId || !symbol || ticketId === 'Total') continue
        
        const side = String(row[sideCol] || '').toLowerCase().includes('sell') ? 'sell' : 'buy'
        const volume = parseFloat(String(row[volumeCol] || '0')) || 0
        const openPrice = parseFloat(String(row[openPriceCol] || '0')) || 0
        const closePrice = parseFloat(String(row[closePriceCol] || '0')) || 0
        const openTime = convertExcelDate(row[openTimeCol])
        const closeTime = convertExcelDate(row[closeTimeCol])
        const pnlGross = parseFloat(String(row[pnlCol] || '0')) || 0
        const swap = parseFloat(String(row[swapCol] || '0')) || 0
        const commission = parseFloat(String(row[commissionCol] || '0')) || 0
        
        if (closeTime) {
          closedTrades.push({
            ticketId,
            symbol,
            side,
            volume,
            openPrice,
            closePrice,
            openTime,
            closeTime,
            pnlGross: pnlGross - swap - commission,
            swap,
            commission,
            comment: ''
          })
        }
      }
    }
  }
  
  // Parse open positions (similar logic but for open positions sheet)
  const openPositions: ParsedOpenPosition[] = []
  const openSheetNames = ['Open Positions', 'Open', 'Current Positions']
  let openSheet: XLSX.WorkSheet | null = null
  
  for (const sheetName of openSheetNames) {
    const exactMatch = workbook.SheetNames.find(s => s.toLowerCase() === sheetName.toLowerCase())
    if (exactMatch) {
      openSheet = workbook.Sheets[exactMatch]
      console.log(`✅ Found open positions sheet: ${exactMatch}`)
      break
    }
  }
  
  if (openSheet) {
    const openData = XLSX.utils.sheet_to_json(openSheet, { header: 1 }) as any[][]
    
    // Similar parsing logic for open positions
    let headerRowIndex = -1
    for (let i = 0; i < openData.length; i++) {
      const row = openData[i] || []
      const rowStr = row.join('').toLowerCase()
      if (rowStr.includes('ticket') || rowStr.includes('position') || rowStr.includes('symbol')) {
        headerRowIndex = i
        break
      }
    }
    
    if (headerRowIndex >= 0) {
      const headers = openData[headerRowIndex].map((h: any) => String(h || '').toLowerCase())
      
      const ticketCol = headers.findIndex(h => h.includes('ticket') || h.includes('position'))
      const symbolCol = headers.findIndex(h => h.includes('symbol'))
      const sideCol = headers.findIndex(h => h.includes('type') || h.includes('side'))
      const volumeCol = headers.findIndex(h => h.includes('volume') || h.includes('lots'))
      const openPriceCol = headers.findIndex(h => h.includes('open') && h.includes('price'))
      const openTimeCol = headers.findIndex(h => h.includes('open') && h.includes('time'))
      const pnlCol = headers.findIndex(h => h.includes('profit') || h.includes('pnl'))
      const swapCol = headers.findIndex(h => h.includes('swap'))
      
      for (let i = headerRowIndex + 1; i < openData.length; i++) {
        const row = openData[i] || []
        
        if (row.length === 0) continue
        
        const ticketId = String(row[ticketCol] || '')
        const symbol = String(row[symbolCol] || '')
        
        if (!ticketId || !symbol) continue
        
        const side = String(row[sideCol] || '').toLowerCase().includes('sell') ? 'sell' : 'buy'
        const volume = parseFloat(String(row[volumeCol] || '0')) || 0
        const openPrice = parseFloat(String(row[openPriceCol] || '0')) || 0
        const openTime = convertExcelDate(row[openTimeCol])
        const currentPnL = parseFloat(String(row[pnlCol] || '0')) || 0
        const swap = parseFloat(String(row[swapCol] || '0')) || 0
        
        openPositions.push({
          ticketId,
          symbol,
          side,
          volume,
          openPrice,
          openTime,
          currentPnL,
          swap,
          comment: ''
        })
      }
    }
  }
  
  // Extract summary data from summary sheet
  let balance = 0
  let equity = 0
  let floatingPnL = 0
  let totalNetProfit = 0
  
  if (summarySheet) {
    const summaryData = XLSX.utils.sheet_to_json(summarySheet, { header: 1 }) as any[][]
    
    for (let i = 0; i < summaryData.length; i++) {
      const row = summaryData[i] || []
      
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').toLowerCase()
        const nextCell = String(row[j + 1] || '').replace(/[^0-9.-]/g, '')
        
        if (cell.includes('balance') && !cell.includes('initial')) {
          balance = parseFloat(nextCell) || 0
        }
        if (cell.includes('equity')) {
          equity = parseFloat(nextCell) || 0
        }
        if (cell.includes('floating') && cell.includes('p/l')) {
          floatingPnL = parseFloat(nextCell) || 0
        }
        if (cell.includes('total') && cell.includes('profit')) {
          totalNetProfit = parseFloat(nextCell) || 0
        }
      }
    }
  }

  console.log(`📊 Final Excel Results:`)
  console.log(`   Account: "${accountLogin}"`)
  console.log(`   Name: "${accountName}"`)
  console.log(`   Date: "${reportDate}"`)
  console.log(`   Closed Trades: ${closedTrades.length}`)
  console.log(`   Open Positions: ${openPositions.length}`)

  return {
    accountLogin,
    accountName,
    reportDate,
    closedTrades,
    openPositions,
    summary: {
      balance,
      equity,
      floatingPnL,
      totalNetProfit
    }
  }
}

function convertExcelDate(dateValue: any): string {
  if (!dateValue) return new Date().toISOString()
  
  try {
    // Handle Excel date serial number
    if (typeof dateValue === 'number') {
      const excelEpoch = new Date(1900, 0, 1)
      const date = new Date(excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000)
      return date.toISOString()
    }
    
    // Handle string dates
    if (typeof dateValue === 'string') {
      // Try various date formats
      const formats = [
        /(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/, // MT5 format
        /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/, // US format
        /(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/, // European format
      ]
      
      for (const format of formats) {
        const match = dateValue.match(format)
        if (match) {
          const [, p1, p2, p3, h, m, s] = match
          let year, month, day
          
          if (format === formats[0]) { // MT5 format YYYY.MM.DD
            [year, month, day] = [p1, p2, p3]
          } else { // Other formats MM/DD/YYYY or DD-MM-YYYY
            [month, day, year] = [p2, p1, p3]
          }
          
          const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${h}:${m}:${s}`)
          return date.toISOString()
        }
      }
      
      // Try direct parsing as last resort
      const date = new Date(dateValue)
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }
    }
    
    return new Date().toISOString()
  } catch (error) {
    console.error('Error converting Excel date:', dateValue, error)
    return new Date().toISOString()
  }
}

async function verifyDataConsistency(accountId: string, parsedData: any) {
  const existingClosedTrades = await db.trade.findMany({
    where: { accountId, closeTime: { not: null } }
  })

  const existingOpenTrades = await db.trade.findMany({
    where: { accountId, closeTime: null }
  })

  return {
    closedTrades: {
      existing: existingClosedTrades.length,
      parsed: parsedData.closedTrades.length,
      match: existingClosedTrades.length === parsedData.closedTrades.length
    },
    openPositions: {
      existing: existingOpenTrades.length,
      parsed: parsedData.openPositions.length,
      match: existingOpenTrades.length === parsedData.openPositions.length
    },
    recommendations: []
  }
}

async function importDataToDatabase(accountId: string, parsedData: any, clearExisting: boolean) {
  const results = {
    cleared: { trades: 0, challenges: 0, metrics: 0 },
    imported: { closedTrades: 0, openPositions: 0 },
    errors: [] as string[]
  }

  // Clear existing data if requested
  if (clearExisting) {
    console.log('🧹 Clearing existing data...')
    const deletedTrades = await db.trade.deleteMany({ where: { accountId } })
    const deletedChallenges = await db.challenge.deleteMany({ where: { accountId } })
    const deletedMetrics = await db.metric.deleteMany({ where: { accountId } })
    
    results.cleared = {
      trades: deletedTrades.count,
      challenges: deletedChallenges.count,
      metrics: deletedMetrics.count
    }
  }

  // Import closed trades
  for (const trade of parsedData.closedTrades) {
    try {
      await db.trade.create({
        data: {
          accountId,
          ticketId: trade.ticketId,
          symbol: trade.symbol,
          side: trade.side,
          volume: trade.volume,
          openPrice: trade.openPrice,
          closePrice: trade.closePrice,
          openTime: trade.openTime,
          closeTime: trade.closeTime,
          pnlGross: trade.pnlGross,
          swap: trade.swap,
          commission: trade.commission,
          comment: trade.comment || ''
        }
      })
      results.imported.closedTrades++
    } catch (error: any) {
      results.errors.push(`Failed to import trade ${trade.ticketId}: ${error.message}`)
    }
  }

  // Import open positions
  for (const position of parsedData.openPositions) {
    try {
      await db.trade.create({
        data: {
          accountId,
          ticketId: position.ticketId,
          symbol: position.symbol,
          side: position.side,
          volume: position.volume,
          openPrice: position.openPrice,
          openTime: position.openTime,
          closePrice: null,
          closeTime: null,
          pnlGross: position.currentPnL - position.swap,
          swap: position.swap,
          commission: 0,
          comment: position.comment || ''
        }
      })
      results.imported.openPositions++
    } catch (error: any) {
      results.errors.push(`Failed to import position ${position.ticketId}: ${error.message}`)
    }
  }

  console.log(`✅ Import completed: ${results.imported.closedTrades} trades, ${results.imported.openPositions} positions`)
  return results
}