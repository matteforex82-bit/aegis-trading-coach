import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('📥 Simple endpoint - Body:', JSON.stringify(body, null, 2))
    
    return NextResponse.json({
      success: true,
      message: 'Simple endpoint working',
      timestamp: new Date().toISOString(),
      receivedData: body
    })
    
  } catch (error: any) {
    console.error('❌ Simple endpoint error:', error)
    return NextResponse.json(
      { 
        error: 'Simple endpoint failed', 
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}