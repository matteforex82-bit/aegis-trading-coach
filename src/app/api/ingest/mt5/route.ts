import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substr(2, 8)
  console.log(`🔧 MT5 endpoint hit [${requestId}] (REBUILT VERSION)`)
  
  try {
    // 🚨 HEALTH CHECK: Return fast 200 for EA ping
    const userAgent = request.headers.get('user-agent') || ''
    if (userAgent.includes('health') || request.headers.get('x-health-check')) {
      console.log(`💊 Health check request [${requestId}]`)
      return NextResponse.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        requestId: requestId,
        message: '✅ MT5 endpoint ready'
      }, { status: 200 })
    }
    // Parse JSON with detailed error handling
    let body: any
    try {
      body = await request.json()
      console.log('✅ JSON parsed successfully')
      console.log('📊 Body keys:', Object.keys(body))
    } catch (parseError: any) {
      console.error(`❌ JSON parsing error [${requestId}]:`, parseError)
      return NextResponse.json(
        { 
          error: 'Invalid JSON format', 
          details: parseError.message,
          requestId: requestId,
          help: 'Verify JSON payload structure'
        },
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

    // Test database connection first with timeout
    try {
      console.log('🔌 Testing database connection...')
      const testQuery = await Promise.race([
        db.user.count(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database connection timeout')), 8000)
        )
      ])
      console.log('✅ Database connected, user count:', testQuery)
    } catch (dbError: any) {
      console.error('❌ Database connection error:', dbError)
      
      // Handle specific database errors
      if (dbError?.code === 'P5000' && dbError?.message?.includes('planLimitReached')) {
        console.error('🚨 PRISMA PLAN LIMIT in connection test!')
        return NextResponse.json({
          error: 'Database service temporarily unavailable',
          code: 'PRISMA_PLAN_LIMIT',
          message: 'Database plan limit reached during connection test',
          suggestion: 'Upgrade Prisma plan at https://cloud.prisma.io/',
          requestId: requestId,
          ea_action: 'RETRY_LATER',
          timestamp: new Date().toISOString()
        }, { 
          status: 503,
          headers: {
            'Retry-After': '1800' // 30 minutes
          }
        })
      }
      
      return NextResponse.json({
        error: 'Database connection failed', 
        details: dbError.message,
        code: dbError.code || 'DB_CONNECTION_ERROR',
        requestId: requestId,
        ea_action: 'RETRY_WITH_BACKOFF',
        timestamp: new Date().toISOString()
      }, { 
        status: 503,
        headers: {
          'Retry-After': '300' // 5 minutes
        }
      })
    }

    // Handle different types of requests with SAFE versions
    if (trades && Array.isArray(trades)) {
      console.log('📈 Processing trade sync with', trades.length, 'trades')
      return await handleTradeSyncSafe(account, trades, requestId)
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
    console.error(`❌ Fatal error in MT5 ingest [${requestId}]:`, error)
    console.error('❌ Error name:', error.name)
    console.error('❌ Error message:', error.message)
    console.error('❌ Error stack:', error.stack)
    
    // 🚨 CRITICAL: Handle Prisma plan limit errors for EA
    if (error?.code === 'P5000' && error?.message?.includes('planLimitReached')) {
      console.error('🚨 PRISMA PLAN LIMIT REACHED - EA will retry automatically!')
      return NextResponse.json({
        error: 'Database service temporarily unavailable',
        code: 'PRISMA_PLAN_LIMIT',
        message: 'Database plan limit reached. EA will retry automatically.',
        suggestion: 'Upgrade Prisma plan at https://cloud.prisma.io/',
        requestId: requestId,
        account_login: request.body?.account?.login || 'unknown',
        timestamp: new Date().toISOString(),
        ea_action: 'RETRY_LATER'
      }, { 
        status: 503,  // Service Unavailable - EA will retry
        headers: {
          'Retry-After': '1800'  // Suggest retry in 30 minutes
        }
      })
    }
    
    // Handle other database errors
    if (error?.code?.startsWith('P')) {
      console.error('🔍 Prisma database error:', error.code, error.message)
      return NextResponse.json({
        error: 'Database operation failed',
        code: error.code,
        requestId: requestId,
        account_login: request.body?.account?.login || 'unknown',
        ea_action: 'RETRY_LATER',
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }
    
    // Always include detailed error info to help EA debugging
    return NextResponse.json({
      error: 'Internal server error', 
      type: error.name,
      details: error.message,
      requestId: requestId,
      account_login: request.body?.account?.login || 'unknown',
      help: 'Check if account exists or can be recreated',
      timestamp: new Date().toISOString(),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

//+------------------------------------------------------------------+
//| Handle Trade Synchronization - SAFE VERSION                    |
//+------------------------------------------------------------------+
async function handleTradeSyncSafe(account: any, trades: any[], requestId: string) {
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
          where: { 
            accountId_ticketId: {
              accountId: accountRecord.id,
              ticketId: ticketId
            }
          }
        })

        if (!existingTrade) {
          // Create new trade
          await createTradeSafe(trade, accountRecord.id)
          processedTrades++
          console.log('✅ Trade created:', ticketId)
        } else {
          // Update existing trade (this fixes the bug!)
          await updateTradeSafe(existingTrade, trade)
          processedTrades++
          console.log('🔄 Trade updated:', ticketId)
        }
      } catch (tradeError: any) {
        console.error('❌ Error processing trade (continuing):', tradeError.message)
        skippedTrades++
      }
    }

    console.log(`🎉 Trade sync completed: ${processedTrades} processed (created + updated), ${skippedTrades} skipped`)
    
    return NextResponse.json({
      success: true,
      message: 'Trades processed successfully with updates',
      processedTrades: processedTrades,
      skippedTrades: skippedTrades,
      accountLogin: account.login,
      requestId: requestId,
      mode: 'full_with_updates',
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
    const existingAccount = await db.tradingAccount.findUnique({
      where: { login: account.login.toString() }
    })

    if (existingAccount) {
      console.log('📝 Found existing account:', existingAccount.id)

      // Enhanced update with PropFirm fields
      return await db.tradingAccount.update({
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
      console.log('📋 Account data received:', JSON.stringify(account, null, 2))
      
      // Create temp user first
      console.log('👤 Creating temp user...')
      try {
        const tempUser = await db.user.create({
          data: {
            email: `temp_${account.login}@propcontrol.com`,
            name: `${account.propFirm || account.broker || 'Trading'} Account`
          }
        })
        console.log('✅ Temp user created:', tempUser.id)

        // Create account with PropFirm fields
        console.log('🏦 Creating account with data:', {
          login: account.login.toString(),
          name: account.name || `${account.broker || 'Trading'} Account`,
          broker: account.broker || 'Unknown',
          server: account.server || 'Unknown',
          currency: account.currency || 'USD',
          timezone: account.timezone || 'Europe/Rome',
          userId: tempUser.id,
          propFirmId: propFirmId,
          accountType: mapAccountTypeSafe(account.accountType) || 'DEMO',
          currentPhase: mapPhaseSafe(account.phase) || 'DEMO',
        })
        
        return await db.tradingAccount.create({
          data: {
            login: account.login.toString(),
            name: account.name || `${account.broker || 'Trading'} Account`,
            broker: account.broker || 'Unknown',
            server: account.server || 'Unknown',
            currency: account.currency || 'USD',
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
      } catch (userError: any) {
        console.error('❌ Failed to create temp user:', userError.message)
        throw new Error(`User creation failed: ${userError.message}`)
      }
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
//| Update Trade Safely                                            |
//+------------------------------------------------------------------+
async function updateTradeSafe(existingTrade: any, incomingTrade: any) {
  try {
    console.log('🔄 Updating existing trade:', existingTrade.ticketId)
    
    // Parse incoming trade data safely
    let closeTime = existingTrade.closeTime // Keep existing closeTime
    if (incomingTrade.close_time) {
      try {
        closeTime = new Date(incomingTrade.close_time)
        console.log('📅 Setting closeTime:', closeTime)
      } catch (dateError) {
        console.log('Warning: Invalid close_time in update, keeping existing')
      }
    }
    
    // Handle numeric fields safely - update only if provided
    const closePrice = incomingTrade.close_price ? Number(incomingTrade.close_price) : existingTrade.closePrice
    const pnlGross = incomingTrade.pnl_gross !== undefined ? Number(incomingTrade.pnl_gross) : 
                     incomingTrade.pnl !== undefined ? Number(incomingTrade.pnl) : existingTrade.pnlGross
    const commission = incomingTrade.commission !== undefined ? Number(incomingTrade.commission) : existingTrade.commission
    const swap = incomingTrade.swap !== undefined ? Number(incomingTrade.swap) : existingTrade.swap
    const taxes = incomingTrade.taxes !== undefined ? Number(incomingTrade.taxes) : existingTrade.taxes
    
    // Update trade in database
    const updatedTrade = await db.trade.update({
      where: { id: existingTrade.id },
      data: {
        // Update fields that can change
        closeTime: closeTime,
        closePrice: closePrice,
        pnlGross: pnlGross,
        commission: commission,
        swap: swap,
        taxes: taxes,
        closeReason: incomingTrade.close_reason || existingTrade.closeReason,
        
        // PropFirm extensions that can be updated
        equityAtClose: incomingTrade.equityAtClose ? Number(incomingTrade.equityAtClose) : existingTrade.equityAtClose,
        drawdownAtClose: incomingTrade.drawdownAtClose ? Number(incomingTrade.drawdownAtClose) : existingTrade.drawdownAtClose,
        dailyPnLAtClose: incomingTrade.dailyPnLAtClose ? Number(incomingTrade.dailyPnLAtClose) : existingTrade.dailyPnLAtClose,
        holdingTime: incomingTrade.holdingTime ? Number(incomingTrade.holdingTime) : existingTrade.holdingTime,
        riskReward: incomingTrade.riskReward ? Number(incomingTrade.riskReward) : existingTrade.riskReward,
        
        // Update timestamp
        updatedAt: new Date()
      }
    })
    
    console.log('✅ Trade updated successfully:', existingTrade.ticketId, closeTime ? '(CLOSED)' : '(UPDATED)')
    return updatedTrade
    
  } catch (error: any) {
    console.error('❌ Error updating trade safely:', error.message)
    console.error('❌ Existing trade:', JSON.stringify(existingTrade, null, 2))
    console.error('❌ Incoming trade:', JSON.stringify(incomingTrade, null, 2))
    throw error
  }
}

//+------------------------------------------------------------------+
//| Handle Partial Closure Conflicts - LIVE FIRST PRIORITY         |
//+------------------------------------------------------------------+
async function handlePartialClosureConflict(ticketId: string, incomingPosition: any, existingPositions: any[]) {
  try {
    if (existingPositions.length === 0) {
      return false // No conflict
    }
    
    // Check if there's a closed position with same ticketId
    const closedPosition = existingPositions.find(p => p.closeTime !== null)
    const openPosition = existingPositions.find(p => p.closeTime === null)
    
    if (closedPosition && !openPosition) {
      // PARTIAL CLOSURE SCENARIO: Closed position exists, live position incoming
      const oldCloseTime = new Date(closedPosition.closeTime).getTime()
      const newHistoricalId = `${ticketId}_hist_${oldCloseTime}`
      
      console.log(`🔄 PARTIAL CLOSURE DETECTED: Renaming closed position`)
      console.log(`   Original: ${ticketId} (closed ${closedPosition.closeTime})`)
      console.log(`   New ID: ${newHistoricalId}`)
      console.log(`   Incoming: ${ticketId} (live position with ${incomingPosition.volume} lots)`)
      
      // Rename the closed position to avoid conflict
      await db.trade.update({
        where: { id: closedPosition.id },
        data: { 
          ticketId: newHistoricalId,
          comment: `${closedPosition.comment || ''} [Partial closure - renamed for live position]`.trim()
        }
      })
      
      console.log(`✅ Conflict resolved: Live position ${ticketId} can now be created`)
      return true
    }
    
    if (existingPositions.length > 1) {
      console.log(`⚠️ Multiple positions found for ticket ${ticketId}:`)
      existingPositions.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.closeTime ? 'CLOSED' : 'OPEN'} - Volume: ${p.volume} - Created: ${p.createdAt}`)
      })
    }
    
    return false
  } catch (error: any) {
    console.error(`❌ Error handling partial closure conflict for ${ticketId}:`, error.message)
    return false
  }
}

//+------------------------------------------------------------------+
//| Sync Open Positions - SAFE UPSERT VERSION                      |
//+------------------------------------------------------------------+
async function syncOpenPositionsSafe(account: any, openPositions: any[]) {
  try {
    console.log('🔴 Starting SMART open positions sync...')
    console.log('🔍 Received', openPositions.length, 'positions from EA')
    
    // VALIDATION: Prevent empty payload sync
    if (!openPositions || openPositions.length === 0) {
      console.log('⚠️ EMPTY PAYLOAD DETECTED - Skipping sync to prevent position loss')
      return
    }
    
    // Log specific positions for debugging
    const positionSummary = openPositions.map(p => `${p.symbol} #${p.ticket_id}`).join(', ')
    console.log('📋 Positions in payload:', positionSummary)
    
    // Get account first
    const accountRecord = await createOrUpdateAccountSafe(account)
    console.log('✅ Account retrieved:', accountRecord.id)
    
    // UPSERT STRATEGY: Update existing positions instead of delete-all
    let updatedPositions = 0
    let createdPositions = 0
    const processedTickets = new Set()
    
    for (const position of openPositions) {
      try {
        // Support both old and new EA formats
        const ticketId = String(position.ticket_id || position.ticket)
        processedTickets.add(ticketId)
        
        // Check if position already exists (any state)
        const allExistingPositions = await db.trade.findMany({
          where: {
            ticketId: ticketId,
            accountId: accountRecord.id
          },
          orderBy: { createdAt: 'desc' }
        })
        
        // Handle partial closure conflicts
        const conflictResolved = await handlePartialClosureConflict(
          ticketId, 
          position, // incoming live position
          allExistingPositions
        )
        
        // Get the current open position (if any) after conflict resolution
        const existingPosition = await db.trade.findFirst({
          where: {
            ticketId: ticketId,
            accountId: accountRecord.id,
            closeTime: null
          }
        })
        
        // Enhanced position data mapping for new EA format
        const positionData = {
          symbol: position.symbol,
          side: (position.side || position.type) === 'buy' ? 'BUY' : 'SELL',
          volume: Number(position.volume),
          openPrice: Number(position.open_price || position.price_open),
          pnlGross: Number(position.pnl || position.profit || 0),
          swap: Number(position.swap || 0),
          commission: Number(position.commission || 0),
          comment: position.comment || null,
          magic: position.magic ? Number(position.magic) : null,
          // NEW: Support for SL/TP from enhanced EA
          sl: position.stop_loss ? Number(position.stop_loss) : null,
          tp: position.take_profit ? Number(position.take_profit) : null,
          tradePhase: mapPhaseSafe(position.phase),
          // Update timestamp for staleness detection
          updatedAt: new Date()
        }
        
        if (existingPosition) {
          // UPDATE existing position
          await db.trade.update({
            where: { id: existingPosition.id },
            data: positionData
          })
          updatedPositions++
          console.log(`🔄 Updated position: ${ticketId} ${position.symbol}`)
        } else {
          // CREATE new position
          await db.trade.create({
            data: {
              ...positionData,
              ticketId: ticketId,
              positionId: ticketId, // Use ticket as position ID for open positions
              orderId: ticketId, // Use ticket as order ID for open positions
              closePrice: null, // Open position
              openTime: new Date(position.open_time || position.time),
              closeTime: null, // Open position
              accountId: accountRecord.id,
              
              // PropFirm fields
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
          createdPositions++
          console.log(`➕ Created new position: ${ticketId} ${position.symbol}`)
        }
      } catch (error: any) {
        console.error(`❌ Error syncing position ${ticketId}:`, error.message)
        console.error(`❌ Full error details:`, error)
        console.error(`❌ Position data:`, JSON.stringify(position, null, 2))
      }
    }
    
    // CLEANUP: Remove stale positions (not updated in last 2 minutes)
    const staleThreshold = new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
    const staleTrades = await db.trade.deleteMany({
      where: {
        accountId: accountRecord.id,
        closeTime: null,
        updatedAt: { lt: staleThreshold }
      }
    })
    
    console.log(`🔴 SMART SYNC COMPLETED:`)
    console.log(`   ✅ Updated: ${updatedPositions} positions`)
    console.log(`   ➕ Created: ${createdPositions} positions`) 
    console.log(`   🗑️ Removed stale: ${staleTrades.count} positions`)
    console.log(`   📊 Total processed: ${processedTickets.size} positions`)
    
    // Verify final count
    const finalCount = await db.trade.count({
      where: {
        accountId: accountRecord.id,
        closeTime: null
      }
    })
    console.log(`🎯 Final position count in database: ${finalCount}`)
    
  } catch (error: any) {
    console.error('❌ Error in syncOpenPositionsSafe:', error.message)
    throw error
  }
}