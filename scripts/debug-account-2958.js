const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugAccount2958() {
  try {
    console.log('🔍 Deep analysis of Account 2958 data...\n');
    
    const account = await prisma.account.findFirst({
      where: { login: '2958' },
      include: {
        propFirmTemplate: {
          include: { propFirm: true }
        }
      }
    });
    
    if (!account) {
      console.log('❌ Account 2958 not found');
      return;
    }
    
    console.log('📊 ACCOUNT 2958 DETAILS:');
    console.log('   Account ID:', account.id);
    console.log('   Login:', account.login);
    console.log('   Name:', account.name);
    console.log('   Broker:', account.broker);
    console.log('   Template:', account.propFirmTemplate?.name);
    console.log('   Initial Balance:', account.initialBalance);
    console.log('');
    
    // Get all trades
    const trades = await prisma.trade.findMany({
      where: { accountId: account.id },
      orderBy: { openTime: 'asc' }
    });
    
    console.log('📈 TRADE ANALYSIS:');
    console.log('   Total Trades in DB:', trades.length);
    
    const closedTrades = trades.filter(t => t.closeTime !== null);
    const openTrades = trades.filter(t => t.closeTime === null);
    
    console.log('   Closed Trades:', closedTrades.length);
    console.log('   Open Trades:', openTrades.length);
    console.log('');
    
    // Calculate P&L
    let closedPnL = 0;
    let openPnL = 0;
    
    console.log('🔍 DETAILED P&L CALCULATION:');
    console.log('CLOSED TRADES:');
    closedTrades.forEach((trade, index) => {
      const pnl = (trade.pnlGross || 0) + (trade.swap || 0) + (trade.commission || 0);
      closedPnL += pnl;
      if (index < 10) { // Show first 10
        console.log('   ' + trade.ticketId + ' - ' + trade.symbol + ' - PnL: ' + pnl.toFixed(2));
      } else if (index === 10) {
        console.log('   ... and ' + (closedTrades.length - 10) + ' more trades');
      }
    });
    
    console.log('');
    console.log('OPEN TRADES:');
    openTrades.forEach(trade => {
      const pnl = (trade.pnlGross || 0) + (trade.swap || 0) + (trade.commission || 0);
      openPnL += pnl;
      console.log('   ' + trade.ticketId + ' - ' + trade.symbol + ' - PnL: ' + pnl.toFixed(2));
    });
    
    const totalPnL = closedPnL + openPnL;
    
    console.log('');
    console.log('💰 P&L SUMMARY:');
    console.log('   Closed P&L: $' + closedPnL.toFixed(2));
    console.log('   Open P&L: $' + openPnL.toFixed(2));
    console.log('   TOTAL P&L: $' + totalPnL.toFixed(2));
    console.log('');
    
    // Compare with MT5 report data
    console.log('🎯 COMPARISON WITH MT5 REPORT:');
    console.log('   MT5 Final Balance: $49,866.83');
    console.log('   MT5 Initial Deposit: $50,000.00');  
    console.log('   MT5 Total P&L: $-133.17 (approx)');
    console.log('   Our Calculation: $' + totalPnL.toFixed(2));
    console.log('   Difference: $' + (totalPnL + 133.17).toFixed(2));
    console.log('');
    
    // Check for data issues
    console.log('⚠️  POTENTIAL ISSUES:');
    const nullPnL = trades.filter(t => t.pnlGross === null || t.pnlGross === 0);
    if (nullPnL.length > 0) {
      console.log('   - ' + nullPnL.length + ' trades with null/zero pnlGross');
    }
    
    const nullSwap = trades.filter(t => t.swap === null);
    if (nullSwap.length > 0) {
      console.log('   - ' + nullSwap.length + ' trades with null swap');
    }
    
    const nullCommission = trades.filter(t => t.commission === null);
    if (nullCommission.length > 0) {
      console.log('   - ' + nullCommission.length + ' trades with null commission');
    }
    
    // Check some specific tickets from MT5 report
    console.log('');
    console.log('🔍 VERIFICATION OF SPECIFIC TRADES:');
    const mt5Tickets = ['279865', '225131', '225128', '210059', '209019'];
    for (const ticket of mt5Tickets) {
      const trade = trades.find(t => t.ticketId === ticket);
      if (trade) {
        const pnl = (trade.pnlGross || 0) + (trade.swap || 0) + (trade.commission || 0);
        console.log('   ✅ ' + ticket + ' - Found - P&L: $' + pnl.toFixed(2));
      } else {
        console.log('   ❌ ' + ticket + ' - Missing from database');
      }
    }
    
    console.log('');
    console.log('🎯 The database P&L should match the dashboard now!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugAccount2958();