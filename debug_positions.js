const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOpenPositions() {
  try {
    console.log('🔍 CONTROLLO POSIZIONI APERTE NEL DATABASE...\n');
    
    const openTrades = await prisma.trade.findMany({
      where: { closeTime: null },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 Trovate ${openTrades.length} posizioni aperte nel database:\n`);
    
    openTrades.forEach(trade => {
      console.log(`Ticket: ${trade.ticketId}`);
      console.log(`Symbol: ${trade.symbol}`);
      console.log(`Side: ${trade.side}`);
      console.log(`Volume: ${trade.volume}`);
      console.log(`Open Price: ${trade.openPrice}`);
      console.log(`Open Time: ${trade.openTime}`);
      console.log(`P&L Gross: ${trade.pnlGross}`);
      console.log(`Swap: ${trade.swap}`);
      console.log(`Commission: ${trade.commission}`);
      console.log(`Created: ${trade.createdAt}`);
      console.log(`Updated: ${trade.updatedAt}`);
      console.log('---');
    });

    console.log('\n🎯 POSIZIONI CHE DOVREBBERO ESSERE NEL DATABASE:');
    console.log('- sp_stp #35313389 (buy 0.25) - Profit: 74.63€');
    console.log('- nsdq_stp #35313390 (sell 0.14) - Profit: 334.14€');
    console.log('- audusd_stp #35226648 (buy 1.22) - Profit: -773.31€');
    console.log('- nzdusd_stp #35226649 (sell 1.29) - Profit: 697.15€');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOpenPositions();