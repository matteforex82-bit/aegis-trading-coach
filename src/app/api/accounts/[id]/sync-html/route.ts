import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as cheerio from 'cheerio'

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
//| POST /api/accounts/[id]/sync-html - Sync MT5 HTML Report       |
//+------------------------------------------------------------------+
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params
    const formData = await request.formData()
    const htmlFile = formData.get('htmlFile') as File
    const options = JSON.parse(formData.get('options') as string) as SyncOptions

    if (!htmlFile) {
      return NextResponse.json({ error: 'No HTML file provided' }, { status: 400 })
    }

    // Verify account exists
    const account = await db.account.findUnique({
      where: { id: accountId },
      select: { id: true, login: true, name: true }
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Read and parse HTML content
    const htmlContent = await htmlFile.text()
    console.log('📄 Parsing MT5 HTML report...')

    const $ = cheerio.load(htmlContent)
    const parsedData = parseHtmlReport($ as any) // Type assertion for cheerio compatibility

    // Validate parsed data with detailed error info
    if (!parsedData.accountLogin) {
      console.error('❌ Account login not found in HTML')
      console.error('📋 Debug info:', {
        accountName: parsedData.accountName,
        company: parsedData.company,
        reportDate: parsedData.reportDate
      })
      
      return NextResponse.json({ 
        error: 'Invalid MT5 report: Account login not found',
        debug: {
          parsedName: parsedData.accountName,
          parsedCompany: parsedData.company,
          parsedDate: parsedData.reportDate,
          help: 'Check if your HTML report contains the account number in the Account field'
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
              company: parsedData.company,
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
    console.error('❌ Error syncing HTML:', error)
    return NextResponse.json({ 
      error: 'Failed to sync HTML report',
      details: error.message 
    }, { status: 500 })
  }
}

function parseHtmlReport($: cheerio.CheerioAPI) {
  console.log('🔍 HTML Parser Debug - Enhanced Version:')
  
  let accountLogin = ''
  
  // Method 1: th:contains("Account:") - case insensitive
  const accountCell1 = $('th').filter((i, el) => {
    return $(el).text().toLowerCase().includes('account')
  }).next().text().trim()
  console.log('   Method 1 - Account cell:', `"${accountCell1}"`)
  
  // Method 2: Extract from title first (most reliable)
  const title = $('title').text() || ''
  console.log('   Method 2 - Title:', `"${title}"`)
  const titleMatch = title.match(/(\d{4,})/)?.[1]
  if (titleMatch) {
    accountLogin = titleMatch
    console.log('   ✅ Found in title:', accountLogin)
  }
  
  // Method 3: Extract from account cell if title failed
  if (!accountLogin && accountCell1) {
    const cellMatch = accountCell1.match(/(\d{4,})/)?.[1]
    if (cellMatch) {
      accountLogin = cellMatch
      console.log('   ✅ Found in cell:', accountLogin)
    }
  }
  
  // Method 4: Search entire HTML for account pattern as last resort
  if (!accountLogin) {
    const bodyText = $('body').text()
    const bodyMatches = bodyText.match(/(\d{4,})\s*[\(\[\s]/g)
    console.log('   Method 4 - Body patterns:', bodyMatches?.slice(0, 3))
    if (bodyMatches && bodyMatches.length > 0) {
      const match = bodyMatches[0].match(/(\d{4,})/)
      if (match) {
        accountLogin = match[1]
        console.log('   ✅ Found in body:', accountLogin)
      }
    }
  }
  
  // Extract other info with better selectors
  const accountName = $('th').filter((i, el) => $(el).text().toLowerCase().includes('name')).next().find('b').text().trim() ||
                     $('th').filter((i, el) => $(el).text().toLowerCase().includes('name')).next().text().replace(/[<>]/g, '').trim()
  
  const company = $('th').filter((i, el) => $(el).text().toLowerCase().includes('company')).next().find('b').text().trim() ||
                  $('th').filter((i, el) => $(el).text().toLowerCase().includes('company')).next().text().replace(/[<>]/g, '').trim()
  
  const reportDate = $('th').filter((i, el) => $(el).text().toLowerCase().includes('date')).next().find('b').text().trim() ||
                     $('th').filter((i, el) => $(el).text().toLowerCase().includes('date')).next().text().replace(/[<>]/g, '').trim()

  console.log(`📊 Final Results:`)
  console.log(`   Account: "${accountLogin}"`)
  console.log(`   Name: "${accountName}"`)
  console.log(`   Company: "${company}"`)
  console.log(`   Date: "${reportDate}"`)

  // Parse closed trades (Closed Transactions section)
  const closedTrades: ParsedTrade[] = []
  
  // Find the "Closed Transactions:" section
  const closedTransactionsTable = $('td:contains("Closed Transactions:")').closest('table')
  
  console.log('🔍 Looking for Closed Transactions section...')
  
  if (closedTransactionsTable.length > 0) {
    console.log('✅ Found Closed Transactions table')
    
    // Find all trade rows (skip header and balance rows)
    closedTransactionsTable.find('tr').each((i, row) => {
      const cells = $(row).find('td')
      
      if (cells.length >= 14) {
        const ticketId = $(cells[0]).text().trim()
        const openTime = $(cells[1]).text().trim()
        const type = $(cells[2]).text().trim().toLowerCase()
        const volume = parseFloat($(cells[3]).text().trim().replace(/[,\s]/g, '')) || 0
        const symbol = $(cells[4]).text().trim().toLowerCase()
        const openPrice = parseFloat($(cells[5]).text().trim()) || 0
        const stopLoss = $(cells[6]).text().trim()
        const takeProfit = $(cells[7]).text().trim()
        const closeTime = $(cells[8]).text().trim()
        const closePrice = parseFloat($(cells[9]).text().trim()) || 0
        const commission = parseFloat($(cells[10]).text().trim().replace(/[,\s]/g, '')) || 0
        const taxes = parseFloat($(cells[11]).text().trim().replace(/[,\s]/g, '')) || 0
        const swap = parseFloat($(cells[12]).text().trim().replace(/[,\s]/g, '')) || 0
        const profit = parseFloat($(cells[13]).text().trim().replace(/[,\s]/g, '')) || 0

        // Skip balance operations and invalid rows
        if (type === 'balance' || !ticketId || !symbol || ticketId === 'Ticket') {
          return
        }
        
        // Skip cancelled orders
        if (type.includes('limit') && $(row).text().includes('cancelled')) {
          return
        }

        // Only process buy/sell transactions with valid close times
        if ((type === 'buy' || type === 'sell') && closeTime && closeTime !== 'Time' && closeTime !== '') {
          console.log(`🔍 Processing trade: ${ticketId} - ${symbol} ${type} - Profit: ${profit}`)
          
          closedTrades.push({
            ticketId,
            symbol: symbol.toUpperCase(),
            side: type as 'buy' | 'sell',
            volume,
            openPrice,
            closePrice,
            openTime: convertMT5DateTime(openTime),
            closeTime: convertMT5DateTime(closeTime),
            pnlGross: profit + swap + commission, // Same logic as Excel: profit + commission + swap
            swap,
            commission,
            comment: $(cells[0]).attr('title') || '' // Get comment from title attribute
          })
        }
      }
    })
  } else {
    console.log('❌ Closed Transactions table not found')
  }

  // Parse open positions (MT4/MT5 compatible)
  const openPositions: ParsedOpenPosition[] = []
  
  console.log('🔍 Looking for Open Positions section...')
  
  // Try both "Open Positions" and "Open Trades" for compatibility
  let openPositionsTable = $('th:contains("Open Positions")').closest('table')
  if (openPositionsTable.length === 0) {
    openPositionsTable = $('td:contains("Open Positions:")').closest('table')
  }
  if (openPositionsTable.length === 0) {
    openPositionsTable = $('th:contains("Open Trades")').closest('table')
  }
  
  if (openPositionsTable.length > 0) {
    console.log('✅ Found Open Positions table')
    
    openPositionsTable.find('tr').each((i, row) => {
      const cells = $(row).find('td')
      
      // MT4/MT5 open positions typically have 8-12+ columns
      if (cells.length >= 8 && !$(row).hasClass('hidden')) {
        const openTime = $(cells[0]).text().trim()
        const ticketId = $(cells[1]).text().trim()
        const symbol = $(cells[2]).text().trim()
        const side = $(cells[3]).text().trim().toLowerCase() as 'buy' | 'sell'

        // Skip header rows and invalid entries
        if (!ticketId || !symbol || !side || ticketId === 'Position' || ticketId === 'Ticket' || openTime === 'Time') {
          return
        }

        const volume = parseFloat($(cells[4]).text().trim().replace(/[,\s]/g, '')) || 0
        const openPrice = parseFloat($(cells[5]).text().trim()) || 0
        
        // For open positions, profit and swap are usually in the last columns
        // Try to find them dynamically based on column count
        let swap = 0
        let profit = 0
        
        if (cells.length >= 10) {
          swap = parseFloat($(cells[cells.length - 3]).text().trim().replace(/[,\s]/g, '')) || 0
          profit = parseFloat($(cells[cells.length - 2]).text().trim().replace(/[,\s]/g, '')) || 0
        } else if (cells.length >= 8) {
          profit = parseFloat($(cells[cells.length - 1]).text().trim().replace(/[,\s]/g, '')) || 0
        }

        // Only process valid open positions
        if (ticketId && symbol && (side === 'buy' || side === 'sell') && openTime && openTime !== 'Time') {
          console.log(`🔍 Processing open position: ${ticketId} - ${symbol} ${side} - Current P/L: ${profit}`)
          
          openPositions.push({
            ticketId,
            symbol: symbol.toUpperCase(),
            side,
            volume,
            openPrice,
            openTime: convertMT5DateTime(openTime),
            currentPnL: profit,
            swap,
            comment: $(cells[cells.length - 1])?.text().trim() || ''
          })
        }
      }
    })
  } else {
    console.log('❌ Open Positions table not found')
  }

  // Extract summary data
  const balance = parseFloat($('td:contains("Balance:")').next().text().replace(/[^0-9.-]/g, '')) || 0
  const equity = parseFloat($('td:contains("Equity:")').next().text().replace(/[^0-9.-]/g, '')) || 0
  const floatingPnL = parseFloat($('td:contains("Floating P/L:")').next().text().replace(/[^0-9.-]/g, '')) || 0
  const totalNetProfit = parseFloat($('td:contains("Total Net Profit:")').next().text().replace(/[^0-9.-]/g, '')) || 0

  return {
    accountLogin,
    accountName,
    company,
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

function convertMT5DateTime(mt5DateTime: string): string {
  // Convert "2025.07.23 12:58:57" to ISO string
  try {
    const [datePart, timePart] = mt5DateTime.split(' ')
    const [year, month, day] = datePart.split('.')
    const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`
    return new Date(isoString).toISOString()
  } catch (error) {
    console.error('Error converting MT5 datetime:', mt5DateTime, error)
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
          positionId: position.ticketId, // Use ticketId as positionId for MT5 compatibility
          orderId: position.ticketId,    // Use ticketId as orderId for MT5 compatibility
          symbol: position.symbol,
          side: position.side,
          volume: position.volume,
          openPrice: position.openPrice,
          openTime: position.openTime,
          closePrice: null,
          closeTime: null,
          pnlGross: position.currentPnL + position.swap + 0, // Same logic: profit + swap + commission
          swap: position.swap,
          commission: 0, // Open positions usually don't have commission yet
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