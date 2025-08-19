const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRealData() {
  try {
    const account = await prisma.account.findFirst({
      where: { propFirmTemplate: { isNot: null } },
      include: { propFirmTemplate: { include: { propFirm: true } } }
    });
    
    if (account) {
      console.log('📊 Account:', account.login);
      console.log('   Initial Balance:', account.initialBalance);
      console.log('   Template:', account.propFirmTemplate.name);
      console.log('');
      
      // Get real P&L
      const trades = await prisma.trade.findMany({
        where: { accountId: account.id },
        select: { pnlGross: true, swap: true, commission: true, openTime: true, closeTime: true }
      });
      
      const closedTrades = trades.filter(t => t.closeTime !== null);
      const openTrades = trades.filter(t => t.closeTime === null);
      
      const closedPnL = closedTrades.reduce((sum, t) => sum + (t.pnlGross || 0) + (t.swap || 0) + (t.commission || 0), 0);
      const openPnL = openTrades.reduce((sum, t) => sum + (t.pnlGross || 0) + (t.swap || 0) + (t.commission || 0), 0);
      const totalPnL = closedPnL + openPnL;
      
      console.log('   Closed Trades:', closedTrades.length);
      console.log('   Open Trades:', openTrades.length);
      console.log('   Closed P&L:', closedPnL);
      console.log('   Open P&L:', openPnL);
      console.log('   TOTAL P&L:', totalPnL);
      console.log('');
      
      // Trading days
      const tradingDays = new Set(trades.map(t => t.openTime.toISOString().split('T')[0])).size;
      console.log('   Trading Days:', tradingDays);
      
      // Win Rate
      const winningTrades = closedTrades.filter(t => {
        const pnl = (t.pnlGross || 0) + (t.swap || 0) + (t.commission || 0);
        return pnl > 0;
      }).length;
      const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;
      console.log('   Win Rate:', winRate.toFixed(2) + '%');
      
      console.log('');
      console.log('🎯 This should show in dashboard instead of €0.00!');
      console.log('🔍 Account ID:', account.id);
      
      // Test the rule engine
      console.log('');
      console.log('🧪 Testing rule calculation...');
      
      const rules = account.propFirmTemplate.rulesJson.phase1;
      if (rules) {
        const profitTarget = rules.profitTargetAmount || 0;
        const maxOverallLoss = rules.maxOverallLossAmount || 0;
        
        console.log('   Profit Target:', profitTarget);
        console.log('   Current P&L:', totalPnL);
        console.log('   Progress:', ((totalPnL / profitTarget) * 100).toFixed(1) + '%');
        
        const drawdownPercent = Math.max(0, ((-totalPnL) / account.initialBalance) * 100);
        console.log('   Current Drawdown:', drawdownPercent.toFixed(2) + '%');
        console.log('   Max Allowed Loss:', (rules.maxOverallLoss || 0) + '%');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRealData();