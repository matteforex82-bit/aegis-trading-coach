const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function getCorrectAccountId() {
  try {
    console.log('🔍 Cercando account nel database...')
    
    // Trova tutti gli account
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        login: true,
        name: true,
        broker: true
      }
    })
    
    console.log(`\n📊 Trovati ${accounts.length} account(s):`);
    
    accounts.forEach((account, index) => {
      console.log(`${index + 1}. ID: ${account.id}`);
      console.log(`   Login: ${account.login}`);
      console.log(`   Nome: ${account.name || 'N/A'}`);
      console.log(`   Broker: ${account.broker || 'N/A'}`);
      console.log('---');
    });
    
    if (accounts.length > 0) {
      console.log(`\n✅ L'URL corretto dovrebbe essere: /account/${accounts[0].id}`);
      console.log(`\n🔗 URL completo: http://localhost:3000/account/${accounts[0].id}`);
    } else {
      console.log('\n❌ Nessun account trovato nel database');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

getCorrectAccountId()