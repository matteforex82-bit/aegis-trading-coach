const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function checkAccounts() {
  try {
    console.log('🔍 Checking available accounts...');
    
    const accounts = await db.account.findMany({
      include: {
        propFirmTemplate: {
          include: {
            propFirm: true
          }
        }
      }
    });
    
    console.log(`📋 Found ${accounts.length} accounts:`);
    
    accounts.forEach(acc => {
      console.log(`- ${acc.login} (${acc.name})`);
      console.log(`  Template: ${acc.propFirmTemplate?.name || 'NONE'}`);
      console.log(`  PropFirm: ${acc.propFirmTemplate?.propFirm?.name || 'NONE'}`);
      console.log(`  Phase: ${acc.currentPhase}`);
      console.log(`  Start Balance: $${acc.startBalance}`);
      console.log('');
    });
    
    // Check specifically for FUTURA FUNDING accounts
    const futuraAccounts = accounts.filter(acc => 
      acc.propFirmTemplate?.propFirm?.name === 'FUTURA FUNDING'
    );
    
    console.log(`🎯 FUTURA FUNDING accounts: ${futuraAccounts.length}`);
    futuraAccounts.forEach(acc => {
      console.log(`- ${acc.login}: ${acc.propFirmTemplate?.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking accounts:', error);
  } finally {
    await db.$disconnect();
  }
}

checkAccounts();