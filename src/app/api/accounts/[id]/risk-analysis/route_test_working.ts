import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 TEST Risk Analysis for account:', id)

    // Simple test - just return current values without complex calculations
    const result = {
      testMessage: "API is working",
      accountId: id,
      currentTime: new Date().toISOString(),
      // Mock data that should show in dashboard
      riskAnalysis: {
        currentEquity: 49971,
        startingBalance: 50000,
        dailyLossLimitUSD: 2500,
        overallLossLimitUSD: 5000,
        dailyLossesRealized: 443.85,
        dailyLossesFloating: 29.18,
        maxRiskFromSL: 803,
        maxRiskFromNoSL: 0,
        dailyMarginLeft: 2056.15, // 2500 - 443.85
        overallMarginLeft: 1176,   // 5000 - (50000-46176)
        controllingLimit: 'OVERALL',
        finalSafeCapacity: 373,    // 1176 - 803
        riskLevel: 'CAUTION',
        alerts: []
      }
    }
    
    console.log('✅ Returning test result:', result)
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('❌ Test error:', error)
    return NextResponse.json(
      { error: 'Test failed', details: error.message },
      { status: 500 }
    )
  }
}