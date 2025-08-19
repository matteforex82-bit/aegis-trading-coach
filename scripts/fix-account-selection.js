const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAccountSelection() {
  try {
    console.log('🔧 Fixing account selection issue...\n');
    
    // Find accounts
    const oldAccount = await prisma.account.findFirst({
      where: { login: '20045652' },
      include: { propFirmTemplate: { include: { propFirm: true } } }
    });
    
    const newAccount = await prisma.account.findFirst({
      where: { login: '2958' },
      include: { propFirmTemplate: { include: { propFirm: true } } }
    });
    
    console.log('📊 ACCOUNT STATUS:');
    console.log('Old Account (20045652):');
    console.log('   ID:', oldAccount?.id);
    console.log('   Template:', oldAccount?.propFirmTemplate?.name);
    console.log('   Trades:', await prisma.trade.count({ where: { accountId: oldAccount?.id } }));
    
    console.log('New Account (2958):');
    console.log('   ID:', newAccount?.id);
    console.log('   Template:', newAccount?.propFirmTemplate?.name);
    console.log('   Trades:', await prisma.trade.count({ where: { accountId: newAccount?.id } }));
    console.log('');
    
    // OPTION 1: Remove PropFirm template from old account to avoid confusion
    console.log('🎯 SOLUTION OPTIONS:');
    console.log('1. Remove PropFirm template from old account (20045652)');
    console.log('2. Keep both accounts but ensure dashboard selects correct one');
    console.log('');
    
    // Let's remove the template from the old account to avoid confusion
    if (oldAccount?.propFirmTemplate) {
      console.log('🔄 Removing PropFirm template from old account...');
      
      await prisma.account.update({
        where: { id: oldAccount.id },
        data: {
          propFirmTemplateId: null,
          propFirmId: null,
          initialBalance: null,
          currentPhase: null,
          accountType: null,
          isChallenge: false
        }
      });
      
      console.log('✅ Removed PropFirm template from account 20045652');
    }
    
    // Verify new account setup
    if (newAccount) {
      console.log('');
      console.log('✅ CURRENT SETUP (Account 2958):');
      console.log('   Login:', newAccount.login);
      console.log('   Template:', newAccount.propFirmTemplate?.name);
      console.log('   Account Size:', newAccount.propFirmTemplate?.accountSize);
      console.log('   Initial Balance:', newAccount.initialBalance);
      console.log('   Current Phase:', newAccount.currentPhase);
      
      // Calculate real P&L for account 2958
      const trades = await prisma.trade.findMany({
        where: { accountId: newAccount.id },
        select: { pnlGross: true, swap: true, commission: true, closeTime: true }
      });
      
      const totalPnL = trades.reduce((sum, t) => sum + (t.pnlGross || 0) + (t.swap || 0) + (t.commission || 0), 0);
      const closedTrades = trades.filter(t => t.closeTime !== null);
      const openTrades = trades.filter(t => t.closeTime === null);
      
      console.log('');
      console.log('📊 ACCOUNT 2958 METRICS:');
      console.log('   Total Trades:', trades.length);
      console.log('   Closed Trades:', closedTrades.length);
      console.log('   Open Trades:', openTrades.length);
      console.log('   Total P&L:', totalPnL.toFixed(2));
      
      console.log('');
      console.log('🎉 Dashboard should now show account 2958 by default!');
      console.log('   Expected P&L:', totalPnL.toFixed(2));
      console.log('   Expected Trades:', trades.length);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAccountSelection();