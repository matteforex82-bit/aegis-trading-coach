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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params
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
        console.log(`📊 BEFORE IMPORT - About to import:`)
        console.log(`   Closed Trades: ${parsedData.closedTrades.length}`)
        console.log(`   Open Positions: ${parsedData.openPositions.length}`)
        if (parsedData.closedTrades.length > 0) {
          console.log(`   Sample trade:`, parsedData.closedTrades[0])
        }
        
        const importResult = await importDataToDatabase(accountId, parsedData, options.clearExisting)
        
        console.log(`📊 IMPORT COMPLETED:`)
        console.log(`   Imported Closed: ${importResult.imported.closedTrades}`)
        console.log(`   Imported Open: ${importResult.imported.openPositions}`)
        console.log(`   Errors: ${importResult.errors.length}`)
        
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
  
  // DEBUG: Print first 30 rows to understand structure
  console.log('🔍 DEBUG - First 30 rows of Excel data:')
  for (let i = 0; i < Math.min(mainData.length, 30); i++) {
    const row = mainData[i] || []
    console.log(`Row ${i}:`, row) // Show ALL columns of each row
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
  
  // Use EXACT SAME logic as test-excel that successfully found 18 trades
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
  
  // EXACT LOGIC FROM test-excel.ts that found 18 trades
  if (positionsHeaderIndex >= 0) {
    console.log(`🔍 Looking for trade data after position row ${positionsHeaderIndex}`)
    
    // Look for data rows after positions header (EXPANDED range for complete import)
    for (let i = positionsHeaderIndex + 1; i < Math.min(positionsHeaderIndex + 100, mainData.length); i++) {
      const row = mainData[i] || []
      
      console.log(`🔍 Checking potential trade row ${i}:`, row.slice(0, 8))
      
      // Stop if we reach Orders or Deals sections
      const firstCell = String(row[0] || '').toLowerCase().trim()
      if (firstCell.includes('orders') || firstCell.includes('deals')) {
        console.log(`📋 Stopping at row ${i} - reached ${firstCell} section`)
        break
      }
      
      // Skip empty rows but continue parsing
      if (row.length === 0 || row.every(cell => !cell || String(cell).trim() === '')) {
        console.log(`⏭️ Skipping empty row ${i}`)
        continue
      }
      
      // EXACT same validation as test-excel: look for rows that might be trades
      if (row.length > 5) {
        const possibleTicket = String(row[1] || '') // Column 1 should have ticket
        console.log(`🔍 Row ${i} - Column 1 (ticket): "${possibleTicket}"`)
        
        if (possibleTicket.match(/^\d+$/)) {
          console.log(`✅ Found potential trade row ${i} with ticket: ${possibleTicket}`)
          
          // Extract trade data using EXACT same column positions as test-excel
          const ticketId = possibleTicket
          const symbol = String(row[2] || '')    // Column 2 should have symbol
          const side = String(row[3] || '').toLowerCase().includes('sell') ? 'sell' : 'buy'
          const volume = parseFloat(String(row[4] || '0').replace(',', '.')) || 0
          const openPrice = parseFloat(String(row[5] || '0').replace(',', '.')) || 0
          const closePrice = parseFloat(String(row[9] || '0').replace(',', '.')) || 0
          const openTime = convertExcelDate(row[0])  // Column 0 should have open time
          const closeTime = convertExcelDate(row[8]) // Column 8 should have close time
          const commission = parseFloat(String(row[10] || '0').replace(',', '.')) || 0
          const swap = parseFloat(String(row[11] || '0').replace(',', '.')) || 0
          const pnlGross = parseFloat(String(row[12] || '0').replace(',', '.')) || 0
          
          console.log(`🔍 Extracted trade data:`)
          console.log(`   Ticket: "${ticketId}", Symbol: "${symbol}"`)
          console.log(`   Side: ${side}, Volume: ${volume}`)
          console.log(`   OpenPrice: ${openPrice}, ClosePrice: ${closePrice}`)
          console.log(`   OpenTime: ${openTime}, CloseTime: ${closeTime}`)
          console.log(`   P&L: ${pnlGross}, Commission: ${commission}, Swap: ${swap}`)
          
          // EXACT same validation as test-excel: just check minimum required data
          if (ticketId && symbol && volume > 0) {
            // Generate closeTime if missing (for historical trades)
            let finalCloseTime = closeTime
            if (!finalCloseTime || finalCloseTime === openTime) {
              const openDate = new Date(openTime)
              openDate.setMinutes(openDate.getMinutes() + 1)
              finalCloseTime = openDate.toISOString()
              console.log(`🔧 Generated closeTime: ${finalCloseTime}`)
            }
            
            closedTrades.push({
              ticketId,
              symbol,
              side,
              volume,
              openPrice,
              closePrice: closePrice || openPrice,
              openTime,
              closeTime: finalCloseTime,
              pnlGross: pnlGross - swap - commission,
              swap,
              commission,
              comment: ''
            })
            console.log(`✅ Added trade ${closedTrades.length}: ${ticketId} ${symbol}`)
          } else {
            console.log(`❌ Rejected trade - missing data: ticket="${ticketId}", symbol="${symbol}", volume=${volume}`)
          }
        }
      }
    }
  } else {
    console.log(`❌ No Positions section found!`)
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

  // Import closed trades with enhanced debugging
  console.log(`💾 Starting database import of ${parsedData.closedTrades.length} trades...`)
  
  for (const [index, trade] of parsedData.closedTrades.entries()) {
    try {
      console.log(`💾 Importing trade ${index + 1}/${parsedData.closedTrades.length}: ${trade.ticketId} ${trade.symbol}`)
      console.log(`   Data:`, {
        ticketId: trade.ticketId,
        symbol: trade.symbol,
        side: trade.side,
        volume: trade.volume,
        openPrice: trade.openPrice,
        closePrice: trade.closePrice,
        openTime: trade.openTime,
        closeTime: trade.closeTime,
        pnlGross: trade.pnlGross
      })
      
      const createdTrade = await db.trade.create({
        data: {
          accountId,
          ticketId: trade.ticketId,
          positionId: trade.ticketId, // Use ticketId as positionId for MT5 compatibility
          orderId: trade.ticketId,    // Use ticketId as orderId for MT5 compatibility  
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
      
      console.log(`✅ Successfully created trade ID: ${createdTrade.id}`)
      results.imported.closedTrades++
    } catch (error: any) {
      console.error(`❌ Failed to import trade ${trade.ticketId}:`, error)
      results.errors.push(`Failed to import trade ${trade.ticketId}: ${error.message}`)
    }
  }
  
  console.log(`💾 Database import completed: ${results.imported.closedTrades} successful, ${results.errors.length} errors`)

  // Import open positions
  for (const position of parsedData.openPositions) {
    try {
      await db.trade.create({
        data: {
          accountId,
          ticketId: position.ticketId,
          positionId: position.ticketId, // Use ticketId as positionId for MT5 compatibility
          orderId: position.ticketId,    // Use ticketId as orderId for MT5 compatibility
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