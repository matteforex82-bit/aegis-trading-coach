// Test manual sync of open positions
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
      "open_time": "2025.08.12 20:00:02",
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
      "open_time": "2025.08.12 20:00:02",
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
      "open_time": "2025.08.13 10:30:03",
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
      "open_time": "2025.08.13 10:30:04",
      "pnl": 697.22,
      "swap": 3.97,
      "commission": 0.0,
      "comment": "",
      "magic": 0,
      "phase": "PHASE_1"
    }
  ]
};

async function testSync() {
  try {
    console.log('🧪 Testing open positions sync...');
    
    const response = await fetch('http://localhost:3000/api/ingest/mt5', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    const result = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', result);
    
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
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSync();