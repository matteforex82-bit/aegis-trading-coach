import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test endpoint hit')
    
    const body = await request.json()
    console.log('📥 Body received:', JSON.stringify(body, null, 2))
    
    // Test database connection
    console.log('🔌 Testing database connection...')
    const userCount = await db.user.count()
    console.log('👥 User count:', userCount)
    
    return NextResponse.json({
      success: true,
      message: 'Test successful',
      receivedData: body,
      dbConnection: 'OK',
      userCount: userCount
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