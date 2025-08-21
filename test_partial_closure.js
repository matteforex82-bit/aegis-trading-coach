const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function setupPartialClosureScenario() {
  try {
    console.log('🧪 Setting up PARTIAL CLOSURE test scenario...')
    
    const account = await prisma.account.findFirst({ where: { login: '2958' } })
    if (!account) {
      console.log('❌ Account not found')
      return
    }
    
    // STEP 1: Remove any existing XAGUSD #162527
    await prisma.trade.deleteMany({
      where: {
        accountId: account.id,
        OR: [
          { ticketId: '162527' },
          { ticketId: { startsWith: '162527_' } }
        ]
      }
    })
    console.log('🗑️ Cleaned existing XAGUSD positions')
    
    // STEP 2: Create the CLOSED partial position (from Excel import)
    const closedPosition = await prisma.trade.create({
      data: {
        ticketId: '162527', // Same ticket as live position!
        positionId: '162527',
        orderId: '162527',
        symbol: 'XAGUSD.p',
        side: 'BUY',
        volume: 0.10, // Partial closure volume
        openPrice: 28.85,
        closePrice: 37.18, // Closed with profit
        openTime: new Date('2025-08-01T08:35:00Z'), // Original open time
        closeTime: new Date('2025-08-14T18:06:04Z'), // Partial close time
        pnlGross: 833.50, // Profit from closed portion
        swap: 0.00,
        commission: 0.00,
        comment: 'Partial closure imported from Excel',
        accountId: account.id,
        tradePhase: 'PHASE_1'
      }
    })
    
    console.log('✅ Created CLOSED partial position:')
    console.log(`   Ticket: ${closedPosition.ticketId}`)
    console.log(`   Volume: ${closedPosition.volume} lots`)
    console.log(`   Status: CLOSED on ${closedPosition.closeTime}`)
    console.log(`   P&L: $${closedPosition.pnlGross}`)
    
    // STEP 3: Show current database state
    const allXAG = await prisma.trade.findMany({
      where: {
        accountId: account.id,
        OR: [
          { ticketId: '162527' },
          { ticketId: { startsWith: '162527_' } }
        ]
      }
    })
    
    console.log('\n📊 Current XAGUSD positions in database:')
    allXAG.forEach(pos => {
      console.log(`   ${pos.ticketId}: ${pos.closeTime ? 'CLOSED' : 'OPEN'} - ${pos.volume} lots`)
    })
    
    console.log('\n🎯 Ready for EA sync test!')
    console.log('   Now run: node test_ea_sync.js')
    console.log('   Expected: Conflict detection and automatic resolution')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupPartialClosureScenario()