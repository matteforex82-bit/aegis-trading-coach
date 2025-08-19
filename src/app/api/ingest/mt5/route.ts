import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  console.log('🔧 MT5 endpoint hit (REBUILT VERSION)')
  
  try {
    // Parse JSON with detailed error handling
    let body: any
    try {
      body = await request.json()
      console.log('✅ JSON parsed successfully')
      console.log('📊 Body keys:', Object.keys(body))
    } catch (parseError: any) {
      console.error('❌ JSON parsing error:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON format', details: parseError.message },
        { status: 400 }
      )
    }
    
    // Log payload size and structure
    const payloadSize = JSON.stringify(body).length
    console.log('📏 Payload size:', payloadSize, 'characters')
    
    // Support different payload formats
    const { account, trades, metrics, openPositions } = body
    console.log('🔍 Request type - account:', !!account, 'trades:', !!trades, 'metrics:', !!metrics, 'openPositions:', !!openPositions)
    
    // Validate required fields
    if (!account) {
      console.log('❌ Missing account data')
      return NextResponse.json(
        { error: 'Account data is required' },
        { status: 400 }
      )
    }

    console.log('🏦 Account login:', account.login)

    // Test database connection first
    try {
      console.log('🔌 Testing database connection...')
      const testQuery = await db.user.count()
      console.log('✅ Database connected, user count:', testQuery)
    } catch (dbError: any) {
      console.error('❌ Database connection error:', dbError)
      return NextResponse.json(
        { error: 'Database connection failed', details: dbError.message },
        { status: 503 }
      )
    }

    // Handle different types of requests with SAFE versions
    if (trades && Array.isArray(trades)) {
      console.log('📈 Processing trade sync with', trades.length, 'trades')
      return await handleTradeSyncSafe(account, trades)
    } else if (metrics) {
      console.log('📊 Processing metrics sync')
      
      // FIRST: Sync open positions if included (before metrics)
      if (openPositions && Array.isArray(openPositions)) {
        console.log('🔴 Syncing', openPositions.length, 'open positions')
        try {
          await syncOpenPositionsSafe(account, openPositions)
          console.log('✅ Open positions sync completed successfully')
        } catch (error: any) {
          console.error('❌ Open positions sync failed:', error.message)
          // Continue with metrics sync even if positions fail
        }
      } else {
        console.log('⚠️ No openPositions found in payload')
      }
      
      return await handleMetricsSyncSafe(account, metrics)
    } else {
      console.log('❌ No valid data type found')
      return NextResponse.json(
        { error: 'Either trades or metrics data is required' },
        { status: 400 }
      )
    }

  } catch (error: any) {
    console.error('❌ Fatal error in MT5 ingest:', error)
    console.error('❌ Error name:', error.name)
    console.error('❌ Error message:', error.message)
    console.error('❌ Error stack:', error.stack)
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        type: error.name,
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

//+------------------------------------------------------------------+
//| Handle Trade Synchronization - SAFE VERSION                    |
//+------------------------------------------------------------------+
async function handleTradeSyncSafe(account: any, trades: any[]) {
  try {
    console.log('🚀 Starting FULL trade sync...')
    
    // Create/update account with PropFirm
    const accountRecord = await createOrUpdateAccountSafe(account)
    console.log('✅ Account processed:', accountRecord.id)

    // Process trades with safe error handling
    let processedTrades = 0
    let skippedTrades = 0
    
    console.log('📊 Processing', trades.length, 'trades...')
    
    for (const trade of trades) {
      try {
        console.log('🔄 Processing trade:', trade.ticket_id || trade.ticket)
        
        // Check if trade already exists
        const ticketId = trade.ticket_id?.toString() || trade.ticket?.toString()
        if (!ticketId) {
          console.log('⚠️ Trade missing ticket ID, skipping')
          skippedTrades++
          continue
        }
        
        const existingTrade = await db.trade.findUnique({
          where: { ticketId: ticketId }
        })

        if (!existingTrade) {
          // Create trade with safe error handling
          await createTradeSafe(trade, accountRecord.id)
          processedTrades++
          console.log('✅ Trade processed:', ticketId)
        } else {
          skippedTrades++
          console.log('⏭️ Trade exists, skipping:', ticketId)
        }
      } catch (tradeError: any) {
        console.error('❌ Error processing trade (continuing):', tradeError.message)
        skippedTrades++
      }
    }

    console.log(`🎉 Trade sync completed: ${processedTrades} processed, ${skippedTrades} skipped`)
    
    return NextResponse.json({
      success: true,
      message: 'Trades processed successfully',
      processedTrades: processedTrades,
      skippedTrades: skippedTrades,
      accountLogin: account.login,
      mode: 'full',
      dashboardUrl: process.env.NEXTAUTH_URL || 'https://new2dash.vercel.app'
    })
  } catch (error: any) {
    console.error('❌ Error in trade sync:', error)
    console.error('❌ Trade sync stack:', error.stack)
    throw error
  }
}

//+------------------------------------------------------------------+
//| Handle Live Metrics Synchronization - SAFE VERSION             |
//+------------------------------------------------------------------+
async function handleMetricsSyncSafe(account: any, metrics: any) {
  try {
    console.log('📊 Starting metrics sync with database storage...')
    
    // Create/update account with PropFirm
    const accountRecord = await createOrUpdateAccountSafe(account)
    console.log('✅ Account processed for metrics:', accountRecord.id)

    // Log metrics data
    console.log('📈 Metrics received:')
    console.log('   Equity:', metrics.equity)
    console.log('   Balance:', metrics.balance)
    console.log('   Drawdown:', metrics.drawdown)
    console.log('   Daily P&L:', metrics.dailyPnL)
    
    // Store metrics in database with safe error handling
    try {
      const currentDate = new Date()
      const dateKey = currentDate.toISOString().split('T')[0]
      
      console.log('💾 Storing metrics in database for date:', dateKey)
      
      await db.metric.upsert({
        where: {
          accountId_date: {
            accountId: accountRecord.id,
            date: new Date(dateKey)
          }
        },
        update: {
          dailyPnL: Number(metrics.dailyPnL) || 0,
          cumulativePnL: Number(metrics.totalPnL) || 0,
          currentDrawdown: Number(metrics.drawdown) || 0,
          maxDrawdown: Number(metrics.maxDrawdown) || 0,
          accountBalance: Number(metrics.balance) || null,
          equity: Number(metrics.equity) || null,
          phase: mapPhaseSafe(metrics.phase),
          tradingDays: Number(metrics.tradingDays) || null,
        },
        create: {
          accountId: accountRecord.id,
          date: new Date(dateKey),
          dailyPnL: Number(metrics.dailyPnL) || 0,
          cumulativePnL: Number(metrics.totalPnL) || 0,
          maxDailyLoss: 0,
          totalMaxLoss: 0,
          currentDrawdown: Number(metrics.drawdown) || 0,
          maxDrawdown: Number(metrics.maxDrawdown) || 0,
          accountBalance: Number(metrics.balance) || null,
          equity: Number(metrics.equity) || null,
          phase: mapPhaseSafe(metrics.phase),
          tradingDays: Number(metrics.tradingDays) || null,
        }
      })
      
      console.log('✅ Metrics stored in database successfully')
      
    } catch (metricsError: any) {
      console.error('❌ Error storing metrics (continuing anyway):', metricsError)
      // Continue without failing the whole request
    }
    
    return NextResponse.json({
      success: true,
      message: 'Metrics processed successfully',
      mode: 'enhanced',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ Error in metrics sync:', error)
    console.error('❌ Metrics sync stack:', error.stack)
    throw error
  }
}

//+------------------------------------------------------------------+
//| Create or Update Account - SAFE VERSION                        |
//+------------------------------------------------------------------+
async function createOrUpdateAccountSafe(account: any) {
  console.log('🏦 Creating/updating account with PropFirm for login:', account.login)
  
  try {
    // STEP 1: Handle PropFirm creation if needed
    let propFirmId = null
    if (account.propFirm) {
      console.log('🏢 Processing PropFirm:', account.propFirm)
      try {
        // Find existing PropFirm or create new one
        let propFirm = await db.propFirm.findFirst({
          where: { name: account.propFirm }
        })
        
        if (!propFirm) {
          console.log('🔄 Creating new PropFirm:', account.propFirm)
          propFirm = await db.propFirm.create({
            data: {
              name: account.propFirm,
              description: `${account.propFirm} Prop Trading Firm`,
              defaultRules: {
                profitTarget: account.profitTarget || null,
                maxDailyLoss: account.maxDailyLoss || null,
                maxTotalLoss: account.maxTotalLoss || null,
                maxDrawdown: account.maxDrawdown || null
              }
            }
          })
        } else {
          console.log('📝 Found existing PropFirm:', propFirm.id)
        }
        
        propFirmId = propFirm.id
        console.log('✅ PropFirm processed:', propFirmId)
      } catch (propFirmError: any) {
        console.error('❌ PropFirm creation error:', propFirmError)
        // Continue without PropFirm if it fails
      }
    }

    console.log('🔍 Looking for existing account...')
    const existingAccount = await db.account.findUnique({
      where: { login: account.login.toString() }
    })

    if (existingAccount) {
      console.log('📝 Found existing account:', existingAccount.id)
      
      // Enhanced update with PropFirm fields
      return await db.account.update({
        where: { login: account.login.toString() },
        data: {
          name: account.name || existingAccount.name,
          broker: account.broker || existingAccount.broker,
          server: account.server || existingAccount.server,
          currency: account.currency || existingAccount.currency,
          timezone: account.timezone || existingAccount.timezone || 'Europe/Rome',
          // PropFirm fields with safe enum mapping
          propFirmId: propFirmId || existingAccount.propFirmId,
          accountType: mapAccountTypeSafe(account.accountType) || existingAccount.accountType,
          currentPhase: mapPhaseSafe(account.phase) || existingAccount.currentPhase,
          startBalance: account.startBalance || existingAccount.startBalance,
          currentBalance: account.currentBalance || existingAccount.currentBalance,
          isChallenge: account.isChallenge ?? existingAccount.isChallenge,
          isFunded: account.isFunded ?? existingAccount.isFunded,
        }
      })
    } else {
      console.log('🆕 Creating new account with PropFirm...')
      
      // Create temp user first
      console.log('👤 Creating temp user...')
      const tempUser = await db.user.create({
        data: {
          email: `temp_${account.login}@propcontrol.com`,
          name: `${account.propFirm || account.broker || 'Trading'} Account`
        }
      })
      console.log('✅ Temp user created:', tempUser.id)

      // Create account with PropFirm fields
      return await db.account.create({
        data: {
          login: account.login.toString(),
          name: account.name || `${account.broker} Account`,
          broker: account.broker,
          server: account.server,
          currency: account.currency,
          timezone: account.timezone || 'Europe/Rome',
          userId: tempUser.id,
          // PropFirm fields with safe defaults
          propFirmId: propFirmId,
          accountType: mapAccountTypeSafe(account.accountType) || 'DEMO',
          currentPhase: mapPhaseSafe(account.phase) || 'DEMO',
          startBalance: account.startBalance || null,
          currentBalance: account.currentBalance || null,
          isChallenge: account.isChallenge || false,
          isFunded: account.isFunded || false,
        }
      })
    }
  } catch (error: any) {
    console.error('❌ Error in PropFirm account creation:', error)
    console.error('❌ Account data that failed:', JSON.stringify(account, null, 2))
    throw error
  }
}

//+------------------------------------------------------------------+
//| Safe Enum Mapping Functions                                    |
//+------------------------------------------------------------------+
function mapAccountTypeSafe(value: any): string | null {
  if (!value) return null
  
  try {
    // Valid types from Prisma schema
    const validTypes = ['DEMO', 'CHALLENGE', 'FUNDED', 'EVALUATION']
    const upperValue = value.toString().toUpperCase()
    
    // Map common variations
    if (upperValue === 'LIVE') return 'DEMO'
    if (upperValue === 'REAL') return 'FUNDED'
    
    return validTypes.includes(upperValue) ? upperValue : 'DEMO'
  } catch (error) {
    console.error('Error mapping account type:', error)
    return 'DEMO'
  }
}

function mapPhaseSafe(value: any): string | null {
  if (!value) return null
  
  try {
    // Valid phases from Prisma schema
    const validPhases = ['DEMO', 'PHASE_1', 'PHASE_2', 'FUNDED', 'VERIFICATION']
    const upperValue = value.toString().toUpperCase()
    
    return validPhases.includes(upperValue) ? upperValue : 'DEMO'
  } catch (error) {
    console.error('Error mapping phase:', error)
    return 'DEMO'
  }
}

//+------------------------------------------------------------------+
//| Create Trade Safely                                            |
//+------------------------------------------------------------------+
async function createTradeSafe(trade: any, accountId: string) {
  try {
    // Parse and validate all required fields with safe defaults
    const ticketId = trade.ticket_id?.toString() || trade.ticket?.toString()
    const positionId = trade.position_id?.toString() || '0'
    const orderId = trade.order_id?.toString() || trade.order?.toString() || '0'
    const symbol = trade.symbol || 'UNKNOWN'
    const side = trade.side || 'buy'
    const volume = Number(trade.volume) || 0
    
    // Handle dates safely
    let openTime = new Date()
    if (trade.open_time) {
      try {
        openTime = new Date(trade.open_time)
      } catch (dateError) {
        console.log('Warning: Invalid open_time, using current time')
      }
    }
    
    let closeTime = null
    if (trade.close_time) {
      try {
        closeTime = new Date(trade.close_time)
      } catch (dateError) {
        console.log('Warning: Invalid close_time, using null')
      }
    }
    
    // Handle numeric fields safely
    const openPrice = Number(trade.open_price) || Number(trade.price) || 0
    const closePrice = Number(trade.close_price) || 0
    const sl = trade.sl ? Number(trade.sl) : null
    const tp = trade.tp ? Number(trade.tp) : null
    const commission = Number(trade.commission) || 0
    const swap = Number(trade.swap) || 0
    const taxes = Number(trade.taxes) || 0
    const pnlGross = Number(trade.pnl_gross) || Number(trade.pnl) || 0
    
    // Create trade in database
    return await db.trade.create({
      data: {
        // Basic MT5 fields
        ticketId: ticketId,
        positionId: positionId,
        orderId: orderId,
        symbol: symbol,
        side: side,
        volume: volume,
        openTime: openTime,
        closeTime: closeTime,
        openPrice: openPrice,
        closePrice: closePrice,
        sl: sl,
        tp: tp,
        commission: commission,
        swap: swap,
        taxes: taxes,
        pnlGross: pnlGross,
        comment: trade.comment || null,
        magic: trade.magic ? Number(trade.magic) : null,
        dealReason: trade.deal_reason || null,
        closeReason: trade.close_reason || null,
        accountId: accountId,
        
        // PropFirm extensions with safe defaults
        tradePhase: mapPhaseSafe(trade.phase),
        violatesRules: Boolean(trade.violatesRules),
        equityAtOpen: trade.equityAtOpen ? Number(trade.equityAtOpen) : null,
        equityAtClose: trade.equityAtClose ? Number(trade.equityAtClose) : null,
        drawdownAtOpen: trade.drawdownAtOpen ? Number(trade.drawdownAtOpen) : null,
        drawdownAtClose: trade.drawdownAtClose ? Number(trade.drawdownAtClose) : null,
        dailyPnLAtOpen: trade.dailyPnLAtOpen ? Number(trade.dailyPnLAtOpen) : null,
        dailyPnLAtClose: trade.dailyPnLAtClose ? Number(trade.dailyPnLAtClose) : null,
        isWeekendTrade: Boolean(trade.isWeekendTrade),
        newsTime: Boolean(trade.newsTime),
        holdingTime: trade.holdingTime ? Number(trade.holdingTime) : null,
        riskReward: trade.riskReward ? Number(trade.riskReward) : null,
        riskPercent: trade.riskPercent ? Number(trade.riskPercent) : null,
      }
    })
  } catch (error: any) {
    console.error('❌ Error creating trade safely:', error.message)
    console.error('❌ Trade data:', JSON.stringify(trade, null, 2))
    throw error
  }
}

//+------------------------------------------------------------------+
//| Sync Open Positions - SAFE VERSION                             |
//+------------------------------------------------------------------+
async function syncOpenPositionsSafe(account: any, openPositions: any[]) {
  try {
    console.log('🔴 Starting open positions sync...')
    console.log('🔍 OpenPositions payload:', JSON.stringify(openPositions, null, 2))
    
    // Get account first
    const accountRecord = await createOrUpdateAccountSafe(account)
    console.log('✅ Account retrieved:', accountRecord.id)
    
    // Clear old open positions for this account first
    const deletedCount = await db.trade.deleteMany({
      where: { 
        accountId: accountRecord.id,
        closeTime: null 
      }
    })
    console.log('✅ Cleared', deletedCount.count, 'old open positions')
    
    let syncedPositions = 0
    
    for (const position of openPositions) {
      try {
        await db.trade.create({
          data: {
            ticketId: String(position.ticket_id),
            positionId: String(position.ticket_id), // Use ticket as position ID for open positions
            orderId: String(position.ticket_id), // Use ticket as order ID for open positions
            symbol: position.symbol,
            side: position.side === 'buy' ? 'BUY' : 'SELL',
            volume: Number(position.volume),
            openPrice: Number(position.open_price),
            closePrice: null, // Open position
            openTime: new Date(position.open_time),
            closeTime: null, // Open position
            pnlGross: Number(position.pnl || 0),
            swap: Number(position.swap || 0),
            commission: Number(position.commission || 0),
            comment: position.comment || null,
            magic: position.magic ? Number(position.magic) : null,
            accountId: accountRecord.id,
            
            // PropFirm fields
            tradePhase: mapPhaseSafe(position.phase),
            violatesRules: false, // Open positions don't violate rules yet
            equityAtOpen: null,
            equityAtClose: null,
            drawdownAtOpen: null,
            drawdownAtClose: null,
            dailyPnLAtOpen: null,
            dailyPnLAtClose: null,
            isWeekendTrade: false,
            newsTime: false,
            holdingTime: null,
            riskReward: null,
            riskPercent: null
          }
        })
        syncedPositions++
        console.log(`✅ Synced open position: ${position.ticket_id} ${position.symbol}`)
      } catch (error: any) {
        console.error(`❌ Error syncing position ${position.ticket_id}:`, error.message)
      }
    }
    
    console.log(`🔴 Synced ${syncedPositions}/${openPositions.length} open positions`)
    
  } catch (error: any) {
    console.error('❌ Error in syncOpenPositionsSafe:', error.message)
    throw error
  }
}