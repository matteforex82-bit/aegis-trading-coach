import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test endpoint hit')
    
    const body = await request.json()
    console.log('📥 Body received:', JSON.stringify(body, null, 2))
    
    // Analizza la struttura del payload
    console.log('📊 Body keys:', Object.keys(body))
    console.log('📏 Payload size:', JSON.stringify(body).length, 'characters')
    
    if (body.account) {
      console.log('🏦 Account data present')
      console.log('   Login:', body.account.login)
      console.log('   Keys:', Object.keys(body.account))
    }
    
    if (body.trades) {
      console.log('📈 Trades data present:', Array.isArray(body.trades) ? body.trades.length : 'not array')
      if (Array.isArray(body.trades) && body.trades.length > 0) {
        console.log('   First trade keys:', Object.keys(body.trades[0]))
      }
    }
    
    if (body.metrics) {
      console.log('📊 Metrics data present')
      console.log('   Keys:', Object.keys(body.metrics))
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test successful - data analyzed',
      receivedData: {
        hasAccount: !!body.account,
        hasTrades: !!body.trades,
        hasMetrics: !!body.metrics,
        tradesCount: Array.isArray(body.trades) ? body.trades.length : 0,
        payloadSize: JSON.stringify(body).length
      }
    })
    
  } catch (error: any) {
    console.error('❌ Test error:', error)
    console.error('❌ Test stack:', error.stack)
    return NextResponse.json(
      { 
        error: 'Test failed', 
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}