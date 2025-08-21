const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkResult() {
  try {
    const account = await prisma.account.findFirst({ where: { login: '2958' } })
    
    const allXAG = await prisma.trade.findMany({
      where: {
        accountId: account.id,
        OR: [
          { ticketId: '162527' },
          { ticketId: { startsWith: '162527_' } }
        ]
      },
      orderBy: { createdAt: 'asc' }
    })
    
    console.log('🔍 RISULTATO TEST CONFLICT RESOLUTION:')
    console.log('Posizioni XAGUSD trovate:', allXAG.length)
    
    allXAG.forEach((pos, i) => {
      console.log(`${i+1}. Ticket: ${pos.ticketId}`)
      console.log(`   Status: ${pos.closeTime ? 'CLOSED' : 'OPEN'}`)
      console.log(`   Volume: ${pos.volume} lots`)
      console.log(`   P&L: $${((pos.pnlGross || 0) + (pos.commission || 0) + (pos.swap || 0)).toFixed(2)}`)
      if (pos.closeTime) console.log(`   Closed: ${pos.closeTime}`)
      if (pos.comment) console.log(`   Comment: ${pos.comment}`)
      console.log('   ---')
    })
    
    const openPos = allXAG.filter(p => !p.closeTime)
    const closedPos = allXAG.filter(p => p.closeTime)
    
    console.log(`📊 RIEPILOGO:`)
    console.log(`   Posizioni aperte: ${openPos.length}`)
    console.log(`   Posizioni chiuse: ${closedPos.length}`)
    
    if (openPos.length === 1 && closedPos.length === 1) {
      console.log('✅ CONFLICT RESOLUTION RIUSCITO!')
      console.log('   - Posizione chiusa rinominata automaticamente')
      console.log('   - Posizione live creata con ID originale')
    } else {
      console.log('❌ Problema nella risoluzione del conflitto')
    }
    
    // Check dei logs per vedere se il conflict resolver ha funzionato
    console.log('\n🔍 Controllare i logs del server per vedere:')
    console.log('   "🔄 PARTIAL CLOSURE DETECTED: Renaming closed position"')
    console.log('   "✅ Conflict resolved: Live position 162527 can now be created"')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkResult()