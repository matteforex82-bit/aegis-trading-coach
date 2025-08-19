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
    const { account, trades, metrics } = body
    console.log('🔍 Request type - account:', !!account, 'trades:', !!trades, 'metrics:', !!metrics)
    
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
    console.log('🚀 Starting SAFE trade sync...')
    
    // Only basic account creation - no PropFirm yet
    const accountRecord = await createOrUpdateAccountSafe(account)
    console.log('✅ Account processed:', accountRecord.id)

    // For now, just acknowledge trades without processing
    console.log('📊 Acknowledging', trades.length, 'trades (safe mode)')
    
    return NextResponse.json({
      success: true,
      message: 'Trades acknowledged successfully (safe mode)',
      processedTrades: 0,
      acknowledgedTrades: trades.length,
      accountLogin: account.login,
      mode: 'safe',
      dashboardUrl: process.env.NEXTAUTH_URL || 'https://new2dash.vercel.app'
    })
  } catch (error: any) {
    console.error('❌ Error in safe trade sync:', error)
    console.error('❌ Safe trade sync stack:', error.stack)
    throw error
  }
}

//+------------------------------------------------------------------+
//| Handle Live Metrics Synchronization - SAFE VERSION             |
//+------------------------------------------------------------------+
async function handleMetricsSyncSafe(account: any, metrics: any) {
  try {
    console.log('📊 Starting SAFE metrics sync...')
    
    // Only basic account creation - no complex metrics processing
    const accountRecord = await createOrUpdateAccountSafe(account)
    console.log('✅ Account processed for metrics:', accountRecord.id)

    // Log metrics data but don't store in database yet
    console.log('📈 Metrics received (safe mode):')
    console.log('   Equity:', metrics.equity)
    console.log('   Balance:', metrics.balance)
    console.log('   Drawdown:', metrics.drawdown)
    console.log('   Daily P&L:', metrics.dailyPnL)
    
    return NextResponse.json({
      success: true,
      message: 'Metrics acknowledged successfully (safe mode)',
      mode: 'safe',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ Error in safe metrics sync:', error)
    console.error('❌ Safe metrics sync stack:', error.stack)
    throw error
  }
}

//+------------------------------------------------------------------+
//| Create or Update Account - SAFE VERSION                        |
//+------------------------------------------------------------------+
async function createOrUpdateAccountSafe(account: any) {
  console.log('🏦 Creating/updating account SAFELY for login:', account.login)
  
  try {
    console.log('🔍 Looking for existing account...')
    const existingAccount = await db.account.findUnique({
      where: { login: account.login.toString() }
    })

    if (existingAccount) {
      console.log('📝 Found existing account:', existingAccount.id)
      
      // Simple update - only basic fields, no PropFirm
      return await db.account.update({
        where: { login: account.login.toString() },
        data: {
          name: account.name || existingAccount.name,
          broker: account.broker || existingAccount.broker,
          server: account.server || existingAccount.server,
          currency: account.currency || existingAccount.currency,
          timezone: account.timezone || existingAccount.timezone || 'Europe/Rome'
          // Skip all PropFirm fields to avoid enum issues
        }
      })
    } else {
      console.log('🆕 Creating new account safely...')
      
      // Create temp user first
      console.log('👤 Creating temp user...')
      const tempUser = await db.user.create({
        data: {
          email: `temp_${account.login}@propcontrol.com`,
          name: `${account.broker || 'Trading'} Account`
        }
      })
      console.log('✅ Temp user created:', tempUser.id)

      // Create simple account - no PropFirm fields at all
      return await db.account.create({
        data: {
          login: account.login.toString(),
          name: account.name || `${account.broker} Account`,
          broker: account.broker,
          server: account.server,
          currency: account.currency,
          timezone: account.timezone || 'Europe/Rome',
          userId: tempUser.id
          // No PropFirm fields - completely safe
        }
      })
    }
  } catch (error: any) {
    console.error('❌ Error in safe account creation:', error)
    console.error('❌ Account data that failed:', JSON.stringify(account, null, 2))
    throw error
  }
}

// All complex functions removed for safe mode
// Will add them back gradually once basic functionality works