// Detailed API debug with minimal payload
const testPayload = {
  "account": {
    "login": "20045652",
    "propFirm": "FTMO"
  },
  "metrics": {
    "equity": 49000
  },
  "openPositions": [
    {
      "ticket_id": "12345",
      "symbol": "TEST",
      "side": "buy",
      "volume": 1.0,
      "open_price": 1.0,
      "open_time": "2025-08-19T12:00:00",
      "pnl": 100.0,
      "swap": 0.0,
      "commission": 0.0,
      "phase": "PHASE_1"
    }
  ]
};

async function debugAPI() {
  try {
    console.log('🔍 Debugging with minimal payload...');
    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await fetch('https://new2dash.vercel.app/api/ingest/mt5', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    const result = await response.text();
    console.log('\n📤 Response Status:', response.status);
    console.log('📤 Response Headers:', Object.fromEntries(response.headers));
    console.log('📤 Response Body:', result);
    
    // Check database immediately
    console.log('\n🗄️ Checking database state...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const openTrades = await prisma.trade.findMany({
      where: { closeTime: null },
      select: {
        ticketId: true,
        symbol: true,
        side: true,
        pnlGross: true,
        createdAt: true
      }
    });
    
    console.log(`📊 Open positions in DB: ${openTrades.length}`);
    if (openTrades.length > 0) {
      openTrades.forEach(t => {
        console.log(`   ${t.ticketId} ${t.symbol} ${t.side} P&L:${t.pnlGross} Created:${t.createdAt}`);
      });
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugAPI();