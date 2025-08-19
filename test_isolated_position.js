// Test isolated position sync to catch the exact error
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testIsolatedPositionSync() {
  try {
    console.log('🧪 Testing isolated position sync...');
    
    // Step 1: Find account
    const account = await prisma.account.findFirst({
      where: { login: "20045652" }
    });
    
    if (!account) {
      console.log('❌ Account not found');
      return;
    }
    
    console.log('✅ Found account:', account.id);
    
    // Step 2: Clear old positions
    const deleted = await prisma.trade.deleteMany({
      where: { 
        accountId: account.id,
        closeTime: null 
      }
    });
    
    console.log('✅ Cleared', deleted.count, 'old positions');
    
    // Step 3: Try to create ONE position with EXACT same data structure as API
    const testPosition = {
      ticketId: "35313389",
      positionId: "35313389",
      symbol: "SP_stp",
      side: "BUY",
      volume: 0.25,
      openPrice: 6439.14,
      closePrice: null,
      openTime: new Date("2025-08-12T20:00:02"),
      closeTime: null,
      pnlGross: 45.29,
      swap: -97.82,
      commission: 0.0,
      comment: null,
      magic: null,
      accountId: account.id,
      
      // PropFirm fields
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
    };
    
    console.log('🔍 Attempting to create position with data:');
    console.log(JSON.stringify(testPosition, null, 2));
    
    const createdPosition = await prisma.trade.create({
      data: testPosition
    });
    
    console.log('✅ Position created successfully!');
    console.log('   ID:', createdPosition.id);
    console.log('   Ticket:', createdPosition.ticketId);
    console.log('   Symbol:', createdPosition.symbol);
    
    // Step 4: Verify it exists
    const verification = await prisma.trade.findMany({
      where: { closeTime: null }
    });
    
    console.log(`📊 Verification: ${verification.length} open positions in database`);
    
  } catch (error) {
    console.error('❌ CAUGHT ERROR:', error.name);
    console.error('❌ ERROR MESSAGE:', error.message);
    console.error('❌ FULL ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testIsolatedPositionSync();