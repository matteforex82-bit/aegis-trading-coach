const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findAccountId() {
  try {
    const trade = await prisma.trade.findFirst({
      where: { closeTime: null },
      include: { account: true }
    });
    
    if (trade && trade.account) {
      console.log('Account ID:', trade.account.id);
      console.log('Account Login:', trade.account.login);
    } else {
      console.log('No open trades found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findAccountId();