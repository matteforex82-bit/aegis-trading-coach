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
  { params }: { params: { id: string } }
) {
  try {
    const { id: accountId } = params
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
    const parsedData = parseHtmlReport($)

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
  // Debug: Log HTML structure for troubleshooting
  console.log('🔍 HTML Parser Debug:')
  
  // Try multiple ways to find account info
  let accountLogin = ''
  
  // Method 1: th:contains("Account:")
  const accountCell1 = $('th:contains("Account:")').next().text()
  console.log('   Method 1 - th contains Account:', accountCell1)
  
  // Method 2: Look for patterns in all table cells
  const allCells = $('th, td').map((i, el) => $(el).text().trim()).get()
  console.log('   Found cells:', allCells.slice(0, 10)) // First 10 cells
  
  // Method 3: Look for account number patterns
  const accountMatches = allCells
    .map(cell => cell.match(/(?:Account[:\s]*)?(\d{4,})/i))
    .filter(match => match)
  console.log('   Account matches found:', accountMatches.map(m => m?.[1]))
  
  // Extract account login
  if (accountCell1) {
    accountLogin = accountCell1.match(/(\d+)/)?.[1] || ''
  }
  
  // Fallback: use any account number found
  if (!accountLogin && accountMatches.length > 0) {
    accountLogin = accountMatches[0]?.[1] || ''
    console.log('   Using fallback account:', accountLogin)
  }
  
  const accountName = $('th:contains("Name:")').next().find('b').text().trim()
  const company = $('th:contains("Company:")').next().find('b').text().trim()
  const reportDate = $('th:contains("Date:")').next().find('b').text().trim()

  console.log(`📊 Parsed - Account: "${accountLogin}" - Name: "${accountName}"`)

  // Parse closed trades (Positions section)
  const closedTrades: ParsedTrade[] = []
  $('th:contains("Positions")').closest('table').find('tr').each((i, row) => {
    const cells = $(row).find('td')
    if (cells.length >= 13 && !$(row).hasClass('hidden')) {
      const openTime = $(cells[0]).text().trim()
      const ticketId = $(cells[1]).text().trim()
      const symbol = $(cells[2]).text().trim()
      const side = $(cells[3]).text().trim() as 'buy' | 'sell'
      
      // Skip if not a valid trade row
      if (!ticketId || !symbol || !side || ticketId === 'Position') return

      const volume = parseFloat($(cells[4]).text().trim()) || 0
      const openPrice = parseFloat($(cells[5]).text().trim()) || 0
      const closeTime = $(cells[8]).text().trim()
      const closePrice = parseFloat($(cells[9]).text().trim()) || 0
      const commission = parseFloat($(cells[10]).text().trim()) || 0
      const swap = parseFloat($(cells[11]).text().trim()) || 0
      const profit = parseFloat($(cells[12]).text().trim()) || 0

      if (ticketId && openTime && closeTime && closeTime !== 'Time') {
        closedTrades.push({
          ticketId,
          symbol,
          side,
          volume,
          openPrice,
          closePrice,
          openTime: convertMT5DateTime(openTime),
          closeTime: convertMT5DateTime(closeTime),
          pnlGross: profit - swap - commission, // Extract gross P&L
          swap,
          commission,
          comment: $(cells[13])?.text().trim() || ''
        })
      }
    }
  })

  // Parse open positions
  const openPositions: ParsedOpenPosition[] = []
  $('th:contains("Open Positions")').closest('table').find('tr').each((i, row) => {
    const cells = $(row).find('td')
    if (cells.length >= 11 && !$(row).hasClass('hidden')) {
      const openTime = $(cells[0]).text().trim()
      const ticketId = $(cells[1]).text().trim()
      const symbol = $(cells[2]).text().trim()
      const side = $(cells[3]).text().trim() as 'buy' | 'sell'

      // Skip if not a valid position row
      if (!ticketId || !symbol || !side || ticketId === 'Position') return

      const volume = parseFloat($(cells[4]).text().trim()) || 0
      const openPrice = parseFloat($(cells[5]).text().trim()) || 0
      const swap = parseFloat($(cells[9]).text().trim()) || 0
      const profit = parseFloat($(cells[10]).text().trim()) || 0

      if (ticketId && openTime && openTime !== 'Time') {
        openPositions.push({
          ticketId,
          symbol,
          side,
          volume,
          openPrice,
          openTime: convertMT5DateTime(openTime),
          currentPnL: profit,
          swap,
          comment: $(cells[11])?.text().trim() || ''
        })
      }
    }
  })

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
          pnlGross: position.currentPnL - position.swap, // Exclude swap from gross
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