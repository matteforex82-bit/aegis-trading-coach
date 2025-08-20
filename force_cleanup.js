const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function forceCleanup() {
  try {
    console.log('🔥 FORCE CLEANUP - Removing problematic positions...')
    
    // Find account
    const account = await prisma.account.findFirst({
      where: {
        login: '2958'
      }
    })
    
    if (!account) {
      console.log('❌ Account not found')
      return
    }
    
    console.log('✅ Found account:', account.login, '(ID:', account.id, ')')
    
    // DELETE XAGUSD #162527 completely (both open and closed)
    const deletedXAG = await prisma.trade.deleteMany({
      where: {
        accountId: account.id,
        ticketId: '162527'
      }
    })
    console.log('🗑️ Deleted XAGUSD #162527:', deletedXAG.count, 'records')
    
    // DELETE any other problematic positions that might conflict
    const problemTickets = ['86014', '163235'] // WTI positions that might cause issues
    
    for (const ticket of problemTickets) {
      const deleted = await prisma.trade.deleteMany({
        where: {
          accountId: account.id,
          ticketId: ticket
        }
      })
      if (deleted.count > 0) {
        console.log(`🗑️ Deleted ticket #${ticket}:`, deleted.count, 'records')
      }
    }
    
    // Show final state
    const remainingOpen = await prisma.trade.count({
      where: {
        accountId: account.id,
        closeTime: null
      }
    })
    
    const remainingClosed = await prisma.trade.count({
      where: {
        accountId: account.id,
        closeTime: { not: null }
      }
    })
    
    console.log('✅ CLEANUP COMPLETED:')
    console.log('   Open positions remaining:', remainingOpen)
    console.log('   Closed positions remaining:', remainingClosed)
    console.log('   🎯 Database is now clean for EA sync!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

forceCleanup()