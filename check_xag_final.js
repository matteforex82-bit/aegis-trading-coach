const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAndCleanXAG() {
  try {
    console.log('🔍 Checking for XAGUSD #162527...')
    
    const account = await prisma.account.findFirst({ where: { login: '2958' } })
    if (!account) { 
      console.log('❌ Account not found')
      return 
    }
    
    const allXAG = await prisma.trade.findMany({
      where: { accountId: account.id, ticketId: '162527' }
    })
    
    console.log('📊 XAGUSD #162527 trovate nel database:', allXAG.length)
    
    for (const pos of allXAG) {
      console.log(`  ID: ${pos.id}`)
      console.log(`  Status: ${pos.closeTime ? 'CLOSED' : 'OPEN'}`)
      console.log(`  Close Time: ${pos.closeTime || 'N/A'}`)
      console.log(`  P&L: ${(pos.pnlGross + (pos.commission || 0) + (pos.swap || 0)).toFixed(2)}`)
      console.log('  ---')
    }
    
    // Cancella TUTTE le XAGUSD per essere sicuri
    if (allXAG.length > 0) {
      console.log('🗑️ Cancello TUTTE le XAGUSD #162527 per reset completo...')
      const deleted = await prisma.trade.deleteMany({
        where: { 
          accountId: account.id, 
          ticketId: '162527' 
        }
      })
      console.log('✅ Cancellate:', deleted.count, 'XAGUSD positions')
    } else {
      console.log('✅ Nessuna XAGUSD da cancellare')
    }
    
    console.log('🎯 Database pulito e pronto per EA sync!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndCleanXAG()