const { PrismaClient } = require('@prisma/client')
const sqlitePrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
})

const postgresPrisma = new PrismaClient()

async function migrateData() {
  try {
    console.log('🔄 Starting data migration from SQLite to PostgreSQL...')
    
    // Migrate Users
    console.log('� migrating users...')
    const users = await sqlitePrisma.user.findMany()
    for (const user of users) {
      await postgresPrisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      })
    }
    console.log(`✅ Migrated ${users.length} users`)

    // Migrate Accounts
    console.log('� migrating accounts...')
    const accounts = await sqlitePrisma.account.findMany()
    for (const account of accounts) {
      await postgresPrisma.account.upsert({
        where: { id: account.id },
        update: {},
        create: {
          id: account.id,
          name: account.name,
          login: account.login,
          broker: account.broker,
          server: account.server,
          currency: account.currency,
          timezone: account.timezone,
          userId: account.userId,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt
        }
      })
    }
    console.log(`✅ Migrated ${accounts.length} accounts`)

    // Migrate Trades
    console.log('� migrating trades...')
    const trades = await sqlitePrisma.trade.findMany()
    for (const trade of trades) {
      await postgresPrisma.trade.upsert({
        where: { id: trade.id },
        update: {},
        create: {
          id: trade.id,
          ticketId: trade.ticketId,
          positionId: trade.positionId,
          orderId: trade.orderId,
          symbol: trade.symbol,
          side: trade.side,
          volume: trade.volume,
          openTime: trade.openTime,
          closeTime: trade.closeTime,
          openPrice: trade.openPrice,
          closePrice: trade.closePrice,
          sl: trade.sl,
          tp: trade.tp,
          commission: trade.commission,
          swap: trade.swap,
          taxes: trade.taxes,
          pnlGross: trade.pnlGross,
          comment: trade.comment,
          magic: trade.magic,
          dealReason: trade.dealReason,
          closeReason: trade.closeReason,
          accountId: trade.accountId,
          createdAt: trade.createdAt,
          updatedAt: trade.updatedAt
        }
      })
    }
    console.log(`✅ Migrated ${trades.length} trades`)

    console.log('🎉 Migration completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await sqlitePrisma.$disconnect()
    await postgresPrisma.$disconnect()
  }
}

migrateData()