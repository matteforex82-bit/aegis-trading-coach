const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function checkAccountId() {
  try {
    console.log('🔍 Checking account ID cmeu5qgwr0002ie04zjubie55...');
    
    const account = await db.account.findUnique({
      where: { id: 'cmeu5qgwr0002ie04zjubie55' }
    });
    
    if (account) {
      console.log('✅ Account found:', account.login, account.name);
    } else {
      console.log('❌ Account NOT FOUND with that ID');
      
      // Get the actual account ID
      const realAccount = await db.account.findFirst({
        where: { login: '20045652' }
      });
      
      if (realAccount) {
        console.log('✅ Real account ID:', realAccount.id);
        console.log('✅ Real account login:', realAccount.login);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await db.$disconnect();
  }
}

checkAccountId();