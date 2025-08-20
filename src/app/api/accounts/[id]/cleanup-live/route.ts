import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🧹 CLEANUP LIVE POSITIONS - Account:', params.id)
  
  try {
    // Find the account
    const account = await db.account.findUnique({
      where: { id: params.id }
    })
    
    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }
    
    console.log('✅ Found account:', account.login)
    
    // DELETE ALL OPEN POSITIONS (closeTime = null) for this account
    const deletedPositions = await db.trade.deleteMany({
      where: {
        accountId: params.id,
        closeTime: null  // Only delete open positions
      }
    })
    
    console.log('🗑️ Deleted', deletedPositions.count, 'live positions')
    
    // Reset account state for fresh EA sync
    await db.account.update({
      where: { id: params.id },
      data: {
        // Reset any cached states if needed
        updatedAt: new Date()
      }
    })
    
    console.log('✅ Account reset - Ready for fresh EA sync')
    
    return NextResponse.json({
      success: true,
      message: 'Live positions cleaned successfully',
      deletedCount: deletedPositions.count,
      accountLogin: account.login,
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('❌ Error cleaning live positions:', error)
    return NextResponse.json(
      { error: 'Failed to clean live positions', details: error.message },
      { status: 500 }
    )
  }
}