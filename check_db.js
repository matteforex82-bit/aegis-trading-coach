const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAll() {
  try {
    console.log('🔍 CHECKING ALL ACCOUNTS...')
    
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        login: true,
        name: true,
        broker: true
      }
    })
    
    console.log('📊 FOUND ACCOUNTS:', accounts.length)
    accounts.forEach(acc => {
      console.log(`Account: ${acc.login} - ${acc.name} (${acc.broker})`)
    })
    
    if (accounts.length === 0) {
      console.log('❌ No accounts found in database')
      return
    }
    
    // Use first account or find the right one
    let targetAccount = accounts.find(acc => acc.login.includes('5021')) || accounts[0]
    console.log('\n✅ Using account:', targetAccount.login)
    
    // Get all open positions
    const openPositions = await prisma.trade.findMany({
      where: {
        accountId: targetAccount.id,
        closeTime: null
      },
      orderBy: {
        ticketId: 'asc'
      }
    })
    
    console.log('📊 OPEN POSITIONS IN DATABASE:', openPositions.length)
    
    openPositions.forEach(pos => {
      const pnl = pos.pnlGross + (pos.commission || 0) + (pos.swap || 0)
      console.log(`${pos.symbol} #${pos.ticketId}: P&L=$${pnl.toFixed(2)}, Updated: ${pos.updatedAt}`)
    })
    
    // Check for XAGUSD specifically in OPEN positions
    const xagPosition = openPositions.find(p => p.ticketId === '162527')
    console.log('\n🔍 XAGUSD #162527 (OPEN):', xagPosition ? 'FOUND ✅' : 'NOT FOUND ❌')
    
    // Check for XAGUSD in ALL positions (including closed)
    const allXagPositions = await prisma.trade.findMany({
      where: {
        accountId: targetAccount.id,
        ticketId: '162527'
      }
    })
    console.log('🔍 XAGUSD #162527 (ALL):', allXagPositions.length, 'found')
    allXagPositions.forEach(pos => {
      console.log(`   Status: ${pos.closeTime ? 'CLOSED' : 'OPEN'}`)
      console.log(`   Close Time: ${pos.closeTime || 'N/A'}`)
      console.log(`   P&L: $${(pos.pnlGross + (pos.commission || 0) + (pos.swap || 0)).toFixed(2)}`)
    })
    
    // Check for WTI
    const wtiPositions = openPositions.filter(p => p.symbol.toLowerCase().includes('wti') || p.symbol.toLowerCase().includes('oil'))
    console.log('\n🛢️ WTI/OIL POSITIONS (OPEN):', wtiPositions.length)
    wtiPositions.forEach(pos => {
      console.log(`   ${pos.symbol} #${pos.ticketId}: ${pos.side} ${pos.volume} lots`)
    })
    
    // Check for WTI in ALL positions
    const allWtiPositions = await prisma.trade.findMany({
      where: {
        accountId: targetAccount.id,
        symbol: {
          contains: 'WTI',
          mode: 'insensitive'
        }
      }
    })
    console.log('🛢️ WTI POSITIONS (ALL):', allWtiPositions.length)
    allWtiPositions.forEach(pos => {
      console.log(`   ${pos.symbol} #${pos.ticketId}: Status=${pos.closeTime ? 'CLOSED' : 'OPEN'}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAll()