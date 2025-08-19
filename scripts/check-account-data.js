const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAccountData() {
  console.log('🔍 Checking account data consistency...\n')

  try {
    // Get all accounts
    const accounts = await prisma.account.findMany({
      include: {
        propFirmTemplate: {
          include: { propFirm: true }
        },
        _count: {
          select: { trades: true }
        }
      }
    })

    console.log('📊 ACCOUNTS FOUND:')
    accounts.forEach(account => {
      console.log(`   ID: ${account.id}`)
      console.log(`   Login: ${account.login}`)
      console.log(`   Name: ${account.name || 'No name'}`)
      console.log(`   Broker: ${account.broker}`)
      console.log(`   Trades count: ${account._count.trades}`)
      console.log(`   PropFirm: ${account.propFirmTemplate ? 
        `${account.propFirmTemplate.propFirm.name} - ${account.propFirmTemplate.name}` : 
        'None'}`)
      console.log('   ---')
    })

    // Check account 2958 specifically
    console.log('\n🎯 ACCOUNT 2958 DETAILS:')
    const account2958 = await prisma.account.findUnique({
      where: { login: '2958' },
      include: {
        trades: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (account2958) {
      console.log(`   Found account 2958: ${account2958.id}`)
      console.log(`   Total trades: ${account2958.trades.length}`)
      
      // Check open trades
      const openTrades = await prisma.trade.findMany({
        where: { 
          accountId: account2958.id,
          closeTime: null
        }
      })
      
      console.log(`   Open trades: ${openTrades.length}`)
      openTrades.forEach(trade => {
        const pnl = (trade.pnlGross || 0) + (trade.swap || 0) + (trade.commission || 0)
        console.log(`     ${trade.symbol} ${trade.side} ${trade.volume} lots → P&L: $${pnl.toFixed(2)}`)
      })

      // Check closed trades summary
      const closedTrades = await prisma.trade.findMany({
        where: { 
          accountId: account2958.id,
          closeTime: { not: null }
        }
      })
      
      const totalClosedPnL = closedTrades.reduce((sum, trade) => {
        return sum + (trade.pnlGross || 0) + (trade.swap || 0) + (trade.commission || 0)
      }, 0)
      
      console.log(`   Closed trades: ${closedTrades.length}`)
      console.log(`   Total closed P&L: $${totalClosedPnL.toFixed(2)}`)

    } else {
      console.log('   ❌ Account 2958 not found!')
    }

    // Check if there are trades from old account 20045652
    console.log('\n🔍 CHECKING OLD ACCOUNT 20045652:')
    const oldAccount = await prisma.account.findUnique({
      where: { login: '20045652' },
      include: {
        _count: { select: { trades: true } }
      }
    })

    if (oldAccount) {
      console.log(`   Found old account: ${oldAccount.id}`)
      console.log(`   Trades count: ${oldAccount._count.trades}`)
    } else {
      console.log('   Old account not found or deleted')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAccountData()