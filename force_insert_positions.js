const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const currentPositions = [
  {
    ticketId: "35313389",
    symbol: "SP_stp",
    side: "BUY",
    volume: 0.25,
    openPrice: 6439.14,
    openTime: new Date("2025-08-12T20:00:02"),
    pnlGross: 45.29,
    swap: -97.82,
    commission: 0.0
  },
  {
    ticketId: "35313390", 
    symbol: "NSDQ_stp",
    side: "SELL",
    volume: 0.14,
    openPrice: 23816.00,
    openTime: new Date("2025-08-12T20:00:02"),
    pnlGross: 530.48,
    swap: 19.63,
    commission: 0.0
  },
  {
    ticketId: "35326648",
    symbol: "AUDUSD_stp",
    side: "BUY", 
    volume: 1.22,
    openPrice: 0.65536,
    openTime: new Date("2025-08-13T10:30:03"),
    pnlGross: -794.28,
    swap: -15.85,
    commission: 0.0
  },
  {
    ticketId: "35326649",
    symbol: "NZDUSD_stp",
    side: "SELL",
    volume: 1.29,
    openPrice: 0.59837,
    openTime: new Date("2025-08-13T10:30:04"),
    pnlGross: 697.22,
    swap: 3.97,
    commission: 0.0
  }
];

async function forceInsertPositions() {
  try {
    console.log('🔧 FORCE INSERT: Current 4 open positions...\n');

    // Find the account first
    const account = await prisma.account.findFirst({
      where: { login: "20045652" }
    });

    if (!account) {
      console.log('❌ Account not found with login 20045652');
      return;
    }

    console.log('✅ Found account:', account.id);

    // Clear old open positions
    const deleted = await prisma.trade.deleteMany({
      where: { 
        accountId: account.id,
        closeTime: null 
      }
    });
    
    console.log(`🧹 Cleared ${deleted.count} old open positions`);

    // Insert current positions
    let inserted = 0;
    for (const pos of currentPositions) {
      try {
        await prisma.trade.create({
          data: {
            ...pos,
            positionId: pos.ticketId, // Required field
            closePrice: null,
            closeTime: null,
            accountId: account.id,
            comment: null,
            magic: null,
            
            // PropFirm fields with defaults
            tradePhase: "PHASE_1",
            violatesRules: false,
            equityAtOpen: null,
            equityAtClose: null,
            drawdownAtOpen: null,
            drawdownAtClose: null,
            dailyPnLAtOpen: null,
            dailyPnLAtClose: null,
            isWeekendTrade: false,
            newsTime: false,
            holdingTime: null,
            riskReward: null,
            riskPercent: null
          }
        });
        
        inserted++;
        console.log(`✅ Inserted: ${pos.ticketId} ${pos.symbol} ${pos.side} P&L:${pos.pnlGross}`);
        
      } catch (error) {
        console.error(`❌ Failed to insert ${pos.ticketId}:`, error.message);
      }
    }

    console.log(`\n🎯 RISULTATO: ${inserted}/${currentPositions.length} posizioni inserite!`);
    
    // Verify final state
    const finalCheck = await prisma.trade.findMany({
      where: { 
        accountId: account.id,
        closeTime: null 
      },
      select: {
        ticketId: true,
        symbol: true,
        side: true,
        pnlGross: true
      }
    });
    
    console.log(`\n📊 Verifica finale: ${finalCheck.length} posizioni aperte nel database:`);
    finalCheck.forEach(t => {
      console.log(`   ${t.ticketId} ${t.symbol} ${t.side} P&L:${t.pnlGross}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

forceInsertPositions();