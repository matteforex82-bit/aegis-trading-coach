// Test manual sync with current production API
const testPayload = {
  "account": {
    "login": "20045652",
    "name": "Trading Account", 
    "broker": "Test Broker",
    "server": "Test Server",
    "currency": "USD",
    "balance": 50000,
    "equity": 49206.36,
    "propFirm": "FTMO",
    "phase": "PHASE_1",
    "startBalance": 50000,
    "profitTarget": 8000,
    "maxDailyLoss": 1000,
    "maxTotalLoss": 5000,
    "maxDrawdown": 10
  },
  "metrics": {
    "equity": 49206.36,
    "balance": 50000,
    "drawdown": 1.5,
    "dailyPnL": 100,
    "totalPnL": -793.64,
    "maxDrawdown": 2.0,
    "tradingDays": 5,
    "phase": "PHASE_1",
    "timestamp": new Date().toISOString()
  },
  "openPositions": [
    {
      "ticket_id": "35313389",
      "symbol": "SP_stp", 
      "side": "buy",
      "volume": 0.25,
      "open_price": 6439.14,
      "open_time": "2025-08-12T20:00:02",
      "pnl": 45.29,
      "swap": -97.82,
      "commission": 0.0,
      "comment": "",
      "magic": 0,
      "phase": "PHASE_1"
    },
    {
      "ticket_id": "35313390", 
      "symbol": "NSDQ_stp",
      "side": "sell",
      "volume": 0.14,
      "open_price": 23816.00,
      "open_time": "2025-08-12T20:00:02",
      "pnl": 530.48,
      "swap": 19.63,
      "commission": 0.0,
      "comment": "",
      "magic": 0,
      "phase": "PHASE_1"
    },
    {
      "ticket_id": "35326648",
      "symbol": "AUDUSD_stp", 
      "side": "buy",
      "volume": 1.22,
      "open_price": 0.65536,
      "open_time": "2025-08-13T10:30:03",
      "pnl": -794.28,
      "swap": -15.85,
      "commission": 0.0,
      "comment": "",
      "magic": 0,
      "phase": "PHASE_1"
    },
    {
      "ticket_id": "35326649",
      "symbol": "NZDUSD_stp",
      "side": "sell", 
      "volume": 1.29,
      "open_price": 0.59837,
      "open_time": "2025-08-13T10:30:04",
      "pnl": 697.22,
      "swap": 3.97,
      "commission": 0.0,
      "comment": "",
      "magic": 0,
      "phase": "PHASE_1"
    }
  ]
};

async function testProdSync() {
  try {
    console.log('🧪 Testing PRODUCTION API sync...');
    
    const response = await fetch('https://new2dash.vercel.app/api/ingest/mt5', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    const result = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', result);
    
    if (response.status === 200) {
      console.log('✅ Production API working - sync successful!');
      
      // Wait a bit then check database
      console.log('⏱️ Waiting 3 seconds then checking database...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check database after
      console.log('\n🔍 Checking database...');
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const openTrades = await prisma.trade.findMany({
        where: { closeTime: null },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log(`📊 Found ${openTrades.length} open positions in database:`);
      openTrades.forEach(trade => {
        console.log(`- ${trade.ticketId} ${trade.symbol} ${trade.side} P&L: ${trade.pnlGross}`);
      });
      
      await prisma.$disconnect();
    } else {
      console.log('❌ Production API failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProdSync();