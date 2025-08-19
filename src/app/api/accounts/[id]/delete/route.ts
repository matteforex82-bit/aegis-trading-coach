import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

//+------------------------------------------------------------------+
//| DELETE /api/accounts/[id]/delete - Delete account and all data  |
//+------------------------------------------------------------------+
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: accountId } = params
    
    console.log('🗑️ Deleting account:', accountId)
    
    // Get account details first for logging
    const account = await db.account.findUnique({
      where: { id: accountId },
      include: {
        _count: {
          select: {
            trades: true,
            challenges: true
          }
        },
        propFirmTemplate: {
          select: {
            name: true,
            propFirm: {
              select: { name: true }
            }
          }
        }
      }
    })

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      )
    }

    console.log('📊 Account to delete:')
    console.log(`   Login: ${account.login}`)
    console.log(`   Name: ${account.name || 'No name'}`)
    console.log(`   Broker: ${account.broker}`)
    console.log(`   Trades: ${account._count.trades}`)
    console.log(`   Challenges: ${account._count.challenges}`)
    if (account.propFirmTemplate) {
      console.log(`   PropFirm: ${account.propFirmTemplate.propFirm.name} - ${account.propFirmTemplate.name}`)
    }

    // Delete in correct order due to foreign key constraints
    console.log('🔄 Deleting related data...')

    // 1. Delete trades (most data)
    const deletedTrades = await db.trade.deleteMany({
      where: { accountId }
    })
    console.log(`   ✅ Deleted ${deletedTrades.count} trades`)

    // 2. Delete challenges
    const deletedChallenges = await db.challenge.deleteMany({
      where: { accountId }
    })
    console.log(`   ✅ Deleted ${deletedChallenges.count} challenges`)

    // 3. Delete metrics
    const deletedMetrics = await db.metric.deleteMany({
      where: { accountId }
    })
    console.log(`   ✅ Deleted ${deletedMetrics.count} metrics`)

    // 4. Finally delete the account
    await db.account.delete({
      where: { id: accountId }
    })
    console.log(`   ✅ Deleted account ${account.login}`)

    console.log('🎯 Account deletion completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
      deletedData: {
        accountLogin: account.login,
        tradesDeleted: deletedTrades.count,
        challengesDeleted: deletedChallenges.count,
        metricsDeleted: deletedMetrics.count
      }
    })

  } catch (error: any) {
    console.error('❌ Error deleting account:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete account',
        details: error.message 
      },
      { status: 500 }
    )
  }
}