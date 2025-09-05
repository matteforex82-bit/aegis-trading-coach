const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function checkAccount() {
  try {
    const accountId = 'cmf5xfjgs00b4hz04i25obf3z';
    
    const account = await db.account.findUnique({
      where: { id: accountId },
      include: {
        propFirmTemplate: {
          include: {
            propFirm: true
          }
        }
      }
    });
    
    if (account) {
      console.log('✅ Account trovato localmente:');
      console.log('- ID:', account.id);
      console.log('- Login:', account.login);
      console.log('- Nome:', account.name);
      console.log('- Template:', account.propFirmTemplate?.name || 'Nessuno');
    } else {
      console.log('❌ Account non trovato nel database locale');
      console.log('Cerco alcuni account disponibili...');
      
      const allAccounts = await db.account.findMany({
        select: { id: true, login: true, name: true },
        take: 10
      });
      
      console.log('Account disponibili (primi 10):', allAccounts.length);
      allAccounts.forEach(acc => {
        console.log(`- ${acc.id} (${acc.login}) - ${acc.name}`);
      });
    }
  } catch (error) {
    console.error('Errore:', error.message);
  } finally {
    await db.$disconnect();
  }
}

checkAccount();