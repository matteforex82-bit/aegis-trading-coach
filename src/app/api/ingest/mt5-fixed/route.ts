import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  console.log('🔧 MT5-FIXED endpoint hit')
  
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

    // Handle different types of requests
    if (trades && Array.isArray(trades)) {
      console.log('📈 Processing trade sync with', trades.length, 'trades')
      return await handleTradeSyncSimple(account, trades)
    } else if (metrics) {
      console.log('📊 Processing metrics sync')
      return await handleMetricsSyncSimple(account, metrics)
    } else {
      console.log('❌ No valid data type found')
      return NextResponse.json(
        { error: 'Either trades or metrics data is required' },
        { status: 400 }
      )
    }

  } catch (error: any) {
    console.error('❌ Fatal error in MT5-FIXED ingest:', error)
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
//| Handle Trade Synchronization - SIMPLIFIED VERSION              |
//+------------------------------------------------------------------+
async function handleTradeSyncSimple(account: any, trades: any[]) {
  try {
    console.log('🚀 Starting simplified trade sync...')
    
    // STEP 1: Only create/find account - no PropFirm for now
    console.log('🏦 Step 1: Account processing...')
    const accountRecord = await createOrUpdateAccountSimple(account)
    console.log('✅ Account processed:', accountRecord.id)

    // STEP 2: Return success without processing trades for now
    console.log('📊 Skipping trade processing for now (simplified mode)')
    
    return NextResponse.json({
      success: true,
      message: 'Trades sync successful (simplified)',
      processedTrades: 0,
      skippedTrades: trades.length,
      accountLogin: account.login,
      mode: 'simplified',
      dashboardUrl: process.env.NEXTAUTH_URL || 'https://new2dash.vercel.app'
    })
  } catch (error: any) {
    console.error('❌ Error in simplified trade sync:', error)
    console.error('❌ Trade sync stack:', error.stack)
    throw error
  }
}

//+------------------------------------------------------------------+
//| Handle Metrics Sync - SIMPLIFIED VERSION                       |
//+------------------------------------------------------------------+
async function handleMetricsSyncSimple(account: any, metrics: any) {
  try {
    console.log('📊 Starting simplified metrics sync...')
    
    // Only create/find account
    const accountRecord = await createOrUpdateAccountSimple(account)
    
    console.log('📊 Skipping metrics processing for now (simplified mode)')

    return NextResponse.json({
      success: true,
      message: 'Metrics sync successful (simplified)',
      mode: 'simplified',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ Error in simplified metrics sync:', error)
    throw error
  }
}

//+------------------------------------------------------------------+
//| Create or Update Account - SIMPLIFIED VERSION                  |
//+------------------------------------------------------------------+
async function createOrUpdateAccountSimple(account: any) {
  console.log('🏦 Creating/updating account for login:', account.login)
  
  try {
    console.log('🔍 Looking for existing account...')
    const existingAccount = await db.account.findUnique({
      where: { login: account.login.toString() }
    })

    if (existingAccount) {
      console.log('📝 Found existing account:', existingAccount.id)
      
      // Simple update - only basic fields
      return await db.account.update({
        where: { login: account.login.toString() },
        data: {
          name: account.name || existingAccount.name,
          broker: account.broker || existingAccount.broker,
          server: account.server || existingAccount.server,
          currency: account.currency || existingAccount.currency,
          timezone: account.timezone || existingAccount.timezone || 'Europe/Rome'
          // Skip PropFirm extensions for now
        }
      })
    } else {
      console.log('🆕 Creating new account...')
      
      // Create temp user first
      console.log('👤 Creating temp user...')
      const tempUser = await db.user.create({
        data: {
          email: `temp_${account.login}@propcontrol.com`,
          name: `${account.broker || 'Trading'} Account`
        }
      })
      console.log('✅ Temp user created:', tempUser.id)

      // Create simple account - no PropFirm fields
      return await db.account.create({
        data: {
          login: account.login.toString(),
          name: account.name || `${account.broker} Account`,
          broker: account.broker,
          server: account.server,
          currency: account.currency,
          timezone: account.timezone || 'Europe/Rome',
          userId: tempUser.id
          // Skip all PropFirm fields initially
        }
      })
    }
  } catch (error: any) {
    console.error('❌ Error in simplified account creation:', error)
    console.error('❌ Account data that failed:', JSON.stringify(account, null, 2))
    throw error
  }
}