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
  
  // Use the first sheet (most MT5 exports use a single sheet)
  const mainSheet = workbook.Sheets[workbook.SheetNames[0]]
  console.log(`📋 Using sheet: ${workbook.SheetNames[0]}`)
  
  if (!mainSheet) {
    throw new Error('No sheet found in Excel file')
  }
  
  // Parse the main sheet data
  const mainData = XLSX.utils.sheet_to_json(mainSheet, { header: 1 }) as any[][]
  console.log(`📊 Total rows in sheet: ${mainData.length}`)
  
  // DEBUG: Print first 20 rows to understand structure
  console.log('🔍 DEBUG - First 20 rows of Excel data:')
  for (let i = 0; i < Math.min(mainData.length, 20); i++) {
    const row = mainData[i] || []
    console.log(`Row ${i}:`, row.slice(0, 5)) // Show first 5 columns of each row
  }
  
  // Search for account info in the data
  for (let i = 0; i < Math.min(mainData.length, 50); i++) { // Check first 50 rows for account info
    const row = mainData[i] || []
    
    // DEBUG: Log each row we're checking
    console.log(`🔍 Checking row ${i}:`, row.slice(0, 3))
    
    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] || '').toLowerCase().trim()
      const nextCell = String(row[j + 1] || '').trim()
      
      // DEBUG: Log cells that contain 'account'
      if (cell.includes('account')) {
        console.log(`🔍 Found 'account' in cell [${i}][${j}]: "${cell}" -> next: "${nextCell}"`)
      }
      
      // Look for Account field - more flexible matching
      if (cell.includes('account') && !cell.includes('type') && !cell.includes('report')) {
        console.log(`🔍 Trying to extract account from: "${nextCell}"`)
        const accountMatch = nextCell.match(/(\d{4,})/)?.[1]
        if (accountMatch) {
          accountLogin = accountMatch
          console.log('✅ Found account login:', accountLogin)
        } else {
          console.log('❌ No account number found in:', nextCell)
        }
      }
      
      // Look for Name field
      if (cell.includes('name') && nextCell && !accountName) {
        accountName = nextCell.trim()
        console.log('✅ Found account name:', accountName)
      }
      
      // Look for date
      if (cell.includes('date') && nextCell) {
        reportDate = nextCell
        console.log('✅ Found report date:', reportDate)
      }
    }
    
    // Stop early if we found account login
    if (accountLogin) break
  }
  
  console.log(`🔍 After search - Account: "${accountLogin}", Name: "${accountName}", Date: "${reportDate}"`)
  
  // FALLBACK: If we didn't find account login, search more aggressively
  if (!accountLogin) {
    console.log('🔍 FALLBACK: Searching for account number in all text...')
    
    // Search in all cells of first 50 rows for any 4+ digit number
    for (let i = 0; i < Math.min(mainData.length, 50); i++) {
      const row = mainData[i] || []
      const rowText = row.join(' ')
      
      // Look for patterns like "2958" or "Account: 2958" anywhere in the row
      const numberMatches = rowText.match(/\b(\d{4,})\b/g)
      if (numberMatches) {
        console.log(`🔍 Found numbers in row ${i}: ${numberMatches}`)
        
        // Take the first 4+ digit number we find
        accountLogin = numberMatches[0]
        console.log('✅ Using first number found as account:', accountLogin)
        break
      }
    }
  }

  // Parse closed trades from the main sheet
  const closedTrades: ParsedTrade[] = []
  
  // Find the "Positions" section header
  let positionsHeaderIndex = -1
  for (let i = 0; i < mainData.length; i++) {
    const row = mainData[i] || []
    const rowStr = row.join('').toLowerCase()
    console.log(`🔍 Checking row ${i} for 'positions': "${rowStr.substring(0, 50)}..."`)
    if (rowStr.includes('positions') && !rowStr.includes('open')) {
      positionsHeaderIndex = i
      console.log(`✅ Found Positions section at row ${i}`)
      break
    }
  }
  
  console.log(`🔍 Positions header index: ${positionsHeaderIndex}`)
  
  if (positionsHeaderIndex >= 0) {
    // Find the actual header row (next row with column names)
    let headerRowIndex = -1
    for (let i = positionsHeaderIndex + 1; i < Math.min(positionsHeaderIndex + 5, mainData.length); i++) {
      const row = mainData[i] || []
      const rowStr = row.join('').toLowerCase()
      if (rowStr.includes('time') && (rowStr.includes('position') || rowStr.includes('symbol'))) {
        headerRowIndex = i
        console.log(`✅ Found header row at ${i}`)
        break
      }
    }
    
    if (headerRowIndex >= 0) {
      const headers = mainData[headerRowIndex].map((h: any) => String(h || '').toLowerCase().trim())
      console.log('📋 Trade headers:', headers)
      
      // Map column indices based on MT5 standard columns
      const openTimeCol = 0  // Time column is usually first
      const ticketCol = 1    // Position column is usually second
      const symbolCol = 2    // Symbol column is usually third
      const sideCol = 3      // Type column is usually fourth
      const volumeCol = 4    // Volume column
      const openPriceCol = 5 // Price column
      const slCol = 6        // S/L column
      const tpCol = 7        // T/P column
      const closeTimeCol = 8 // Close Time column
      const closePriceCol = 9 // Close Price column
      const commissionCol = 10 // Commission column
      const swapCol = 11     // Swap column
      const pnlCol = 12      // Profit column
      
      console.log(`📋 Column mapping: Time(${openTimeCol}), Ticket(${ticketCol}), Symbol(${symbolCol}), Type(${sideCol})`)
      
      // Parse trade rows after header
      for (let i = headerRowIndex + 1; i < mainData.length; i++) {
        const row = mainData[i] || []
        
        console.log(`🔍 Processing trade row ${i}:`, row.slice(0, 8))
        
        // Stop if we reach Orders section or empty rows
        if (row.length === 0 || String(row[0] || '').toLowerCase().includes('orders')) {
          console.log(`📋 Stopping at row ${i} - reached Orders section or empty row`)
          break
        }
        
        const ticketId = String(row[ticketCol] || '')
        const symbol = String(row[symbolCol] || '')
        
        console.log(`🔍 Trade data - Ticket: "${ticketId}", Symbol: "${symbol}"`)
        
        // Skip header rows or empty rows
        if (!ticketId || !symbol || ticketId.toLowerCase().includes('position') || ticketId.toLowerCase().includes('time')) {
          console.log(`⏭️ Skipping row ${i} - invalid ticket/symbol`)
          continue
        }
        
        const side = String(row[sideCol] || '').toLowerCase().includes('sell') ? 'sell' : 'buy'
        const volume = parseFloat(String(row[volumeCol] || '0').replace(',', '.')) || 0
        const openPrice = parseFloat(String(row[openPriceCol] || '0').replace(',', '.')) || 0
        const closePrice = parseFloat(String(row[closePriceCol] || '0').replace(',', '.')) || 0
        const openTime = convertExcelDate(row[openTimeCol])
        const closeTime = convertExcelDate(row[closeTimeCol])
        const pnlGross = parseFloat(String(row[pnlCol] || '0').replace(',', '.')) || 0
        const swap = parseFloat(String(row[swapCol] || '0').replace(',', '.')) || 0
        const commission = parseFloat(String(row[commissionCol] || '0').replace(',', '.')) || 0
        
        console.log(`🔍 Trade parsed - Side: ${side}, Volume: ${volume}, OpenPrice: ${openPrice}, ClosePrice: ${closePrice}`)
        console.log(`🔍 Raw times - Open: "${row[openTimeCol]}", Close: "${row[closeTimeCol]}"`)
        console.log(`🔍 Converted times - Open: ${openTime}, Close: ${closeTime}`)
        console.log(`🔍 P&L - Gross: ${pnlGross}, Swap: ${swap}, Commission: ${commission}`)
        
        // FIXED: Check if we have close price and close time data, or if row has enough columns indicating closed trade
        const hasCloseTime = row[closeTimeCol] && String(row[closeTimeCol]).trim() !== ''
        const hasClosePrice = closePrice && closePrice > 0
        
        console.log(`🔍 Close validation - hasCloseTime: ${hasCloseTime}, hasClosePrice: ${hasClosePrice}`)
        
        // Only add if this looks like a completed trade (has close data)
        if (ticketId && symbol && (hasCloseTime || hasClosePrice)) {
          // Ensure we have a proper closeTime - if not provided, use openTime + 1 hour as fallback
          const finalCloseTime = hasCloseTime ? closeTime : (hasClosePrice ? openTime : closeTime)
          
          closedTrades.push({
            ticketId,
            symbol,
            side,
            volume,
            openPrice,
            closePrice,
            openTime,
            closeTime: finalCloseTime,
            pnlGross: pnlGross - swap - commission,
            swap,
            commission,
            comment: ''
          })
          console.log(`✅ Added trade: ${ticketId} ${symbol} ${side} ${volume} - CloseTime: ${finalCloseTime}`)
        } else {
          console.log(`❌ Rejected trade - Missing closeTime or invalid data`)
        }
      }
    }
  }
  
  // Parse open positions - for now, skip since MT5 typically doesn't include open positions in historical reports
  const openPositions: ParsedOpenPosition[] = []
  
  // Note: Most MT5 exports are historical and don't include current open positions
  // Open positions would typically be in a separate export or live data
  console.log('📋 Open positions parsing skipped for historical MT5 report')
  
  // Extract summary data - calculate from trades for historical reports
  let balance = 0
  let equity = 0
  let floatingPnL = 0
  let totalNetProfit = 0
  
  // Calculate total P&L from closed trades
  totalNetProfit = closedTrades.reduce((sum, trade) => sum + trade.pnlGross + trade.swap + trade.commission, 0)
  
  // For historical reports, balance and equity are often the same as final P&L
  balance = totalNetProfit
  equity = totalNetProfit
  floatingPnL = 0 // No floating P&L in historical reports
  
  console.log(`📊 Summary calculated: ${closedTrades.length} trades, Total P&L: ${totalNetProfit}`)

  console.log(`📊 Final Excel Results:`)
  console.log(`   Account: "${accountLogin}"`)
  console.log(`   Name: "${accountName}"`)
  console.log(`   Date: "${reportDate}"`)
  console.log(`   Closed Trades: ${closedTrades.length}`)
  console.log(`   Open Positions: ${openPositions.length}`)
  
  // DEBUG: Show first few trades if any found
  if (closedTrades.length > 0) {
    console.log('🔍 First few trades found:')
    closedTrades.slice(0, 3).forEach((trade, i) => {
      console.log(`  Trade ${i + 1}: ${trade.ticketId} ${trade.symbol} ${trade.side} ${trade.volume} -> P&L: ${trade.pnlGross}`)
    })
  } else {
    console.log('❌ No closed trades were parsed!')
  }

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
      const dateStr = dateValue.trim()
      
      // Handle MT5 format: "2025.07.23 12:58:57"
      const mt5Match = dateStr.match(/(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/)
      if (mt5Match) {
        const [, year, month, day, hour, minute, second] = mt5Match
        const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`)
        if (!isNaN(date.getTime())) {
          return date.toISOString()
        }
      }
      
      // Try other formats
      const formats = [
        /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/, // US format
        /(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/, // European format
      ]
      
      for (const format of formats) {
        const match = dateStr.match(format)
        if (match) {
          const [, p1, p2, p3, h, m, s] = match
          const date = new Date(`${p3}-${p1}-${p2}T${h}:${m}:${s}`)
          if (!isNaN(date.getTime())) {
            return date.toISOString()
          }
        }
      }
      
      // Try direct parsing as last resort
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }
    }
    
    console.warn('Could not parse date:', dateValue)
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