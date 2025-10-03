import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a sample user
  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      name: 'Demo User',
    },
  })

  // Create a sample trading account
  const account = await prisma.tradingAccount.create({
    data: {
      userId: user.id,
      name: 'Account Demo MT5',
      login: '123456',
      broker: 'MetaQuotes',
      server: 'Demo Server',
      currency: 'USD',
      timezone: 'Europe/Rome',
    },
  })

  // Create some sample trades
  const trades = [
    {
      ticketId: '12345',
      positionId: 'pos1',
      orderId: 'ord1',
      symbol: 'EURUSD',
      side: 'buy',
      volume: 0.1,
      openTime: new Date('2025-01-15T10:30:00Z'),
      closeTime: new Date('2025-01-15T15:45:00Z'),
      openPrice: 1.0850,
      closePrice: 1.0900,
      pnlGross: 45.0,
      commission: 2.5,
      swap: 0.5,
      comment: 'Trade chiuso a profitto',
      magic: 12345,
      dealReason: 'client',
      accountId: account.id,
    },
    {
      ticketId: '12346',
      positionId: 'pos2',
      orderId: 'ord2',
      symbol: 'GBPUSD',
      side: 'sell',
      volume: 0.2,
      openTime: new Date('2025-01-15T11:15:00Z'),
      closeTime: new Date('2025-01-15T14:20:00Z'),
      openPrice: 1.2650,
      closePrice: 1.2600,
      pnlGross: 85.0,
      commission: 3.0,
      swap: -1.2,
      comment: 'Trade chiuso a profitto',
      magic: 12345,
      dealReason: 'expert',
      accountId: account.id,
    },
    {
      ticketId: '12347',
      positionId: 'pos3',
      orderId: 'ord3',
      symbol: 'USDJPY',
      side: 'buy',
      volume: 0.05,
      openTime: new Date('2025-01-15T14:00:00Z'),
      openPrice: 149.50,
      closePrice: 149.45,
      pnlGross: -12.5,
      commission: 1.5,
      swap: 0.3,
      comment: 'Trade chiuso a perdita',
      magic: 12345,
      dealReason: 'client',
      accountId: account.id,
    },
  ]

  for (const trade of trades) {
    await prisma.trade.create({
      data: trade,
    })
  }

  console.log('Sample trades created successfully!')

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })