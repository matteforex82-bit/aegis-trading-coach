import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Test 1: Can we access User table?
    const userCount = await db.user.count()

    // Test 2: Can we access TradingAccount table?
    let tradingAccountCount = 'ERROR'
    try {
      tradingAccountCount = (await db.tradingAccount.count()).toString()
    } catch (e: any) {
      tradingAccountCount = `ERROR: ${e.code} - ${e.message}`
    }

    // Test 3: List all available tables
    const tables = await db.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    return NextResponse.json({
      success: true,
      tests: {
        userCount,
        tradingAccountCount,
        tables
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      stack: error.stack
    }, { status: 500 })
  }
}
