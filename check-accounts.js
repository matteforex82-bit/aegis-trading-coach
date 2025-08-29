const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function checkAccounts() {
  try {
    const accounts = await db.account.findMany({
      include: {
        propFirmTemplate: {
          include: {
            propFirm: true
          }
        }
      }
    });

    console.log('=== ACCOUNTS WITH TEMPLATES ===');
    accounts.forEach(acc => {
      console.log(`Account: ${acc.name || acc.login}`);
      if (acc.propFirmTemplate) {
        console.log(`  Template: ${acc.propFirmTemplate.name}`);
        console.log(`  PropFirm: ${acc.propFirmTemplate.propFirm?.name}`);
        console.log(`  Account Size: $${acc.propFirmTemplate.accountSize}`);
        console.log(`  Phase: ${acc.currentPhase}`);
      } else {
        console.log(`  No template assigned`);
      }
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.$disconnect();
  }
}

checkAccounts();