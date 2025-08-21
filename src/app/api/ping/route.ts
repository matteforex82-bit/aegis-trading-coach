import { NextResponse } from 'next/server'

// Simple ping endpoint for EA connectivity check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'PropControl API',
    message: '🟢 Server is responding'
  }, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

export async function POST() {
  return NextResponse.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    message: '✅ Ready for MT5 data'
  }, { status: 200 })
}